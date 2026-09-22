import type { SupabaseClient } from "@supabase/supabase-js";

import { isLocale, type Locale } from "@/lib/i18n/dictionaries";

// Server components render status labels (shop-status.ts) before any
// client-side I18nProvider exists, so they need the viewer's saved
// locale directly from their profile row — this is the one-query way
// to get it, for pages that don't already have `profile` in scope.
export async function getViewerLocale(supabase: SupabaseClient): Promise<Locale> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "en";

  const { data } = await supabase.from("profiles").select("locale").eq("id", user.id).maybeSingle();
  return data?.locale && isLocale(data.locale) ? data.locale : "en";
}
