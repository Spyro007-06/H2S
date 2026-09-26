# UNBLUFF — API Contract (FROZEN)

> Source of truth for frontend ↔ backend. Field names, enum values, nesting and paths are exact.
> Changes require both teams to agree; log them in `DECISIONS.md`.

## 1. Overview

A student picks a target role and gives a resume and/or declared skills. The backend extracts
**claims**, the student confirms them, then every claim is interrogated on three levels:

| Level | Probes |
|---|---|
| L1 | What they built/know, and **their** personal part |
| L2 | How it works internally |
| L3 | Why this design: alternatives, trade-offs, what broke |

Each claim ends as `defended`, `shaky`, `bluff`, `honest_gap` (or `error` if the LLM failed).
The report shows readiness, coverage, a resume heatmap, per-skill states, blind spots, priorities,
a 7-day plan, fix tasks and retests.

**The LLM never decides a score.** It returns per-criterion booleans plus verbatim evidence quotes;
backend code decides pass/fail, verdicts, proficiency, readiness, coverage and plans.

## 2. Conventions

- Base URL: `${VITE_API_URL}/api` (backend default port `8080`).
- JSON in, JSON out. `Content-Type: application/json`. Max body size: 100 kB.
- All ids are strings. Claim ids look like `CL-001`, stable for the session.
- Timestamps are ISO-8601 UTC strings.
- Numbers: `proficiency` is `0..1`; `readiness` and `coverage` are integers `0..100`.
- Sessions live in server memory (or Firestore on Cloud Run). No auth.
- Every non-2xx response has this shape:

```json
{ "error": { "code": "SESSION_NOT_FOUND", "message": "Session s_123 not found" } }
```

| HTTP | code | When |
|---|---|---|
| 400 | `BAD_REQUEST` | Body fails validation, or the action isn't allowed in the current state |
| 404 | `NOT_FOUND` | Unknown route |
| 404 | `ROLE_NOT_FOUND` | Unknown `role_id` |
| 404 | `SESSION_NOT_FOUND` | Unknown `session_id` |
| 404 | `CLAIM_NOT_FOUND` | Unknown `claim_id` in that session |
| 429 | `RATE_LIMITED` | Too many requests; retry later |
| 502 | `LLM_INVALID_OUTPUT` | LLM output invalid after one retry (extraction only; grading turns this into verdict `error`) |
| 504 | `LLM_TIMEOUT` | LLM call exceeded 25 s (extraction only; same rule as above) |
| 500 | `INTERNAL` | Anything else |

## 3. Enums

| Type | Values |
|---|---|
| `Level` | `1` `2` `3` |
| `Verdict` | `pending` `defended` `shaky` `bluff` `honest_gap` `error` |
| `SkillState` | `ready` `needs_work` `unverified` `blind_spot` `deprioritized` |
| `Criterion` | `accuracy` `specificity` `mechanism` `ownership` `tradeoff` |
| `ClaimSource` | `resume` `declared` |
| `Mode` | `assess` `retest` |
| `TurnType` | `question` `clarify` `done` |
| `QuestionKind` | `question` `clarify` `retest` |
| `LlmMode` | `live` `mock` |

`deprioritized` is never used in `Report.skills`; it describes claims whose `skill_id` is `null`
(listed in `Report.deprioritized_claim_ids`).

## 4. Types (copy verbatim into `types.ts`)

