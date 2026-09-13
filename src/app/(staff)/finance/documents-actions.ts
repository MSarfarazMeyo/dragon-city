"use server";

import { createClient } from "@/lib/supabase/server";

export async function getDocumentUrl(filePath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("documents").createSignedUrl(filePath, 60);
  if (error) return null;
  return data.signedUrl;
}
