/**
 * One-time migration: mall-shop-manager JSON + PDFs → Supabase.
 *
 * Usage (from dragon-city/):
 *   node --env-file=.env.local scripts/migrate-from-prototype.mjs
 *   node --env-file=.env.local scripts/migrate-from-prototype.mjs --dry-run
 *   node --env-file=.env.local scripts/migrate-from-prototype.mjs --skip-pdfs
 *   node --env-file=.env.local scripts/migrate-from-prototype.mjs --only-pdfs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PROTO = join(ROOT, "..", "mall-shop-manager");
const DRY = process.argv.includes("--dry-run");
const SKIP_PDFS = process.argv.includes("--skip-pdfs");
const ONLY_PDFS = process.argv.includes("--only-pdfs");

const MAP_W = 2384;
const MAP_H = 1684;

const STATUS_MAP = {
  inventory: "inventory",
  absconded: "absconded",
  normal: "normal",
  holding: "holding",
  follow_up: "follow_up",
  moved_out: "moved_out",
  unknown: "unknown",
  showroom: "showroom",
  empty: "empty",
};

function loadJson(rel) {
  return JSON.parse(readFileSync(join(PROTO, rel), "utf8"));
}

function slugify(code) {
  return code.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function asList(raw) {
  return Array.isArray(raw) ? raw : Object.values(raw);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function ensureFloors() {
  const { data: floors, error } = await supabase.from("floors").select("*").order("sort_order");
  if (error) throw error;

  let floor1 = floors.find((f) => f.sort_order === 0 || /1F|一楼/i.test(f.label));
  let food = floors.find((f) => /food|餐厅/i.test(f.label));

  if (!DRY) {
    if (floor1) {
      await supabase
        .from("floors")
        .update({
          map_width: MAP_W,
          map_height: MAP_H,
          label_i18n: { zh: "一楼", en: "1F", ar: "الطابق الأول" },
          sort_order: 0,
        })
        .eq("id", floor1.id);
    }
  }

  // Upload 1F background
  const bgPath = "dragon-city/1f.png";
  const localBg = join(PROTO, "public", "floor_1f.png");
  if (!DRY && existsSync(localBg) && floor1) {
    const buf = readFileSync(localBg);
    const { error: upErr } = await supabase.storage.from("floor-plans").upload(bgPath, buf, {
      contentType: "image/png",
      upsert: true,
    });
    if (upErr) console.warn("bg upload:", upErr.message);
    else {
      await supabase.from("floors").update({ bg_image_path: bgPath }).eq("id", floor1.id);
      console.log("Uploaded floor bg →", bgPath);
    }
  }

  // Food court bg if present
  const foodLocal = join(PROTO, "public", "floor_bg", "longcheng_msn372ed.png");
  if (!DRY && food && existsSync(foodLocal)) {
    const foodPath = "dragon-city/food-court.png";
    const buf = readFileSync(foodLocal);
    await supabase.storage.from("floor-plans").upload(foodPath, buf, {
      contentType: "image/png",
      upsert: true,
    });
    await supabase
      .from("floors")
      .update({
        bg_image_path: foodPath,
        map_width: 9536,
        map_height: 6736,
        label_i18n: { zh: "二楼餐厅", en: "Food Court", ar: "ساحة الطعام" },
      })
      .eq("id", food.id);
  }

  const { data: refreshed } = await supabase.from("floors").select("*").order("sort_order");
  floor1 = refreshed.find((f) => f.sort_order === 0 || /1F|一楼/i.test(f.label));
  return { floor1, floors: refreshed };
}

async function importUnits(floor1) {
  const shops = asList(loadJson("data/shops.json"));
  console.log(`Importing ${shops.length} shops…`);

  // Group by zone
  const byZone = new Map();
  for (const s of shops) {
    const zone = s.zone || String(s.shopId).split("-")[0];
    if (!byZone.has(zone)) byZone.set(zone, []);
    byZone.get(zone).push(s);
  }

  const zoneIds = new Map();
  let zi = 0;
  for (const [code, list] of [...byZone.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (DRY) {
      zoneIds.set(code, `dry-zone-${code}`);
      continue;
    }
    const { data: existing } = await supabase
      .from("zones")
      .select("id")
      .eq("floor_id", floor1.id)
      .eq("code", code)
      .maybeSingle();

    if (existing) {
      zoneIds.set(code, existing.id);
    } else {
      const { data, error } = await supabase
        .from("zones")
        .insert({ floor_id: floor1.id, code, label: `Zone ${code}`, sort_order: zi++ })
        .select("id")
        .single();
      if (error) throw error;
      zoneIds.set(code, data.id);
    }
  }

  const unitByCode = new Map();
  let imported = 0;
  let geos = 0;

  for (const s of shops) {
    const zone = s.zone || String(s.shopId).split("-")[0];
    const zoneId = zoneIds.get(zone);
    const code = s.shopId;
    const slug = slugify(code);
    const property_status = STATUS_MAP[s.status] || "unknown";
    const payload = {
      zone_id: zoneId,
      code,
      slug,
      category: s.category || null,
      area_sqm: s.area_sqm ?? null,
      grid_order: imported,
      property_status,
    };

    if (DRY) {
      unitByCode.set(code, { id: `dry-${code}`, ...payload });
      imported++;
      continue;
    }

    const { data: existing } = await supabase.from("units").select("id").eq("code", code).maybeSingle();
    let unitId;
    if (existing) {
      await supabase.from("units").update(payload).eq("id", existing.id);
      unitId = existing.id;
    } else {
      const { data, error } = await supabase.from("units").insert(payload).select("id").single();
      if (error) {
        console.warn("unit", code, error.message);
        continue;
      }
      unitId = data.id;
    }
    unitByCode.set(code, { id: unitId, ...payload });
    imported++;

    if (s.box) {
      const shape = { type: "box", x: s.box.x, y: s.box.y, w: s.box.w, h: s.box.h };
      const { data: geo } = await supabase
        .from("unit_geometries")
        .select("id")
        .eq("unit_id", unitId)
        .maybeSingle();
      if (geo) {
        await supabase
          .from("unit_geometries")
          .update({ shape, floor_id: floor1.id, map_width: MAP_W, map_height: MAP_H })
          .eq("id", geo.id);
      } else {
        await supabase.from("unit_geometries").insert({
          unit_id: unitId,
          floor_id: floor1.id,
          shape,
          map_width: MAP_W,
          map_height: MAP_H,
        });
      }
      geos++;
    }
  }

  console.log(`Units: ${imported}, geometries: ${geos}`);
  return unitByCode;
}

async function importMerchants(unitByCode) {
  const merchants = asList(loadJson("data/merchants.json"));
  const shopsByCode = new Map(asList(loadJson("data/shops.json")).map((s) => [s.shopId, s]));
  console.log(`Importing ${merchants.length} merchants…`);

  // Checklist: skip unsigned 054 docs later; name fixes applied at display via notes
  const merchantIdMap = new Map(); // proto MCH-xxxx → uuid
  let mCount = 0;
  let leaseCount = 0;
  let invCount = 0;

  for (const m of merchants) {
    const notesParts = [];
    if (m.remarks) notesParts.push(m.remarks);
    if (m.wechat) notesParts.push(`WeChat: ${m.wechat}`);
    notesParts.push(`proto_id=${m.id}`);

    const payload = {
      name: m.name,
      type: m.customerType === "company" || /公司|Co\.|Ltd/i.test(m.name) ? "company" : "individual",
      contact_name: m.contactPerson || null,
      contact_phone: m.phone || null,
      contact_email: null,
      notes: notesParts.join("\n") || null,
    };

    if (DRY) {
      merchantIdMap.set(m.id, `dry-${m.id}`);
      mCount++;
      continue;
    }

    // Prefer match by proto_id in notes, else by name
    let merchantUuid;
    const { data: byNote } = await supabase
      .from("merchants")
      .select("id, notes")
      .ilike("notes", `%proto_id=${m.id}%`)
      .maybeSingle();

    if (byNote) {
      await supabase.from("merchants").update(payload).eq("id", byNote.id);
      merchantUuid = byNote.id;
    } else {
      const { data: byName } = await supabase.from("merchants").select("id").eq("name", m.name).maybeSingle();
      if (byName) {
        await supabase.from("merchants").update(payload).eq("id", byName.id);
        merchantUuid = byName.id;
      } else {
        const { data, error } = await supabase.from("merchants").insert(payload).select("id").single();
        if (error) {
          console.warn("merchant", m.name, error.message);
          continue;
        }
        merchantUuid = data.id;
      }
    }
    merchantIdMap.set(m.id, merchantUuid);
    mCount++;

    const shops = m.linkedShops || [];
    for (const code of shops) {
      const unit = unitByCode.get(code);
      if (!unit) continue;

      const { data: active } = await supabase
        .from("leases")
        .select("id")
        .eq("unit_id", unit.id)
        .eq("status", "active")
        .maybeSingle();

      if (active) {
        await supabase
          .from("leases")
          .update({ merchant_id: merchantUuid })
          .eq("id", active.id);
      } else {
        const shop = shopsByCode.get(code) || {};
        const { error } = await supabase.from("leases").insert({
          unit_id: unit.id,
          merchant_id: merchantUuid,
          start_date: "2025-09-25",
          end_date: "2026-03-25",
          status: "active",
          billing_status: "active",
          rent_amount: shop.fixed_fee_year ?? null,
          deposit: shop.deposit ?? null,
          service_fee: shop.service_fee_year ?? null,
          service_contract_no: shop.contract_no && shop.contract_no !== "？" ? shop.contract_no : null,
          cooperation_contract_no:
            shop.cooperation_no && shop.cooperation_no !== "？" ? shop.cooperation_no : null,
        });
        if (error) console.warn("lease", code, error.message);
        else leaseCount++;
      }
    }

    // Seed invoices from leaseObligations (latest period per merchant — attach to first lease)
    if (m.leaseObligations?.length) {
      const { data: leases } = await supabase
        .from("leases")
        .select("id")
        .eq("merchant_id", merchantUuid)
        .eq("status", "active")
        .limit(1);
      const leaseId = leases?.[0]?.id;
      if (leaseId) {
        for (const ob of m.leaseObligations) {
          if (!ob.periodStart || !ob.periodEnd) continue;
          const { data: existingInv } = await supabase
            .from("invoices")
            .select("id")
            .eq("lease_id", leaseId)
            .eq("period_start", ob.periodStart)
            .eq("period_end", ob.periodEnd)
            .maybeSingle();
          if (existingInv) continue;

          const due = ob.periodStart;
          const { data: inv, error } = await supabase
            .from("invoices")
            .insert({
              lease_id: leaseId,
              period_start: ob.periodStart,
              period_end: ob.periodEnd,
              due_date: due,
              status: "pending",
            })
            .select("id")
            .single();
          if (error) {
            console.warn("invoice", m.id, error.message);
            continue;
          }
          const lines = [];
          if (ob.serviceFee != null) lines.push({ label: "Service Fee for Current Term", amount: Number(ob.serviceFee), sort_order: 10 });
          if (ob.mgmtFee != null) lines.push({ label: "Management Fee for Current Term", amount: Number(ob.mgmtFee), sort_order: 20 });
          // Balance line so sum equals totalPayable when fees alone don't
          const feeSum = lines.reduce((s, l) => s + l.amount, 0);
          if (ob.totalPayable != null && Math.abs(feeSum - Number(ob.totalPayable)) > 0.01) {
            lines.push({
              label: "Adjustments / Already Paid / Deductions",
              amount: Number(ob.totalPayable) - feeSum,
              sort_order: 90,
            });
          }
          if (lines.length === 0 && ob.totalPayable != null) {
            lines.push({ label: "Total Payable for Current Term", amount: Number(ob.totalPayable), sort_order: 10 });
          }
          if (lines.length) {
            await supabase.from("invoice_line_items").insert(
              lines.map((l) => ({ ...l, invoice_id: inv.id })),
            );
          }
          invCount++;
        }
      }
    }
  }

  console.log(`Merchants: ${mCount}, new leases: ${leaseCount}, invoices: ${invCount}`);
  return merchantIdMap;
}

async function importPdfs(merchantIdMap) {
  const docsRoot = join(PROTO, "public", "merchant_docs");
  if (!existsSync(docsRoot)) {
    console.warn("No merchant_docs folder");
    return;
  }

  const merchantsById = new Map(asList(loadJson("data/merchants.json")).map((m) => [m.id, m]));

  // Checklist: do not archive unsigned 054 — skip filenames containing Unsigned
  let uploaded = 0;
  let skipped = 0;

  for (const [protoId, merchantUuid] of merchantIdMap) {
    const dir = join(docsRoot, protoId);
    if (!existsSync(dir)) continue;
    const files = readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".pdf"));
    for (const file of files) {
      if (/unsigned/i.test(file)) {
        skipped++;
        continue;
      }
      const m = merchantsById.get(protoId);
      const meta = m?.signedDocuments?.find((d) => d.id === file);
      const displayName = meta?.name || file;
      if (/unsigned/i.test(displayName)) {
        skipped++;
        continue;
      }

      const storagePath = `${merchantUuid}/${file}`;
      if (DRY) {
        uploaded++;
        continue;
      }

      const buf = readFileSync(join(dir, file));
      const { error: upErr } = await supabase.storage.from("documents").upload(storagePath, buf, {
        contentType: "application/pdf",
        upsert: true,
      });
      if (upErr) {
        console.warn("pdf upload", protoId, file, upErr.message);
        continue;
      }

      const docType = /确认|confirmation|租期/i.test(displayName)
        ? "confirmation_letter"
        : /billing|fee|缴费|notice/i.test(displayName)
          ? "fee_notice"
          : "other";

      const { data: existing } = await supabase
        .from("documents")
        .select("id")
        .eq("merchant_id", merchantUuid)
        .eq("file_path", storagePath)
        .maybeSingle();

      if (!existing) {
        await supabase.from("documents").insert({
          merchant_id: merchantUuid,
          file_path: storagePath,
          name: displayName,
          doc_type: docType,
        });
      }
      uploaded++;
    }
  }

  console.log(`PDFs uploaded: ${uploaded}, skipped unsigned: ${skipped}`);
}

async function main() {
  console.log(DRY ? "=== DRY RUN ===" : "=== LIVE MIGRATION ===");
  const { floor1 } = await ensureFloors();
  if (!floor1) throw new Error("No 1F floor found — seed floor first");
  console.log("Floor 1F:", floor1.id, floor1.label);

  if (ONLY_PDFS) {
    // Rebuild merchant map from notes
    const { data: all } = await supabase.from("merchants").select("id, notes");
    const map = new Map();
    for (const m of all ?? []) {
      const match = m.notes?.match(/proto_id=(MCH-\d+)/);
      if (match) map.set(match[1], m.id);
    }
    if (!SKIP_PDFS) await importPdfs(map);
    return;
  }

  const unitByCode = await importUnits(floor1);
  const merchantIdMap = await importMerchants(unitByCode);
  if (!SKIP_PDFS) await importPdfs(merchantIdMap);

  // Spot-check Yang Maolan
  if (!DRY) {
    const { data: ym } = await supabase
      .from("merchants")
      .select("id, name, leases(id, units(code), invoices(period_start, period_end, invoice_line_items(amount)))")
      .ilike("name", "%杨茂兰%")
      .maybeSingle();
    console.log("Spot-check Yang Maolan:", JSON.stringify(ym, null, 2)?.slice(0, 800));
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
