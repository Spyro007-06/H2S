import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/lib/buttonClasses";
import { cn } from "@/lib/cn";

export const WorkspacePage: React.FC = () => {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <h2 className="mb-2 text-2xl font-bold text-ink-primary">
        Interrogation Workspace
      </h2>
      <p className="mb-6 text-ink-secondary">
        Defend your technical claims across 3 levels of depth (L1: personal part, L2:
        internal mechanism, L3: trade-offs).
      </p>
      <Card>
        <p className="text-sm text-ink-muted">
          Architectural placeholder — the claim list, question/answer panel and level
          tracker ship in the next milestone.
        </p>
      </Card>
      <Link
        to="/report/s_demo"
        className={cn("mt-6 inline-flex", buttonClasses("secondary"))}
      >
        View Demo Report →
      </Link>
    </div>
  );
};
