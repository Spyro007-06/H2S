import { useCallback, useState } from "react";
import { api } from "@/api/endpoints";
import type { FixTask } from "@/types/contract";

/** POST /api/fix-task — fetches the backend-authored explanation + exercise for a weak claim. */
export function useFixTask() {
  const [fixTask, setFixTask] = useState<FixTask | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async (sessionId: string, claimId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getFixTask({ session_id: sessionId, claim_id: claimId });
      setFixTask(res);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setFixTask(null);
    setError(null);
  }, []);

  return { fixTask, isLoading, error, load, reset };
}
