# DECISIONS

Running log of judgement calls, contract notes, stubs and audit results.

## Contract

- **CONTRACT.md was not in the repo at kickoff.** The backend drafted it from the build brief
  (types, endpoints, errors, display mapping, mock report). Frontend should code against this file.
- **Retest goes through `POST /api/interrogate` with `mode: "retest"`**, matching the agreed repo
  skeleton (`interrogate.ts` = assess + clarify + retest). No separate `/api/retest` route.
- `Mode` values are `assess` | `retest` (the brief's skill-history `mode: "retest"` pairs with `assess`).
- Added error codes `NOT_FOUND` (unknown route), `ROLE_NOT_FOUND` and `RATE_LIMITED` to the brief's list.
- `Grade.guard_flips` exposes which criteria the evidence guard forced to false (for transparency UI).
- `Report.deprioritized_claim_ids` lists claims with `skill_id: null`; they never appear in `skills`.
- Colors in §6 are darker than typical "traffic light" hexes so text passes WCAG 4.5:1.

## Rules (deterministic core)

- Clarify only triggers when the level did **not** already pass; a passing answer flagged
  `needs_clarification` just advances.
- Honest gap after passing L1 keeps `levels_passed: 1` but verdict `honest_gap`, proficiency 0 (per table).
- Retest levels above the start level also use fresh scenario (RETEST) questions, targeting that
  level's role criteria.
- A partial retest can raise proficiency (`retest.passed = true`) while the verdict stays the old one,
  exactly as specified ("keep the old one").
- Priority tie-break: score, then weight, then role order. Skills at proficiency 1.0 are never priorities.
- Plan caps at 14 items (7 days × 2). Blind-spot plan items use a deterministic template built from the
  role's L1/L2 criteria (there are no `missing_concepts` for a skill that was never claimed).
- Declared chips become `Knows <chip>` claims mapped to a skill by keyword (deterministic), after
  resume claims; the combined list is capped at 8.
- Extracted claims whose `resume_line` is not actually in the resume are dropped (anti-hallucination).

## LLM failures

- Assess mode: invalid output / timeout ends the claim with verdict `error` (restartable).
- Retest mode: nothing is saved and the API returns 502/504, so the client can resend the same answer.
- Report time: fix task / rewrite failures fall back to templates; the report never fails because of them.
