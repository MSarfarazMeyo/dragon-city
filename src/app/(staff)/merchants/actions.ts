"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AddMerchantState = { error?: string } | null;

export async function addMerchant(
  _prevState: AddMerchantState,
  formData: FormData,
): Promise<AddMerchantState> {
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "individual");
  const cr_number = String(formData.get("cr_number") ?? "").trim() || null;
  const contact_name = String(formData.get("contact_name") ?? "").trim() || null;
  const contact_phone = String(formData.get("contact_phone") ?? "").trim() || null;
  const contact_email = String(formData.get("contact_email") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name) {
    return { error: "Merchant name is required." };
  }

  const { error } = await supabase.from("merchants").insert({
    name,
    type,
    cr_number,
    contact_name,
    contact_phone,
    contact_email,
    notes,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/merchants");
  return null;
}
