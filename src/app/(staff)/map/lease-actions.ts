"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type LeaseFormState = { error?: string } | null;

export async function getUnitHistory(unitId: string) {
  const supabase = await createClient();

  const { data: leases } = await supabase
    .from("leases")
    .select(
      "id, start_date, end_date, status, billing_status, rent_amount, deposit, service_fee, service_contract_no, cooperation_contract_no, merchants(id, name)",
    )
    .eq("unit_id", unitId)
    .order("start_date", { ascending: false });

  return leases ?? [];
}

export async function createLease(
  _prevState: LeaseFormState,
  formData: FormData,
): Promise<LeaseFormState> {
  const supabase = await createClient();

  const unit_id = String(formData.get("unit_id") ?? "");
  const existingMerchantId = String(formData.get("merchant_id") ?? "");
  const newMerchantName = String(formData.get("new_merchant_name") ?? "").trim();

  const start_date = String(formData.get("start_date") ?? "");
  const end_date = String(formData.get("end_date") ?? "") || null;
  const rent_amount = numOrNull(formData.get("rent_amount"));
  const deposit = numOrNull(formData.get("deposit"));
  const service_fee = numOrNull(formData.get("service_fee"));
  const service_contract_no = String(formData.get("service_contract_no") ?? "").trim() || null;
  const cooperation_contract_no = String(formData.get("cooperation_contract_no") ?? "").trim() || null;
  const billing_status = String(formData.get("billing_status") ?? "active");

  if (!unit_id || !start_date) {
    return { error: "Missing shop or start date." };
  }
  if (!existingMerchantId && !newMerchantName) {
    return { error: "Pick a merchant or enter a name for a new one." };
  }

  let merchantId = existingMerchantId;

  if (!merchantId) {
    const { data: newMerchant, error: merchantError } = await supabase
      .from("merchants")
      .insert({ name: newMerchantName })
      .select("id")
      .single();

    if (merchantError || !newMerchant) {
      return { error: merchantError?.message ?? "Could not create the merchant." };
    }
    merchantId = newMerchant.id;
  }

  const { error } = await supabase.from("leases").insert({
    unit_id,
    merchant_id: merchantId,
    start_date,
    end_date,
    rent_amount,
    deposit,
    service_fee,
    service_contract_no,
    cooperation_contract_no,
    billing_status,
  });

  if (error) {
    return {
      error: error.code === "23505" ? "This shop already has an active lease." : error.message,
    };
  }

  revalidatePath("/map");
  return null;
}

export async function vacateLease(
  _prevState: LeaseFormState,
  formData: FormData,
): Promise<LeaseFormState> {
  const supabase = await createClient();
  const lease_id = String(formData.get("lease_id") ?? "");

  if (!lease_id) return { error: "Missing lease." };

  const { error } = await supabase
    .from("leases")
    .update({ status: "terminated", end_date: new Date().toISOString().slice(0, 10) })
    .eq("id", lease_id);

  if (error) return { error: error.message };

  revalidatePath("/map");
  return null;
}

function numOrNull(value: FormDataEntryValue | null) {
  const s = String(value ?? "").trim();
  return s ? Number(s) : null;
}
