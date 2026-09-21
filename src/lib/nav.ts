import type { LucideIcon } from "lucide-react";
import { LayoutGrid, Store, Wallet, Ticket, BarChart3, Handshake, Settings, UsersRound } from "lucide-react";

import type { Dictionary } from "@/lib/i18n/dictionaries";

export type StaffRole = "admin" | "operations" | "finance" | "maintenance";

export type NavItem = {
  href: string;
  labelKey: keyof Dictionary["nav"];
  icon: LucideIcon;
  roles: StaffRole[];
};

// One source of truth — the desktop sidebar and the mobile bottom bar
// both render from this list, filtered by the signed-in role.
// (Accounts was removed here — merchant/staff login creation now lives on
// their own detail pages instead of a standalone tab.)
export const staffNav: NavItem[] = [
  { href: "/map", labelKey: "map", icon: LayoutGrid, roles: ["admin", "operations", "finance", "maintenance"] },
  { href: "/merchants", labelKey: "merchants", icon: Store, roles: ["admin", "operations"] },
  { href: "/leads", labelKey: "leads", icon: Handshake, roles: ["admin", "operations"] },
  { href: "/invoices", labelKey: "invoices", icon: Wallet, roles: ["admin", "finance"] },
  { href: "/tickets", labelKey: "tickets", icon: Ticket, roles: ["admin", "operations", "finance", "maintenance"] },
  { href: "/dashboards", labelKey: "dashboards", icon: BarChart3, roles: ["admin", "operations", "finance"] },
  { href: "/staff", labelKey: "staff", icon: UsersRound, roles: ["admin"] },
  { href: "/settings", labelKey: "settings", icon: Settings, roles: ["admin"] },
];

export function navForRole(role: StaffRole): NavItem[] {
  return staffNav.filter((item) => item.roles.includes(role));
}
