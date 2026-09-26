import React, { useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { useReport } from "@/hooks/useReport";
import { Card } from "@/components/ui/Card";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { ErrorState } from "@/components/ui/ErrorState";
import { ResumeHeatmap } from "@/components/report/ResumeHeatmap";
import { SkillCoverageGrid } from "@/components/report/SkillCoverageGrid";
import { PrioritiesList } from "@/components/report/PrioritiesList";
import { EvidenceDrawer } from "@/components/report/EvidenceDrawer";
import { VerdictBadge } from "@/components/ui/StatusBadge";
import { buttonClasses } from "@/lib/buttonClasses";
import type { Report } from "@/types/contract";

interface ReportLocationState {
  report?: Report;
  /** Local navigation-state hint set by useDemoReport — not part of the API contract. */
  isDemo?: boolean;
}

export const ReportPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const { report: initialReport, isDemo } = (location.state as ReportLocationState | null) ?? {};
  const { report, isLoading, error, retry } = useReport(sessionId, initialReport ?? null);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  const selectedClaim = report?.claims.find((c) => c.id === selectedClaimId) ?? null;

  return (
    <div className="mx-auto max-w-4xl p-4 pb-16 pt-8 sm:p-8">
      <div className="mb-2 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-ink-primary sm:text-3xl">Readiness Report</h1>
        {isDemo && (
          <span className="rounded-sm bg-surface-100 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            Demo data
          </span>
        )}
      </div>

      {isLoading && (
        <p className="mt-6 text-sm text-ink-muted" role="status">
          Building your readiness report…
        </p>
      )}

      {error !== null && <ErrorState error={error} onRetry={retry} className="mt-6" />}

      {report && (
        <div className="mt-6 space-y-8">
          <Card className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-8">
              <ScoreRing value={report.readiness} label="Readiness" />
              <ScoreRing value={report.coverage} label="Coverage" />
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
                Role
              </p>
              <p className="text-sm font-semibold text-ink-primary">{report.role.name}</p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
                Session
              </p>
              <code className="text-xs text-primary">{report.session_id}</code>
            </div>
          </Card>

          {report.blind_spots.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-subtle">
                Blind spots
              </h2>
              <div className="flex flex-wrap gap-2">
                {report.blind_spots.map((spot) => (
                  <span
                    key={spot.skill_id}
                    className="inline-flex items-center gap-1.5 rounded-sm border-l-2 border-skill-blind_spot-fg bg-surface-100 px-2 py-1 text-xs font-medium text-ink-primary"
                  >
                    ⚫ {spot.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {report.priorities.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-subtle">
                Top priorities
              </h2>
              <PrioritiesList priorities={report.priorities} skills={report.skills} />
            </section>
          )}

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-subtle">
              Role coverage
            </h2>
            <SkillCoverageGrid skills={report.skills} />
          </section>

          {report.resume_lines.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-subtle">
                Resume heatmap
              </h2>
              <ResumeHeatmap lines={report.resume_lines} onSelectClaim={setSelectedClaimId} />
            </section>
          )}

          {report.plan.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-subtle">
                7-day plan
              </h2>
              <ol className="space-y-2">
                {report.plan.map((item, i) => (
                  <Card key={i} className="p-3">
                    <p className="font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
                      Day {item.day}
                    </p>
                    <p className="text-sm font-semibold text-ink-primary">{item.title}</p>
                    <p className="mt-1 text-sm text-ink-secondary">{item.task}</p>
                  </Card>
                ))}
              </ol>
            </section>
          )}

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-subtle">
              Claims
            </h2>
            <ul className="space-y-2">
              {report.claims.map((claim) => (
                <li key={claim.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedClaimId(claim.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-md border border-line bg-white p-3 text-left transition-colors hover:border-line-strong"
                  >
                    <span className="text-sm text-ink-primary">{claim.text}</span>
                    <VerdictBadge verdict={claim.verdict} className="shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <Link to="/" className={`mt-8 inline-flex ${buttonClasses("secondary")}`}>
        ← Return Home
      </Link>

      <EvidenceDrawer
        claim={selectedClaim}
        sessionId={sessionId ?? ""}
        onClose={() => setSelectedClaimId(null)}
      />
    </div>
  );
};
