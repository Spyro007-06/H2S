import React from "react";
import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { ClaimInput, ClaimSource, RoleSkill } from "@/types/contract";

interface ClaimRowProps {
  claim: ClaimInput;
  source: ClaimSource;
  skills: RoleSkill[];
  onChange: (next: ClaimInput) => void;
  onDelete: () => void;
}

export const ClaimRow: React.FC<ClaimRowProps> = ({
  claim,
  source,
  skills,
  onChange,
  onDelete,
}) => {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-wide text-ink-subtle">
          {source === "resume" ? "From resume" : "Declared skill"}
        </span>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete claim: ${claim.text}`}
          className="inline-flex shrink-0 items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs text-ink-muted transition-colors hover:bg-surface-100 hover:text-verdict-bluff-fg"
        >
          <Trash2 size={14} aria-hidden="true" />
          Delete
        </button>
      </div>

      <label className="mt-2 block">
        <span className="sr-only">Claim text</span>
        <textarea
          value={claim.text}
          onChange={(e) => onChange({ ...claim, text: e.target.value })}
          rows={2}
          className="w-full resize-y rounded-md border border-line bg-white p-2.5 text-sm text-ink-primary focus:border-primary focus:outline-none"
        />
      </label>

      {claim.resume_line && (
        <p className="mt-2 border-l-2 border-line pl-3 text-xs italic text-ink-muted">
          &ldquo;{claim.resume_line}&rdquo;
        </p>
      )}

      <label className="mt-3 flex items-center gap-2 text-xs">
        <span className="font-medium text-ink-secondary">Skill</span>
        <select
          value={claim.skill_id ?? ""}
          onChange={(e) => onChange({ ...claim, skill_id: e.target.value || null })}
          className="rounded-sm border border-line-strong bg-white px-2 py-1 text-xs text-ink-primary focus:border-primary focus:outline-none"
        >
          <option value="">Not related to this role</option>
          {skills.map((skill) => (
            <option key={skill.id} value={skill.id}>
              {skill.name}
            </option>
          ))}
        </select>
      </label>
    </Card>
  );
};
