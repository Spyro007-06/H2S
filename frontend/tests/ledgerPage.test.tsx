import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { SessionProvider } from "@/state/SessionContext";
import { InterrogationProvider } from "@/state/InterrogationContext";
import { useSessionState } from "@/state/useSession";
import { LedgerPage } from "@/pages/LedgerPage";
import { api } from "@/api/endpoints";
import { ApiError } from "@/api/types";
import type { Claim, ClaimsResponse, Role } from "@/types/contract";

vi.mock("@/api/endpoints", () => ({
  api: { getRole: vi.fn(), confirmClaims: vi.fn() },
}));

const claim1: Claim = {
  id: "CL-001",
  text: "Built a React dashboard",
  resume_line: "Developed a responsive dashboard using React.",
  skill_id: "react_state",
  source: "resume",
  verdict: "pending",
  levels_passed: 0,
  proficiency: 0,
  missing_concepts: [],
  evidence: [],
  qa: [],
  retest: null,
  fix_task: null,
  rewrite: null,
};

const claim2: Claim = {
  ...claim1,
  id: "CL-002",
  text: "Knows Git",
  resume_line: null,
  skill_id: "git",
  source: "declared",
};

const mockRole: Role = {
  id: "frontend_developer",
  name: "Frontend Developer",
  description: "React, JS, APIs",
  skills: [
    {
      id: "react_state",
      name: "React State & Rendering",
      weight: 0.2,
      description: "",
      keywords: [],
      levels: { L1: ["a", "b"], L2: ["a", "b"], L3: ["a", "b"] },
    },
    {
      id: "git",
      name: "Git",
      weight: 0.1,
      description: "",
      keywords: [],
      levels: { L1: ["a", "b"], L2: ["a", "b"], L3: ["a", "b"] },
    },
  ],
};

function Seed() {
  const { dispatch } = useSessionState();
  React.useEffect(() => {
    dispatch({
      type: "SET_SESSION",
      payload: {
        sessionId: "s_123",
        roleId: "frontend_developer",
        claims: [claim1, claim2],
        blindSpots: [{ skill_id: "testing", name: "Testing & Debugging", weight: 0.1 }],
      },
    });
  }, [dispatch]);
  return null;
}

function renderLedger() {
  return render(
    <SessionProvider>
      <InterrogationProvider>
        <Seed />
        <MemoryRouter initialEntries={["/ledger"]}>
          <Routes>
            <Route path="/ledger" element={<LedgerPage />} />
            <Route path="/interrogate" element={<div>WORKSPACE_PLACEHOLDER</div>} />
          </Routes>
        </MemoryRouter>
      </InterrogationProvider>
    </SessionProvider>
  );
}

describe("LedgerPage", () => {
  beforeEach(() => {
    vi.mocked(api.getRole).mockReset().mockResolvedValue(mockRole);
    vi.mocked(api.confirmClaims).mockReset();
  });

  it("renders extracted claims with resume line and blind spots", async () => {
    renderLedger();
    expect(await screen.findByDisplayValue("Built a React dashboard")).toBeInTheDocument();
    expect(screen.getByText(/Developed a responsive dashboard/)).toBeInTheDocument();
    expect(screen.getByText(/Testing & Debugging/)).toBeInTheDocument();
  });

  it("lets the user edit claim text before confirming", async () => {
    renderLedger();
    const textarea = await screen.findByDisplayValue("Built a React dashboard");
    fireEvent.change(textarea, { target: { value: "Built a Vue dashboard" } });
    expect(screen.getByDisplayValue("Built a Vue dashboard")).toBeInTheDocument();
  });

  it("removes a claim from the list on delete", async () => {
    renderLedger();
    await screen.findByDisplayValue("Knows Git");
    fireEvent.click(screen.getByRole("button", { name: /Delete claim: Knows Git/i }));
    expect(screen.queryByDisplayValue("Knows Git")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Built a React dashboard")).toBeInTheDocument();
  });

  it("confirms the edited claim list and navigates to interrogation on success", async () => {
    const response: ClaimsResponse = {
      session_id: "s_123",
      role_id: "frontend_developer",
      claims: [claim1, claim2],
      blind_spots: [],
      progress: { claims_total: 2, claims_done: 0, next_claim_id: "CL-001" },
    };
    vi.mocked(api.confirmClaims).mockResolvedValue(response);
    renderLedger();
    await screen.findByDisplayValue("Built a React dashboard");

    fireEvent.click(screen.getByRole("button", { name: "Start Interrogation" }));

    await waitFor(() => {
      expect(screen.getByText("WORKSPACE_PLACEHOLDER")).toBeInTheDocument();
    });
    expect(api.confirmClaims).toHaveBeenCalledWith({
      session_id: "s_123",
      claims: [
        { id: "CL-001", text: "Built a React dashboard", resume_line: claim1.resume_line, skill_id: "react_state" },
        { id: "CL-002", text: "Knows Git", resume_line: null, skill_id: "git" },
      ],
    });
  });

  it("shows a retryable error when confirmation fails", async () => {
    vi.mocked(api.confirmClaims).mockRejectedValue(new ApiError("boom", "INTERNAL", 500));
    renderLedger();
    await screen.findByDisplayValue("Built a React dashboard");

    fireEvent.click(screen.getByRole("button", { name: "Start Interrogation" }));

    expect(await screen.findByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Built a React dashboard")).toBeInTheDocument();
  });
});
