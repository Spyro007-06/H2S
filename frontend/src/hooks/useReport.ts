import { useCallback, useEffect, useState } from "react";
import { api } from "@/api/endpoints";
import type { Report } from "@/types/contract";

/**
 * GET /api/report/:sessionId — the live per-session report. Can be called
 * anytime (unassessed claims come back "pending") and is cheap to refetch,
 * so screens that change assessment state (interrogate, fix, retest) can
 * just navigate back here for fresh data instead of predicting the delta.
 */
export function useReport(sessionId: string | undefined, initial: Report | null = null) {
  const [report, setReport] = useState<Report | null>(initial);
  const [isLoading, setIsLoading] = useState(!initial && Boolean(sessionId));
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getReport(sessionId);
      setReport(res);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!initial) void load();
    // Only refetch on mount / when explicitly retried — `initial` (the demo
    // report passed via router state) is treated as final, static data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  return { report, isLoading, error, retry: load };
}
