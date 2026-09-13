"use client";

import { useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { AddShopDialog } from "@/components/map/add-shop-dialog";
import { ShopDetailDialog, type ShopDetailUnit } from "@/components/map/shop-detail-dialog";
import { cn } from "@/lib/utils";

type UnitLease = {
  billing_status: string;
  end_date: string | null;
  is_locked: boolean;
  is_overdue: boolean;
  merchants: { name: string } | null;
};

export type MapUnit = {
  id: string;
  code: string;
  category: string | null;
  area_sqm: number | null;
  lease: UnitLease | null;
};

export type MapZone = {
  id: string;
  code: string;
  label: string | null;
  units: MapUnit[];
};

type Status = "free" | "occupied" | "expiring" | "fit_out" | "on_hold" | "overdue";

const EXPIRING_WITHIN_DAYS = 30;

function statusOf(unit: MapUnit): Status {
  const lease = unit.lease;
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

const STATUS_STYLE: Record<Status, string> = {
  free: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  occupied: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  expiring: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  fit_out: "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400",
  on_hold: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  overdue: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
};

const STATUS_LABEL: Record<Status, string> = {
  free: "Free",
  occupied: "Occupied",
  expiring: "Expiring",
  fit_out: "Fit-out",
  on_hold: "On hold",
  overdue: "Overdue",
};

export function MapGrid({
  zones,
  merchants,
}: {
  zones: MapZone[];
  merchants: { id: string; name: string }[];
}) {
  const [scale, setScale] = useState(1);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [selected, setSelected] = useState<ShopDetailUnit | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const allUnits = useMemo(() => zones.flatMap((z) => z.units), [zones]);
  const counts = useMemo(() => {
    const c: Record<Status, number> = { free: 0, occupied: 0, expiring: 0, fit_out: 0, on_hold: 0, overdue: 0 };
    for (const u of allUnits) c[statusOf(u)]++;
    return c;
  }, [allUnits]);

  function openUnit(unit: MapUnit) {
    setSelected({ id: unit.id, code: unit.code, category: unit.category, area_sqm: unit.area_sqm });
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Stat label="Total" value={allUnits.length} />
          <Stat label="Free" value={counts.free} tone="free" />
          <Stat label="Occupied" value={counts.occupied} tone="occupied" />
          {counts.overdue > 0 && <Stat label="Overdue" value={counts.overdue} tone="overdue" />}
          {counts.expiring > 0 && <Stat label="Expiring" value={counts.expiring} tone="expiring" />}
          {counts.fit_out > 0 && <Stat label="Fit-out" value={counts.fit_out} tone="fit_out" />}
          {counts.on_hold > 0 && <Stat label="On hold" value={counts.on_hold} tone="on_hold" />}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-md border">
            <button type="button" onClick={() => setScale((s) => Math.max(0.6, s - 0.15))} className="px-2.5 py-1.5 text-sm hover:bg-secondary" aria-label="Zoom out">
              −
            </button>
            <button type="button" onClick={() => setScale(1)} className="border-x px-2.5 py-1.5 text-sm hover:bg-secondary">
              Reset
            </button>
            <button type="button" onClick={() => setScale((s) => Math.min(1.6, s + 0.15))} className="px-2.5 py-1.5 text-sm hover:bg-secondary" aria-label="Zoom in">
              +
            </button>
          </div>
          <AddShopDialog zones={zones.map(({ id, code, label }) => ({ id, code, label }))} />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <FilterChip label="All" active={filter === "all"} onClick={() => setFilter("all")} />
        {(Object.keys(STATUS_LABEL) as Status[])
          .filter((s) => counts[s] > 0)
          .map((s) => (
            <FilterChip key={s} label={STATUS_LABEL[s]} active={filter === s} onClick={() => setFilter(s)} />
          ))}
      </div>

      {allUnits.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          No shops yet. Click <span className="font-medium text-foreground">Add shop</span> to start building the map.
        </div>
      ) : (
        <div className="origin-top-left space-y-6 transition-transform" style={{ transform: `scale(${scale})` }}>
          {zones
            .filter((z) => z.units.length > 0)
            .map((zone) => {
              const visibleUnits = zone.units.filter((u) => filter === "all" || statusOf(u) === filter);
              if (visibleUnits.length === 0) return null;
              return (
                <div key={zone.id} className="space-y-2">
                  <h2 className="text-sm font-semibold text-muted-foreground">
                    Zone {zone.code}
                    {zone.label ? <span className="font-normal"> — {zone.label}</span> : null}
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {visibleUnits.map((unit) => {
                      const status = statusOf(unit);
                      return (
                        <button
                          key={unit.id}
                          type="button"
                          onClick={() => openUnit(unit)}
                          title={unit.lease?.merchants?.name ?? unit.category ?? undefined}
                          className={cn(
                            "relative flex size-12 items-center justify-center rounded-md border text-[11px] font-medium transition-transform hover:scale-105",
                            STATUS_STYLE[status],
                          )}
                        >
                          {unit.code}
                          {unit.lease?.is_locked && (
                            <Lock className="absolute -top-1 -right-1 size-3.5 rounded-full bg-background p-0.5 text-rose-600 dark:text-rose-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      <ShopDetailDialog unit={selected} merchants={merchants} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active ? "border-foreground bg-foreground text-background" : "text-muted-foreground hover:bg-secondary",
      )}
    >
      {label}
    </button>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: Status }) {
  return (
    <div className="rounded-lg border px-4 py-2">
      <div className="text-xs tracking-wide text-muted-foreground uppercase">{label}</div>
      <div
        className={cn(
          "text-xl font-semibold tabular-nums",
          tone === "free" && "text-emerald-600 dark:text-emerald-400",
          tone === "occupied" && "text-sky-600 dark:text-sky-400",
          tone === "expiring" && "text-amber-600 dark:text-amber-400",
          tone === "fit_out" && "text-orange-600 dark:text-orange-400",
          tone === "on_hold" && "text-violet-600 dark:text-violet-400",
          tone === "overdue" && "text-rose-600 dark:text-rose-400",
        )}
      >
        {value}
      </div>
    </div>
  );
}
