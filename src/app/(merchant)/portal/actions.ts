"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

  const { error } = await supabase.from("tickets").insert({
    unit_id,
    merchant_id: profile.merchant_id,
    department,
    type,
    description,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/portal");
  return null;
}
