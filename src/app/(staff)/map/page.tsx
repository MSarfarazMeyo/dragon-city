import { createClient } from "@/lib/supabase/server";
import { MapWorkspace } from "@/components/map/map-workspace";
import type { MapZone } from "@/components/map/map-grid";
import type { FloorPlanUnit, BoxShape } from "@/components/map/floor-plan-map";
import type { PropertyStatus } from "@/lib/shop-status";

export default async function MapPage() {
  const supabase = await createClient();

  const { data: floors } = await supabase
    .from("floors")
    .select("id, label, bg_image_path, map_width, map_height, sort_order")
    .order("sort_order");

  // Single mall view — always the primary floor (Dragon City).
  const selectedFloor = floors?.[0] ?? null;

  let bgImageUrl: string | null = null;
  if (selectedFloor?.bg_image_path) {
    const { data } = await supabase.storage
      .from("floor-plans")
      .createSignedUrl(selectedFloor.bg_image_path, 3600);
    bgImageUrl = data?.signedUrl ?? null;
  }

  const floorId = selectedFloor?.id ?? "";

  const { data: zones } = await supabase
    .from("zones")
    .select("id, code, label, sort_order, units(id, code, category, area_sqm, grid_order, property_status)")
    .eq("floor_id", floorId)
    .order("sort_order");

  const { data: geometries } = await supabase
    .from("unit_geometries")
    .select("unit_id, shape, map_width, map_height")
    .eq("floor_id", floorId);

  const { data: activeLeases } = await supabase
    .from("leases")
    .select("id, unit_id, merchant_id, billing_status, end_date, is_locked, merchants(name)")
    .eq("status", "active");

  const today = new Date().toISOString().slice(0, 10);
  const { data: overdueInvoices } = await supabase
    .from("invoices")
    .select("lease_id")
    .eq("status", "pending")
    .lt("due_date", today);

  const { data: merchants } = await supabase.from("merchants").select("id, name").order("name");

  const overdueLeaseIds = new Set((overdueInvoices ?? []).map((i) => i.lease_id));
  const leaseByUnit = new Map(
    (activeLeases ?? []).map((l) => [l.unit_id, { ...l, is_overdue: overdueLeaseIds.has(l.id) }]),
  );

  const geometryByUnit = new Map(
    (geometries ?? []).map((g) => [
      g.unit_id,
      {
        shape: g.shape as BoxShape,
        map_width: g.map_width,
        map_height: g.map_height,
      },
    ]),
  );

  const mapZones: MapZone[] = (zones ?? [])
    .map((zone) => ({
      id: zone.id,
      code: zone.code,
      label: zone.label,
      units: [...zone.units]
        .sort((a, b) => a.grid_order - b.grid_order)
        .map((u) => ({
          ...u,
          lease: leaseByUnit.get(u.id) ?? null,
        })),
    }))
    .sort((a, b) => a.code.localeCompare(b.code));

  const planUnits: FloorPlanUnit[] = mapZones.flatMap((zone) =>
    zone.units.map((u) => {
      const lease = leaseByUnit.get(u.id);
      const geometry = geometryByUnit.get(u.id) ?? null;
      return {
        id: u.id,
        code: u.code,
        category: u.category,
        area_sqm: u.area_sqm,
        property_status: (u.property_status ?? "unknown") as PropertyStatus,
        geometry,
        lease: lease
          ? {
              billing_status: lease.billing_status,
              end_date: lease.end_date,
              is_overdue: lease.is_overdue,
              merchant_id: lease.merchant_id,
              is_locked: lease.is_locked,
            }
          : null,
        merchantName: lease?.merchants?.name ?? undefined,
      };
    }),
  );

  const mapWidth = selectedFloor?.map_width ?? planUnits[0]?.geometry?.map_width ?? 1200;
  const mapHeight = selectedFloor?.map_height ?? planUnits[0]?.geometry?.map_height ?? 800;

  return (
    <MapWorkspace
      floor={{
        id: selectedFloor?.id ?? "",
        label: "Dragon City",
        bgImageUrl,
        mapWidth,
        mapHeight,
      }}
      units={planUnits}
      zones={mapZones}
      merchants={merchants ?? []}
    />
  );
}
