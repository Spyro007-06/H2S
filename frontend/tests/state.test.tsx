import React from "react";
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { SessionProvider } from "@/state/SessionContext";
import { InterrogationProvider } from "@/state/InterrogationContext";
import { useSessionState, useInterrogationState } from "@/state/useSession";
import type { TurnResponse } from "@/types/contract";

describe("State Management: Session & Interrogation Reducers", () => {
  it("manages session data accurately without local calculations", () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <SessionProvider>{children}</SessionProvider>
    );

    const { result } = renderHook(() => useSessionState(), { wrapper });

    expect(result.current.state.sessionId).toBeNull();

    act(() => {
      result.current.dispatch({
        type: "SET_SESSION",
        payload: {
          sessionId: "s_test_123",
          roleId: "frontend_developer",
          prepMode: "teach",
        },
      });
    });

    expect(result.current.state.sessionId).toBe("s_test_123");
    expect(result.current.state.roleId).toBe("frontend_developer");
    expect(result.current.state.prepMode).toBe("teach");
  });

  it("handles interrogation transitions and triggers inline teach_now when turn is done", () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <InterrogationProvider>{children}</InterrogationProvider>
    );

    const { result } = renderHook(() => useInterrogationState(), { wrapper });

    expect(result.current.state.activeClaimId).toBeNull();
    expect(result.current.state.inlineTeachNow).toBe(false);

    act(() => {
      result.current.dispatch({
        type: "SET_ACTIVE_CLAIM",
        payload: { claimId: "CL-001", mode: "assess" },
      });
    });

    expect(result.current.state.activeClaimId).toBe("CL-001");

    const mockDoneTurn: TurnResponse = {
      session_id: "s_test",
      claim_id: "CL-001",
      mode: "assess",
      turn: "done",
      level: null,
      question: null,
      grade: null,
      teach_now: true,
      next_claim_id: "CL-002",
      next_mode: "retest",
      claim: {
        id: "CL-001",
        text: "Built accessible React components",
        resume_line: "Built accessible React components",
        skill_id: "accessibility",
        source: "resume",
        verdict: "shaky",
        levels_passed: 1,
        proficiency: 0.25,
        missing_concepts: ["ARIA live regions"],
        evidence: [],
        qa: [],
        retest: null,
        fix_task: null,
        rewrite: null,
      },
      progress: {
        claims_total: 3,
        claims_done: 1,
        next_claim_id: "CL-002",
        next_mode: "retest",
      },
    };

    act(() => {
      result.current.dispatch({
        type: "SET_TURN_RESPONSE",
        payload: mockDoneTurn,
      });
    });

    expect(result.current.state.currentTurn?.turn).toBe("done");
    expect(result.current.state.inlineTeachNow).toBe(true);

    act(() => {
      result.current.dispatch({ type: "DISMISS_INLINE_TEACH" });
    });

    expect(result.current.state.inlineTeachNow).toBe(false);
  });
});
