import React from "react";
import { useNavigate } from "react-router-dom";
import { Drawer } from "@/components/ui/Drawer";
import { VerdictBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { FixTaskCard } from "@/components/common/FixTaskCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { useFixTask } from "@/hooks/useFixTask";
import { useInterrogationState } from "@/state/useSession";
import type { Claim } from "@/types/contract";

interface EvidenceDrawerProps {
  claim: Claim | null;
  sessionId: string;
  onClose: () => void;
}

const RETESTABLE_VERDICTS = new Set(["shaky", "bluff", "honest_gap"]);

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ claim, sessionId, onClose }) => {
  const navigate = useNavigate();
  const { dispatch: interrogationDispatch } = useInterrogationState();
  const fixTask = useFixTask();

  function handleRetest() {
    if (!claim) return;
    interrogationDispatch({
      type: "SET_ACTIVE_CLAIM",
      payload: { claimId: claim.id, mode: "retest" },
    });
    navigate("/interrogate");
  }

  return (
    <Drawer open={claim !== null} onClose={onClose} title={claim?.text ?? "Claim"}>
      {claim && (
        <div className="space-y-4">
          <VerdictBadge verdict={claim.verdict} />

          {claim.resume_line && (
            <p className="border-l-2 border-line pl-3 text-sm italic text-ink-muted">
              &ldquo;{claim.resume_line}&rdquo;
            </p>
          )}

          {claim.root_cause && (
            <p className="rounded-md border border-verdict-bluff-bg bg-verdict-bluff-bg/40 p-3 text-sm text-ink-primary">
              <strong>Root cause:</strong> {claim.root_cause}
            </p>
          )}

          {claim.missing_concepts.length > 0 && (
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
                Missing concepts
              </p>
              <ul className="mt-1 list-inside list-disc text-sm text-ink-secondary">
                {claim.missing_concepts.map((concept) => (
                  <li key={concept}>{concept}</li>
                ))}
              </ul>
            </div>
          )}

          {claim.qa.length > 0 && (
            <div>
              <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
                Question & answer history
              </p>
              <div className="space-y-3">
                {claim.qa.map((qa, i) => (
                  <div key={i} className="rounded-md border border-line p-3">
                    <p className="font-mono text-[10px] uppercase tracking-wide text-ink-subtle">
                      Level {qa.level} · {qa.kind}
                    </p>
                    <p className="mt-1 text-sm font-medium text-ink-primary">{qa.question}</p>
                    {qa.answer && (
                      <p className="mt-1 text-sm text-ink-secondary">&ldquo;{qa.answer}&rdquo;</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {claim.rewrite && (
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
                Honest resume rewrite
              </p>
              <p className="mt-1 text-sm text-ink-secondary">{claim.rewrite}</p>
            </div>
          )}

          {RETESTABLE_VERDICTS.has(claim.verdict) && (
            <div className="border-t border-line pt-4">
              {!fixTask.fixTask && !fixTask.isLoading && (
                <Button
                  variant="secondary"
                  onClick={() => fixTask.load(sessionId, claim.id)}
                >
                  Get Fix Task
                </Button>
              )}
              {fixTask.isLoading && (
                <p className="text-sm text-ink-muted" role="status">
                  Preparing your fix task…
                </p>
              )}
              {fixTask.error !== null && (
                <ErrorState error={fixTask.error} onRetry={() => fixTask.load(sessionId, claim.id)} />
              )}
              {fixTask.fixTask && (
                <FixTaskCard
                  fixTask={fixTask.fixTask}
                  onRetest={handleRetest}
                  retestLabel="Retest this claim"
                />
              )}
              {!fixTask.fixTask && (
                <Button variant="ghost" className="mt-2" onClick={handleRetest}>
                  Skip straight to retest
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
};
