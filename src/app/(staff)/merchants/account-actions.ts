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

// Moved here from the old standalone Accounts tab (removed in the IA
// rename) — account creation now lives directly on the merchant it's
// for, one click away from everything else about that merchant.
// Accounts are admin-provisioned, not self-signup: the admin sets the
// password directly and shares it with the merchant.
export async function createMerchantAccount(_prevState: AccountFormState, formData: FormData): Promise<AccountFormState> {
  if (!(await requireAdmin())) {
    return { error: "Only an admin can create accounts." };
  }

  const merchant_id = String(formData.get("merchant_id") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!merchant_id || !email || password.length < 8) {
    return { error: "Enter an email and a password of at least 8 characters." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "merchant", merchant_id },
  });

  if (error) return { error: error.message };

  revalidatePath(`/merchants/${merchant_id}`);
  return null;
}

export async function resetMerchantPassword(_prevState: AccountFormState, formData: FormData): Promise<AccountFormState> {
  if (!(await requireAdmin())) {
    return { error: "Only an admin can reset passwords." };
  }

  const user_id = String(formData.get("user_id") ?? "");
  const merchant_id = String(formData.get("merchant_id") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!user_id || password.length < 8) {
    return { error: "Enter a new password of at least 8 characters." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user_id, { password });
  if (error) return { error: error.message };

  revalidatePath(`/merchants/${merchant_id}`);
  return null;
}

export async function findMerchantAccount(merchantId: string) {
  if (!(await requireAdmin())) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("merchant_id", merchantId)
    .maybeSingle();
  if (!profile) return null;

  const admin = createAdminClient();
  const { data } = await admin.auth.admin.getUserById(profile.id);
  return data?.user ? { id: data.user.id, email: data.user.email ?? "—" } : null;
}