```ts
// ===== UNBLUFF shared types — copied EXACTLY from CONTRACT.md §4 =====

// ---------- Enums ----------
export type Level = 1 | 2 | 3;
export type LevelsPassed = 0 | 1 | 2 | 3;
export type Verdict = "pending" | "defended" | "shaky" | "bluff" | "honest_gap" | "error";
export type SkillState = "ready" | "needs_work" | "unverified" | "blind_spot" | "deprioritized";
export type Criterion = "accuracy" | "specificity" | "mechanism" | "ownership" | "tradeoff";
export type ClaimSource = "resume" | "declared";
export type Mode = "assess" | "retest";
export type TurnType = "question" | "clarify" | "done";
export type QuestionKind = "question" | "clarify" | "retest";
export type LlmMode = "live" | "mock";
export type ErrorCode =
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "ROLE_NOT_FOUND"
  | "SESSION_NOT_FOUND"
  | "CLAIM_NOT_FOUND"
  | "RATE_LIMITED"
  | "LLM_INVALID_OUTPUT"
  | "LLM_TIMEOUT"
  | "INTERNAL";

// ---------- Roles ----------
export interface LevelCriteria {
  L1: string[];
  L2: string[];
  L3: string[];
}

export interface RoleSkill {
  id: string;
  name: string;
  weight: number; // all weights in a role sum to 1.0
  description: string;
  keywords: string[];
  levels: LevelCriteria;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  skills: RoleSkill[];
}

export interface RoleSummary {
  id: string;
  name: string;
  description: string;
  skill_count: number;
}

// ---------- Grading ----------
export interface CriterionResult {
  passed: boolean;
  evidence_quote: string | null; // verbatim substring of the answer, or null
  missing_concept: string | null;
}

export interface Grade {
  criteria: Record<Criterion, CriterionResult>;
  admits_gap: boolean;
  needs_clarification: boolean;
  level_passed: boolean; // computed by backend code, never by the LLM
  guard_flips: Criterion[]; // criteria forced to false because the quote was not in the answer
}

// ---------- Claims ----------
export interface QA {
  level: Level;
  kind: QuestionKind;
  mode: Mode;
  question: string;
  answer: string | null; // null while the question is waiting for an answer
  grade: Grade | null;
  asked_at: string;
}

export interface Evidence {
  level: Level;
  criterion: Criterion;
  passed: boolean;
  quote: string; // verbatim from the student's answer
}

export interface RetestResult {
  attempted: boolean;
  passed: boolean; // after > before
  before: number;
  after: number;
}

export interface FixTask {
  claim_id: string;
  skill_id: string | null;
  missing_concepts: string[];
  explanation: string; // markdown, <= 120 words
  exercise: string; // markdown
}

export interface Claim {
  id: string; // "CL-001"
  text: string;
  resume_line: string | null; // verbatim resume line; null for declared skills
  skill_id: string | null; // null => deprioritized (not in the role)
  source: ClaimSource;
  verdict: Verdict;
  levels_passed: LevelsPassed;
  proficiency: number; // 0..1
  missing_concepts: string[];
  evidence: Evidence[];
  qa: QA[];
  retest: RetestResult | null;
  fix_task: FixTask | null;
  rewrite: string | null; // honest resume rewrite, only for shaky/bluff/honest_gap
}

export interface ClaimInput {
  id: string | null; // null => new claim, gets a fresh id
  text: string;
  resume_line: string | null;
  skill_id: string | null;
}

export interface BlindSpot {
  skill_id: string;
  name: string;
  weight: number;
}

export interface Progress {
  claims_total: number;
  claims_done: number; // claims whose verdict is not "pending"
  next_claim_id: string | null; // first "pending" claim in list order
}

// ---------- Report ----------
export interface SkillHistoryEntry {
  at: string;
  mode: Mode;
  claim_id: string;
  proficiency: number; // skill proficiency after this event
}

export interface SkillReport {
  skill_id: string;
  name: string;
  weight: number;
  state: SkillState;
  proficiency: number;
  claim_ids: string[];
  history: SkillHistoryEntry[];
}

export interface ResumeLine {
  index: number; // 0-based over non-empty lines
  text: string;
  verdict: Verdict | null; // worst verdict of mapped claims; null if none
  claim_ids: string[];
}

export interface Priority {
  rank: number; // 1..3
  skill_id: string;
  claim_id: string | null; // null for blind spots
  score: number; // weight * (1 - proficiency), 3 decimals
  reason: string;
}

export interface PlanItem {
  day: number; // 1..7, max 2 items per day
  skill_id: string | null;
  claim_id: string | null;
  title: string;
  task: string; // markdown
}

export interface Report {
  session_id: string;
  role: { id: string; name: string };
  generated_at: string;
  readiness: number; // 0..100
  coverage: number; // 0..100
  claims: Claim[];
  skills: SkillReport[]; // one per role skill, role order
  deprioritized_claim_ids: string[];
  blind_spots: BlindSpot[];
  resume_lines: ResumeLine[];
  priorities: Priority[];
  plan: PlanItem[];
  progress: Progress;
}

// ---------- Requests / responses ----------
export interface HealthResponse {
  status: "ok";
  llm_mode: LlmMode;
  model: string | null;
}

export interface RolesResponse {
  roles: RoleSummary[];
}

export interface ExtractRequest {
  role_id: string;
  resume_text?: string | null; // <= 20000 chars
  declared_skills?: string[]; // <= 20 chips, each <= 60 chars
}

export interface ClaimsResponse {
  session_id: string;
  role_id: string;
  claims: Claim[];
  blind_spots: BlindSpot[];
  progress: Progress;
}

export interface ConfirmRequest {
  session_id: string;
  claims: ClaimInput[]; // 1..8
}

export interface InterrogateRequest {
  session_id: string;
  claim_id: string;
  mode?: Mode; // default "assess"
  answer?: string; // omit to start (or resume) the claim; <= 4000 chars
}

export interface TurnResponse {
  session_id: string;
  claim_id: string;
  mode: Mode;
  turn: TurnType;
  level: Level | null; // level of `question`; null when turn is "done"
  question: string | null; // null when turn is "done"
  grade: Grade | null; // grade of the answer just submitted; null on start
  claim: Claim;
  progress: Progress;
}

export interface FixTaskRequest {
  session_id: string;
  claim_id: string;
}

export type FixTaskResponse = FixTask;

export interface ApiErrorBody {
  error: { code: ErrorCode; message: string };
}
```

