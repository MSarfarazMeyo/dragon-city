"use client";

import { useState } from "react";
import { LayoutGrid, Map as MapIcon } from "lucide-react";

import { FloorPlanMap, type FloorPlanUnit } from "@/components/map/floor-plan-map";
import { MapGrid, type MapZone } from "@/components/map/map-grid";
import { ShopDetailDialog, type ShopDetailUnit } from "@/components/map/shop-detail-dialog";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export type MapWorkspaceProps = {
  floor: {
    id: string;
    label: string;
    bgImageUrl: string | null;
    mapWidth: number;
    mapHeight: number;
  };
  units: FloorPlanUnit[];
  zones: MapZone[];
  merchants: { id: string; name: string }[];
  defaultView?: "plan" | "grid";
};

export function MapWorkspace({ floor, units, zones, merchants, defaultView = "plan" }: MapWorkspaceProps) {
  const { t } = useI18n();
  const hasPlan = Boolean(floor.bgImageUrl && units.some((u) => u.geometry));
  const [viewMode, setViewMode] = useState<"plan" | "grid">(hasPlan ? defaultView : "grid");
  const [selected, setSelected] = useState<ShopDetailUnit | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function openUnit(
    unit: {
      id: string;
      code: string;
      category?: string | null;
      area_sqm?: number | null;
      property_status?: string | null;
      geometry?: FloorPlanUnit["geometry"];
    },
    floorId?: string,
  ) {
    const shape = unit.geometry?.shape;
    setSelected({
      id: unit.id,
      code: unit.code,
      category: unit.category ?? null,
      area_sqm: unit.area_sqm ?? null,
      property_status: unit.property_status ?? null,
      floor_id: floorId ?? floor.id,
      geometry:
        shape && shape.type === "box"
          ? {
              x: shape.x,
              y: shape.y,
              w: shape.w,
              h: shape.h,
              map_width: unit.geometry!.map_width,
              map_height: unit.geometry!.map_height,
            }
          : null,
    });
    setDialogOpen(true);
  }

  function handlePlanSelect(unit: FloorPlanUnit) {
    openUnit(unit, floor.id);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Map</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Shops, occupancy, and overdue at a glance</p>
        </div>
        {hasPlan && (
          <div className="flex flex-col items-end gap-1.5">
            <div className="inline-flex rounded-xl border bg-card p-1 shadow-sm">
              <ViewToggle
                label={t.map.planView}
                icon={<MapIcon className="size-3.5" />}
                active={viewMode === "plan"}
                onClick={() => setViewMode("plan")}
              />
              <ViewToggle
                label={t.map.gridView}
                icon={<LayoutGrid className="size-3.5" />}
                active={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
              />
            </div>
            <p className="max-w-xs text-end text-xs text-muted-foreground">
              {viewMode === "plan" ? t.map.planViewHint : t.map.gridViewHint}
            </p>
          </div>
        )}
      </div>

      {viewMode === "plan" && hasPlan ? (
        <FloorPlanMap floor={floor} units={units} onSelect={handlePlanSelect} />
      ) : (
        <MapGrid zones={zones} merchants={merchants} onUnitSelect={openUnit} />
      )}

      <ShopDetailDialog unit={selected} merchants={merchants} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function ViewToggle({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
