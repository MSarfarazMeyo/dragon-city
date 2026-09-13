import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

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
    <div className="mx-auto flex min-h-screen w-full max-w-[1536px] flex-col p-4 pb-20 md:p-6">
      {children}
    </div>
  );
}
