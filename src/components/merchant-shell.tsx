"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, LogOut, Store, Ticket, Wallet } from "lucide-react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";
import { cn } from "@/lib/utils";

export type MerchantTab = "stall" | "invoices" | "requests" | "more";

export function MerchantShell({
  title,
  children,
}: {
  title?: string;
  children: (tab: MerchantTab) => React.ReactNode;
}) {
  const [tab, setTab] = useState<MerchantTab>("stall");
  const router = useRouter();
  const { t } = useI18n();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const tabs: { id: MerchantTab; label: string; icon: typeof Store }[] = [
    { id: "stall", label: t.portal.myLease, icon: Store },
    { id: "invoices", label: t.portal.myInvoices, icon: Wallet },
    { id: "requests", label: t.tickets.title, icon: Ticket },
    { id: "more", label: "More", icon: FileText },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <header
        className="sticky top-0 z-40 border-b bg-card/90 shadow-sm backdrop-blur-md"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-[11px] font-bold text-primary-foreground">
              DC
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight">Dragon City</div>
              <div className="truncate text-xs text-muted-foreground">{title ?? t.portal.title}</div>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <LanguageSwitcher />
            <NotificationBell />
            <Button variant="ghost" size="icon" className="size-11" onClick={signOut} aria-label={t.common.logOut}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:max-w-2xl">
        {children(tab)}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-lg">
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className={cn("size-5", active && "stroke-[2.25px]")} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
