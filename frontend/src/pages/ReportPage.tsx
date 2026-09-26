import React from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
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
  const { report, isDemo } = (location.state as ReportLocationState | null) ?? {};

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-2 flex items-center gap-3">
        <h2 className="text-2xl font-bold text-ink-primary">Readiness Report</h2>
        {isDemo && (
          <span className="rounded-sm bg-surface-100 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            Demo data
          </span>
        )}
      </div>
      <p className="mb-6 text-ink-secondary">
        Session:{" "}
        <code className="rounded-sm bg-surface-100 px-2 py-1 font-mono text-primary">
          {sessionId || "unknown"}
        </code>
      </p>

      {report && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <p className="font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
              Role
            </p>
            <p className="mt-1 text-sm font-semibold text-ink-primary">
              {report.role.name}
            </p>
          </Card>
          <Card className="p-4">
            <p className="font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
              Readiness
            </p>
            <p className="mt-1 text-2xl font-bold text-ink-primary">
              {report.readiness}%
            </p>
          </Card>
          <Card className="p-4">
            <p className="font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
              Coverage
            </p>
            <p className="mt-1 text-2xl font-bold text-ink-primary">
              {report.coverage}%
            </p>
          </Card>
          <Card className="p-4">
            <p className="font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
              Claims
            </p>
            <p className="mt-1 text-2xl font-bold text-ink-primary">
              {report.claims.length}
            </p>
          </Card>
        </div>
      )}

      <Card className="mb-6">
        <p className="text-sm text-ink-muted">
          Architectural placeholder — the resume heatmap, role coverage grid, evidence
          drawer and fix/retest flow render this same report data starting in a later
          milestone.
        </p>
      </Card>
      <Link to="/" className={buttonClasses("secondary")}>
        ← Return Home
      </Link>
    </div>
  );
};
