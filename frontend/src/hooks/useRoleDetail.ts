import { useCallback, useEffect, useState } from "react";
import { api } from "@/api/endpoints";
import type { Role } from "@/types/contract";

/** GET /api/roles/:roleId — full skill list for editing a claim's skill association. */
export function useRoleDetail(roleId: string | null) {
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(roleId));
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    if (!roleId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getRole(roleId);
      setRole(res);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [roleId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { role, isLoading, error, retry: load };
}
