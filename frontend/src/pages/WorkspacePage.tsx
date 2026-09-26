import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, HelpCircle } from "lucide-react";
import { useSessionState, useInterrogationState } from "@/state/useSession";
import { useInterrogate } from "@/hooks/useInterrogate";
import { useFixTask } from "@/hooks/useFixTask";
import { ClaimListPanel } from "@/components/interrogation/ClaimListPanel";
import { LevelTracker } from "@/components/interrogation/LevelTracker";
import { FixTaskCard } from "@/components/common/FixTaskCard";
import { VerdictBadge } from "@/components/ui/StatusBadge";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";
import { buttonClasses } from "@/lib/buttonClasses";
import { cn } from "@/lib/cn";
import type { Criterion } from "@/types/contract";

const CRITERION_LABELS: Record<Criterion, string> = {
  accuracy: "Accuracy",
  specificity: "Specificity",
  mechanism: "Mechanism",
  ownership: "Ownership",
  tradeoff: "Trade-off",
};

export const WorkspacePage: React.FC = () => {
  const { state: session } = useSessionState();
  const { state: interrogation, dispatch: interrogationDispatch } = useInterrogationState();
  const { start, submitAnswer, retry } = useInterrogate();
  const fixTask = useFixTask();
  const [answerText, setAnswerText] = useState("");

  const { sessionId } = session;
  const { currentTurn, isLoading, error, activeClaimId, activeMode, inlineTeachNow } =
    interrogation;

  const activeClaim = session.claims.find((c) => c.id === activeClaimId) ?? null;

  // Land on the backend-designated next claim the first time this page is visited.
  useEffect(() => {
    if (!sessionId || activeClaimId) return;
    const nextId = session.progress?.next_claim_id;
    if (nextId) start(sessionId, nextId, session.progress?.next_mode ?? "assess");
  }, [sessionId, activeClaimId, session.progress, start]);

  // Fetch the fix task the moment the backend says teach_now for this claim.
  useEffect(() => {
    if (inlineTeachNow && sessionId && currentTurn?.claim_id && !fixTask.fixTask) {
      void fixTask.load(sessionId, currentTurn.claim_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inlineTeachNow, sessionId, currentTurn?.claim_id]);

  useEffect(() => {
    setAnswerText("");
  }, [currentTurn?.question]);

  if (!sessionId) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <p className="text-ink-secondary">
          There&rsquo;s no active session. Start from Setup to begin an assessment.
        </p>
        <Link to="/setup" className={cn("mt-4 inline-flex", buttonClasses())}>
          Go to Setup
        </Link>
      </div>
    );
  }

  const nextClaimId =
    currentTurn?.next_claim_id !== undefined
      ? currentTurn.next_claim_id
      : (currentTurn?.progress.next_claim_id ?? null);
  const nextMode = currentTurn?.next_mode ?? currentTurn?.progress.next_mode ?? "assess";

  function handleAdvance() {
    if (!sessionId) return;
    fixTask.reset();
    interrogationDispatch({ type: "DISMISS_INLINE_TEACH" });
    if (nextClaimId) {
      start(sessionId, nextClaimId, nextMode);
    }
  }

  const showTeachCard = currentTurn?.turn === "done" && inlineTeachNow;
  const showAdvanceControls = currentTurn?.turn === "done" && !inlineTeachNow;

  return (
    <div className="mx-auto max-w-6xl p-4 pb-16 pt-8 sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-ink-primary sm:text-3xl">
        Interrogation Workspace
      </h1>
      <p className="mt-2 text-ink-secondary">
        Defend your claims across three levels of depth. The backend decides every
        question, grade and verdict — this screen only shows you what it found.
      </p>

      {activeMode === "retest" && activeClaim && currentTurn?.turn !== "done" && (
        <div className="mt-6 rounded-md border border-primary/30 bg-primary-soft p-3 text-sm text-ink-primary">
          Welcome back to <strong>{activeClaim.text}</strong> — a new scenario. Let&rsquo;s see
          if it stuck.
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr_220px]">
        <div className="order-2 lg:order-1">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-subtle">
            Claims
          </h2>
          <ClaimListPanel claims={session.claims} activeClaimId={activeClaimId} />
        </div>

        <div className="order-1 lg:order-2">
          {!activeClaim && !isLoading && (
            <Card>
              <p className="text-sm text-ink-muted">
                All claims are assessed. Head to your report to see the results.
              </p>
              <Link to={`/report/${sessionId}`} className={cn("mt-4 inline-flex", buttonClasses())}>
                See my report →
              </Link>
            </Card>
          )}

          {activeClaim && (
            <Card>
              <p className="font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
                Claim
              </p>
              <p className="mt-1 text-sm font-medium text-ink-primary">{activeClaim.text}</p>

              {isLoading && (
                <p className="mt-6 text-sm text-ink-muted" role="status">
                  {currentTurn ? "Checking your answer…" : "Preparing your question…"}
                </p>
              )}

              {error !== null && (
                <ErrorState error={error} onRetry={() => retry(sessionId)} className="mt-4" />
              )}

              {!isLoading && currentTurn && (currentTurn.turn === "question" || currentTurn.turn === "clarify") && (
                <div className="mt-4">
                  {currentTurn.turn === "clarify" && (
                    <span className="mb-2 inline-block rounded-sm bg-verdict-honest_gap-bg px-2 py-0.5 text-[11px] font-medium text-ink-primary">
                      Follow-up — be more specific
                    </span>
                  )}
                  <p className="text-lg font-semibold leading-snug text-ink-primary">
                    {currentTurn.question}
                  </p>
                  <label className="mt-4 block">
                    <span className="sr-only">Your answer</span>
                    <textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      rows={6}
                      placeholder="Explain your answer…"
                      className="w-full resize-y rounded-md border border-line-strong bg-white p-3 text-sm text-ink-primary focus:border-primary focus:outline-none"
                    />
                  </label>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Button
                      onClick={() => submitAnswer(sessionId, answerText)}
                      disabled={answerText.trim().length === 0}
                    >
                      Submit Answer
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => submitAnswer(sessionId, "I don't know")}
                    >
                      <HelpCircle size={14} aria-hidden="true" />
                      I don&rsquo;t know
                    </Button>
                  </div>
                </div>
              )}

              {!isLoading && currentTurn?.grade && (
                <div className="mt-6 border-t border-line pt-4">
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
                    Evidence
                  </p>
                  <ul className="space-y-1.5">
                    {(Object.entries(currentTurn.grade.criteria) as [Criterion, typeof currentTurn.grade.criteria[Criterion]][]).map(
                      ([criterion, result]) => (
                        <li key={criterion} className="flex items-start gap-2 text-sm">
                          {result.passed ? (
                            <Check size={14} className="mt-0.5 shrink-0 text-verdict-defended-fg" aria-hidden="true" />
                          ) : (
                            <X size={14} className="mt-0.5 shrink-0 text-verdict-bluff-fg" aria-hidden="true" />
                          )}
                          <span>
                            <span className="font-medium text-ink-primary">
                              {CRITERION_LABELS[criterion]}:
                            </span>{" "}
                            {result.evidence_quote ? (
                              <span className="italic text-ink-secondary">
                                &ldquo;{result.evidence_quote}&rdquo;
                              </span>
                            ) : result.missing_concept ? (
                              <span className="text-ink-muted">{result.missing_concept}</span>
                            ) : (
                              <span className="text-ink-muted">—</span>
                            )}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {!isLoading && currentTurn?.turn === "done" && (
                <div className="mt-6 border-t border-line pt-4">
                  <VerdictBadge verdict={activeClaim.verdict} />

                  {activeClaim.retest && (
                    <p className="mt-3 text-sm text-ink-secondary">
                      Verified — proficiency {Math.round(activeClaim.retest.before * 100)}% →{" "}
                      {Math.round(activeClaim.retest.after * 100)}%
                      {typeof activeClaim.retest.interleaved_claims === "number" && (
                        <> (verified after {activeClaim.retest.interleaved_claims} other concepts)</>
                      )}
                    </p>
                  )}
                </div>
              )}

              {showTeachCard && (
                <div className="mt-4">
                  {fixTask.isLoading && (
                    <p className="text-sm text-ink-muted" role="status">
                      Preparing your fix task…
                    </p>
                  )}
                  {fixTask.error !== null && (
                    <ErrorState
                      error={fixTask.error}
                      onRetry={() => sessionId && currentTurn && fixTask.load(sessionId, currentTurn.claim_id)}
                    />
                  )}
                  {fixTask.fixTask && (
                    <>
                      <FixTaskCard fixTask={fixTask.fixTask} />
                      <Button
                        className="mt-3"
                        onClick={() => interrogationDispatch({ type: "DISMISS_INLINE_TEACH" })}
                      >
                        Got it, continue →
                      </Button>
                    </>
                  )}
                </div>
              )}

              {showAdvanceControls && (
                <div className="mt-4">
                  {nextClaimId ? (
                    <Button onClick={handleAdvance}>
                      {nextMode === "retest" ? "Retest this claim next →" : "Next claim →"}
                    </Button>
                  ) : (
                    <Link to={`/report/${sessionId}`} className={buttonClasses()}>
                      See my report →
                    </Link>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="order-3">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-subtle">
            Level
          </h2>
          <LevelTracker
            currentLevel={currentTurn?.level ?? null}
            levelsPassed={activeClaim?.levels_passed ?? 0}
          />
        </div>
      </div>
    </div>
  );
};
