import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Level, LevelsPassed } from "@/types/contract";

const LEVELS: { level: Level; title: string; copy: string }[] = [
  { level: 1, title: "What you did", copy: "L1" },
  { level: 2, title: "How it works", copy: "L2" },
  { level: 3, title: "Why / trade-offs", copy: "L3" },
];

interface LevelTrackerProps {
  currentLevel: Level | null;
  levelsPassed: LevelsPassed;
}

/** Vertical L1 -> L2 -> L3 progression, driven entirely by backend state. */
export const LevelTracker: React.FC<LevelTrackerProps> = ({ currentLevel, levelsPassed }) => {
  return (
    <ol className="space-y-4">
      {LEVELS.map(({ level, title, copy }) => {
        const done = level <= levelsPassed;
        const current = level === currentLevel;
        return (
          <li key={level} className="flex items-start gap-3">
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 font-mono text-[11px] font-semibold",
                done
                  ? "border-verdict-defended-fg bg-verdict-defended-fg text-white"
                  : current
                    ? "border-primary text-primary"
                    : "border-line-strong text-ink-subtle"
              )}
              aria-hidden="true"
            >
              {done ? <Check size={14} /> : copy}
            </span>
            <div>
              <p
                className={cn(
                  "text-sm font-semibold",
                  current ? "text-primary" : "text-ink-primary"
                )}
              >
                {copy} — {title}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
};
