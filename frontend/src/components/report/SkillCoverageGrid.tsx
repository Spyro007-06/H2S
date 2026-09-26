import React from "react";
import { Card } from "@/components/ui/Card";
import { SkillStateBadge } from "@/components/ui/StatusBadge";
import type { SkillReport } from "@/types/contract";

interface SkillCoverageGridProps {
  skills: SkillReport[];
}

export const SkillCoverageGrid: React.FC<SkillCoverageGridProps> = ({ skills }) => {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {skills.map((skill) => (
        <Card key={skill.skill_id} className="p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink-primary">{skill.name}</p>
            <span className="font-mono text-xs text-ink-subtle">
              {Math.round(skill.proficiency * 100)}%
            </span>
          </div>
          <div className="mt-2">
            <SkillStateBadge state={skill.state} />
          </div>
        </Card>
      ))}
    </div>
  );
};
