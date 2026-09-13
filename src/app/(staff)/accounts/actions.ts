"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AccountFormState = { error?: string } | null;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin";
}

// Accounts are admin-provisioned, not self-signup: the admin sets the
// password directly and shares it with the merchant, rather than an
// invite-email flow neither this app nor the mall's process expects.
export async function createMerchantAccount(
  _prevState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  if (!(await requireAdmin())) {
    return { error: "Only an admin can create accounts." };
  }

  const merchant_id = String(formData.get("merchant_id") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!merchant_id || !email || password.length < 8) {
    return { error: "Pick a merchant, an email, and a password of at least 8 characters." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "merchant", merchant_id },
  });

  if (error) return { error: error.message };

  revalidatePath("/accounts");
  return null;
}
