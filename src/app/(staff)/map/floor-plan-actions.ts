"use server";

import { createClient } from "@/lib/supabase/server";

export async function getFloorPlanUrl(path: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("floor-plans").createSignedUrl(path, 300);
  if (error) return null;
  return data.signedUrl;
}
