/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // UNBLUFF base palette — Milestone 0 design system
        surface: {
          DEFAULT: "#FFFFFF",
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
        },
        ink: {
          primary: "#0F172A",
          secondary: "#334155",
          muted: "#64748B",
          subtle: "#94A3B8",
        },
        line: {
          DEFAULT: "#E2E8F0",
          strong: "#CBD5E1",
        },
        primary: {
          DEFAULT: "#4F46E5",
          dark: "#3730A3",
          soft: "#EEF2FF",
        },
        // Contract-defined verdict colors (CONTRACT.md §6)
        verdict: {
          defended: {
            fg: "#166534",
            bg: "#DCFCE7",
          },
          shaky: {
            fg: "#92400E",
            bg: "#FEF3C7",
          },
          bluff: {
            fg: "#991B1B",
            bg: "#FEE2E2",
          },
          honest_gap: {
            fg: "#1E40AF",
            bg: "#DBEAFE",
          },
          error: {
            fg: "#374151",
            bg: "#F3F4F6",
          },
          pending: {
            fg: "#334155",
            bg: "#F1F5F9",
          },
        },
        // Contract-defined skill state colors (CONTRACT.md §6)
        skill: {
          ready: {
            fg: "#166534",
            bg: "#DCFCE7",
          },
          needs_work: {
            fg: "#92400E",
            bg: "#FEF3C7",
          },
          unverified: {
            fg: "#334155",
            bg: "#F1F5F9",
          },
          blind_spot: {
            fg: "#6B21A8",
            bg: "#F3E8FF",
          },
          deprioritized: {
            fg: "#374151",
            bg: "#F3F4F6",
          },
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "18px",
      },
      screens: {
        // Additive: keeps Tailwind's default sm/md/lg/xl/2xl, adds the
        // large-desktop breakpoint called out in the Milestone 0 brief.
        wide: "1440px",
      },
    },
  },
  plugins: [],
};
