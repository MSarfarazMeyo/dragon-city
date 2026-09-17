"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AddShopState = { error?: string } | null;

export async function addShop(
  _prevState: AddShopState,
  formData: FormData,
): Promise<AddShopState> {
  const supabase = await createClient();

  const code = String(formData.get("code") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;
  const areaRaw = String(formData.get("area_sqm") ?? "").trim();
  const area_sqm = areaRaw ? Number(areaRaw) : null;

  const existingZoneId = String(formData.get("zone_id") ?? "");
  const newZoneCode = String(formData.get("new_zone_code") ?? "").trim();
  const newZoneLabel = String(formData.get("new_zone_label") ?? "").trim() || null;

  if (!code || !slug) {
    return { error: "Shop code and slug are required." };
  }
  if (!existingZoneId && !newZoneCode) {
    return { error: "Pick a zone or enter a code for a new one." };
  }

  const { data: floor, error: floorError } = await supabase
    .from("floors")
    .select("id")
    .limit(1)
    .single();

  if (floorError || !floor) {
    return { error: "No floor found — run the seed migration first." };
  }

  let zoneId = existingZoneId;

  if (!zoneId) {
    const { count } = await supabase
      .from("zones")
      .select("id", { count: "exact", head: true })
      .eq("floor_id", floor.id);

    const { data: newZone, error: zoneError } = await supabase
      .from("zones")
      .insert({
        floor_id: floor.id,
        code: newZoneCode,
        label: newZoneLabel,
        sort_order: count ?? 0,
      })
      .select("id")
      .single();

    if (zoneError || !newZone) {
      return { error: zoneError?.message ?? "Could not create the zone." };
    }
    zoneId = newZone.id;
  }

  const { count: unitCount } = await supabase
    .from("units")
    .select("id", { count: "exact", head: true })
    .eq("zone_id", zoneId);

  const { error: unitError } = await supabase.from("units").insert({
    zone_id: zoneId,
    code,
    slug,
    category,
    area_sqm,
    grid_order: unitCount ?? 0,
  });

  if (unitError) {
    return {
      error: unitError.code === "23505"
        ? "A shop with that code or slug already exists."
        : unitError.message,
    };
  }

  revalidatePath("/map");
  return null;
}

export type UnitEditState = { error?: string } | null;

const PROPERTY_STATUSES = [
  "normal",
  "inventory",
  "absconded",
  "moved_out",
  "showroom",
  "holding",
  "follow_up",
  "unknown",
  "empty",
] as const;

export async function updatePropertyStatus(
  _prev: UnitEditState,
  formData: FormData,
): Promise<UnitEditState> {
  const supabase = await createClient();
  const unitId = String(formData.get("unit_id") ?? "");
  const property_status = String(formData.get("property_status") ?? "");
  if (!unitId || !(PROPERTY_STATUSES as readonly string[]).includes(property_status)) {
    return { error: "Invalid unit or status." };
  }
  const { error } = await supabase.from("units").update({ property_status }).eq("id", unitId);
  if (error) return { error: error.message };
  revalidatePath("/map");
  return null;
}

export async function updateUnitGeometry(
  _prev: UnitEditState,
  formData: FormData,
): Promise<UnitEditState> {
  const supabase = await createClient();
  const unitId = String(formData.get("unit_id") ?? "");
  const floorId = String(formData.get("floor_id") ?? "");
  const x = Number(formData.get("x"));
  const y = Number(formData.get("y"));
  const w = Number(formData.get("w"));
  const h = Number(formData.get("h"));
  const map_width = Number(formData.get("map_width") || 2384);
  const map_height = Number(formData.get("map_height") || 1684);

  if (!unitId || !floorId || [x, y, w, h].some((n) => Number.isNaN(n))) {
    return { error: "Geometry values are required." };
  }

  const shape = { type: "box" as const, x, y, w, h };
  const { data: existing } = await supabase
    .from("unit_geometries")
    .select("id")
    .eq("unit_id", unitId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("unit_geometries")
      .update({ shape, floor_id: floorId, map_width, map_height })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("unit_geometries").insert({
      unit_id: unitId,
      floor_id: floorId,
      shape,
      map_width,
      map_height,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/map");
  return null;
}

