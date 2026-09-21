import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, KeyRound, Ticket, Wallet } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { displayStatus, displayStatusColor, displayStatusLabel, type PropertyStatus } from "@/lib/shop-status";
import { DetailTabs } from "@/components/ui/detail-tabs";
import { StatCard, StatCardRow } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

export default async function UnitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: unit } = await supabase
    .from("units")
    .select("id, code, category, area_sqm, property_status, zones(code)")
    .eq("id", id)
    .maybeSingle();

  if (!unit) notFound();

  const { data: leases } = await supabase
    .from("leases")
    .select(
      "id, start_date, end_date, status, billing_status, is_locked, rent_amount, deposit, service_fee, service_contract_no, cooperation_contract_no, merchants(id, name)",
    )
    .eq("unit_id", id)
    .order("start_date", { ascending: false });

  const leaseIds = (leases ?? []).map((l) => l.id);
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: invoices }, { data: tickets }] = await Promise.all([
    leaseIds.length > 0
      ? supabase
          .from("invoices")
          .select("id, period_start, period_end, due_date, status, lease_id, invoice_line_items(amount), payments(amount)")
          .in("lease_id", leaseIds)
          .order("due_date", { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase
      .from("tickets")
      .select("id, type, department, status, description, created_at, resolved_at, merchants(name)")
      .eq("unit_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const activeLease = (leases ?? []).find((l) => l.status === "active") ?? null;
  const historyLeases = (leases ?? []).filter((l) => l.status !== "active");
  const overdueLeaseIds = new Set(
    (invoices ?? []).filter((i) => i.status === "pending" && i.due_date < today).map((i) => i.lease_id),
  );

  const status = displayStatus({
    lease: activeLease
      ? {
          billing_status: activeLease.billing_status,
          end_date: activeLease.end_date,
          is_overdue: overdueLeaseIds.has(activeLease.id),
        }
      : null,
    property_status: (unit.property_status ?? "unknown") as PropertyStatus,
  });

  const openTickets = (tickets ?? []).filter((t) => t.status !== "resolved");

  let totalOutstanding = 0;
  for (const inv of invoices ?? []) {
    if (inv.status !== "pending") continue;
    const total = inv.invoice_line_items.reduce((s, li) => s + li.amount, 0);
    const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
    totalOutstanding += total - paid;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/map" className="text-sm text-muted-foreground hover:text-foreground">
          ← Map
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{unit.code}</h1>
          <span
            className="rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ backgroundColor: `${displayStatusColor(status)}1a`, color: displayStatusColor(status) }}
          >
            {displayStatusLabel(status)}
          </span>
        </div>
        <p className="text-muted-foreground text-sm">
          {[unit.zones?.code ? `Zone ${unit.zones.code}` : null, unit.category, unit.area_sqm ? `${unit.area_sqm} m²` : null]
            .filter(Boolean)
            .join(" · ") || "No details set"}
        </p>
      </div>

      <DetailTabs
        defaultTab="overview"
        tabs={[
          {
            id: "overview",
            label: "Overview",
            content: (
              <div className="space-y-6">
                <StatCardRow>
                  <StatCard label="Status" value={displayStatusLabel(status)} icon={KeyRound} tone={status === "overdue" ? "rose" : "teal"} />
                  <StatCard
                    label="Outstanding"
                    value={`SAR ${totalOutstanding.toFixed(2)}`}
                    icon={Wallet}
                    tone={totalOutstanding > 0 ? "amber" : "neutral"}
                  />
                  <StatCard label="Open tickets" value={openTickets.length} icon={Ticket} tone={openTickets.length ? "rose" : "neutral"} />
                  <StatCard label="Lease history" value={leases?.length ?? 0} icon={Building2} tone="sky" />
                </StatCardRow>

                {activeLease ? (
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Current tenant</h2>
                      {activeLease.merchants && (
                        <Link href={`/merchants/${activeLease.merchants.id}`} className="text-sm text-primary hover:underline">
                          View merchant →
                        </Link>
                      )}
                    </div>
                    <p className="mt-2 text-lg font-medium">{activeLease.merchants?.name ?? "Unknown merchant"}</p>
                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
                      <dt className="text-muted-foreground">Term</dt>
                      <dd className="col-span-3">
                        {activeLease.start_date} → {activeLease.end_date ?? "open"}
                      </dd>
                      {activeLease.rent_amount != null && (
                        <>
                          <dt className="text-muted-foreground">Rent</dt>
                          <dd className="col-span-3 tabular-nums">{activeLease.rent_amount}</dd>
                        </>
                      )}
                      {activeLease.service_contract_no && (
                        <>
                          <dt className="text-muted-foreground">Service contract</dt>
                          <dd className="col-span-3">{activeLease.service_contract_no}</dd>
                        </>
                      )}
                    </dl>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    This shop has no active lease.
                  </div>
                )}
              </div>
            ),
          },
          {
            id: "leases",
            label: "Lease history",
            count: leases?.length ?? 0,
            content: (
              <div className="overflow-x-auto rounded-lg border">
                {!leases || leases.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">No leases recorded for this shop yet.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
                        <th className="px-4 py-2 font-medium">Merchant</th>
                        <th className="px-4 py-2 font-medium">Period</th>
                        <th className="px-4 py-2 font-medium">Status</th>
                        <th className="px-4 py-2 font-medium text-right">Rent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...(activeLease ? [activeLease] : []), ...historyLeases].map((l) => (
                        <tr key={l.id} className="border-b last:border-0">
                          <td className="px-4 py-2 font-medium">
                            {l.merchants ? (
                              <Link href={`/merchants/${l.merchants.id}`} className="hover:underline">
                                {l.merchants.name}
                              </Link>
                            ) : (
                              "Unknown"
                            )}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {l.start_date} → {l.end_date ?? "open"}
                          </td>
                          <td className="px-4 py-2 capitalize">{l.status}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{l.rent_amount?.toFixed(2) ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ),
          },
          {
            id: "invoices",
            label: "Invoices",
            count: invoices?.length ?? 0,
            content: (
              <div className="overflow-x-auto rounded-lg border">
                {!invoices || invoices.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">No invoices for this shop yet.</p>
                ) : (
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
                      {invoices.map((inv) => {
                        const total = inv.invoice_line_items.reduce((s, li) => s + li.amount, 0);
                        const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
                        const balance = total - paid;
                        const overdue = inv.status === "pending" && inv.due_date < today;
                        return (
                          <tr key={inv.id} className="border-b last:border-0">
                            <td className="px-4 py-2 text-muted-foreground">
                              <Link href={`/invoices/${inv.id}`} className="hover:underline">
                                {inv.period_start} → {inv.period_end}
                              </Link>
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
                )}
              </div>
            ),
          },
          {
            id: "tickets",
            label: "Tickets",
            count: openTickets.length,
            content: (
              <div className="overflow-x-auto rounded-lg border">
                {!tickets || tickets.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">No tickets for this shop.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
                        <th className="px-4 py-2 font-medium">Type</th>
                        <th className="px-4 py-2 font-medium">Merchant</th>
                        <th className="px-4 py-2 font-medium">Department</th>
                        <th className="px-4 py-2 font-medium">Status</th>
                        <th className="px-4 py-2 font-medium">Opened</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((t) => (
                        <tr key={t.id} className="border-b last:border-0">
                          <td className="px-4 py-2 font-medium">{t.type}</td>
                          <td className="px-4 py-2 text-muted-foreground">{t.merchants?.name ?? "—"}</td>
                          <td className="px-4 py-2 capitalize text-muted-foreground">{t.department}</td>
                          <td className="px-4 py-2">
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                                t.status === "resolved" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                                t.status === "open" && "bg-rose-500/10 text-rose-700 dark:text-rose-400",
                                t.status === "in_progress" && "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                              )}
                            >
                              {t.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
