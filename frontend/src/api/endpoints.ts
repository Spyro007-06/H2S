import { apiClient } from "./client";
import { mockApi } from "@/mocks/mockApi";
import type {
  HealthResponse,
  RolesResponse,
  Role,
  ExtractRequest,
  ClaimsResponse,
  ConfirmRequest,
  InterrogateRequest,
  TurnResponse,
  Report,
  FixTaskRequest,
  FixTaskResponse,
} from "@/types/contract";

/**
 * UNBLUFF API Service Layer
 * Strict 1:1 mapping with frozen endpoints in CONTRACT.md §5.
 * This is a thin transport layer with zero local scoring or business decisions.
 */
const realApi = {
  /**
   * GET /api/health
   */
  async getHealth(): Promise<HealthResponse> {
    return apiClient<HealthResponse>("/health", { method: "GET" });
  },

  /**
   * GET /api/roles
   */
  async getRoles(): Promise<RolesResponse> {
    return apiClient<RolesResponse>("/roles", { method: "GET" });
  },

  /**
   * GET /api/roles/:roleId
   */
  async getRole(roleId: string): Promise<Role> {
    return apiClient<Role>(`/roles/${encodeURIComponent(roleId)}`, {
      method: "GET",
    });
  },

  /**
   * POST /api/claims/extract
   * Creates the session and extracts claims from resume and/or declared skills.
   */
  async extractClaims(payload: ExtractRequest): Promise<ClaimsResponse> {
    return apiClient<ClaimsResponse>("/claims/extract", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * POST /api/claims/confirm
   * Replaces/confirms the active claim list before interrogation begins.
   */
  async confirmClaims(payload: ConfirmRequest): Promise<ClaimsResponse> {
    return apiClient<ClaimsResponse>("/claims/confirm", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * POST /api/interrogate
   * Drives both assessment and retest turns.
   * Empty answer starts/resumes claim; answer submits for grading.
   */
  async interrogate(payload: InterrogateRequest): Promise<TurnResponse> {
    return apiClient<TurnResponse>("/interrogate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * GET /api/report/:sessionId
   * Builds and fetches the full readiness report.
   */
  async getReport(sessionId: string): Promise<Report> {
    return apiClient<Report>(`/report/${encodeURIComponent(sessionId)}`, {
      method: "GET",
    });
  },

  /**
   * POST /api/fix-task
   * Generates a fix task for shaky, bluff, or honest_gap claims.
   */
  async getFixTask(payload: FixTaskRequest): Promise<FixTaskResponse> {
    return apiClient<FixTaskResponse>("/fix-task", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * GET /api/demo/report
   * Retrieves the verbatim frozen demo report for preview / offline demo mode.
   */
  async getDemoReport(): Promise<Report> {
    return apiClient<Report>("/demo/report", { method: "GET" });
  },
};

/**
 * `VITE_MOCK_API=true` swaps every call above for the in-browser mock
 * backend (src/mocks/) — see vite-env.d.ts. Also requires `import.meta.env.DEV`
 * (a Vite compile-time constant, always false for `vite build`) so a stray
 * local .env can never ship the mock into a real production bundle — the
 * `DEV` check lets esbuild dead-code-eliminate `mockApi` from that build
 * entirely, regardless of what VITE_MOCK_API happens to be set to.
 */
export const api: typeof realApi =
  import.meta.env.DEV && import.meta.env.VITE_MOCK_API === "true" ? mockApi : realApi;
