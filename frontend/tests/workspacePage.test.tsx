import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { SessionProvider } from "@/state/SessionContext";
import { InterrogationProvider } from "@/state/InterrogationContext";
import { useSessionState } from "@/state/useSession";
import { WorkspacePage } from "@/pages/WorkspacePage";
import { api } from "@/api/endpoints";
import { ApiError } from "@/api/types";
import type { Claim, TurnResponse, FixTask } from "@/types/contract";

vi.mock("@/api/endpoints", () => ({
  api: { interrogate: vi.fn(), getFixTask: vi.fn() },
}));

const pendingClaim: Claim = {
  id: "CL-001",
  text: "Built a React dashboard",
  resume_line: "Developed a dashboard using React.",
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

function Seed({ claims = [pendingClaim], nextClaimId = "CL-001" }: { claims?: Claim[]; nextClaimId?: string | null }) {
  const { dispatch } = useSessionState();
  React.useEffect(() => {
    dispatch({
      type: "SET_SESSION",
      payload: {
        sessionId: "s_123",
        roleId: "frontend_developer",
        claims,
        progress: { claims_total: claims.length, claims_done: 0, next_claim_id: nextClaimId },
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);
  return null;
}

function renderWorkspace(seedProps?: { claims?: Claim[]; nextClaimId?: string | null }) {
  return render(
    <SessionProvider>
      <InterrogationProvider>
        <Seed {...seedProps} />
        <MemoryRouter initialEntries={["/interrogate"]}>
          <Routes>
            <Route path="/interrogate" element={<WorkspacePage />} />
            <Route path="/report/:sessionId" element={<div>REPORT_PLACEHOLDER</div>} />
          </Routes>
        </MemoryRouter>
      </InterrogationProvider>
    </SessionProvider>
  );
}

function questionTurn(overrides: Partial<TurnResponse> = {}): TurnResponse {
  return {
    session_id: "s_123",
    claim_id: "CL-001",
    mode: "assess",
    turn: "question",
    level: 1,
    question: "Which part of that dashboard did you personally build?",
    grade: null,
    claim: pendingClaim,
    progress: { claims_total: 1, claims_done: 0, next_claim_id: "CL-001" },
    ...overrides,
  };
}

describe("WorkspacePage", () => {
  beforeEach(() => {
    vi.mocked(api.interrogate).mockReset();
    vi.mocked(api.getFixTask).mockReset();
  });

  it("auto-starts the backend-designated next claim and renders its question", async () => {
    vi.mocked(api.interrogate).mockResolvedValue(questionTurn());
    renderWorkspace();

    expect(await screen.findByText(/Which part of that dashboard/i)).toBeInTheDocument();
    expect(api.interrogate).toHaveBeenCalledWith({
      session_id: "s_123",
      claim_id: "CL-001",
      mode: "assess",
    });
  });

  it("submits an answer and renders the resulting evidence and next question", async () => {
    vi.mocked(api.interrogate).mockResolvedValueOnce(questionTurn());
    renderWorkspace();
    await screen.findByText(/Which part of that dashboard/i);

    const gradedClaim: Claim = { ...pendingClaim, levels_passed: 1 };
    vi.mocked(api.interrogate).mockResolvedValueOnce(
      questionTurn({
        level: 2,
        question: "Walk me through what happens from a state update to the UI changing.",
        grade: {
          criteria: {
            accuracy: { passed: true, evidence_quote: "I used useState", missing_concept: null },
            specificity: { passed: true, evidence_quote: "the filter panel", missing_concept: null },
            mechanism: { passed: false, evidence_quote: null, missing_concept: "re-render sequence" },
            ownership: { passed: true, evidence_quote: "I built it", missing_concept: null },
            tradeoff: { passed: false, evidence_quote: null, missing_concept: null },
          },
          admits_gap: false,
          needs_clarification: false,
          level_passed: true,
          guard_flips: [],
        },
        claim: gradedClaim,
      })
    );

    fireEvent.change(screen.getByLabelText("Your answer"), {
      target: { value: "I built the filter panel using useState." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit Answer" }));

    expect(
      await screen.findByText(/Walk me through what happens from a state update/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/re-render sequence/i)).toBeInTheDocument();
    expect(api.interrogate).toHaveBeenLastCalledWith({
      session_id: "s_123",
      claim_id: "CL-001",
      mode: "assess",
      answer: "I built the filter panel using useState.",
    });
  });

  it('sends the literal "I don\'t know" answer', async () => {
    vi.mocked(api.interrogate).mockResolvedValueOnce(questionTurn());
    renderWorkspace();
    await screen.findByText(/Which part of that dashboard/i);

    vi.mocked(api.interrogate).mockResolvedValueOnce(
      questionTurn({
        turn: "done",
        level: null,
        question: null,
        claim: { ...pendingClaim, verdict: "honest_gap" },
        progress: { claims_total: 1, claims_done: 1, next_claim_id: null },
      })
    );
    fireEvent.click(screen.getByRole("button", { name: /I don.t know/i }));

    await waitFor(() => {
      expect(api.interrogate).toHaveBeenLastCalledWith({
        session_id: "s_123",
        claim_id: "CL-001",
        mode: "assess",
        answer: "I don't know",
      });
    });
    await waitFor(() => {
      expect(screen.getAllByText("Honest gap").length).toBeGreaterThan(0);
    });
  });

  it("shows the inline fix task when the backend sets teach_now, then reveals the next-claim control", async () => {
    vi.mocked(api.interrogate).mockResolvedValueOnce(questionTurn());
    renderWorkspace();
    await screen.findByText(/Which part of that dashboard/i);

    vi.mocked(api.interrogate).mockResolvedValueOnce(
      questionTurn({
        turn: "done",
        level: null,
        question: null,
        claim: { ...pendingClaim, verdict: "shaky", levels_passed: 1 },
        teach_now: true,
        next_claim_id: "CL-002",
        next_mode: "assess",
        progress: { claims_total: 2, claims_done: 1, next_claim_id: "CL-002", next_mode: "assess" },
      })
    );
    const fixTask: FixTask = {
      claim_id: "CL-001",
      skill_id: "react_state",
      missing_concepts: ["re-render sequence"],
      explanation: "React re-renders when state changes.",
      exercise: "Trace a counter component through 3 updates.",
    };
    vi.mocked(api.getFixTask).mockResolvedValue(fixTask);

    fireEvent.change(screen.getByLabelText("Your answer"), { target: { value: "hooks make it faster" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit Answer" }));

    expect(await screen.findByText("Trace a counter component through 3 updates.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next claim →" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Got it, continue →" }));
    expect(await screen.findByRole("button", { name: "Next claim →" })).toBeInTheDocument();
  });

  it("shows the retest banner and sends mode retest when advancing into a retest", async () => {
    vi.mocked(api.interrogate).mockResolvedValueOnce(
      questionTurn({
        turn: "done",
        level: null,
        question: null,
        claim: { ...pendingClaim, verdict: "shaky" },
        next_claim_id: "CL-001",
        next_mode: "retest",
        progress: { claims_total: 1, claims_done: 1, next_claim_id: "CL-001", next_mode: "retest" },
      })
    );
    renderWorkspace();
    await screen.findByRole("button", { name: "Retest this claim next →" });

    vi.mocked(api.interrogate).mockResolvedValueOnce(
      questionTurn({ mode: "retest", question: "New scenario: describe a different dashboard feature." })
    );
    fireEvent.click(screen.getByRole("button", { name: "Retest this claim next →" }));

    expect(await screen.findByText(/Welcome back to/i)).toBeInTheDocument();
    expect(api.interrogate).toHaveBeenLastCalledWith({
      session_id: "s_123",
      claim_id: "CL-001",
      mode: "retest",
    });
  });

  it("shows a safe error and retries the exact same request on failure", async () => {
    vi.mocked(api.interrogate).mockRejectedValueOnce(new ApiError("boom", "INTERNAL", 500));
    renderWorkspace();

    expect(await screen.findByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.queryByText("boom")).not.toBeInTheDocument();

    vi.mocked(api.interrogate).mockResolvedValueOnce(questionTurn());
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText(/Which part of that dashboard/i)).toBeInTheDocument();
    expect(api.interrogate).toHaveBeenCalledTimes(2);
  });

  it("routes to the report when no next claim remains", async () => {
    vi.mocked(api.interrogate).mockResolvedValueOnce(
      questionTurn({
        turn: "done",
        level: null,
        question: null,
        claim: { ...pendingClaim, verdict: "defended", levels_passed: 3 },
        next_claim_id: null,
        progress: { claims_total: 1, claims_done: 1, next_claim_id: null },
      })
    );
    renderWorkspace();

    const link = await screen.findByRole("link", { name: "See my report →" });
    fireEvent.click(link);
    expect(await screen.findByText("REPORT_PLACEHOLDER")).toBeInTheDocument();
  });
});
