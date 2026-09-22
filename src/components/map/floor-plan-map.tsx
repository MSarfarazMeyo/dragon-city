"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Minus, Plus, RotateCcw, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/context";
import {
  displayStatus,
  displayStatusColor,
  displayStatusLabel,
  type DisplayStatus,
  type PropertyStatus,
  type UnitLease,
} from "@/lib/shop-status";
import { cn } from "@/lib/utils";

export type BoxShape = { type: "box"; x: number; y: number; w: number; h: number };

export type FloorPlanUnit = {
  id: string;
  code: string;
  category?: string | null;
  area_sqm?: number | null;
  property_status: PropertyStatus;
  geometry: { shape: BoxShape; map_width: number; map_height: number } | null;
  lease: (UnitLease & { merchant_id: string; is_locked: boolean }) | null;
  merchantName?: string;
};

type FloorPlanMapProps = {
  floor: {
    id: string;
    label: string;
    bgImageUrl: string | null;
    mapWidth: number;
    mapHeight: number;
  };
  units: FloorPlanUnit[];
  onSelect: (unit: FloorPlanUnit) => void;
};

export function FloorPlanMap({ floor, units, onSelect }: FloorPlanMapProps) {
  const { t, locale } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DisplayStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mappedUnits = useMemo(
    () =>
      units
        .filter((u) => u.geometry?.shape?.type === "box")
        .map((u) => ({
          ...u,
          status: displayStatus(u),
        })),
    [units],
  );

  const selectedMerchantId = useMemo(() => {
    const selected = mappedUnits.find((u) => u.id === selectedId);
    return selected?.lease?.merchant_id ?? null;
  }, [mappedUnits, selectedId]);

  const searchLower = search.trim().toLowerCase();

  const statusCounts = useMemo(() => {
    const counts = new Map<DisplayStatus, number>();
    for (const u of mappedUnits) {
      counts.set(u.status, (counts.get(u.status) ?? 0) + 1);
    }
    return counts;
  }, [mappedUnits]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.min(4, Math.max(0.4, s - e.deltaY * 0.001)));
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      setDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [offset],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      setOffset({
        x: dragStart.current.ox + (e.clientX - dragStart.current.x),
        y: dragStart.current.oy + (e.clientY - dragStart.current.y),
      });
    },
    [dragging],
  );

  const onPointerUp = useCallback(() => setDragging(false), []);

  function handleUnitClick(unit: FloorPlanUnit) {
    setSelectedId(unit.id);
    onSelect(unit);
  }

  function resetView() {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }

  if (!floor.bgImageUrl) {
    return (
      <div className="rounded-2xl border border-dashed bg-card/60 p-12 text-center text-sm text-muted-foreground">
        {t.map.noFloorPlan}
      </div>
    );
  }

  const { mapWidth, mapHeight } = floor;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-card/80 p-2.5 shadow-sm backdrop-blur-sm">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.common.search}
            className="h-10 border-0 bg-muted/60 ps-9 shadow-none focus-visible:ring-1"
          />
        </div>
        <div className="flex overflow-hidden rounded-xl border bg-background">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.4, s - 0.15))}
            className="flex size-10 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Zoom out"
          >
            <Minus className="size-4" />
          </button>
          <button
            type="button"
            onClick={resetView}
            className="flex h-10 items-center gap-1.5 border-x px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
            {t.common.reset}
          </button>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(4, s + 0.15))}
            className="flex size-10 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Zoom in"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <FilterChip label={t.common.all} active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
        {[...statusCounts.entries()]
          .sort(([a], [b]) => displayStatusLabel(a, locale).localeCompare(displayStatusLabel(b, locale)))
          .map(([status, count]) => (
            <FilterChip
              key={status}
              label={`${displayStatusLabel(status, locale)} (${count})`}
              color={displayStatusColor(status)}
              active={statusFilter === status}
              onClick={() => setStatusFilter(status)}
            />
          ))}
      </div>

      <div
        ref={containerRef}
        className={cn(
          "relative h-[min(72vh,760px)] overflow-hidden rounded-2xl border bg-white shadow-sm ring-1 ring-black/5 touch-none",
          dragging ? "cursor-grabbing" : "cursor-grab",
        )}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className="absolute origin-top-left"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          }}
        >
          <svg
            width={mapWidth}
            height={mapHeight}
            viewBox={`0 0 ${mapWidth} ${mapHeight}`}
            className="block max-w-none"
            role="img"
            aria-label={floor.label}
          >
            <image href={floor.bgImageUrl} width={mapWidth} height={mapHeight} preserveAspectRatio="xMidYMid meet" />
            {mappedUnits.map((unit) => {
              const shape = unit.geometry!.shape;
              const matchesSearch = !searchLower || unit.code.toLowerCase().includes(searchLower);
              const matchesFilter = statusFilter === "all" || unit.status === statusFilter;
              const isSelected = unit.id === selectedId;
              const isLinked =
                selectedMerchantId !== null &&
                unit.lease?.merchant_id === selectedMerchantId &&
                unit.id !== selectedId;
              const dimmed = !matchesFilter || (searchLower && !matchesSearch);
              const fill = displayStatusColor(unit.status);

              return (
                <g key={unit.id}>
                  <rect
                    x={shape.x}
                    y={shape.y}
                    width={shape.w}
                    height={shape.h}
                    rx={2}
                    fill={fill}
                    fillOpacity={dimmed ? 0.1 : isSelected || isLinked ? 0.58 : 0.38}
                    stroke={
                      isSelected
                        ? "#0f172a"
                        : isLinked
                          ? "#eab308"
                          : matchesSearch && searchLower
                            ? "#0f172a"
                            : fill
                    }
                    strokeWidth={isSelected || isLinked || (matchesSearch && searchLower) ? 2.5 : 1}
                    className="cursor-pointer transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnitClick(unit);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                  />
                  <text
                    x={shape.x + shape.w / 2}
                    y={shape.y + shape.h / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={dimmed ? "#64748b" : "#ffffff"}
                    fontSize={Math.max(10, Math.min(shape.w, shape.h) * 0.22)}
                    fontWeight={600}
                    pointerEvents="none"
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.55)" }}
                  >
                    {unit.code}
                  </text>
                  {unit.lease?.is_locked && (
                    <text
                      x={shape.x + shape.w - 6}
                      y={shape.y + 10}
                      textAnchor="end"
                      fontSize={10}
                      fill="#f43f5e"
                      pointerEvents="none"
                    >
                      🔒
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {selectedMerchantId && (
        <p className="text-xs text-muted-foreground">
          {t.map.linkedUnits}: {mappedUnits.filter((u) => u.lease?.merchant_id === selectedMerchantId).length}
        </p>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
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
      {color && !active && (
        <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      )}
      {label}
    </button>
  );
}
