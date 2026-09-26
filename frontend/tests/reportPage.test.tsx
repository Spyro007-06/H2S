import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { SessionProvider } from "@/state/SessionContext";
import { InterrogationProvider } from "@/state/InterrogationContext";
import { ReportPage } from "@/pages/ReportPage";
import { api } from "@/api/endpoints";
import { ApiError } from "@/api/types";
import type { Claim, Report } from "@/types/contract";

vi.mock("@/api/endpoints", () => ({
  api: { getReport: vi.fn(), getFixTask: vi.fn() },
}));

const shakyClaim: Claim = {
  id: "CL-001",
  text: "Built a React dashboard",
  resume_line: "Developed a dashboard using React.",
  skill_id: "react_state",
  source: "resume",
  verdict: "shaky",
  levels_passed: 1,
  proficiency: 0.25,
  missing_concepts: ["State update -> re-render sequence"],
  evidence: [],
  qa: [
    {
      level: 2,
      kind: "question",
      mode: "assess",
      question: "Walk me through what happens from a state update to the UI changing.",
      answer: "React re-renders because hooks make it faster.",
      grade: null,
      asked_at: "2026-01-01T00:00:00Z",
    },
  ],
  retest: null,
  fix_task: null,
  rewrite: "Built dashboard UI components in React",
  root_cause: "Confused hooks with performance rather than the render cycle.",
};

const mockReport: Report = {
  session_id: "s_123",
  role: { id: "frontend_developer", name: "Frontend Developer" },
  generated_at: "2026-01-01T00:00:00Z",
  readiness: 52,
  coverage: 70,
  claims: [shakyClaim],
  skills: [
    {
      skill_id: "react_state",
      name: "React State & Rendering",
      weight: 0.2,
      state: "needs_work",
      proficiency: 0.25,
      claim_ids: ["CL-001"],
      history: [],
    },
  ],
  deprioritized_claim_ids: [],
  blind_spots: [{ skill_id: "testing", name: "Testing & Debugging", weight: 0.1 }],
  resume_lines: [
    { index: 0, text: "Developed a dashboard using React.", verdict: "shaky", claim_ids: ["CL-001"] },
  ],
  priorities: [
    { rank: 1, skill_id: "react_state", claim_id: "CL-001", score: 0.15, reason: "20% weight, failed at L2" },
  ],
  plan: [
    { day: 1, skill_id: "react_state", claim_id: "CL-001", title: "Trace a render", task: "Trace a counter through 3 updates." },
  ],
  progress: { claims_total: 1, claims_done: 1, next_claim_id: null },
};

function renderReport() {
  return render(
    <SessionProvider>
      <InterrogationProvider>
        <MemoryRouter initialEntries={["/report/s_123"]}>
          <Routes>
            <Route path="/report/:sessionId" element={<ReportPage />} />
            <Route path="/interrogate" element={<div>WORKSPACE_PLACEHOLDER</div>} />
          </Routes>
        </MemoryRouter>
      </InterrogationProvider>
    </SessionProvider>
  );
}

describe("ReportPage", () => {
  beforeEach(() => {
    vi.mocked(api.getReport).mockReset();
    vi.mocked(api.getFixTask).mockReset();
  });

  it("fetches the real report by session id and renders score, skills, priorities and blind spots", async () => {
    vi.mocked(api.getReport).mockResolvedValue(mockReport);
    renderReport();

    expect(await screen.findByRole("img", { name: "Readiness: 52%" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Coverage: 70%" })).toBeInTheDocument();
    expect(screen.getAllByText("React State & Rendering").length).toBeGreaterThan(0);
    expect(screen.getByText(/20% weight, failed at L2/)).toBeInTheDocument();
    expect(screen.getByText(/Testing & Debugging/)).toBeInTheDocument();
    expect(api.getReport).toHaveBeenCalledWith("s_123");
  });

  it("shows a retryable error when the report fails to load", async () => {
    vi.mocked(api.getReport).mockRejectedValue(new ApiError("boom", "SESSION_NOT_FOUND", 404));
    renderReport();

    expect(await screen.findByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.queryByText("boom")).not.toBeInTheDocument();
  });

  it("opens the evidence drawer from the resume heatmap and shows the root cause", async () => {
    vi.mocked(api.getReport).mockResolvedValue(mockReport);
    renderReport();

    const heatmapLine = await screen.findByText("Developed a dashboard using React.");
    fireEvent.click(heatmapLine);

    expect(
      await screen.findByText(/Confused hooks with performance rather than the render cycle\./)
    ).toBeInTheDocument();
    expect(screen.getByText(/hooks make it faster/)).toBeInTheDocument();
    expect(screen.getByText("Built dashboard UI components in React")).toBeInTheDocument();
  });

  it("fetches and displays a fix task from the evidence drawer, then navigates to retest", async () => {
    vi.mocked(api.getReport).mockResolvedValue(mockReport);
    vi.mocked(api.getFixTask).mockResolvedValue({
      claim_id: "CL-001",
      skill_id: "react_state",
      missing_concepts: ["re-render sequence"],
      explanation: "React re-renders when state changes.",
      exercise: "Trace a counter component through 3 updates.",
    });
    renderReport();

    fireEvent.click(await screen.findByText("Developed a dashboard using React."));
    fireEvent.click(await screen.findByRole("button", { name: "Get Fix Task" }));

    expect(
      await screen.findByText("Trace a counter component through 3 updates.")
    ).toBeInTheDocument();
    expect(api.getFixTask).toHaveBeenCalledWith({ session_id: "s_123", claim_id: "CL-001" });

    fireEvent.click(screen.getByRole("button", { name: "Retest this claim" }));
    await waitFor(() => {
      expect(screen.getByText("WORKSPACE_PLACEHOLDER")).toBeInTheDocument();
    });
  });

  it("closes the evidence drawer on Escape", async () => {
    vi.mocked(api.getReport).mockResolvedValue(mockReport);
    renderReport();

    fireEvent.click(await screen.findByText("Developed a dashboard using React."));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
