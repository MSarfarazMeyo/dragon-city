"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, MoreHorizontal } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { navForRole, type StaffRole, type NavItem } from "@/lib/nav";
import { useI18n } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NotificationBell } from "@/components/notification-bell";
import { cn } from "@/lib/utils";

const MOBILE_PRIMARY = 4;

export function AppShell({
  role,
  children,
}: {
  role: StaffRole;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const items = navForRole(role);
  const primary = items.slice(0, MOBILE_PRIMARY);
  const overflow = items.slice(MOBILE_PRIMARY);
  const overflowActive = overflow.some((item) => pathname.startsWith(item.href));

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="hidden w-[15.5rem] shrink-0 md:flex md:flex-col bg-[var(--sidebar)] text-[var(--sidebar-foreground)]">
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <BrandMark size={36} className="rounded-xl" />
            <div>
              <div className="text-[15px] font-semibold tracking-tight">Dragon City</div>
              <div className="text-[11px] capitalize text-[var(--sidebar-muted)]">{role}</div>
            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {items.map((item) => (
            <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} label={t.nav[item.labelKey]} />
          ))}
        </nav>
        <div className="space-y-3 border-t border-white/10 p-3">
          <LanguageSwitcher tone="onDark" className="justify-center" />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              className="h-11 flex-1 justify-start text-[var(--sidebar-foreground)] hover:bg-white/10 hover:text-white"
              onClick={signOut}
            >
              <LogOut className="size-4" />
              {t.common.logOut}
            </Button>
            <NotificationBell className="text-[var(--sidebar-foreground)] hover:bg-white/10 hover:text-white" />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-40 flex items-center justify-between border-b bg-card/90 px-4 py-3 shadow-sm backdrop-blur-md md:hidden"
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          <div className="flex items-center gap-2.5">
            <BrandMark size={32} className="rounded-lg" />
            <div>
              <div className="text-sm font-semibold tracking-tight">Dragon City</div>
              <div className="text-[11px] text-muted-foreground capitalize">{role}</div>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <LanguageSwitcher />
            <NotificationBell />
            <Button variant="ghost" size="icon" className="size-11" onClick={signOut} aria-label={t.common.logOut}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1536px] flex-1 px-4 py-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:p-7 md:pb-7">
          {children}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/95 shadow-[0_-4px_24px_rgba(15,23,42,0.06)] backdrop-blur-md md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-lg">
          {primary.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className={cn("size-5", active && "stroke-[2.25px]")} />
                <span className="max-w-full truncate">{t.nav[item.labelKey]}</span>
              </Link>
            );
          })}

          {overflow.length > 0 && (
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium",
                    overflowActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <MoreHorizontal className="size-5" />
                  <span>More</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <SheetHeader>
                  <SheetTitle>More</SheetTitle>
                </SheetHeader>
                <div className="mt-4 grid gap-1">
                  {overflow.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium",
                        pathname.startsWith(item.href)
                          ? "bg-secondary text-secondary-foreground"
                          : "hover:bg-muted",
                      )}
                    >
                      <item.icon className="size-5" />
                      {t.nav[item.labelKey]}
                    </Link>
                  ))}
                  <Separator className="my-2" />
                  <Button variant="ghost" className="h-12 justify-start" onClick={signOut}>
                    <LogOut className="size-4" />
                    {t.common.logOut}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </nav>
    </div>
  );
}

function NavLink({ item, active, label }: { item: NavItem; active: boolean; label: string }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-[var(--sidebar-accent)] text-white"
          : "text-[var(--sidebar-muted)] hover:bg-white/5 hover:text-white",
      )}
    >
      {active && (
        <span className="absolute start-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[var(--sidebar-active)]" />
      )}
      <item.icon className={cn("size-4 shrink-0", active && "text-[var(--sidebar-active)]")} />
      {label}
    </Link>
  );
}
