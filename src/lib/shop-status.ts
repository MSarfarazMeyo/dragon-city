// The one place tile/status color logic lives — used by the map grid and
// the operations dashboard so the two can never quietly disagree about
// what "overdue" or "expiring" means.

export type UnitLease = {
  billing_status: string;
  end_date: string | null;
  is_overdue: boolean;
};

export type ShopStatus = "free" | "occupied" | "expiring" | "fit_out" | "on_hold" | "overdue";

export type PropertyStatus =
  | "normal"
  | "inventory"
  | "absconded"
  | "moved_out"
  | "showroom"
  | "holding"
  | "follow_up"
  | "unknown"
  | "empty";

export type DisplayStatus = ShopStatus | PropertyStatus;

export type DisplayStatusUnit = {
  lease: UnitLease | null;
  property_status: PropertyStatus;
};

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

/**
 * Combined status for map coloring and filters.
 * Active leases always win (overdue/expiring/occupied/etc.) so finance signals
 * stay visible on rented units. Property status is shown only when the unit has
 * no lease-driven state — i.e. statusOf(lease) === "free".
 */
export function displayStatus(unit: DisplayStatusUnit): DisplayStatus {
  const leaseStatus = statusOf(unit.lease);
  if (leaseStatus !== "free") return leaseStatus;
  return unit.property_status;
}

export const STATUS_LABEL: Record<ShopStatus, string> = {
  free: "Free",
  occupied: "Occupied",
  expiring: "Expiring",
  fit_out: "Fit-out",
  on_hold: "On hold",
  overdue: "Overdue",
};

export const PROPERTY_STATUS_LABEL: Record<PropertyStatus, string> = {
  normal: "Normal",
  inventory: "Inventory",
  absconded: "Absconded",
  moved_out: "Moved out",
  showroom: "Showroom",
  holding: "Holding",
  follow_up: "Follow up",
  unknown: "Unknown",
  empty: "Empty",
};

export const STATUS_COLOR: Record<ShopStatus, string> = {
  free: "#10b981",
  occupied: "#0ea5e9",
  expiring: "#f59e0b",
  fit_out: "#f97316",
  on_hold: "#8b5cf6",
  overdue: "#f43f5e",
};

export const PROPERTY_STATUS_COLOR: Record<PropertyStatus, string> = {
  normal: "#64748b",
  inventory: "#3b82f6",
  absconded: "#dc2626",
  moved_out: "#ea580c",
  showroom: "#a855f7",
  holding: "#eab308",
  follow_up: "#d97706",
  unknown: "#94a3b8",
  empty: "#10b981",
};

export function displayStatusLabel(status: DisplayStatus): string {
  if (status in STATUS_LABEL) return STATUS_LABEL[status as ShopStatus];
  return PROPERTY_STATUS_LABEL[status as PropertyStatus];
}

export function displayStatusColor(status: DisplayStatus): string {
  if (status in STATUS_COLOR) return STATUS_COLOR[status as ShopStatus];
  return PROPERTY_STATUS_COLOR[status as PropertyStatus];
}

export function isPropertyStatus(status: DisplayStatus): status is PropertyStatus {
  return status in PROPERTY_STATUS_LABEL;
}
