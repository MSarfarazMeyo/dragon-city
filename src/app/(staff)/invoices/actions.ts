"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyMerchant } from "@/lib/notify";
import { sendEmail } from "@/lib/email";
import { renderInvoiceEmail, renderLeaseEmail } from "@/lib/email-templates";

export type FinanceFormState = { error?: string } | null;
export type ResendEmailState = { error?: string; sent?: boolean } | null;

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
  const { data: lease } = await supabase
    .from("leases")
    .select("merchant_id, units(code), merchants(name)")
    .eq("id", lease_id)
    .single();
  if (lease?.merchant_id) {
    const unitCode = lease.units?.code ?? "your shop";
    const total = rows.reduce((s, r) => s + r.amount, 0);
    await notifyMerchant(lease.merchant_id, {
      event: "invoice_created",
      title: `New invoice for ${unitCode}`,
      vars: { unit_code: unitCode, due_date },
      fallbackBody: `A new invoice has been issued for ${unitCode}, due ${due_date}.`,
      html: renderInvoiceEmail({
        headline: "New invoice issued",
        introText: `A new invoice has been issued for your shop. Please review the details below and settle it by the due date.`,
        merchantName: lease.merchants?.name ?? "Merchant",
        unitCode,
        periodStart: period_start,
        periodEnd: period_end,
        dueDate: due_date,
        totalAmount: total,
        status: "pending",
      }),
    });
  }

  revalidatePath("/invoices");
  revalidatePath("/map");
  return null;
}

// Manual re-send, separate from the automatic trigger in createInvoice —
// for "the merchant says they never got it" / "also cc our contact at
// the company" situations. Always notifies the merchant's own portal
// login (in-app + email, same as at creation) when one exists, and can
// additionally reach one more address that isn't tracked as a user —
// so that address only gets the plain email, never an in-app row.
export async function resendInvoiceEmail(
  _prevState: ResendEmailState,
  formData: FormData,
): Promise<ResendEmailState> {
  const supabase = await createClient();

  const invoice_id = String(formData.get("invoice_id") ?? "");
  const extraEmail = String(formData.get("extra_email") ?? "").trim();

  if (!invoice_id) return { error: "Missing invoice." };

  const { data: invoice } = await supabase
    .from("invoices")
    .select(
      "due_date, period_start, period_end, status, leases(merchant_id, units(code), merchants(name)), invoice_line_items(amount), payments(amount)",
    )
    .eq("id", invoice_id)
    .single();

  if (!invoice?.leases?.merchant_id) {
    return { error: "Could not find the merchant for this invoice." };
  }

  const unitCode = invoice.leases.units?.code ?? "your shop";
  const merchantName = invoice.leases.merchants?.name ?? "Merchant";
  const title = `Invoice for ${unitCode}`;
  const fallbackBody = `A new invoice has been issued for ${unitCode}, due ${invoice.due_date}.`;
  const total = invoice.invoice_line_items.reduce((s, li) => s + li.amount, 0);
  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);

  const html = renderInvoiceEmail({
    headline: "Invoice — resent",
    introText: `Here's a copy of your invoice for your shop, sent again on request.`,
    merchantName,
    unitCode,
    periodStart: invoice.period_start,
    periodEnd: invoice.period_end,
    dueDate: invoice.due_date,
    totalAmount: total,
    paidAmount: paid,
    balance: total - paid,
    status: invoice.status,
  });

  await notifyMerchant(invoice.leases.merchant_id, {
    event: "invoice_created",
    title,
    vars: { unit_code: unitCode, due_date: invoice.due_date },
    fallbackBody,
    html,
  });

  if (extraEmail) {
    const sent = await sendEmail(extraEmail, title, fallbackBody, html);
    if (!sent) return { error: "Sent to the merchant, but the extra email could not be delivered (SMTP not configured)." };
  }

  return { sent: true };
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
    .select(
      "due_date, period_start, period_end, status, invoice_line_items(amount), payments(amount), leases(merchant_id, units(code), merchants(name))",
    )
    .eq("id", invoice_id)
    .single();

  const total = invoice ? invoice.invoice_line_items.reduce((s, li) => s + li.amount, 0) : 0;
  const paid = invoice ? invoice.payments.reduce((s, p) => s + p.amount, 0) : 0;

  if (invoice?.leases?.merchant_id) {
    const unitCode = invoice.leases.units?.code ?? "your shop";
    await notifyMerchant(invoice.leases.merchant_id, {
      event: "payment_recorded",
      title: `Payment received for ${unitCode}`,
      vars: { unit_code: unitCode, amount: amount.toFixed(2) },
      fallbackBody: `A payment of ${amount.toFixed(2)} was recorded for ${unitCode}.`,
      html: renderInvoiceEmail({
        headline: paid >= total ? "Invoice paid in full" : "Payment received",
        introText:
          paid >= total
            ? `We've recorded a payment of ${amount.toFixed(2)} SAR, settling this invoice in full. Thank you.`
            : `We've recorded a payment of ${amount.toFixed(2)} SAR against your invoice. Thank you.`,
        merchantName: invoice.leases.merchants?.name ?? "Merchant",
        unitCode,
        periodStart: invoice.period_start,
        periodEnd: invoice.period_end,
        dueDate: invoice.due_date,
        totalAmount: total,
        paidAmount: paid,
        balance: total - paid,
        status: paid >= total ? "paid" : invoice.status,
      }),
    });
  }

  if (invoice) {
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

  const { data: lease } = await supabase
    .from("leases")
    .select("merchant_id, units(code), merchants(name)")
    .eq("id", leaseId)
    .single();

  if (lease?.merchant_id) {
    const unitCode = lease.units?.code ?? "your shop";
    await notifyMerchant(lease.merchant_id, {
      event: "lease_lock_changed",
      title: locked ? `Lease locked for ${unitCode}` : `Lease unlocked for ${unitCode}`,
      vars: { unit_code: unitCode },
      fallbackBody: locked
        ? `Your lease for ${unitCode} has been locked pending outstanding dues.`
        : `Your lease for ${unitCode} has been unlocked.`,
      html: renderLeaseEmail({
        headline: locked ? "Lease locked" : "Lease unlocked",
        introText: locked
          ? "Your lease has been locked in the portal, usually pending an outstanding balance. Contact finance if you have questions."
          : "Your lease has been unlocked and the portal is back to normal.",
        merchantName: lease.merchants?.name ?? "Merchant",
        unitCode,
        status: locked ? "locked" : "unlocked",
      }),
    });
  }

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
