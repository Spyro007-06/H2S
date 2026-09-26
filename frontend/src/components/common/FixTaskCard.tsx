import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { FixTask } from "@/types/contract";

interface FixTaskCardProps {
  fixTask: FixTask;
  onRetest?: () => void;
  retestLabel?: string;
}

/**
 * Backend-authored fix task — explanation + exercise for a weak claim.
 * Never renders an expected interview answer, only what the backend sent.
 */
export const FixTaskCard: React.FC<FixTaskCardProps> = ({
  fixTask,
  onRetest,
  retestLabel = "Retest",
}) => {
  return (
    <Card className="border-primary/30 bg-primary-soft/40">
      {fixTask.missing_concepts.length > 0 && (
        <div className="mb-3">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
            What&rsquo;s missing
          </p>
          <ul className="mt-1 list-inside list-disc text-sm text-ink-primary">
            {fixTask.missing_concepts.map((concept) => (
              <li key={concept}>{concept}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-3">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
          Why it matters
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary">
          {fixTask.explanation}
        </p>
      </div>

      <div>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
          Your fix
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-primary">
          {fixTask.exercise}
        </p>
      </div>

      {onRetest && (
        <div className="mt-4">
          <Button onClick={onRetest}>{retestLabel}</Button>
        </div>
      )}
    </Card>
  );
};
