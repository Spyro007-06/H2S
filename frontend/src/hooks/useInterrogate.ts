import { useCallback, useRef } from "react";
import { api } from "@/api/endpoints";
import { useSessionState, useInterrogationState } from "@/state/useSession";
import { getErrorMessage } from "@/lib/errors";
import type { Mode } from "@/types/contract";

/**
 * POST /api/interrogate — one endpoint drives start, answer, clarify and
 * retest (per CONTRACT.md §5.6). This hook only transports the request and
 * writes the backend's response into state; it never grades, advances a
 * level, or picks the next claim itself.
 */
export function useInterrogate() {
  const { dispatch: sessionDispatch } = useSessionState();
  const { state: interrogation, dispatch } = useInterrogationState();
  const lastRequest = useRef<{ claimId: string; mode: Mode; answer?: string } | null>(null);

  const run = useCallback(
    async (sessionId: string, claimId: string, mode: Mode, answer?: string) => {
      lastRequest.current = { claimId, mode, answer };
      dispatch({ type: "START_REQUEST" });
      try {
        const turn = await api.interrogate({
          session_id: sessionId,
          claim_id: claimId,
          mode,
          ...(answer !== undefined ? { answer } : {}),
        });
        dispatch({ type: "SET_TURN_RESPONSE", payload: turn });
        sessionDispatch({
          type: "UPDATE_CLAIM",
          payload: { claim: turn.claim, progress: turn.progress },
        });
      } catch (err) {
        dispatch({ type: "SET_ERROR", payload: getErrorMessage(err) });
      }
    },
    [dispatch, sessionDispatch]
  );

  const start = useCallback(
    (sessionId: string, claimId: string, mode: Mode = "assess") => {
      dispatch({ type: "SET_ACTIVE_CLAIM", payload: { claimId, mode } });
      void run(sessionId, claimId, mode);
    },
    [dispatch, run]
  );

  const submitAnswer = useCallback(
    (sessionId: string, answer: string) => {
      if (!interrogation.activeClaimId) return;
      void run(sessionId, interrogation.activeClaimId, interrogation.activeMode, answer);
    },
    [interrogation.activeClaimId, interrogation.activeMode, run]
  );

  const retry = useCallback(
    (sessionId: string) => {
      if (!lastRequest.current) return;
      const { claimId, mode, answer } = lastRequest.current;
      void run(sessionId, claimId, mode, answer);
    },
    [run]
  );

  return { start, submitAnswer, retry };
}
