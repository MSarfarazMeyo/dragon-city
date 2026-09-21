import { createClient } from "@/lib/supabase/server";
import { CreateInvoiceDialog } from "@/components/finance/create-invoice-dialog";
import { FinanceBoard, type FinanceInvoiceRow } from "@/components/finance/finance-board";

export default async function FinancePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();

  const { data: activeLeases } = await supabase
    .from("leases")
    .select("id, is_locked, units(code), merchants(name)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const { data: invoices } = await supabase
    .from("invoices")
    .select(
      "id, period_start, period_end, due_date, status, paid_at, created_at, lease_id, leases(is_locked, units(code), merchants(name)), invoice_line_items(label, amount, sort_order), payments(id, amount, method, paid_at)",
    )
    .order("due_date", { ascending: false });

  const { data: templates } = await supabase
    .from("invoice_line_templates")
    .select("code, label, is_deduction, sort_order")
    .order("sort_order");

  const leaseOptions = (activeLeases ?? []).map((l) => ({
    id: l.id,
    unit_code: l.units?.code ?? "?",
    merchant_name: l.merchants?.name ?? "?",
  }));

  const rows: FinanceInvoiceRow[] = (invoices ?? []).map((inv) => ({
    id: inv.id,
    lease_id: inv.lease_id,
    period_start: inv.period_start,
    period_end: inv.period_end,
    due_date: inv.due_date,
    status: inv.status,
    paid_at: inv.paid_at,
    created_at: inv.created_at,
    unit_code: inv.leases?.units?.code ?? "?",
    merchant_name: inv.leases?.merchants?.name ?? "?",
    is_locked: inv.leases?.is_locked ?? false,
    line_items: inv.invoice_line_items ?? [],
    payments: inv.payments ?? [],
  }));

  const today = new Date().toISOString().slice(0, 10);
  const canDelete = profile?.role === "admin" || profile?.role === "finance";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Click an invoice for line items, payments, lock confirmation, and delete.
          </p>
        </div>
        <CreateInvoiceDialog leases={leaseOptions} templates={templates ?? []} />
      </div>

      <FinanceBoard invoices={rows} today={today} canDelete={canDelete} />
    </div>
  );
}
