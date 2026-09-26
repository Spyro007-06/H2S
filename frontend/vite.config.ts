import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

interface VitestConfig extends UserConfig {
  test: {
    globals: boolean;
    environment: string;
    setupFiles: string[];
    include: string[];
    env: Record<string, string>;
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    open: false,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    // Tests must be deterministic regardless of a developer's local .env
    // (e.g. VITE_MOCK_API=true for local demoing) — always exercise the
    // real API wrapper here; mock-backend behavior isn't unit-tested.
    env: { VITE_MOCK_API: "false" },
  },
} as VitestConfig);
