import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, CircleDollarSign, Wallet } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { DeleteInvoiceButton } from "@/components/finance/delete-invoice-button";
import { LockToggleButton } from "@/components/finance/lock-toggle-button";
import { RecordPaymentDialog } from "@/components/finance/record-payment-dialog";
import { ResendInvoiceEmail } from "@/components/finance/resend-invoice-email";
import { StatCard, StatCardRow } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

type ActivityEntry = {
  id: string;
  action: "insert" | "update" | "delete";
  diff: Record<string, [unknown, unknown]> | null;
  created_at: string;
  label: string;
  actor: { full_name: string | null; role: string | null } | null;
};

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select(
      "id, period_start, period_end, due_date, status, paid_at, lease_id, leases(id, is_locked, units(id, code), merchants(id, name)), invoice_line_items(id, label, amount, sort_order), payments(id, amount, method, paid_at, recorded_by)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!invoice) notFound();

  const lease = invoice.leases;
  const unit = lease?.units ?? null;
  const merchant = lease?.merchants ?? null;

  // payments.recorded_by references auth.users, not profiles directly,
  // so it can't be embedded in the select above — fetch names separately.
  const recorderIds = [...new Set(invoice.payments.map((p) => p.recorded_by).filter((v): v is string => Boolean(v)))];
  const { data: recorders } =
    recorderIds.length > 0
      ? await supabase.from("profiles").select("id, full_name, role").in("id", recorderIds)
      : { data: [] };
  const recorderById = new Map((recorders ?? []).map((r) => [r.id, r]));

  const lineItems = [...invoice.invoice_line_items].sort((a, b) => a.sort_order - b.sort_order);
  const total = lineItems.reduce((s, li) => s + li.amount, 0);
  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  const balance = total - paid;
  const today = new Date().toISOString().slice(0, 10);
  const overdue = invoice.status === "pending" && invoice.due_date < today;

  const paymentIds = invoice.payments.map((p) => p.id);
  const { data: auditRows } = await supabase
    .from("audit_log")
    .select("id, entity_type, entity_id, action, diff, created_at, profiles(full_name, role)")
    .or(
      `and(entity_type.eq.invoices,entity_id.eq.${id})${paymentIds.length > 0 ? `,and(entity_type.eq.payments,entity_id.in.(${paymentIds.join(",")}))` : ""}`,
    )
    .order("created_at", { ascending: false });

  const activity: ActivityEntry[] = (auditRows ?? []).map((row) => ({
    id: row.id,
    action: row.action as ActivityEntry["action"],
    diff: row.diff as ActivityEntry["diff"],
    created_at: row.created_at,
    actor: row.profiles,
    label: row.entity_type === "payments" ? "recorded a payment" : describeInvoiceDiff(row.action, row.diff as ActivityEntry["diff"]),
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/invoices" className="text-sm text-muted-foreground hover:text-foreground">
          ← Invoices
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {invoice.period_start} → {invoice.period_end}
          </h1>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium",
              invoice.status === "paid" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
              invoice.status === "pending" && !overdue && "bg-sky-500/10 text-sky-700 dark:text-sky-400",
              overdue && "bg-rose-500/10 text-rose-700 dark:text-rose-400",
            )}
          >
            {overdue ? "Overdue" : invoice.status === "paid" ? "Paid" : "Pending"}
          </span>
        </div>
        <p className="text-muted-foreground text-sm">
          {unit && (
            <Link href={`/map/units/${unit.id}`} className="hover:underline">
              {unit.code}
            </Link>
          )}
          {unit && merchant && " · "}
          {merchant && (
            <Link href={`/merchants/${merchant.id}`} className="hover:underline">
              {merchant.name}
            </Link>
          )}
        </p>
      </div>

      <StatCardRow>
        <StatCard label="Total" value={`SAR ${total.toFixed(2)}`} icon={CircleDollarSign} tone="sky" />
        <StatCard label="Paid" value={`SAR ${paid.toFixed(2)}`} icon={Wallet} tone={paid > 0 ? "teal" : "neutral"} />
        <StatCard label="Balance" value={`SAR ${balance.toFixed(2)}`} icon={Wallet} tone={balance > 0 ? "amber" : "neutral"} />
        <StatCard label="Due" value={invoice.due_date} icon={CalendarClock} tone={overdue ? "rose" : "neutral"} />
      </StatCardRow>

      <div className="flex flex-wrap items-center gap-2">
        {invoice.status === "pending" && <RecordPaymentDialog invoiceId={invoice.id} balance={balance} />}
        {lease && <LockToggleButton leaseId={lease.id} locked={lease.is_locked} />}
        <ResendInvoiceEmail invoiceId={invoice.id} />
        <DeleteInvoiceButton invoiceId={invoice.id} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border">
          <div className="border-b bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Line items
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {lineItems.map((li) => (
                <tr key={li.id} className="border-b last:border-0">
                  <td className="px-4 py-2">{li.label}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{li.amount.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="font-medium">
                <td className="px-4 py-2">Total</td>
                <td className="px-4 py-2 text-right tabular-nums">{total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>

        <div className="rounded-lg border">
          <div className="border-b bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Payments
          </div>
          {invoice.payments.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {invoice.payments.map((p) => {
                  const recorder = p.recorded_by ? recorderById.get(p.recorded_by) : null;
                  return (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="px-4 py-2">
                        {p.method ?? "—"}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {recorder?.full_name ?? recorder?.role ?? "Unknown"} · {new Date(p.paid_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">{p.amount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Activity</div>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No changes recorded yet.</p>
        ) : (
          <ol className="space-y-2">
            {activity.map((entry) => (
              <li key={entry.id} className="text-sm">
                <span className="font-medium">{entry.actor?.full_name ?? entry.actor?.role ?? "System"}</span>{" "}
                <span className="text-muted-foreground">
                  {entry.label} · {new Date(entry.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function describeInvoiceDiff(action: string, diff: Record<string, [unknown, unknown]> | null) {
  if (action === "insert") return "created this invoice";
  if (!diff) return "made a change";
  const parts = Object.entries(diff).map(([field, [, next]]) => `${field.replace(/_/g, " ")} → ${next ?? "—"}`);
  return parts.length > 0 ? `changed ${parts.join(", ")}` : "made a change";
}
