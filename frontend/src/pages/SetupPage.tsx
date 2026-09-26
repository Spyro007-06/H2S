import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/lib/buttonClasses";
import { cn } from "@/lib/cn";

export const SetupPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-2xl p-8">
      <h2 className="mb-2 text-2xl font-bold text-ink-primary">Setup</h2>
      <p className="mb-6 text-ink-secondary">
        Select your target role and preparation mode (Teach me / Challenge me).
      </p>
      <Card>
        <p className="text-sm text-ink-muted">
          Architectural placeholder — role picker, resume upload and skill chips ship
          in the next milestone.
        </p>
      </Card>
      <Link to="/ledger" className={cn("mt-6 inline-flex", buttonClasses())}>
        Proceed to Ledger →
      </Link>
    </div>
  );
};
