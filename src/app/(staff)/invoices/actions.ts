"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyMerchant } from "@/lib/notify";

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

  // Immediate email — the cron route only reaches invoices as they
  // approach/pass due_date (invoice_due rule); this is the "notify at
  // creation" trigger that was missing.
  const { data: lease } = await supabase.from("leases").select("merchant_id, units(code)").eq("id", lease_id).single();
  if (lease?.merchant_id) {
    const unitCode = lease.units?.code ?? "your shop";
    await notifyMerchant(lease.merchant_id, {
      event: "invoice_created",
      title: `New invoice for ${unitCode}`,
      vars: { unit_code: unitCode, due_date },
      fallbackBody: `A new invoice has been issued for ${unitCode}, due ${due_date}.`,
    });
  }

  revalidatePath("/invoices");
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
    .select("invoice_line_items(amount), payments(amount), leases(merchant_id, units(code))")
    .eq("id", invoice_id)
    .single();

  if (invoice?.leases?.merchant_id) {
    const unitCode = invoice.leases.units?.code ?? "your shop";
    await notifyMerchant(invoice.leases.merchant_id, {
      event: "payment_recorded",
      title: `Payment received for ${unitCode}`,
      vars: { unit_code: unitCode, amount: amount.toFixed(2) },
      fallbackBody: `A payment of ${amount.toFixed(2)} was recorded for ${unitCode}.`,
    });
  }

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

  revalidatePath("/invoices");
  revalidatePath("/map");
  return null;
}

export async function toggleLock(leaseId: string, locked: boolean) {
  const supabase = await createClient();
  await supabase.from("leases").update({ is_locked: locked }).eq("id", leaseId);
  revalidatePath("/invoices");
  revalidatePath("/map");
}

export async function deleteInvoice(invoiceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "finance") {
    return { error: "Only finance or admin can delete invoices." };
  }

  // Payments and line items cascade / need manual cleanup
  await supabase.from("payments").delete().eq("invoice_id", invoiceId);
  await supabase.from("invoice_line_items").delete().eq("invoice_id", invoiceId);
  const { error } = await supabase.from("invoices").delete().eq("id", invoiceId);
  if (error) return { error: error.message };

  revalidatePath("/invoices");
  revalidatePath("/map");
  return null;
}

export async function uploadDocument(
  _prevState: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  const supabase = await createClient();

  const merchant_id = String(formData.get("merchant_id") ?? "");
  const doc_type = String(formData.get("doc_type") ?? "other");
  const file = formData.get("file") as File | null;

  if (!merchant_id || !file || file.size === 0) {
    return { error: "Pick a merchant and a file." };
  }

  const allowedDocTypes = [
    "confirmation_letter",
    "fee_notice",
    "cr",
    "iqama",
    "contract",
    "other",
  ];
  if (!allowedDocTypes.includes(doc_type)) {
    return { error: "Invalid document type." };
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
    doc_type,
    uploaded_by: user?.id,
  });
  if (docError) return { error: docError.message };

  revalidatePath("/invoices");
  return null;
}
