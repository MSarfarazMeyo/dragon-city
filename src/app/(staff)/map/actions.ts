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
