import { createClient } from "@/lib/supabase/server";
import { SubmitTicketDialog } from "@/components/portal/submit-ticket-dialog";
import { cn } from "@/lib/utils";

export default async function PortalPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("merchant_id, merchants(name)")
    .eq("id", user!.id)
    .single();

  const { data: leases } = await supabase
    .from("leases")
    .select(
      "id, start_date, end_date, billing_status, units(id, code), invoices(id, period_start, period_end, due_date, status, invoice_line_items(label, amount), payments(amount))",
    )
    .eq("merchant_id", profile?.merchant_id ?? "")
    .eq("status", "active");

  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, type, department, status, created_at, units(code)")
    .order("created_at", { ascending: false });

  const units = (leases ?? []).map((l) => ({ id: l.units!.id, code: l.units!.code }));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{profile?.merchants?.name ?? "My Shop"}</h1>
          <p className="text-muted-foreground text-sm">Your shops, dues, and support requests.</p>
        </div>
        <SubmitTicketDialog units={units} />
      </div>

      {!leases || leases.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          No active shops linked to your account yet.
        </div>
      ) : (
        <div className="space-y-6">
          {leases.map((lease) => (
            <div key={lease.id} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{lease.units?.code}</h2>
                <span className="text-sm text-muted-foreground">
                  {lease.start_date} → {lease.end_date ?? "open"}
                </span>
              </div>

              {lease.invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invoices yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
                        <th className="px-3 py-2 font-medium">Period</th>
                        <th className="px-3 py-2 font-medium">Due</th>
                        <th className="px-3 py-2 font-medium text-right">Total</th>
                        <th className="px-3 py-2 font-medium text-right">Balance</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lease.invoices.map((inv) => {
                        const total = inv.invoice_line_items.reduce((s, li) => s + li.amount, 0);
                        const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
                        const balance = total - paid;
                        const overdue = inv.status === "pending" && inv.due_date < today;
                        return (
                          <tr key={inv.id} className="border-b last:border-0">
                            <td className="px-3 py-2 text-muted-foreground">
                              {inv.period_start} → {inv.period_end}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">{inv.due_date}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{total.toFixed(2)}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{balance.toFixed(2)}</td>
                            <td className="px-3 py-2">
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
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Your tickets</h2>
        {!tickets || tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tickets submitted yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {tickets.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <div>
                  <div className="font-medium">{t.type}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.units?.code ?? "General"} · {t.department}
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    t.status === "open" && "bg-sky-500/10 text-sky-700 dark:text-sky-400",
                    t.status === "in_progress" && "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                    t.status === "resolved" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                  )}
                >
                  {t.status.replace("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
