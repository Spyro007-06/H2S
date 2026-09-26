import type { Claim, ClaimSource } from "../types.js";

export const MAX_CLAIMS = 8;

export function claimId(seq: number): string {
  return `CL-${String(seq).padStart(3, "0")}`;
}

export function newClaim(
  id: string,
  fields: { text: string; resume_line: string | null; skill_id: string | null; source: ClaimSource },
): Claim {
  return {
    id,
    ...fields,
    verdict: "pending",
    levels_passed: 0,
    proficiency: 0,
    missing_concepts: [],
    evidence: [],
    qa: [],
    retest: null,
    fix_task: null,
    rewrite: null,
  };
}

/** Keyword match for declared chips / mock extraction: first skill whose keyword appears. */
export function matchSkillByKeywords(
  text: string,
  skills: readonly { id: string; name: string; keywords: string[] }[],
): string | null {
  const t = ` ${text.toLowerCase().replace(/[^a-z0-9.+#\s]/g, " ")} `;
  for (const s of skills) {
    if (t.includes(` ${s.name.toLowerCase()} `)) return s.id;
    if (s.keywords.some((k) => t.includes(` ${k.toLowerCase()} `))) return s.id;
  }
  return null;
}
