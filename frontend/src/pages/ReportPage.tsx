import React from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/lib/buttonClasses";

export const ReportPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h2 className="mb-2 text-2xl font-bold text-ink-primary">Readiness Report</h2>
      <p className="mb-6 text-ink-secondary">
        Session:{" "}
        <code className="rounded-sm bg-surface-100 px-2 py-1 font-mono text-primary">
          {sessionId || "unknown"}
        </code>
      </p>
      <Card className="mb-6">
        <p className="text-sm text-ink-muted">
          Architectural placeholder — the readiness score, resume heatmap, coverage
          grid and evidence drawer render authoritative backend report data starting
          in the next milestone.
        </p>
      </Card>
      <Link to="/" className={buttonClasses("secondary")}>
        ← Return Home
      </Link>
    </div>
  );
};
