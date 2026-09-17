"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyInApp } from "@/lib/notifications";

export type TicketFormState = { error?: string } | null;

export async function createTicket(
  _prevState: TicketFormState,
  formData: FormData,
): Promise<TicketFormState> {
  const supabase = await createClient();

  const unit_id = String(formData.get("unit_id") ?? "") || null;
  const merchant_id = String(formData.get("merchant_id") ?? "") || null;
  const department = String(formData.get("department") ?? "");
  const type = String(formData.get("type") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!department || !type) {
    return { error: "Department and type are required." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("tickets").insert({
    unit_id,
    merchant_id,
    department,
    type,
    description,
    created_by: user?.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/tickets");
  return null;
}

export async function assignToMe(ticketId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("tickets").update({ assigned_to: user.id }).eq("id", ticketId);
  revalidatePath("/tickets");
}

export async function updateStatus(ticketId: string, status: "in_progress" | "resolved") {
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("created_by, merchant_id, type, unit_id, units(code)")
    .eq("id", ticketId)
    .single();

  await supabase
    .from("tickets")
    .update({
      status,
      resolved_at: status === "resolved" ? new Date().toISOString() : null,
    })
    .eq("id", ticketId);

  if (status === "resolved" && ticket?.created_by) {
    const shopCode = ticket.units?.code ? ` (${ticket.units.code})` : "";
    await notifyInApp(
      supabase,
      ticket.created_by,
      "ticket_resolved",
      `Ticket resolved: ${ticket.type}${shopCode}`,
      undefined,
      ticketId,
    );
  }

  revalidatePath("/tickets");
}

export async function reopenTicket(ticketId: string) {
  const supabase = await createClient();
  await supabase
    .from("tickets")
    .update({ status: "open", resolved_at: null, archived_at: null })
    .eq("id", ticketId);
  revalidatePath("/tickets");
}

export async function archiveTicket(ticketId: string) {
  const supabase = await createClient();
  await supabase
    .from("tickets")
    .update({
      archived_at: new Date().toISOString(),
      status: "resolved",
      resolved_at: new Date().toISOString(),
    })
    .eq("id", ticketId);
  revalidatePath("/tickets");
}

export async function unarchiveTicket(ticketId: string) {
  const supabase = await createClient();
  await supabase.from("tickets").update({ archived_at: null }).eq("id", ticketId);
  revalidatePath("/tickets");
}

export async function deleteTicket(ticketId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Only admins can permanently delete tickets." };

  const { error } = await supabase.from("tickets").delete().eq("id", ticketId);
  if (error) return { error: error.message };
  revalidatePath("/tickets");
  return null;
}
