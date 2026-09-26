import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSessionState } from "@/state/useSession";
import { useRoleDetail } from "@/hooks/useRoleDetail";
import { useConfirmClaims } from "@/hooks/useConfirmClaims";
import { ClaimRow } from "@/components/ledger/ClaimRow";
import { StepProgress } from "@/components/common/StepProgress";
import { ErrorState } from "@/components/ui/ErrorState";
import { buttonClasses } from "@/lib/buttonClasses";
import { cn } from "@/lib/cn";
import type { ClaimInput } from "@/types/contract";

export const LedgerPage: React.FC = () => {
  const { state: session } = useSessionState();
  const { role } = useRoleDetail(session.roleId);
  const { isLoading, error, confirm } = useConfirmClaims();

  const [draftClaims, setDraftClaims] = useState<ClaimInput[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || session.claims.length === 0) return;
    initialized.current = true;
    setDraftClaims(
      session.claims.map((c) => ({
        id: c.id,
        text: c.text,
        resume_line: c.resume_line,
        skill_id: c.skill_id,
      }))
    );
  }, [session.claims]);

  const sourceById = React.useMemo(
    () => new Map(session.claims.map((c) => [c.id, c.source])),
    [session.claims]
  );

  function updateClaim(index: number, next: ClaimInput) {
    setDraftClaims((prev) => prev.map((c, i) => (i === index ? next : c)));
  }

  function deleteClaim(index: number) {
    setDraftClaims((prev) => prev.filter((_, i) => i !== index));
  }

  if (!session.sessionId) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <p className="text-ink-secondary">
          There&rsquo;s no active session. Start from Setup to extract claims first.
        </p>
        <Link to="/setup" className={cn("mt-4 inline-flex", buttonClasses())}>
          Go to Setup
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4 pb-16 pt-8 sm:p-8">
      <StepProgress current={2} />

      <h1 className="mt-6 text-2xl font-bold tracking-tight text-ink-primary sm:text-3xl">
        Claim Ledger
      </h1>
      <p className="mt-2 text-ink-secondary">
        This is what UNBLUFF thinks your resume claims. Edit anything that&rsquo;s
        wrong, remove what doesn&rsquo;t belong, then start the interrogation.
      </p>

      {session.blindSpots.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-subtle">
            Blind spots
          </h2>
          <div className="flex flex-wrap gap-2">
            {session.blindSpots.map((spot) => (
              <span
                key={spot.skill_id}
                className="inline-flex items-center gap-1.5 rounded-sm border-l-2 border-skill-blind_spot-fg bg-surface-100 px-2 py-1 text-xs font-medium text-ink-primary"
              >
                ⚫ {spot.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {draftClaims.length === 0 && (
          <p className="text-sm text-ink-muted">
            No claims left to confirm. Go back to Setup to try again.
          </p>
        )}
        {draftClaims.map((claim, index) => (
          <ClaimRow
            key={claim.id ?? index}
            claim={claim}
            source={sourceById.get(claim.id ?? "") ?? "declared"}
            skills={role?.skills ?? []}
            onChange={(next) => updateClaim(index, next)}
            onDelete={() => deleteClaim(index)}
          />
        ))}
      </div>

      {error !== null && (
        <ErrorState error={error} onRetry={() => confirm(draftClaims)} className="mt-6" />
      )}

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={() => confirm(draftClaims)}
          disabled={draftClaims.length === 0 || isLoading}
          aria-busy={isLoading}
          className={buttonClasses("primary", "md")}
        >
          {isLoading ? "Confirming your claims…" : "Start Interrogation"}
        </button>
      </div>
    </div>
  );
};
