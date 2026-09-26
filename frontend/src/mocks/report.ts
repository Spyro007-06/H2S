import type {
  BlindSpot,
  Claim,
  PlanItem,
  Priority,
  Report,
  ResumeLine,
  Role,
  SkillReport,
  SkillState,
} from "@/types/contract";

/**
 * Builds a Report the same way CONTRACT.md §5 documents the real backend
 * doing it (readiness/coverage formulas, skill-state thresholds, priority
 * ranking) — applied to the mock session's own claims. This mirrors the
 * documented contract; it does not invent a different scoring model.
 */
export function buildReport(sessionId: string, role: Role, claims: Claim[], blindSpots: BlindSpot[]): Report {
  const skills: SkillReport[] = role.skills.map((skill) => {
    const skillClaims = claims.filter((c) => c.skill_id === skill.id);
    const proficiency = skillClaims.length > 0 ? Math.max(...skillClaims.map((c) => c.proficiency)) : 0;
    const state: SkillState =
      skillClaims.length === 0
        ? "blind_spot"
        : skillClaims.every((c) => c.verdict === "pending")
          ? "unverified"
          : proficiency >= 0.6
            ? "ready"
            : "needs_work";
    return {
      skill_id: skill.id,
      name: skill.name,
      weight: skill.weight,
      state,
      proficiency,
      claim_ids: skillClaims.map((c) => c.id),
      history: skillClaims
        .filter((c) => c.verdict !== "pending")
        .map((c) => ({ at: new Date().toISOString(), mode: "assess" as const, claim_id: c.id, proficiency: c.proficiency })),
    };
  });

  const readiness = Math.round(100 * skills.reduce((sum, s) => sum + s.weight * s.proficiency, 0));
  const assessedWeight = skills
    .filter((s) => s.state !== "unverified" && s.state !== "blind_spot")
    .reduce((sum, s) => sum + s.weight, 0);
  const coverage = Math.round(100 * assessedWeight);

  const priorities: Priority[] = skills
    .filter((s) => s.proficiency < 1)
    .map((s) => ({
      rank: 0,
      skill_id: s.skill_id,
      claim_id: s.claim_ids[0] ?? null,
      score: Math.round(s.weight * (1 - s.proficiency) * 1000) / 1000,
      reason:
        s.state === "blind_spot"
          ? `Required at ${Math.round(s.weight * 100)}% weight, never claimed`
          : `${Math.round(s.weight * 100)}% weight, currently at ${Math.round(s.proficiency * 100)}% proficiency`,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  const plan: PlanItem[] = priorities.slice(0, 7).map((p, i) => ({
    day: i + 1,
    skill_id: p.skill_id,
    claim_id: p.claim_id,
    title: role.skills.find((s) => s.id === p.skill_id)?.name ?? p.skill_id,
    task: p.claim_id
      ? "Revisit this claim's missing concept and rehearse a fresh example out loud."
      : "Prepare one concrete example for this skill in case it comes up.",
  }));

  const resumeLines: ResumeLine[] = claims
    .filter((c) => c.resume_line)
    .map((c, i) => ({ index: i, text: c.resume_line!, verdict: c.verdict, claim_ids: [c.id] }));

  return {
    session_id: sessionId,
    role: { id: role.id, name: role.name },
    generated_at: new Date().toISOString(),
    readiness,
    coverage,
    claims,
    skills,
    deprioritized_claim_ids: claims.filter((c) => c.skill_id === null).map((c) => c.id),
    blind_spots: blindSpots,
    resume_lines: resumeLines,
    priorities,
    plan,
    progress: {
      claims_total: claims.length,
      claims_done: claims.filter((c) => c.verdict !== "pending").length,
      next_claim_id: claims.find((c) => c.verdict === "pending")?.id ?? null,
    },
  };
}
