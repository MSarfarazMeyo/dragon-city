import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { AddLeadDialog } from "@/components/leasing/add-lead-dialog";
import { ConvertLeadDialog } from "@/components/leasing/convert-lead-dialog";
import { LeadStageSelect } from "@/components/leasing/lead-stage-select";
import type { LeadStage } from "@/app/(staff)/leads/actions";

const STAGES: { key: LeadStage; label: string }[] = [
  { key: "inquiry", label: "Inquiry" },
  { key: "negotiation", label: "Negotiation" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

export default async function LeasingPage() {
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from("leasing_leads")
    .select("id, prospect_name, contact_phone, contact_email, stage, notes, converted_merchant_id, created_at")
    .order("updated_at", { ascending: false });

  const byStage = Object.fromEntries(STAGES.map((s) => [s.key, [] as NonNullable<typeof leads>])) as Record<
    LeadStage,
    NonNullable<typeof leads>
  >;

  for (const lead of leads ?? []) {
    const stage = lead.stage as LeadStage;
    if (byStage[stage]) byStage[stage].push(lead);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-muted-foreground text-sm">Track prospects from first inquiry to signed lease.</p>
        </div>
        <AddLeadDialog />
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {STAGES.map((stage) => (
          <section key={stage.key} className="space-y-3 rounded-lg border p-3">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
              {stage.label}
              <span className="ml-2 tabular-nums text-foreground">({byStage[stage.key].length})</span>
            </h2>
            {byStage[stage.key].length === 0 ? (
              <p className="text-xs text-muted-foreground">No leads</p>
            ) : (
              <ul className="space-y-2">
                {byStage[stage.key].map((lead) => (
                  <li key={lead.id} className="rounded-md border bg-card p-3 text-sm">
                    <div className="font-medium">{lead.prospect_name}</div>
                    {(lead.contact_phone || lead.contact_email) && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {[lead.contact_phone, lead.contact_email].filter(Boolean).join(" · ")}
                      </div>
                    )}
                    {lead.notes && <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{lead.notes}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <LeadStageSelect leadId={lead.id} stage={lead.stage as LeadStage} />
                      {stage.key !== "won" && stage.key !== "lost" && (
                        <ConvertLeadDialog lead={lead} />
                      )}
                      {lead.converted_merchant_id && (
                        <Link
                          href={`/merchants/${lead.converted_merchant_id}`}
                          className="text-xs text-primary hover:underline"
                        >
                          View merchant
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
