"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveLocalePreference(locale: string) {
  if (!["en", "zh", "ar"].includes(locale)) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").update({ locale }).eq("id", user.id);
}
