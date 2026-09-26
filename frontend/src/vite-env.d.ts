/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /**
   * Opt-in local/demo mode: routes every `api.*` call to an in-browser mock
   * backend (src/mocks/) instead of a real server. Never set this against a
   * real deployment — it exists purely so the frontend is clickable before
   * the backend HTTP layer exists.
   */
  readonly VITE_MOCK_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
