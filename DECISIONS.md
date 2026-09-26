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

## Live Gemini

- **Model:** originally `gemini-3.6-flash` (≈1.5–3 s per call); switched to `gemini-3.1-flash-lite` as primary because of the free-tier daily cap (see Quota). `gemini-2.5-flash` is not
  available to new keys; `gemini-3.8-flash` / `gemini-flash-latest` returned frequent 503/429;
  `gemini-3.5-flash` timed out. `GEMINI_MODEL` stays required with no hardcoded default.
- **Fallback model (addition):** `GEMINI_FALLBACK_MODEL` (e.g. `gemini-3.1-flash-lite`). On a 429/5xx
  the single retry goes to the fallback, with no invalid-JSON note. After a quota 429 the primary is
  skipped for the "retry in Ns" window (max 60 s) to avoid wasted calls. Invalid-JSON retries stay
  on the same model with the note, as specified.
- **Thinking:** `thinkingLevel: LOW` for all prompts (latency). `GRADE_THINKING` env can raise it for
  grading if quality needs it; LOW passed every grade-check case.
- **Structured output:** zod schemas → `z.toJSONSchema` → `responseJsonSchema`, then zod-validated again.
- **Transient API errors (429/5xx) use the one retry.** Non-transient API errors (400/401/403) fail
  immediately as `LLM_INVALID_OUTPUT`.
- **GRADE prompt tightened twice** during the grade check:
  1. "A correct but thin answer keeps accuracy = true" so vague-but-true answers fail on
     mechanism/specificity instead of accuracy.
  2. "Relevance first": a true but off-topic answer (e.g. a Redux speech for a TypeScript question)
     had passed L1 in the live smoke. It now fails accuracy and specificity. Added grade-check case (f).
- **Case (d)** ("state changes and React updates the screen") consistently returns
  `accuracy=T, mechanism=F, needs_clarification=F`, so it ends the claim rather than triggering a
  clarify turn. That satisfies "needs_clarification OR fails mechanism". Left as-is: pushing the
  model towards clarify risked making it lenient on (b).

## Quota (important for the demo)

- The provided key is on the **free tier**. `gemini-3.6-flash` is capped at **20 requests/day**
  (`GenerateRequestsPerDayPerProjectPerModel-FreeTier`; an earlier note here wrongly said per minute).
  A full session is 30–40 calls, so **`gemini-3.1-flash-lite` is now the primary** (6/6 on the grade check,
  same as 3.6-flash) with 3.6-flash as the fallback. With billing on, swap them back. Mitigations: fallback model + cooldown, report-time LLM calls capped at 2
  concurrent and stopping after the first failure (templates fill in, next fetch retries),
  `SMOKE_DELAY` pacing in `smoke.sh`. **Enable billing on the key for the live demo.**
- Retest mode returns 502/504 on LLM failure and saves nothing, so the same answer can be resent.

## Efficiency

- Report-time rewrites/fix tasks are generated once and cached on the claim. A report refetch makes
  0 LLM calls (integration test). The cache is invalidated when a claim finishes (assess or retest).
- Re-requesting an open question (page reload) makes no LLM call.
- Per-session promise lock: concurrent double-submits are serialised, so an answer is graded once and
  the duplicate gets 400.

## Security

- helmet, `x-powered-by` off, CORS from `CORS_ORIGIN` (comma-separated allow-list or `*`), 100 kB
  JSON limit, strict zod request schemas (unknown keys → 400), global 300/min + LLM routes 40/min
  per IP (`RATE_LIMITED` in the contract shape), no stack traces in responses.
- Prompt injection: student text lives inside `<student_*>` tags; any attempt to write those tags is
  replaced with `[tag removed]`; the system instruction says tag content is data. The evidence guard
  means even a fooled model can't pass a criterion without a real quote.
- Keys only from env / Secret Manager; pino `redact` + error-message scrubbing of key-like strings.

## Stubs / not verified here

- **Docker is not installed on the dev machine**, so `docker build` could not be run locally. The
  compiled `dist/` server (what the image runs) was built and smoke-tested with `node dist/src/server.js`.
- **Firestore store** is implemented (`STORE=firestore`, ADC credentials) and unit-tested with a mocked
  client (round-trip, missing → null, nested serialization, overwrite). Not yet exercised against a
  real project.
- **Cloud Run deploy is blocked: the Google Cloud SDK (`gcloud`) is not installed** on the dev machine.
  `backend/scripts/deploy.sh` is ready (`SETUP=1` enables APIs, creates Firestore, pipes the key from
  `backend/.env` into Secret Manager via stdin, grants the runtime SA secretAccessor + datastore.user,
  then `gcloud run deploy --source backend`).
- **`is_demo` flag:** the deploy verification checklist asks to check `is_demo: true` on
  `/api/demo/report`, but the frozen contract's `Report` type has no such field. It was not added;
  the demo report is identifiable by `session_id: "s_demo"`. Adding `is_demo` needs both teams to agree
  on a contract change.
- `jq` isn't installed locally; `smoke.sh` uses jq when present, otherwise `scripts/jq-lite.mjs`.
- Port 8080 is taken on the dev machine by an unrelated Windows service, so local runs used
  8090/8091. Express 5 reports bind errors through the `listen` callback, which is now handled
  (the server exits with a fatal log instead of silently).
- Frontend: only the folder skeleton, `.env.example` and `src/mocks/report.json` (generated) come
  from the backend side. The frontend devs own the rest.
