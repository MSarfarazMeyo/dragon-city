"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type AvatarFormState = { error?: string } | null;

// Shared by the merchant "Overview" tab (logo) and the staff detail page
// (profile pic) — one bucket (`avatars`, see the Sprint 0 migration),
// path-namespaced by target so both can reuse this single action.
export async function uploadAvatar(_prevState: AvatarFormState, formData: FormData): Promise<AvatarFormState> {
  const supabase = await createClient();

  const target = String(formData.get("target") ?? "");
  const entityId = String(formData.get("entity_id") ?? "");
  const revalidate = String(formData.get("revalidate") ?? "");
  const file = formData.get("file") as File | null;

  if (target !== "merchant" && target !== "staff") {
    return { error: "Invalid upload target." };
  }
  if (!entityId || !file || file.size === 0) {
    return { error: "Choose an image to upload." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Please choose an image file." };
  }

  const path = `${target}/${entityId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
  if (uploadError) return { error: uploadError.message };

  // Supabase's generated types reject a computed column key against a
  // union of exact row shapes, so update each table explicitly rather
  // than looking up { table, column } from TARGET_COLUMN.
  const { error: updateError } =
    target === "merchant"
      ? await supabase.from("merchants").update({ logo_path: path }).eq("id", entityId)
      : await supabase.from("profiles").update({ avatar_path: path }).eq("id", entityId);
  if (updateError) return { error: updateError.message };

  if (revalidate) revalidatePath(revalidate);
  return null;
}

export async function getAvatarUrl(filePath: string | null | undefined) {
  if (!filePath) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("avatars").createSignedUrl(filePath, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}
