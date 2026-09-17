"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AddMerchantState = { error?: string } | null;

export async function addMerchant(
  _prevState: AddMerchantState,
  formData: FormData,
): Promise<AddMerchantState> {
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "individual");
  const cr_number = String(formData.get("cr_number") ?? "").trim() || null;
  const contact_name = String(formData.get("contact_name") ?? "").trim() || null;
  const contact_phone = String(formData.get("contact_phone") ?? "").trim() || null;
  const contact_email = String(formData.get("contact_email") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name) {
    return { error: "Merchant name is required." };
  }

  const { error } = await supabase.from("merchants").insert({
    name,
    type,
    cr_number,
    contact_name,
    contact_phone,
    contact_email,
    notes,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/merchants");
  return null;
}

export type ImportMerchantsState = { error?: string; imported?: number } | null;

export async function importMerchants(
  _prevState: ImportMerchantsState,
  formData: FormData,
): Promise<ImportMerchantsState> {
  const supabase = await createClient();
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) {
    return { error: "Choose a CSV file." };
  }

  const text = await file.text();
  const lines = text
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { error: "CSV is empty." };
  }

  const rows: { name: string; type: string; contact_phone: string | null }[] = [];
  let start = 0;
  const first = lines[0].toLowerCase();
  if (first.startsWith("name") || first.includes("phone")) start = 1;

  for (let i = start; i < lines.length; i++) {
    const parts = parseCsvLine(lines[i]);
    const name = (parts[0] ?? "").trim();
    if (!name) continue;
    const type = (parts[1] ?? "individual").trim() || "individual";
    const phone = (parts[2] ?? "").trim() || null;
    rows.push({
      name,
      type: type === "company" ? "company" : "individual",
      contact_phone: phone,
    });
  }

  if (rows.length === 0) {
    return { error: "No valid rows found. Expected: name, type, phone." };
  }

  const { error } = await supabase.from("merchants").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/merchants");
  return { imported: rows.length };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else current += ch;
  }
  result.push(current);
  return result;
}
