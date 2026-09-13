import { createClient } from "@/lib/supabase/server";
import { statusOf, STATUS_LABEL, type ShopStatus } from "@/lib/shop-status";
import { cn } from "@/lib/utils";

export default async function DashboardsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: myProfile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  const isAdmin = myProfile?.role === "admin";

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const ago90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // --- Operations: shop status breakdown, same logic the map uses ---
  const { count: totalUnits } = await supabase.from("units").select("id", { count: "exact", head: true });
  const { data: activeLeases } = await supabase
    .from("leases")
    .select("id, billing_status, end_date")
    .eq("status", "active");
  const { data: overdueInvoices } = await supabase
    .from("invoices")
    .select("lease_id")
    .eq("status", "pending")
    .lt("due_date", today);
  const overdueLeaseIds = new Set((overdueInvoices ?? []).map((i) => i.lease_id));

  const counts: Record<ShopStatus, number> = { free: 0, occupied: 0, expiring: 0, fit_out: 0, on_hold: 0, overdue: 0 };
  for (const lease of activeLeases ?? []) {
    counts[statusOf({ ...lease, is_overdue: overdueLeaseIds.has(lease.id) })]++;
  }
  counts.free = (totalUnits ?? 0) - (activeLeases?.length ?? 0);
  const occupancyRate = totalUnits ? Math.round(((totalUnits - counts.free) / totalUnits) * 100) : 0;

  // --- Finance: invoiced / collected / outstanding ---
  const { data: allInvoices } = await supabase
    .from("invoices")
    .select("status, due_date, invoice_line_items(amount), payments(amount)");
  let invoiced = 0;
  let collected = 0;
  let overdueCount = 0;
  let overdueBalance = 0;
  for (const inv of allInvoices ?? []) {
    const total = inv.invoice_line_items.reduce((s, li) => s + li.amount, 0);
    const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
    invoiced += total;
    collected += paid;
    if (inv.status === "pending" && inv.due_date < today) {
      overdueCount++;
      overdueBalance += total - paid;
    }
  }

  // --- Leasing: active / expiring / churn ---
  const { count: expiringCount } = await supabase
    .from("leases")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .lte("end_date", in30Days)
    .gte("end_date", today);
  const { count: endedRecentlyCount } = await supabase
    .from("leases")
    .select("id", { count: "exact", head: true })
    .eq("status", "terminated")
    .gte("end_date", ago90Days);

  // --- Audit log (admin only) ---
  const auditLog = isAdmin
    ? (
        await supabase
          .from("audit_log")
          .select("id, entity_type, entity_id, action, diff, created_at, profiles(full_name, role)")
          .order("created_at", { ascending: false })
          .limit(50)
      ).data
    : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboards</h1>
        <p className="text-muted-foreground text-sm">Operations, finance, and leasing at a glance.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Operations</h2>
        <div className="flex flex-wrap gap-3">
          <Stat label="Total shops" value={totalUnits ?? 0} />
          <Stat label="Occupancy" value={`${occupancyRate}%`} />
          {(Object.keys(STATUS_LABEL) as ShopStatus[]).map((s) => (
            <Stat key={s} label={STATUS_LABEL[s]} value={counts[s]} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Finance</h2>
        <div className="flex flex-wrap gap-3">
          <Stat label="Invoiced" value={invoiced.toFixed(2)} />
          <Stat label="Collected" value={collected.toFixed(2)} />
          <Stat label="Outstanding" value={(invoiced - collected).toFixed(2)} />
          <Stat label="Overdue invoices" value={overdueCount} />
          <Stat label="Overdue balance" value={overdueBalance.toFixed(2)} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Leasing</h2>
        <div className="flex flex-wrap gap-3">
          <Stat label="Active leases" value={activeLeases?.length ?? 0} />
          <Stat label="Expiring in 30 days" value={expiringCount ?? 0} />
          <Stat label="Ended in last 90 days" value={endedRecentlyCount ?? 0} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Export</h2>
        <div className="flex flex-wrap gap-2">
          {["units", "leases", "invoices", "tickets"].map((entity) => (
            <a
              key={entity}
              href={`/api/export?entity=${entity}`}
              className="rounded-md border px-3 py-1.5 text-sm font-medium capitalize hover:bg-secondary"
            >
              {entity}.csv
            </a>
          ))}
        </div>
      </section>

      {isAdmin && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Audit log</h2>
          {!auditLog || auditLog.length === 0 ? (
            <p className="text-sm text-muted-foreground">No changes recorded yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
                    <th className="px-3 py-2 font-medium">When</th>
                    <th className="px-3 py-2 font-medium">Actor</th>
                    <th className="px-3 py-2 font-medium">Entity</th>
                    <th className="px-3 py-2 font-medium">Action</th>
                    <th className="px-3 py-2 font-medium">Changed</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 align-top">
                      <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                        {new Date(row.created_at).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {row.profiles?.full_name ?? (row.profiles?.role ? row.profiles.role : "System")}
                      </td>
                      <td className="px-3 py-2">
                        {row.entity_type}
                        <span className="text-muted-foreground"> #{row.entity_id?.slice(0, 8)}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            row.action === "insert" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                            row.action === "update" && "bg-sky-500/10 text-sky-700 dark:text-sky-400",
                            row.action === "delete" && "bg-rose-500/10 text-rose-700 dark:text-rose-400",
                          )}
                        >
                          {row.action}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                        {row.action === "update" ? Object.keys(row.diff as object).join(", ") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border px-4 py-2">
      <div className="text-xs tracking-wide text-muted-foreground uppercase">{label}</div>
      <div className="text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
