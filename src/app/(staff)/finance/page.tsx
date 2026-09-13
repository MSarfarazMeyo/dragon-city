import { createClient } from "@/lib/supabase/server";
import { CreateInvoiceDialog } from "@/components/finance/create-invoice-dialog";
import { RecordPaymentDialog } from "@/components/finance/record-payment-dialog";
import { LockToggleButton } from "@/components/finance/lock-toggle-button";
import { UploadDocumentDialog } from "@/components/finance/upload-document-dialog";
import { DownloadDocumentButton } from "@/components/finance/download-document-button";
import { cn } from "@/lib/utils";

export default async function FinancePage() {
  const supabase = await createClient();

  const { data: activeLeases } = await supabase
    .from("leases")
    .select("id, is_locked, units(code), merchants(name)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const { data: invoices } = await supabase
    .from("invoices")
    .select(
      "id, period_start, period_end, due_date, status, lease_id, leases(is_locked, units(code), merchants(name)), invoice_line_items(amount), payments(amount)",
    )
    .order("due_date", { ascending: false });

  const { data: merchants } = await supabase.from("merchants").select("id, name").order("name");

  const { data: documents } = await supabase
    .from("documents")
    .select("id, name, file_path, created_at, merchants(name)")
    .order("created_at", { ascending: false });

  const leaseOptions = (activeLeases ?? []).map((l) => ({
    id: l.id,
    unit_code: l.units?.code ?? "?",
    merchant_name: l.merchants?.name ?? "?",
  }));

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Finance</h1>
          <p className="text-muted-foreground text-sm">Itemized invoices, payments, and overdue/lock — never a flat number.</p>
        </div>
        <CreateInvoiceDialog leases={leaseOptions} />
      </div>

      {!invoices || invoices.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          No invoices yet. Click <span className="font-medium text-foreground">Create invoice</span> to bill an active lease.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="px-4 py-2 font-medium">Shop</th>
                <th className="px-4 py-2 font-medium">Merchant</th>
                <th className="px-4 py-2 font-medium">Period</th>
                <th className="px-4 py-2 font-medium">Due</th>
                <th className="px-4 py-2 font-medium text-right">Total</th>
                <th className="px-4 py-2 font-medium text-right">Balance</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const total = inv.invoice_line_items.reduce((s, li) => s + li.amount, 0);
                const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
                const balance = total - paid;
                const overdue = inv.status === "pending" && inv.due_date < today;

                return (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">{inv.leases?.units?.code ?? "?"}</td>
                    <td className="px-4 py-2">{inv.leases?.merchants?.name ?? "?"}</td>
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
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-2">
                        {balance > 0 && <RecordPaymentDialog invoiceId={inv.id} balance={balance} />}
                        {(overdue || inv.leases?.is_locked) && (
                          <LockToggleButton leaseId={inv.lease_id} locked={inv.leases?.is_locked ?? false} />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Documents</h2>
          <UploadDocumentDialog merchants={merchants ?? []} />
        </div>

        {!documents || documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <div>
                  <div className="font-medium">{doc.name}</div>
                  <div className="text-muted-foreground text-xs">{doc.merchants?.name ?? "Unknown merchant"}</div>
                </div>
                <DownloadDocumentButton filePath={doc.file_path} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
