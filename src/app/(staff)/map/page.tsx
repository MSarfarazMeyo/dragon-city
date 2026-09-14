import { createClient } from "@/lib/supabase/server";
import { MapGrid, type MapZone } from "@/components/map/map-grid";
import { ViewFloorPlanDialog } from "@/components/map/view-floor-plan-dialog";

export default async function MapPage() {
  const supabase = await createClient();

  const { data: floor } = await supabase.from("floors").select("id, label, reference_pdf_url").limit(1).single();

  const { data: zones } = await supabase
    .from("zones")
    .select("id, code, label, sort_order, units(id, code, category, area_sqm, grid_order)")
    .eq("floor_id", floor?.id ?? "")
    .order("sort_order");

  const { data: activeLeases } = await supabase
    .from("leases")
    .select("id, unit_id, billing_status, end_date, is_locked, merchants(name)")
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

  const mapZones: MapZone[] = (zones ?? [])
    .map((zone) => ({
      id: zone.id,
      code: zone.code,
      label: zone.label,
      units: [...zone.units]
        .sort((a, b) => a.grid_order - b.grid_order)
        .map((u) => ({ ...u, lease: leaseByUnit.get(u.id) ?? null })),
    }))
    .sort((a, b) => a.code.localeCompare(b.code));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{floor?.label ?? "Map"}</h1>
          <p className="text-muted-foreground text-sm">
            The zone grid is the source of truth — shops are added by hand, not extracted from a floor plan.
          </p>
        </div>
        {floor?.reference_pdf_url && <ViewFloorPlanDialog path={floor.reference_pdf_url} />}
      </div>
      <MapGrid zones={mapZones} merchants={merchants ?? []} />
    </div>
  );
}
