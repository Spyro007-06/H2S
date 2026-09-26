import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/lib/buttonClasses";
import { cn } from "@/lib/cn";

export const LedgerPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-2xl p-8">
      <h2 className="mb-2 text-2xl font-bold text-ink-primary">Claim Ledger</h2>
      <p className="mb-6 text-ink-secondary">
        Review and confirm your extracted resume claims and declared skills.
      </p>
      <Card>
        <p className="text-sm text-ink-muted">
          Architectural placeholder — the editable claim list and blind-spot chips
          ship in the next milestone.
        </p>
      </Card>
      <Link to="/interrogate" className={cn("mt-6 inline-flex", buttonClasses())}>
        Start Interrogation →
      </Link>
    </div>
  );
};
