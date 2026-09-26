import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { SessionProvider } from "@/state/SessionContext";
import { InterrogationProvider } from "@/state/InterrogationContext";
import { LandingPage } from "@/pages/LandingPage";
import { SetupPage } from "@/pages/SetupPage";
import { LedgerPage } from "@/pages/LedgerPage";
import { WorkspacePage } from "@/pages/WorkspacePage";
import { ReportPage } from "@/pages/ReportPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { buttonClasses } from "@/lib/buttonClasses";
import { DemoReportButton } from "@/components/common/DemoReportButton";

export const App: React.FC = () => {
  return (
    <SessionProvider>
      <InterrogationProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <div className="flex min-h-screen flex-col bg-surface-50 text-ink-primary">
            <header className="border-b border-line bg-white px-4 py-4 sm:px-6">
              <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  to="/"
                  className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight text-ink-primary"
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                  UNBLUFF
                </Link>
                <nav
                  aria-label="Primary"
                  className="flex flex-wrap items-center gap-3 text-sm"
                >
                  <DemoReportButton variant="ghost" size="sm" />
                  <Link to="/setup" className={buttonClasses("primary", "sm")}>
                    Audit My Readiness
                  </Link>
                </nav>
              </div>
            </header>

            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/setup" element={<SetupPage />} />
                <Route path="/ledger" element={<LedgerPage />} />
                <Route path="/interrogate" element={<WorkspacePage />} />
                <Route path="/report/:sessionId" element={<ReportPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>

            <footer className="border-t border-line px-6 py-4 text-center text-xs text-ink-subtle">
              UNBLUFF &copy; 2026 — Evidence-Driven Candidate Evaluation
            </footer>
          </div>
        </BrowserRouter>
      </InterrogationProvider>
    </SessionProvider>
  );
};
