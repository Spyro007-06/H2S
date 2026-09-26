import React from "react";
import { CardRadioGroup } from "@/components/ui/CardRadioGroup";
import type { PreparationMode } from "@/types/contract";

const MODE_OPTIONS = [
  {
    value: "teach" as PreparationMode,
    title: "Teach me — Prepare",
    description: "Find the gaps before the interview does. UNBLUFF flags weak areas and helps you close them first.",
  },
  {
    value: "challenge" as PreparationMode,
    title: "Challenge me — Interview Defense",
    description: "Defend what your resume claims, right now, under the same pressure a real interviewer would apply.",
  },
];

interface ModeSelectorProps {
  value: PreparationMode | null;
  onChange: (mode: PreparationMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ value, onChange }) => {
  return (
    <CardRadioGroup
      ariaLabel="Preparation mode"
      value={value}
      onChange={onChange}
      options={MODE_OPTIONS}
      className="sm:grid-cols-2"
    />
  );
};
