import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/endpoints";
import { useSessionState } from "@/state/useSession";
import type { ClaimInput } from "@/types/contract";

/**
 * POST /api/claims/confirm — sends the user's edited claim list, stores the
 * backend's recomputed claims/blind_spots/progress, and hands off to the
 * interrogation workspace. The backend decides everything about the
 * resulting claims; this hook only transports the request.
 */
export function useConfirmClaims() {
  const navigate = useNavigate();
  const { state, dispatch } = useSessionState();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const confirm = useCallback(
    async (claims: ClaimInput[]) => {
      if (!state.sessionId) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.confirmClaims({ session_id: state.sessionId, claims });
        dispatch({
          type: "UPDATE_CLAIMS",
          payload: { claims: res.claims, blindSpots: res.blind_spots, progress: res.progress },
        });
        navigate("/interrogate");
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    },
    [state.sessionId, dispatch, navigate]
  );

  return { isLoading, error, confirm };
}
