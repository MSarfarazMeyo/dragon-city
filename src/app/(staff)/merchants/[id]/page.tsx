import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { DownloadDocumentButton } from "@/components/finance/download-document-button";
import { DOC_TYPE_LABEL, type DocType } from "@/lib/doc-types";
import { cn } from "@/lib/utils";

export default async function MerchantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, name, type, cr_number, contact_name, contact_phone, contact_email, notes, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!merchant) notFound();

  const { data: leases } = await supabase
    .from("leases")
    .select("id, start_date, end_date, status, is_locked, rent_amount, service_fee, units(code)")
    .eq("merchant_id", id)
    .order("start_date", { ascending: false });

  const { data: documents } = await supabase
    .from("documents")
    .select("id, name, file_path, doc_type, created_at")
    .eq("merchant_id", id)
    .order("created_at", { ascending: false });

  const leaseIds = (leases ?? []).map((l) => l.id);
  const { data: invoices } =
    leaseIds.length > 0
      ? await supabase
          .from("invoices")
          .select(
            "id, period_start, period_end, due_date, status, lease_id, invoice_line_items(amount), payments(amount)",
          )
          .in("lease_id", leaseIds)
          .order("due_date", { ascending: false })
      : { data: [] };

  const today = new Date().toISOString().slice(0, 10);
  const activeLeases = (leases ?? []).filter((l) => l.status === "active");
  const historyLeases = (leases ?? []).filter((l) => l.status !== "active");

  let totalInvoiced = 0;
  let totalOutstanding = 0;
  for (const inv of invoices ?? []) {
    const total = inv.invoice_line_items.reduce((s, li) => s + li.amount, 0);
    const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
    totalInvoiced += total;
    if (inv.status === "pending") totalOutstanding += total - paid;
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/merchants" className="text-sm text-muted-foreground hover:text-foreground">
          ← Merchants
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{merchant.name}</h1>
        <p className="text-muted-foreground text-sm capitalize">{merchant.type}</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="Contact" value={merchant.contact_name ?? "—"} />
        <InfoCard label="Phone" value={merchant.contact_phone ?? "—"} />
        <InfoCard label="Email" value={merchant.contact_email ?? "—"} />
        <InfoCard label="CR number" value={merchant.cr_number ?? "—"} />
      </section>

      {merchant.notes && (
        <p className="rounded-lg border px-4 py-3 text-sm text-muted-foreground">{merchant.notes}</p>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Active leases</h2>
        {activeLeases.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active leases.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="px-4 py-2 font-medium">Unit</th>
                  <th className="px-4 py-2 font-medium">Period</th>
                  <th className="px-4 py-2 font-medium text-right">Rent</th>
                  <th className="px-4 py-2 font-medium">Locked</th>
                </tr>
              </thead>
              <tbody>
                {activeLeases.map((l) => (
                  <tr key={l.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">{l.units?.code ?? "?"}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {l.start_date} → {l.end_date ?? "open"}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{l.rent_amount?.toFixed(2) ?? "—"}</td>
                    <td className="px-4 py-2">{l.is_locked ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {historyLeases.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Lease history</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="px-4 py-2 font-medium">Unit</th>
                  <th className="px-4 py-2 font-medium">Period</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {historyLeases.map((l) => (
                  <tr key={l.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">{l.units?.code ?? "?"}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {l.start_date} → {l.end_date ?? "—"}
                    </td>
                    <td className="px-4 py-2 capitalize">{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Invoices summary</h2>
        <div className="flex flex-wrap gap-3">
          <SummaryStat label="Total invoiced" value={totalInvoiced.toFixed(2)} />
          <SummaryStat label="Outstanding" value={totalOutstanding.toFixed(2)} />
          <SummaryStat label="Invoice count" value={invoices?.length ?? 0} />
        </div>
        {(invoices?.length ?? 0) > 0 && (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="px-4 py-2 font-medium">Period</th>
                  <th className="px-4 py-2 font-medium">Due</th>
                  <th className="px-4 py-2 font-medium text-right">Total</th>
                  <th className="px-4 py-2 font-medium text-right">Balance</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices!.map((inv) => {
                  const total = inv.invoice_line_items.reduce((s, li) => s + li.amount, 0);
                  const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
                  const balance = total - paid;
                  const overdue = inv.status === "pending" && inv.due_date < today;
                  return (
                    <tr key={inv.id} className="border-b last:border-0">
                      <td className="px-4 py-2 text-muted-foreground">
                        {inv.period_start} → {inv.period_end}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{inv.due_date}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{total.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{balance.toFixed(2)}</td>
                      <td className="px-4 py-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            inv.status === "paid" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                            inv.status === "pending" && !overdue && "bg-sky-500/10 text-sky-700 dark:text-sky-400",
                            overdue && "bg-rose-500/10 text-rose-700 dark:text-rose-400",
                          )}
                        >
                          {overdue ? "Overdue" : inv.status === "paid" ? "Paid" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Documents</h2>
        {!documents || documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents on file.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <div>
                  <div className="font-medium">{doc.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {DOC_TYPE_LABEL[doc.doc_type as DocType] ?? doc.doc_type} ·{" "}
                    {new Date(doc.created_at).toLocaleDateString()}
                  </div>
                </div>
                <DownloadDocumentButton filePath={doc.file_path} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border px-4 py-3">
      <div className="text-xs tracking-wide text-muted-foreground uppercase">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border px-4 py-2">
      <div className="text-xs tracking-wide text-muted-foreground uppercase">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
