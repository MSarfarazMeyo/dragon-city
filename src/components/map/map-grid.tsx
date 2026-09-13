"use client";

import { useState } from "react";
import { AddShopDialog } from "@/components/map/add-shop-dialog";
import { cn } from "@/lib/utils";

export type MapUnit = {
  id: string;
  code: string;
  category: string | null;
  area_sqm: number | null;
};

export type MapZone = {
  id: string;
  code: string;
  label: string | null;
  units: MapUnit[];
};

export function MapGrid({ zones }: { zones: MapZone[] }) {
  const [scale, setScale] = useState(1);
  const totalUnits = zones.reduce((sum, z) => sum + z.units.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-4">
          <Stat label="Total shops" value={totalUnits} />
          <Stat label="Free" value={totalUnits} tone="good" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-md border">
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(0.6, s - 0.15))}
              className="px-2.5 py-1.5 text-sm hover:bg-secondary"
              aria-label="Zoom out"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => setScale(1)}
              className="border-x px-2.5 py-1.5 text-sm hover:bg-secondary"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(1.6, s + 0.15))}
              className="px-2.5 py-1.5 text-sm hover:bg-secondary"
              aria-label="Zoom in"
            >
              +
            </button>
          </div>
          <AddShopDialog zones={zones.map(({ id, code, label }) => ({ id, code, label }))} />
        </div>
      </div>

      {totalUnits === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          No shops yet. Click <span className="font-medium text-foreground">Add shop</span> to start
          building the map.
        </div>
      ) : (
        <div
          className="origin-top-left space-y-6 transition-transform"
          style={{ transform: `scale(${scale})` }}
        >
          {zones
            .filter((z) => z.units.length > 0)
            .map((zone) => (
              <div key={zone.id} className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground">
                  Zone {zone.code}
                  {zone.label ? <span className="font-normal"> — {zone.label}</span> : null}
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {zone.units.map((unit) => (
                    <div
                      key={unit.id}
                      title={unit.category ?? undefined}
                      className={cn(
                        "flex size-12 items-center justify-center rounded-md border text-[11px] font-medium",
                        "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                      )}
                    >
                      {unit.code}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "good";
}) {
  return (
    <div className="rounded-lg border px-4 py-2">
      <div className="text-xs tracking-wide text-muted-foreground uppercase">{label}</div>
      <div
        className={cn(
          "text-xl font-semibold tabular-nums",
          tone === "good" && "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {value}
      </div>
    </div>
  );
}
