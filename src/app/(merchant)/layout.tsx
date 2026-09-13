import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { MerchantHeader } from "@/components/merchant-header";

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
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "merchant") {
    redirect("/map");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MerchantHeader />
      <div className="mx-auto w-full max-w-[1536px] flex-1 p-4 md:p-6">{children}</div>
    </div>
  );
}
