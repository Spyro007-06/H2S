import { ApiError } from "@/api/types";
import { FRONTEND_DEVELOPER_ROLE, MOCK_ROLES } from "./roleFixture";
import { gradeAnswer, proficiencyForLevelsPassed } from "./grading";
import { questionFor, clarifyPrompt } from "./questions";
import { buildReport } from "./report";
import { buildDemoReport } from "./demoReport";
import type {
  BlindSpot,
  Claim,
  ClaimInput,
  ClaimsResponse,
  ConfirmRequest,
  Evidence,
  ExtractRequest,
  FixTask,
  FixTaskRequest,
  HealthResponse,
  InterrogateRequest,
  Level,
  Mode,
  Progress,
  Report,
  Role,
  RolesResponse,
  RoleSkill,
  TurnResponse,
} from "@/types/contract";

interface ClaimRuntime {
  level: Level;
  mode: Mode;
  clarifiedLevels: Set<Level>;
  beforeProficiency: number;
  interleavedAtStart: number;
}

interface MockSession {
  sessionId: string;
  roleId: string;
  claims: Claim[];
  blindSpots: BlindSpot[];
  runtime: Map<string, ClaimRuntime>;
}

const sessions = new Map<string, MockSession>();
let sessionCounter = 0;
let claimCounter = 0;

function delay<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function getRoleOrThrow(roleId: string): Role {
  const role = MOCK_ROLES.find((r) => r.id === roleId);
  if (!role) throw new ApiError(`Role ${roleId} not found`, "ROLE_NOT_FOUND", 404);
  return role;
}

function getSessionOrThrow(sessionId: string): MockSession {
  const session = sessions.get(sessionId);
  if (!session) throw new ApiError(`Session ${sessionId} not found`, "SESSION_NOT_FOUND", 404);
  return session;
}

function includesWord(haystack: string, needle: string): boolean {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, "i").test(haystack);
}

function findSkillByText(role: Role, text: string): RoleSkill | null {
  const normalized = text.toLowerCase();
  return (
    role.skills.find((s) => includesWord(normalized, s.name.toLowerCase())) ??
    role.skills.find((s) => s.keywords.some((k) => includesWord(normalized, k.toLowerCase()))) ??
    null
  );
}

function computeBlindSpots(role: Role, claims: Claim[]): BlindSpot[] {
  const covered = new Set(claims.map((c) => c.skill_id).filter(Boolean));
  return role.skills
    .filter((s) => !covered.has(s.id))
    .map((s) => ({ skill_id: s.id, name: s.name, weight: s.weight }));
}

