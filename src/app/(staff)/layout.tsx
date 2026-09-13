import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import type { StaffRole } from "@/lib/nav";

export default async function StaffLayout({
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
    .select("role")
    .eq("id", user.id)
    .single();

  // The middleware already keeps merchants out of staff routes — this is
  // defense in depth for direct server-side rendering.
  if (!profile || profile.role === "merchant") {
    redirect("/portal");
  }

  return <AppShell role={profile.role as StaffRole}>{children}</AppShell>;
}
