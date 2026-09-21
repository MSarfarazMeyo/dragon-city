"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AdminFormState = { error?: string } | null;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin";
}

export async function upsertPriceStandard(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  if (!(await requireAdmin())) return { error: "Admin only." };

  const supabase = await createClient();
  const id = String(formData.get("id") ?? "").trim();
  const zone_code = String(formData.get("zone_code") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim() || null;
  const unit_price = Number(formData.get("unit_price") ?? 0);
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!unit_price) return { error: "Unit price is required." };

  if (id) {
    const { error } = await supabase
      .from("price_standards")
      .update({ zone_code, category, unit_price, notes })
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("price_standards").insert({ zone_code, category, unit_price, notes });
    if (error) return { error: error.message };
  }

  revalidatePath("/settings");
  return null;
}

export async function deletePriceStandard(id: string) {
  if (!(await requireAdmin())) return;

  const supabase = await createClient();
  await supabase.from("price_standards").delete().eq("id", id);
  revalidatePath("/settings");
}

export async function updateNotificationRule(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  if (!(await requireAdmin())) return { error: "Admin only." };

  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const template = String(formData.get("template") ?? "").trim();
  const template_en = String(formData.get("template_en") ?? "").trim();

  if (!id || !template) return { error: "Missing rule or template." };

  const { data: existing } = await supabase
    .from("notification_rules")
    .select("template_i18n")
    .eq("id", id)
    .single();

  const prior =
    existing?.template_i18n && typeof existing.template_i18n === "object" && !Array.isArray(existing.template_i18n)
      ? (existing.template_i18n as Record<string, string>)
      : {};

  const template_i18n = {
    ...prior,
    en: template_en || template,
  };

  const { error } = await supabase
    .from("notification_rules")
    .update({ template, template_i18n })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return null;
}

export async function updateFloor(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  if (!(await requireAdmin())) return { error: "Admin only." };

  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const bg_image_path = String(formData.get("bg_image_path") ?? "").trim() || null;
  const map_width = formData.get("map_width") ? Number(formData.get("map_width")) : null;
  const map_height = formData.get("map_height") ? Number(formData.get("map_height")) : null;

  if (!id || !label) return { error: "Floor id and label are required." };

  const { error } = await supabase
    .from("floors")
    .update({ label, bg_image_path, map_width, map_height })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/map");
  return null;
}
