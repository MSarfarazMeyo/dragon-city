"use client";

import { useMemo, useState } from "react";
import { Lock, Minus, Plus, RotateCcw } from "lucide-react";

import { AddShopDialog } from "@/components/map/add-shop-dialog";
import { ShopDetailDialog, type ShopDetailUnit } from "@/components/map/shop-detail-dialog";
import { statusOf as computeStatus, statusLabel, STATUS_LABEL, type ShopStatus, type UnitLease } from "@/lib/shop-status";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export type MapUnit = {
  id: string;
  code: string;
  category: string | null;
  area_sqm: number | null;
  property_status?: string;
  lease: (UnitLease & { is_locked: boolean; merchants: { name: string } | null }) | null;
};

export type MapZone = {
  id: string;
  code: string;
  label: string | null;
  units: MapUnit[];
};

type Status = ShopStatus;
const statusOf = (unit: MapUnit) => computeStatus(unit.lease);

const STATUS_STYLE: Record<Status, string> = {
  free: "border-emerald-500/25 bg-emerald-500/12 text-emerald-800 dark:text-emerald-300",
  occupied: "border-sky-500/25 bg-sky-500/12 text-sky-800 dark:text-sky-300",
  expiring: "border-amber-500/25 bg-amber-500/12 text-amber-800 dark:text-amber-300",
  fit_out: "border-orange-500/25 bg-orange-500/12 text-orange-800 dark:text-orange-300",
  on_hold: "border-violet-500/25 bg-violet-500/12 text-violet-800 dark:text-violet-300",
  overdue: "border-rose-500/25 bg-rose-500/12 text-rose-800 dark:text-rose-300",
};

const STATUS_DOT: Record<Status, string> = {
  free: "bg-emerald-500",
  occupied: "bg-sky-500",
  expiring: "bg-amber-500",
  fit_out: "bg-orange-500",
  on_hold: "bg-violet-500",
  overdue: "bg-rose-500",
};

export function MapGrid({
  zones,
  merchants,
  onUnitSelect,
}: {
  zones: MapZone[];
  merchants: { id: string; name: string }[];
  onUnitSelect?: (unit: MapUnit) => void;
}) {
  const { t, locale } = useI18n();
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
    if (onUnitSelect) {
      onUnitSelect(unit);
      return;
    }
    setSelected({ id: unit.id, code: unit.code, category: unit.category, area_sqm: unit.area_sqm });
    setDialogOpen(true);
  }

  function zoneTitle(zone: MapZone) {
    const label = zone.label?.trim();
    if (!label || label.toLowerCase() === `zone ${zone.code}`.toLowerCase() || label.toLowerCase() === zone.code.toLowerCase()) {
      return `Zone ${zone.code}`;
    }
    return `Zone ${zone.code} · ${label}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card/80 p-3 shadow-sm backdrop-blur-sm">
        <div className="flex flex-wrap gap-2">
          <Stat label={t.map.total} value={allUnits.length} />
          <Stat label={statusLabel("free", locale)} value={counts.free} tone="free" />
          <Stat label={statusLabel("occupied", locale)} value={counts.occupied} tone="occupied" />
          {counts.overdue > 0 && <Stat label={statusLabel("overdue", locale)} value={counts.overdue} tone="overdue" />}
          {counts.expiring > 0 && <Stat label={statusLabel("expiring", locale)} value={counts.expiring} tone="expiring" />}
          {counts.fit_out > 0 && <Stat label={statusLabel("fit_out", locale)} value={counts.fit_out} tone="fit_out" />}
          {counts.on_hold > 0 && <Stat label={statusLabel("on_hold", locale)} value={counts.on_hold} tone="on_hold" />}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-xl border bg-background">
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(0.6, s - 0.15))}
              className="flex size-10 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Zoom out"
            >
              <Minus className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setScale(1)}
              className="flex h-10 items-center gap-1.5 border-x px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </button>
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(1.6, s + 0.15))}
              className="flex size-10 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Zoom in"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <AddShopDialog zones={zones.map(({ id, code, label }) => ({ id, code, label }))} />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <FilterChip label={t.common.all} active={filter === "all"} onClick={() => setFilter("all")} />
        {(Object.keys(STATUS_LABEL) as Status[])
          .filter((s) => counts[s] > 0)
          .map((s) => (
            <FilterChip
              key={s}
              label={statusLabel(s, locale)}
              tone={s}
              active={filter === s}
              onClick={() => setFilter(s)}
            />
          ))}
      </div>

      {allUnits.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/60 p-12 text-center text-muted-foreground">
          No shops yet. Click <span className="font-medium text-foreground">Add shop</span> to start building the map.
        </div>
      ) : (
        <div className="origin-top-left space-y-5 transition-transform" style={{ transform: `scale(${scale})` }}>
          {zones
            .filter((z) => z.units.length > 0)
            .map((zone) => {
              const visibleUnits = zone.units.filter((u) => filter === "all" || statusOf(u) === filter);
              if (visibleUnits.length === 0) return null;
              return (
                <section key={zone.id} className="rounded-2xl border bg-card/70 p-4 shadow-sm">
                  <div className="mb-3 flex items-baseline justify-between gap-2">
                    <h2 className="text-sm font-semibold tracking-tight">{zoneTitle(zone)}</h2>
                    <span className="text-xs tabular-nums text-muted-foreground">{visibleUnits.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {visibleUnits.map((unit) => {
                      const status = statusOf(unit);
                      return (
                        <button
                          key={unit.id}
                          type="button"
                          onClick={() => openUnit(unit)}
                          title={unit.lease?.merchants?.name ?? unit.category ?? undefined}
                          className={cn(
                            "relative flex h-12 min-w-12 items-center justify-center rounded-xl border px-2 text-[11px] font-semibold tracking-tight transition-all hover:-translate-y-0.5 hover:shadow-md",
                            STATUS_STYLE[status],
                          )}
                        >
                          {unit.code}
                          {unit.lease?.is_locked && (
                            <Lock className="absolute -top-1.5 -end-1.5 size-3.5 rounded-full bg-background p-0.5 text-rose-600 shadow-sm dark:text-rose-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
        </div>
      )}

      {!onUnitSelect && (
        <ShopDetailDialog unit={selected} merchants={merchants} open={dialogOpen} onOpenChange={setDialogOpen} />
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  tone,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  tone?: Status;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
        active
          ? "border-transparent bg-primary text-primary-foreground shadow-sm"
          : "bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground",
      )}
    >
      {tone && !active && <span className={cn("size-1.5 rounded-full", STATUS_DOT[tone])} aria-hidden />}
      {label}
    </button>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: Status }) {
  return (
    <div className="min-w-[4.5rem] rounded-xl bg-muted/50 px-3.5 py-2">
      <div className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">{label}</div>
      <div
        className={cn(
          "text-xl font-semibold tabular-nums tracking-tight",
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
