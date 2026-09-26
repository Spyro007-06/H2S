import React from "react";
import { VerdictBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import type { Claim } from "@/types/contract";

interface ClaimListPanelProps {
  claims: Claim[];
  activeClaimId: string | null;
}

/** Read-only claim status list — the backend decides sequencing, this only shows it. */
export const ClaimListPanel: React.FC<ClaimListPanelProps> = ({ claims, activeClaimId }) => {
  return (
    <ul className="space-y-1.5">
      {claims.map((claim) => (
        <li
          key={claim.id}
          aria-current={claim.id === activeClaimId ? "true" : undefined}
          className={cn(
            "rounded-md border p-2.5 text-sm",
            claim.id === activeClaimId
              ? "border-primary bg-primary-soft"
              : "border-line bg-white"
          )}
        >
          <p className="truncate text-ink-primary">{claim.text}</p>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <VerdictBadge verdict={claim.verdict} />
            {claim.retest_status && (
              <span className="font-mono text-[10px] uppercase tracking-wide text-ink-subtle">
                {claim.retest_status === "scheduled" && "Retest scheduled"}
                {claim.retest_status === "due" && "Retest ready"}
                {claim.retest_status === "done" && "Retest complete"}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};
