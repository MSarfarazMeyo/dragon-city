"use client";

import { updateLeadStage, type LeadStage } from "@/app/(staff)/leasing/actions";

const STAGES: { value: LeadStage; label: string }[] = [
  { value: "inquiry", label: "Inquiry" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export function LeadStageSelect({ leadId, stage }: { leadId: string; stage: LeadStage }) {
  return (
    <select
      value={stage}
      onChange={(e) => updateLeadStage(leadId, e.target.value as LeadStage)}
      className="border-input h-8 rounded-md border bg-transparent px-2 text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
    >
      {STAGES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
