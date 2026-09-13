"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FinanceFormState = { error?: string } | null;

type LineItemInput = { label: string; amount: number };

export async function createInvoice(
  _prevState: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const supabase = await createClient();

  const lease_id = String(formData.get("lease_id") ?? "");
  const period_start = String(formData.get("period_start") ?? "");
  const period_end = String(formData.get("period_end") ?? "");
  const due_date = String(formData.get("due_date") ?? "");

  let lineItems: LineItemInput[] = [];
  try {
    lineItems = JSON.parse(String(formData.get("line_items") ?? "[]"));
  } catch {
    return { error: "Invalid line items." };
  }

  if (!lease_id || !period_start || !period_end || !due_date) {
    return { error: "Missing lease or dates." };
  }
  if (lineItems.length === 0) {
    return { error: "Add at least one line item." };
  }

  // Carry forward any unpaid balance from this lease's most recent
  // pending invoice — the same "历史欠款" line every real confirmation
  // letter carries, computed automatically instead of typed in by hand.
  const { data: priorInvoices } = await supabase
    .from("invoices")
    .select("id, period_end, invoice_line_items(amount), payments(amount)")
    .eq("lease_id", lease_id)
    .eq("status", "pending")
    .order("period_end", { ascending: false })
    .limit(1);

  const prior = priorInvoices?.[0];
  const priorBalance = prior
    ? prior.invoice_line_items.reduce((s, li) => s + li.amount, 0) -
      prior.payments.reduce((s, p) => s + p.amount, 0)
    : 0;

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({ lease_id, period_start, period_end, due_date })
    .select("id")
    .single();

  if (invoiceError || !invoice) {
    return { error: invoiceError?.message ?? "Could not create the invoice." };
  }

  const rows = lineItems.map((li, i) => ({
    invoice_id: invoice.id,
    label: li.label,
    amount: li.amount,
    sort_order: i,
  }));

  if (priorBalance !== 0) {
    rows.push({
      invoice_id: invoice.id,
      label: `Carried arrears from ${prior!.period_end}`,
      amount: priorBalance,
      sort_order: rows.length,
    });
  }

  const { error: lineError } = await supabase.from("invoice_line_items").insert(rows);
  if (lineError) {
    return { error: lineError.message };
  }

  revalidatePath("/finance");
  revalidatePath("/map");
  return null;
}

export async function recordPayment(
  _prevState: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const supabase = await createClient();

  const invoice_id = String(formData.get("invoice_id") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const method = String(formData.get("method") ?? "").trim() || null;

  if (!invoice_id || !amount) {
    return { error: "Missing invoice or amount." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: paymentError } = await supabase.from("payments").insert({
    invoice_id,
    amount,
    method,
    recorded_by: user?.id,
  });

  if (paymentError) return { error: paymentError.message };

  const { data: invoice } = await supabase
    .from("invoices")
    .select("invoice_line_items(amount), payments(amount)")
    .eq("id", invoice_id)
    .single();

  if (invoice) {
    const total = invoice.invoice_line_items.reduce((s, li) => s + li.amount, 0);
    const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
    if (paid >= total) {
      await supabase
        .from("invoices")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", invoice_id);
    }
  }

  revalidatePath("/finance");
  revalidatePath("/map");
  return null;
}

export async function toggleLock(leaseId: string, locked: boolean) {
  const supabase = await createClient();
  await supabase.from("leases").update({ is_locked: locked }).eq("id", leaseId);
  revalidatePath("/finance");
  revalidatePath("/map");
}

export async function uploadDocument(
  _prevState: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const supabase = await createClient();

  const merchant_id = String(formData.get("merchant_id") ?? "");
  const file = formData.get("file") as File | null;

  if (!merchant_id || !file || file.size === 0) {
    return { error: "Pick a merchant and a file." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = `${merchant_id}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("documents").upload(path, file);
  if (uploadError) return { error: uploadError.message };

  const { error: docError } = await supabase.from("documents").insert({
    merchant_id,
    file_path: path,
    name: file.name,
    uploaded_by: user?.id,
  });
  if (docError) return { error: docError.message };

  revalidatePath("/finance");
  return null;
}
