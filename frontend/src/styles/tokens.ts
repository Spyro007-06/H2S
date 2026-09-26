import type { Verdict, SkillState } from "@/types/contract";

export interface DisplayMeta {
  label: string;
  iconName: string;
  fg: string;
  bg: string;
}

/**
 * Exact display mapping from CONTRACT.md §6
 * Guaranteed to pass WCAG 4.5:1 contrast ratio.
 */
export const VERDICT_CONFIG: Record<Verdict, DisplayMeta> = {
  defended: {
    label: "Defended",
    iconName: "ShieldCheck",
    fg: "#166534",
    bg: "#DCFCE7",
  },
  shaky: {
    label: "Shaky",
    iconName: "AlertTriangle",
    fg: "#92400E",
    bg: "#FEF3C7",
  },
  bluff: {
    label: "Bluff",
    iconName: "XOctagon",
    fg: "#991B1B",
    bg: "#FEE2E2",
  },
  honest_gap: {
    label: "Honest gap",
    iconName: "HelpCircle",
    fg: "#1E40AF",
    bg: "#DBEAFE",
  },
  error: {
    label: "Not assessed (error)",
    iconName: "CircleSlash",
    fg: "#374151",
    bg: "#F3F4F6",
  },
  pending: {
    label: "Not yet assessed",
    iconName: "Clock",
    fg: "#334155",
    bg: "#F1F5F9",
  },
};

export const SKILL_STATE_CONFIG: Record<SkillState, DisplayMeta> = {
  ready: {
    label: "Ready",
    iconName: "CheckCircle2",
    fg: "#166534",
    bg: "#DCFCE7",
  },
  needs_work: {
    label: "Needs work",
    iconName: "Wrench",
    fg: "#92400E",
    bg: "#FEF3C7",
  },
  unverified: {
    label: "Unverified",
    iconName: "Clock",
    fg: "#334155",
    bg: "#F1F5F9",
  },
  blind_spot: {
    label: "Blind spot",
    iconName: "EyeOff",
    fg: "#6B21A8",
    bg: "#F3E8FF",
  },
  deprioritized: {
    label: "Not in role",
    iconName: "MinusCircle",
    fg: "#374151",
    bg: "#F3F4F6",
  },
};