## 5. Endpoints

| Method | Path | Body | 200 response |
|---|---|---|---|
| GET | `/api/health` | — | `HealthResponse` |
| GET | `/api/roles` | — | `RolesResponse` |
| GET | `/api/roles/:roleId` | — | `Role` |
| POST | `/api/claims/extract` | `ExtractRequest` | `ClaimsResponse` (creates the session) |
| POST | `/api/claims/confirm` | `ConfirmRequest` | `ClaimsResponse` |
| POST | `/api/interrogate` | `InterrogateRequest` | `TurnResponse` |
| POST | `/api/fix-task` | `FixTaskRequest` | `FixTaskResponse` |
| GET | `/api/report/:sessionId` | — | `Report` |
| GET | `/api/demo/report` | — | `Report` (the §7 mock, verbatim) |

### `POST /api/claims/extract`
- At least one of `resume_text` (non-blank) or `declared_skills` (non-empty) is required → else 400.
- Max 8 claims. Resume claims come first, then one claim per declared chip (`source: "declared"`,
  `text: "Knows <chip>"`, `resume_line: null`).
- All claims start `verdict: "pending"`, `levels_passed: 0`, `proficiency: 0`.

### `POST /api/claims/confirm`
- Replaces the claim list. `id: null` → new id. An existing id keeps its progress only if `text` and
  `skill_id` are unchanged; otherwise it resets to `pending`. Unknown id → 404 `CLAIM_NOT_FOUND`.
- `skill_id` must be a skill of the session's role or `null` → else 400. Blind spots are recomputed.

### `POST /api/interrogate`
One endpoint drives both assessment and retest.

| Request | Behaviour |
|---|---|
| no `answer`, claim idle | Starts the claim. `mode: "assess"` requires verdict `pending` or `error`. `mode: "retest"` requires `shaky`, `bluff` or `honest_gap`. Else 400. Returns `turn: "question"`. |
| no `answer`, claim in progress | Returns the current open question again (safe to call on page reload). |
| `answer`, claim in progress | Grades the answer and returns the next turn. |
| `answer`, claim idle | 400. |

Turn rules:

