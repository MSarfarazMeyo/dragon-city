"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyStaffRole } from "@/lib/notify";

export type PortalFormState = { error?: string } | null;

export async function submitTicket(
  _prevState: PortalFormState,
  formData: FormData,
): Promise<PortalFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: profile } = await supabase.from("profiles").select("merchant_id").eq("id", user.id).single();
  if (!profile?.merchant_id) return { error: "No merchant linked to this account." };

  const unit_id = String(formData.get("unit_id") ?? "") || null;
  const department = String(formData.get("department") ?? "");
  const type = String(formData.get("type") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!department || !type) {
    return { error: "Department and type are required." };
  }

  const { data: ticket, error } = await supabase
    .from("tickets")
    .insert({
      unit_id,
      merchant_id: profile.merchant_id,
      department,
      type,
      description,
      created_by: user.id,
    })
    .select("id, units(code)")
    .single();

  if (error) return { error: error.message };

  // A merchant opening a ticket — route the notification to whichever
  // staff department they picked, the same role-matching the cron
  // route uses for invoice_due/lease_expiring.
  const unitCode = ticket.units?.code ?? "a shop";
  await notifyStaffRole(department, {
    event: "ticket_created",
    title: `New ticket for ${unitCode}`,
    vars: { unit_code: unitCode, ticket_type: type },
    fallbackBody: `New ${type} ticket for ${unitCode}.`,
    relatedTicketId: ticket.id,
  });

  revalidatePath("/portal");
  return null;
}
