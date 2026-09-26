import type { Claim, Level, Mode, RoleSkill } from "@/types/contract";

const TEMPLATES: Record<Level, (claim: Claim, skill: RoleSkill | null) => string> = {
  1: (claim) => `Walk me through "${claim.text}" — what did you personally build?`,
  2: (_claim, skill) =>
    skill
      ? `How does ${skill.name.toLowerCase()} actually work under the hood in what you built?`
      : "How does that actually work under the hood?",
  3: () => "Why that approach? What was the alternative, and what would it have cost you?",
};

const RETEST_TEMPLATES: Record<Level, (claim: Claim, skill: RoleSkill | null) => string> = {
  1: (claim) => `New scenario: for "${claim.text}", what's a specific piece you'd point to and explain?`,
  2: (_claim, skill) =>
    skill
      ? `Different angle: walk through what happens step by step, in order, for ${skill.name.toLowerCase()}.`
      : "Different angle: walk through what happens step by step, in order.",
  3: () => "New scenario: pick a different trade-off you made and justify it.",
};

export function questionFor(
  claim: Claim,
  skill: RoleSkill | null,
  level: Level,
  mode: Mode
): string {
  const templates = mode === "retest" ? RETEST_TEMPLATES : TEMPLATES;
  return templates[level](claim, skill);
}

export function clarifyPrompt(question: string): string {
  return `Can you be more specific? ${question}`;
}