| Situation | Result |
|---|---|
| `admits_gap` | `turn: "done"`, verdict `honest_gap` |
| `needs_clarification` and this level's clarify not used | `turn: "clarify"`, same level, follow-up question |
| Level failed | `turn: "done"` |
| Level passed, level < 3 | `turn: "question"`, next level |
| Level 3 passed | `turn: "done"` |
| LLM invalid/timeout | `turn: "done"`, verdict `error` (assess) — may be re-started |

Level pass rules (code, after the evidence guard): **L1** `accuracy && specificity && ownership`,
**L2** `accuracy && mechanism`, **L3** `accuracy && tradeoff`.

| Outcome | Verdict | Proficiency |
|---|---|---|
| 3 levels passed | `defended` | 0.85 |
| 2 levels passed | `shaky` | 0.60 |
| 1 level passed | `shaky` | 0.25 |
| 0 levels passed | `bluff` | 0 |
| Gap admitted | `honest_gap` | 0 |
| LLM failure | `error` | 0 |
| Retest passed through L3 | `defended` | 1.0 |

Retest starts at the first failed level (L1 for `bluff`/`honest_gap`) with a new scenario question,
and on `done` sets `claim.retest`. A failed retest keeps the old verdict and never lowers proficiency.

### `POST /api/fix-task`
Only for `shaky`, `bluff`, `honest_gap` claims (else 400). Result is cached on `claim.fix_task`.

### `GET /api/report/:sessionId`
Builds the report. Rewrites and fix tasks for weak claims are generated once and cached, so
refetching is cheap. Can be called at any time (unassessed claims are `pending`).

- `readiness = round(100 × Σ weight × skill proficiency)`, skill proficiency = max over its claims.
- `coverage = round(100 × Σ weight of skills with ≥1 claim whose verdict is not pending/error)`.
- Skill `state`: `blind_spot` (no claims) → `unverified` (all pending/error) → `ready` (≥ 0.6) → `needs_work`.
- `priorities`: top 3 skills by `weight × (1 − proficiency)`, ties by weight then role order.
- `plan`: one item per priority, then remaining shaky/bluff/honest_gap claims; days 1..7, 2 per day.
- `resume_lines`: worst verdict per line, severity `bluff > shaky > honest_gap > error > pending > defended`.

## 6. Display mapping (label + icon + color — never color alone)

Colors are chosen for ≥ 4.5:1 contrast as text on white (`fg`) and on their tint (`bg`).
Icon names are from `lucide-react`.

| Verdict | Label | Icon | fg | bg |
|---|---|---|---|---|
| `defended` | Defended | `ShieldCheck` | `#166534` | `#DCFCE7` |
| `shaky` | Shaky | `AlertTriangle` | `#92400E` | `#FEF3C7` |
| `bluff` | Bluff | `XOctagon` | `#991B1B` | `#FEE2E2` |
| `honest_gap` | Honest gap | `HelpCircle` | `#1E40AF` | `#DBEAFE` |
| `error` | Not assessed (error) | `CircleSlash` | `#374151` | `#F3F4F6` |
| `pending` | Not yet assessed | `Clock` | `#334155` | `#F1F5F9` |

| SkillState | Label | Icon | fg | bg |
|---|---|---|---|---|
| `ready` | Ready | `CheckCircle2` | `#166534` | `#DCFCE7` |
| `needs_work` | Needs work | `Wrench` | `#92400E` | `#FEF3C7` |
| `unverified` | Unverified | `Clock` | `#334155` | `#F1F5F9` |
| `blind_spot` | Blind spot | `EyeOff` | `#6B21A8` | `#F3E8FF` |
| `deprioritized` | Not in role | `MinusCircle` | `#374151` | `#F3F4F6` |

Resume heatmap line with `verdict: null` → no highlight, label "No claim".

## 7. Mock report

`GET /api/demo/report` returns exactly this JSON (also `backend/data/demo_report.json` and
`frontend/src/mocks/report.json`). It was generated by the backend's own report builder
(`backend/scripts/build_demo_report.ts`) so it is guaranteed to match §4.

MOCK_REPORT_PLACEHOLDER
