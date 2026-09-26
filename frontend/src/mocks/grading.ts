import type { Criterion, CriterionResult, Grade, Level, RoleSkill } from "@/types/contract";

/**
 * Toy grading heuristic for the mock backend ONLY. It stands in for the
 * real LLM-graded assessment so the demo has *something* to react to; it
 * is never used when a real backend is configured, and it is not the kind
 * of "frontend calculates assessment intelligence" the product forbids —
 * it exists so this mock module can behave enough like a server to click
 * through, nothing more.
 */

const GAP_PATTERN = /\b(don'?t know|dont know|no idea|not sure|no clue)\b/i;

const CRITERIA_BY_LEVEL: Record<Level, Criterion[]> = {
  1: ["accuracy", "specificity", "ownership"],
  2: ["accuracy", "mechanism"],
  3: ["accuracy", "tradeoff"],
};

function passesCriterion(answer: string, criterion: Criterion, skill: RoleSkill | null): boolean {
  const normalized = answer.toLowerCase();
  const mentionsKeyword = skill?.keywords.some((k) => normalized.includes(k.toLowerCase())) ?? false;
  const longEnough = answer.trim().length >= (criterion === "ownership" ? 15 : 30);
  switch (criterion) {
    case "accuracy":
      return longEnough && (mentionsKeyword || answer.trim().length >= 60);
    case "specificity":
      return answer.trim().length >= 40;
    case "ownership":
      return /\b(i|we|my|our)\b/i.test(answer) && answer.trim().length >= 15;
    case "mechanism":
      return answer.trim().length >= 60;
    case "tradeoff":
      return /\b(versus|vs\.?|instead|trade-?off|because|compared to|downside|cost)\b/i.test(answer) && answer.trim().length >= 40;
    default:
      return false;
  }
}

function missingConceptFor(criterion: Criterion, level: Level, skill: RoleSkill | null): string {
  const fallback: Record<Criterion, string> = {
    accuracy: "A concrete, technically accurate detail",
    specificity: "A more specific description of what you built",
    ownership: "What part of this was specifically yours",
    mechanism: "The underlying mechanism, not just that it works",
    tradeoff: "A concrete alternative and its downside",
  };
  if (skill) {
    const pool = level === 3 ? skill.levels.L3 : skill.levels.L2;
    const candidate = pool.find((c) => c.toLowerCase().includes(criterion === "tradeoff" ? "compar" : "explain"));
    if (candidate) return candidate;
  }
  return fallback[criterion];
}

export interface MockGradeResult {
  grade: Grade;
  levelPassed: boolean;
  admitsGap: boolean;
  needsClarification: boolean;
}

export function gradeAnswer(answer: string, level: Level, skill: RoleSkill | null): MockGradeResult {
  const trimmed = answer.trim();
  const admitsGap = trimmed.length === 0 || GAP_PATTERN.test(trimmed);
  const needsClarification = !admitsGap && trimmed.length > 0 && trimmed.length < 12;

  const criteria = {} as Record<Criterion, CriterionResult>;
  (["accuracy", "specificity", "mechanism", "ownership", "tradeoff"] as Criterion[]).forEach((c) => {
    const relevant = CRITERIA_BY_LEVEL[level].includes(c);
    const passed = !admitsGap && !needsClarification && relevant && passesCriterion(trimmed, c, skill);
    criteria[c] = {
      passed,
      evidence_quote: passed ? trimmed.slice(0, 60) : null,
      missing_concept: relevant && !passed ? missingConceptFor(c, level, skill) : null,
    };
  });

  const levelPassed =
    !admitsGap && !needsClarification && CRITERIA_BY_LEVEL[level].every((c) => criteria[c]!.passed);

  return {
    grade: {
      criteria,
      admits_gap: admitsGap,
      needs_clarification: needsClarification,
      level_passed: levelPassed,
      guard_flips: [],
    },
    levelPassed,
    admitsGap,
    needsClarification,
  };
}

export function proficiencyForLevelsPassed(levelsPassed: 0 | 1 | 2 | 3): number {
  return { 0: 0, 1: 0.25, 2: 0.6, 3: 0.85 }[levelsPassed];
}
