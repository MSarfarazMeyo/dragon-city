"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type StaffFormState = { error?: string } | null;

const STAFF_ROLES = ["admin", "operations", "finance", "maintenance"] as const;
export type StaffRoleValue = (typeof STAFF_ROLES)[number];

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin";
}

// This replaces create-admin.mjs as the day-to-day way to add staff —
// that script stays only for bootstrapping the very first admin, since
// it has to run before any admin account (and therefore this page)
// exists at all.
export async function createStaff(_prevState: StaffFormState, formData: FormData): Promise<StaffFormState> {
  if (!(await requireAdmin())) {
    return { error: "Only an admin can add staff." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const full_name = String(formData.get("full_name") ?? "").trim() || null;
  const role = String(formData.get("role") ?? "");

  if (!email || password.length < 8) {
    return { error: "Enter an email and a password of at least 8 characters." };
  }
  if (!STAFF_ROLES.includes(role as StaffRoleValue)) {
    return { error: "Pick a role." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role, full_name },
  });

  if (error) return { error: error.message };

  revalidatePath("/staff");
  return null;
}

export async function updateStaffRole(userId: string, role: StaffRoleValue) {
  if (!(await requireAdmin())) return;
  if (!STAFF_ROLES.includes(role)) return;

  const supabase = await createClient();
  await supabase.from("profiles").update({ role }).eq("id", userId);
  revalidatePath("/staff");
  revalidatePath(`/staff/${userId}`);
}

export async function updateStaffStatus(userId: string, status: "active" | "inactive") {
  if (!(await requireAdmin())) return;

  const supabase = await createClient();
  await supabase.from("profiles").update({ status }).eq("id", userId);
  revalidatePath("/staff");
  revalidatePath(`/staff/${userId}`);
}

export async function updateStaffName(_prevState: StaffFormState, formData: FormData): Promise<StaffFormState> {
  if (!(await requireAdmin())) {
    return { error: "Only an admin can edit staff." };
  }

  const userId = String(formData.get("user_id") ?? "");
  const full_name = String(formData.get("full_name") ?? "").trim() || null;
  if (!userId) return { error: "Missing staff member." };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ full_name }).eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath(`/staff/${userId}`);
  return null;
}

export async function resetStaffPassword(_prevState: StaffFormState, formData: FormData): Promise<StaffFormState> {
  if (!(await requireAdmin())) {
    return { error: "Only an admin can reset passwords." };
  }

  const userId = String(formData.get("user_id") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!userId || password.length < 8) {
    return { error: "Enter a new password of at least 8 characters." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { error: error.message };

  revalidatePath(`/staff/${userId}`);
  return null;
}