function newClaim(text: string, resumeLine: string | null, skillId: string | null, source: Claim["source"]): Claim {
  claimCounter += 1;
  return {
    id: `CL-${String(claimCounter).padStart(3, "0")}`,
    text,
    resume_line: resumeLine,
    skill_id: skillId,
    source,
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

function recomputeProgress(session: MockSession): Progress {
  const nextClaim = pickNextClaim(session);
  return {
    claims_total: session.claims.length,
    claims_done: session.claims.filter((c) => c.verdict !== "pending").length,
    next_claim_id: nextClaim?.id ?? null,
    next_mode: nextClaim ? nextClaim.mode : undefined,
  };
}

/** Backend-style sequencing: offer an immediate retest for a freshly-weak claim, else the next pending one. */
function pickNextClaim(session: MockSession): { id: string; mode: Mode } | null {
  const dueRetest = session.claims.find(
    (c) => c.retest_status === "due" && (c.verdict === "shaky" || c.verdict === "bluff" || c.verdict === "honest_gap")
  );
  if (dueRetest) return { id: dueRetest.id, mode: "retest" };
  const pending = session.claims.find((c) => c.verdict === "pending");
  return pending ? { id: pending.id, mode: "assess" } : null;
}

// ---------------------------------------------------------------------------

async function getRoles(): Promise<RolesResponse> {
  return delay({ roles: MOCK_ROLES.map((r) => ({ id: r.id, name: r.name, description: r.description, skill_count: r.skills.length })) }, 200);
}

async function getRole(roleId: string): Promise<Role> {
  return delay(getRoleOrThrow(roleId), 200);
}

async function extractClaims(request: ExtractRequest): Promise<ClaimsResponse> {
  const role = getRoleOrThrow(request.role_id);
  const claims: Claim[] = [];

  const lines = (request.resume_text ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  for (const line of lines) {
    if (claims.length >= 8) break;
    const skill = findSkillByText(role, line);
    claims.push(newClaim(line, line, skill?.id ?? null, "resume"));
  }

  for (const chip of request.declared_skills ?? []) {
    if (claims.length >= 8) break;
    const skill = findSkillByText(role, chip);
    claims.push(newClaim(`Knows ${chip}`, null, skill?.id ?? null, "declared"));
  }

  if (claims.length === 0) {
    throw new ApiError("Couldn't find anything to extract from that input.", "BAD_REQUEST", 400);
  }

  sessionCounter += 1;
  const sessionId = `s_mock_${sessionCounter}`;
  const session: MockSession = {
    sessionId,
    roleId: role.id,
    claims,
    blindSpots: computeBlindSpots(role, claims),
    runtime: new Map(),
  };
  sessions.set(sessionId, session);

  return delay(
    {
      session_id: sessionId,
      role_id: role.id,
      claims,
      blind_spots: session.blindSpots,
      progress: recomputeProgress(session),
    },
    1200
  );
}

async function confirmClaims(request: ConfirmRequest): Promise<ClaimsResponse> {
  const session = getSessionOrThrow(request.session_id);
  const role = getRoleOrThrow(session.roleId);

  const nextClaims: Claim[] = request.claims.map((input: ClaimInput) => {
    if (input.id) {
      const existing = session.claims.find((c) => c.id === input.id);
      if (!existing) throw new ApiError(`Claim ${input.id} not found`, "CLAIM_NOT_FOUND", 404);
      const unchanged = existing.text === input.text && existing.skill_id === input.skill_id;
      return unchanged
        ? existing
        : { ...newClaim(input.text, input.resume_line, input.skill_id, existing.source), id: existing.id };
    }
    return newClaim(input.text, input.resume_line, input.skill_id, "declared");
  });

  session.claims = nextClaims;
  session.blindSpots = computeBlindSpots(role, nextClaims);

  return delay({
    session_id: session.sessionId,
    role_id: session.roleId,
    claims: session.claims,
    blind_spots: session.blindSpots,
    progress: recomputeProgress(session),
  });
}

async function interrogate(request: InterrogateRequest): Promise<TurnResponse> {
  const session = getSessionOrThrow(request.session_id);
  const role = getRoleOrThrow(session.roleId);
  const claim = session.claims.find((c) => c.id === request.claim_id);
  if (!claim) throw new ApiError(`Claim ${request.claim_id} not found`, "CLAIM_NOT_FOUND", 404);

  const mode: Mode = request.mode ?? "assess";
  const skill = role.skills.find((s) => s.id === claim.skill_id) ?? null;
  let runtime = session.runtime.get(claim.id);

  if (!runtime || runtime.mode !== mode) {
    const startLevel: Level = mode === "retest" ? (claim.verdict === "shaky" ? ((claim.levels_passed + 1) as Level) : 1) : 1;
    runtime = {
      level: startLevel,
      mode,
      clarifiedLevels: new Set(),
      beforeProficiency: claim.proficiency,
      interleavedAtStart: session.claims.filter((c) => c.id !== claim.id && c.verdict !== "pending").length,
    };
    session.runtime.set(claim.id, runtime);
  }

  const openTurn = claim.qa[claim.qa.length - 1];

  if (request.answer === undefined) {
    if (openTurn && openTurn.answer === null) {
      return delay(toTurnResponse(session, claim, openTurn.level, "question", openTurn.question, null));
    }
    const question = questionFor(claim, skill, runtime.level, mode);
    claim.qa.push({ level: runtime.level, kind: mode === "retest" ? "retest" : "question", mode, question, answer: null, grade: null, asked_at: new Date().toISOString() });
    return delay(toTurnResponse(session, claim, runtime.level, "question", question, null), 900);
  }

  if (!openTurn || openTurn.answer !== null) {
    throw new ApiError("No open question for this claim.", "BAD_REQUEST", 400);
  }

  const result = gradeAnswer(request.answer, runtime.level, skill);
  openTurn.answer = request.answer;
  openTurn.grade = result.grade;

  if (result.admitsGap) {
    claim.verdict = "honest_gap";
    claim.proficiency = 0;
    finishClaim(session, claim, runtime, mode);
    return delay(toTurnResponse(session, claim, null, "done", null, result.grade, { teachNow: mode === "assess" }), 1400);
  }

  if (result.needsClarification && !runtime.clarifiedLevels.has(runtime.level)) {
    runtime.clarifiedLevels.add(runtime.level);
    const question = clarifyPrompt(questionFor(claim, skill, runtime.level, mode));
    claim.qa.push({ level: runtime.level, kind: "clarify", mode, question, answer: null, grade: null, asked_at: new Date().toISOString() });
    return delay(toTurnResponse(session, claim, runtime.level, "clarify", question, result.grade), 1200);
  }

  recordEvidence(claim, runtime.level, result.grade);

  if (result.levelPassed) {
    claim.levels_passed = Math.max(claim.levels_passed, runtime.level) as Claim["levels_passed"];
    if (runtime.level < 3) {
      runtime.level = (runtime.level + 1) as Level;
      const question = questionFor(claim, skill, runtime.level, mode);
      claim.qa.push({ level: runtime.level, kind: mode === "retest" ? "retest" : "question", mode, question, answer: null, grade: null, asked_at: new Date().toISOString() });
      return delay(toTurnResponse(session, claim, runtime.level, "question", question, result.grade), 1400);
    }
    claim.verdict = "defended";
    claim.proficiency = mode === "retest" ? 1.0 : 0.85;
    finishClaim(session, claim, runtime, mode);
    return delay(toTurnResponse(session, claim, null, "done", null, result.grade), 1400);
  }

  claim.verdict = claim.levels_passed === 0 ? "bluff" : "shaky";
  claim.proficiency = proficiencyForLevelsPassed(claim.levels_passed);
  finishClaim(session, claim, runtime, mode);
  return delay(toTurnResponse(session, claim, null, "done", null, result.grade, { teachNow: mode === "assess" }), 1400);
}

function recordEvidence(claim: Claim, level: Level, grade: TurnResponse["grade"]): void {
  if (!grade) return;
  (Object.entries(grade.criteria) as [Evidence["criterion"], { passed: boolean; evidence_quote: string | null }][]).forEach(
    ([criterion, result]) => {
      if (result.evidence_quote) {
        claim.evidence.push({ level, criterion, passed: result.passed, quote: result.evidence_quote });
      }
      if (!result.passed) {
        const concept = grade.criteria[criterion].missing_concept;
        if (concept && !claim.missing_concepts.includes(concept)) claim.missing_concepts.push(concept);
      }
    }
  );
}

function finishClaim(session: MockSession, claim: Claim, runtime: ClaimRuntime, mode: Mode): void {
  if (mode === "retest") {
    claim.retest = {
      attempted: true,
      passed: claim.proficiency > runtime.beforeProficiency,
      before: runtime.beforeProficiency,
      after: claim.proficiency,
      interleaved_claims: runtime.interleavedAtStart,
    };
    claim.retest_status = "done";
  } else if (claim.verdict === "shaky" || claim.verdict === "bluff" || claim.verdict === "honest_gap") {
    claim.retest_status = "due";
  }
  session.runtime.delete(claim.id);
}

function toTurnResponse(
  session: MockSession,
  claim: Claim,
  level: Level | null,
  turn: TurnResponse["turn"],
  question: string | null,
  grade: TurnResponse["grade"],
  learning: { teachNow?: boolean } = {}
): TurnResponse {
  const progress = recomputeProgress(session);
  const next = turn === "done" ? pickNextClaim(session) : null;
  return {
    session_id: session.sessionId,
    claim_id: claim.id,
    mode: session.runtime.get(claim.id)?.mode ?? "assess",
    turn,
    level,
    question,
    grade,
    claim,
    progress,
    ...(turn === "done" ? { teach_now: Boolean(learning.teachNow), next_claim_id: next?.id ?? null, next_mode: next?.mode } : {}),
  };
}

async function getFixTask(request: FixTaskRequest): Promise<FixTask> {
  const session = getSessionOrThrow(request.session_id);
  const role = getRoleOrThrow(session.roleId);
  const claim = session.claims.find((c) => c.id === request.claim_id);
  if (!claim) throw new ApiError(`Claim ${request.claim_id} not found`, "CLAIM_NOT_FOUND", 404);
  if (claim.fix_task) return delay(claim.fix_task, 400);

  const skill = role.skills.find((s) => s.id === claim.skill_id) ?? null;
  const exercise = skill?.levels.L2[0] ?? "Explain the concept step by step, in your own words, using a concrete example.";
  const fixTask: FixTask = {
    claim_id: claim.id,
    skill_id: claim.skill_id,
    missing_concepts: claim.missing_concepts.length > 0 ? claim.missing_concepts : ["A concrete mechanism, not just the outcome"],
    explanation: skill
      ? `${skill.description} Right now your answer describes *what* happened but not *how* — that gap is exactly what "${claim.text}" needs to close.`
      : `Your answer needs a concrete mechanism, not just a description of the outcome.`,
    exercise: `Try this: ${exercise}`,
  };
  claim.fix_task = fixTask;
  return delay(fixTask, 900);
}

async function getReport(sessionId: string): Promise<Report> {
  const session = getSessionOrThrow(sessionId);
  const role = getRoleOrThrow(session.roleId);
  return delay(buildReport(session.sessionId, role, session.claims, session.blindSpots), 700);
}

async function getDemoReport(): Promise<Report> {
  return delay(buildDemoReport(FRONTEND_DEVELOPER_ROLE), 300);
}

async function getHealth(): Promise<HealthResponse> {
  return delay({ status: "ok", llm_mode: "mock", model: null }, 50);
}

export const mockApi = {
  getHealth,
  getRoles,
  getRole,
  extractClaims,
  confirmClaims,
  interrogate,
  getFixTask,
  getReport,
  getDemoReport,
};
