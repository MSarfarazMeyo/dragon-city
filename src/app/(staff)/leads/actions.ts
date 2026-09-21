"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type LeasingFormState = { error?: string } | null;

const STAGES = ["inquiry", "negotiation", "won", "lost"] as const;
export type LeadStage = (typeof STAGES)[number];

export async function createLead(
  _prevState: LeasingFormState,
  formData: FormData,
): Promise<LeasingFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const prospect_name = String(formData.get("prospect_name") ?? "").trim();
  const contact_phone = String(formData.get("contact_phone") ?? "").trim() || null;
  const contact_email = String(formData.get("contact_email") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!prospect_name) {
    return { error: "Prospect name is required." };
  }

  const { error } = await supabase.from("leasing_leads").insert({
    prospect_name,
    contact_phone,
    contact_email,
    notes,
    stage: "inquiry",
    created_by: user?.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/leads");
  return null;
}

export async function updateLeadStage(leadId: string, stage: LeadStage) {
  if (!STAGES.includes(stage)) return;

  const supabase = await createClient();
  await supabase.from("leasing_leads").update({ stage }).eq("id", leadId);
  revalidatePath("/leads");
}

export async function convertLeadToMerchant(
  _prevState: LeasingFormState,
  formData: FormData,
): Promise<LeasingFormState> {
  const supabase = await createClient();

  const lead_id = String(formData.get("lead_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "individual");
  const contact_phone = String(formData.get("contact_phone") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!lead_id || !name) {
    return { error: "Lead and merchant name are required." };
  }

  const { data: lead } = await supabase
    .from("leasing_leads")
    .select("id, stage, prospect_name, contact_phone, notes")
    .eq("id", lead_id)
    .single();

  if (!lead) return { error: "Lead not found." };

  const { data: merchant, error: merchantError } = await supabase
    .from("merchants")
    .insert({
      name,
      type: type === "company" ? "company" : "individual",
      contact_phone: contact_phone ?? lead.contact_phone,
      notes: notes ?? lead.notes,
    })
    .select("id")
    .single();

  if (merchantError || !merchant) {
    return { error: merchantError?.message ?? "Could not create merchant." };
  }

  const { error: leadError } = await supabase
    .from("leasing_leads")
    .update({
      stage: "won",
      converted_merchant_id: merchant.id,
      notes: notes ?? lead.notes,
    })
    .eq("id", lead_id);

  if (leadError) return { error: leadError.message };

  revalidatePath("/leads");
  revalidatePath("/merchants");
  return null;
}
