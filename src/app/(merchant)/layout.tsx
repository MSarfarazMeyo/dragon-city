import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { I18nProvider } from "@/lib/i18n/context";

export default async function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, locale")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "merchant") {
    redirect("/map");
  }

  return <I18nProvider initialLocale={profile.locale}>{children}</I18nProvider>;
}
