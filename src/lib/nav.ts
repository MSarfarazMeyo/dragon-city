import type { LucideIcon } from "lucide-react";
import { LayoutGrid, Store, Wallet, Ticket, Users } from "lucide-react";

export type StaffRole = "admin" | "operations" | "finance" | "maintenance";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: StaffRole[];
};

// One source of truth — the desktop sidebar and the mobile bottom bar
// both render from this list, filtered by the signed-in role.
export const staffNav: NavItem[] = [
  { href: "/map", label: "Map", icon: LayoutGrid, roles: ["admin", "operations", "finance", "maintenance"] },
  { href: "/merchants", label: "Merchants", icon: Store, roles: ["admin", "operations"] },
  { href: "/finance", label: "Finance", icon: Wallet, roles: ["admin", "finance"] },
  { href: "/tickets", label: "Tickets", icon: Ticket, roles: ["admin", "operations", "finance", "maintenance"] },
  { href: "/accounts", label: "Accounts", icon: Users, roles: ["admin"] },
];

export function navForRole(role: StaffRole): NavItem[] {
  return staffNav.filter((item) => item.roles.includes(role));
}
