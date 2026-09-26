import React from "react";
import { Link } from "react-router-dom";
import { buttonClasses } from "@/lib/buttonClasses";

export const LandingPage: React.FC = () => {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center p-8 text-center">
      <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-ink-primary">
        UNBLUFF
      </h1>
      <p className="mb-8 max-w-md text-lg text-ink-secondary">
        Your resume says you're ready. Let's prove it.
      </p>
      <Link to="/setup" className={buttonClasses()}>
        Audit My Readiness →
      </Link>
    </div>
  );
};
