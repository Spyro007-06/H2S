import React from "react";
import { Card } from "@/components/ui/Card";
import type { Priority, SkillReport } from "@/types/contract";

interface PrioritiesListProps {
  priorities: Priority[];
  skills: SkillReport[];
}

/** Backend-ranked top priorities — never recomputed on the frontend. */
export const PrioritiesList: React.FC<PrioritiesListProps> = ({ priorities, skills }) => {
  if (priorities.length === 0) return null;

  return (
    <ol className="space-y-2">
      {priorities.map((priority) => {
        const skillName = skills.find((s) => s.skill_id === priority.skill_id)?.name ?? priority.skill_id;
        return (
          <Card key={`${priority.rank}-${priority.skill_id}`} className="flex items-start gap-3 p-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft font-mono text-xs font-semibold text-primary">
              {priority.rank}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-primary">{skillName}</p>
              <p className="text-sm text-ink-secondary">{priority.reason}</p>
            </div>
          </Card>
        );
      })}
    </ol>
  );
};
