"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";

export function MerchantHeader() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b p-4">
      <span className="text-lg font-semibold tracking-tight">Dragon City</span>
      <div className="flex items-center gap-1">
        <NotificationBell />
        <Button variant="ghost" size="icon" onClick={signOut} aria-label="Log out">
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
