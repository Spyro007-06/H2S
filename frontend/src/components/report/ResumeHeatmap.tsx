import React from "react";
import { VERDICT_CONFIG } from "@/styles/tokens";
import type { ResumeLine } from "@/types/contract";

interface ResumeHeatmapProps {
  lines: ResumeLine[];
  onSelectClaim: (claimId: string) => void;
}

/** Resume lines in backend-provided order; verdict shown as a left-border tint, never reordered or computed. */
export const ResumeHeatmap: React.FC<ResumeHeatmapProps> = ({ lines, onSelectClaim }) => {
  if (lines.length === 0) return null;

  return (
    <div className="divide-y divide-line rounded-md border border-line bg-white">
      {lines.map((line) => {
        const config = line.verdict ? VERDICT_CONFIG[line.verdict] : null;
        const clickable = line.claim_ids.length > 0;
        const content = (
          <>
            <span
              className="mr-3 inline-block h-full w-1 shrink-0 self-stretch rounded-full"
              style={{ backgroundColor: config?.fg ?? "transparent" }}
              aria-hidden="true"
            />
            <span className="flex-1 text-sm text-ink-primary">{line.text}</span>
          </>
        );
        return clickable ? (
          <button
            key={line.index}
            type="button"
            onClick={() => onSelectClaim(line.claim_ids[0]!)}
            className="flex w-full items-center gap-0 px-3 py-2.5 text-left transition-colors hover:bg-surface-50"
            style={config ? { backgroundColor: `${config.bg}55` } : undefined}
          >
            {content}
          </button>
        ) : (
          <div key={line.index} className="flex items-center gap-0 px-3 py-2.5">
            {content}
          </div>
        );
      })}
    </div>
  );
};
