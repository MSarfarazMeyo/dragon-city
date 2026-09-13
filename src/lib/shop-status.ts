// The one place tile/status color logic lives — used by the map grid and
// the operations dashboard so the two can never quietly disagree about
// what "overdue" or "expiring" means.

export type UnitLease = {
  billing_status: string;
  end_date: string | null;
  is_overdue: boolean;
};

export type ShopStatus = "free" | "occupied" | "expiring" | "fit_out" | "on_hold" | "overdue";

export const EXPIRING_WITHIN_DAYS = 30;

export function statusOf(lease: UnitLease | null): ShopStatus {
  if (!lease) return "free";
  if (lease.billing_status === "fit_out") return "fit_out";
  if (lease.billing_status === "free_use") return "on_hold";
  if (lease.is_overdue) return "overdue";
  if (lease.end_date) {
    const days = (new Date(lease.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (days >= 0 && days <= EXPIRING_WITHIN_DAYS) return "expiring";
  }
  return "occupied";
}

export const STATUS_LABEL: Record<ShopStatus, string> = {
  free: "Free",
  occupied: "Occupied",
  expiring: "Expiring",
  fit_out: "Fit-out",
  on_hold: "On hold",
  overdue: "Overdue",
};