- Frontend timeout note: interrogate can make 2 LLM calls (grade + next question), and each call may
  retry once. Typical latency is 3–8 s, but a slow worst case can pass 30 s. Consider 45–60 s for
  `/interrogate` and `/report`.

## Addendum 2: learning loop (contract change, additive only)

**Ordering note:** the brief says to do this after the Cloud Run deploy + verification. The deploy is
blocked (no `gcloud` on the dev machine), so the addendum was built first. The deploy script ships
everything once gcloud is available.

**Contract additions (§3/§4/§5), nothing renamed or removed:**
- Enums `SessionMode` (`prepare` | `defense`), `RetestStatus` (`none` | `scheduled` | `due` | `done`).
- `ExtractRequest.mode?`; `ClaimsResponse.mode`; `Report.mode`.
- `RoleSkill.prerequisites`; `Grade.root_cause`; `FixTask.root_cause`.
- `Claim.root_cause`, `Claim.retest_status`, `Claim.retest_unlocks_after` (the brief's "ClaimResult"
  is our `Claim`); `RetestResult.interleaved_claims`.
- `Progress.next_mode`; `TurnResponse.next_mode`, `TurnResponse.teach_now` (the brief's
  "InterrogateResponse" is our `TurnResponse`).
- **Semantics change on an existing field:** `Progress.next_claim_id` now prefers a due retest over the
  next pending claim (it used to be "first pending"). Requested explicitly; the frontend should route
  on `next_mode`.
- **Behaviour change:** `mode: "retest"` now also requires `retest_status: "due"`, which means opening the
  fix task first. Older clients that retest immediately get 400, except when nothing else is pending
  (rule 3 forces the retest due).

**Decisions:**
- Internal `teach_completed_at_claims_done` is the session's completion counter (every assess or
  retest `done`, including `error` endings) at fix-task time. `interleaved_claims` = counter at retest
  start minus that. It is the real number: a forced-due retest right after the fix task records 0.
- A claim's own completion never counts down its own retest; `error` endings of other claims do count
  (they are `turn: "done"`).
- Report-time fix-task generation does not schedule retests; only `POST /api/fix-task` does
  (the student must actually open the task).
- Re-opening the fix task while scheduled/due doesn't reset the countdown. After a retest (`done`), a
  still-weak claim can be scheduled again by opening its new fix task.
- `root_cause` is always `null` on a passed level, and validation is exact string match.
- Higher levels inside a retest target that level's role criteria (`rootCause: null`); the first retest
  question targets `root_cause` (else `missing_concepts`).
- Mock provider: `root_cause` = the skill's first (most fundamental) prerequisite on any failure;
  `null` on a pass. Deterministic.
- The new key (supplied mid-session) replaced the old one in `backend/.env` only. It is also free tier,
  so `gemini-3.1-flash-lite` stays primary.
- Live check after the GRADE change: 6/6 still, and root causes come back as valid prerequisites
  (e.g. "Component render cycle" for the virtual-DOM-cache answer, "Immutability" for a
  mutate-then-setState bug).

## Hosting: Render instead of Cloud Run

- The team has no billing account, and Cloud Run / Cloud Build / Artifact Registry / Secret Manager
  (and Firebase Functions) all require one. The backend therefore deploys to **Render's free Docker
  web service** via `render.yaml` (Blueprint, region singapore, health check `/api/health`). The
  frontend stays on **Firebase Hosting** (Spark plan, no billing).
- The GCP path (`backend/scripts/deploy.sh`, `STORE=firestore`) is kept, tested and documented as
  "ready, needs billing". The README services table marks what is live vs ready, so we don't claim
  services the demo doesn't use.
- **Sessions are in memory on Render** (`STORE=memory`). Firestore without Cloud Run would need a
  service-account JSON key stored on Render; skipped to avoid handling a long-lived GCP credential.
  Consequence: sessions reset when the free instance sleeps (~15 min idle) or redeploys.
- **Cold start ≈ 1 min** after idle. The frontend should call `/api/health` on landing and show a
  "waking the examiner…" status; `/api/demo/report` is the fallback for the demo.
- **Dockerfile bug fixed:** `.dockerignore` excludes `tests/`, but the build stage copied
  `tests/fixtures`, so the image could never have built. `npm run build` now uses
  `tsconfig.build.json` (src only). Scripts and tests are still typechecked by `npm run typecheck`
  and CI. Without Docker locally, the build was rehearsed stage by stage (same COPYs, `npm ci`,
  `npm ci --omit=dev`): the image boots on Render's `PORT=10000`, contains no `.env`, and exits with
  a clear config error in live mode when `GEMINI_API_KEY` is missing.
- The Gemini key is declared `sync: false` in `render.yaml`: Render prompts for it once in its
  dashboard; it never enters the repo.

## Compatibility hardening

- `POST /api/interrogate` accepts `answer: null` as identical to an omitted answer (start or resume, no
  LLM call on resume). Blank strings are still 400, so only `null` means "no answer".
  `InterrogateRequest.answer` is now `string | null` (widened, not breaking).
- `TurnResponse` gained five **alias** fields for older clients: `last_grade`, `verdict`,
  `levels_passed`, `next_claim_id`, `retest`. They are always equal to `grade`, `claim.verdict`,
  `claim.levels_passed`, `progress.next_claim_id` and `claim.retest` (an integration test asserts this
  on every turn type). New code should read the canonical fields.
