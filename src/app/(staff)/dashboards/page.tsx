import Link from "next/link";
import type { ComponentType, CSSProperties } from "react";
import {
  Building2,
  CircleDollarSign,
  Download,
  AlertTriangle,
  KeyRound,
  Percent,
  Store,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { statusOf, STATUS_LABEL, STATUS_COLOR, type ShopStatus } from "@/lib/shop-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

  const counts: Record<ShopStatus, number> = {
    free: 0,
    occupied: 0,
    expiring: 0,
    fit_out: 0,
    on_hold: 0,
    overdue: 0,
  };
  for (const lease of activeLeases ?? []) {
    counts[statusOf({ ...lease, is_overdue: overdueLeaseIds.has(lease.id) })]++;
  }
  counts.free = (totalUnits ?? 0) - (activeLeases?.length ?? 0);
  const total = totalUnits ?? 0;
  const occupiedish = total - counts.free;
  const occupancyRate = total ? Math.round((occupiedish / total) * 100) : 0;

  const { data: allInvoices } = await supabase
    .from("invoices")
    .select("status, due_date, invoice_line_items(amount), payments(amount)");
  let invoiced = 0;
  let collected = 0;
  let overdueCount = 0;
  let overdueBalance = 0;
  for (const inv of allInvoices ?? []) {
    const invTotal = inv.invoice_line_items.reduce((s, li) => s + li.amount, 0);
    const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
    invoiced += invTotal;
    collected += paid;
    if (inv.status === "pending" && inv.due_date < today) {
      overdueCount++;
      overdueBalance += invTotal - paid;
    }
  }
  const outstanding = invoiced - collected;
  const collectionRate = invoiced > 0 ? Math.round((collected / invoiced) * 100) : 0;

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

  const auditLog = isAdmin
    ? (
        await supabase
          .from("audit_log")
          .select("id, entity_type, entity_id, action, diff, created_at, profiles(full_name, role)")
          .order("created_at", { ascending: false })
          .limit(50)
      ).data
    : null;

  const statusOrder: ShopStatus[] = ["occupied", "free", "overdue", "expiring", "fit_out", "on_hold"];

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Dashboards</h1>
          <p className="text-sm text-muted-foreground">Live snapshot of occupancy, collections, and leasing risk.</p>
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">Updated {now.toLocaleString()}</p>
      </div>

      {/* Hero KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Occupancy"
          value={`${occupancyRate}%`}
          hint={`${occupiedish} of ${total} shops occupied`}
          icon={Percent}
          accent="teal"
        >
          <ProgressBar value={occupancyRate} className="bg-teal-500" />
        </KpiCard>
        <KpiCard
          title="Overdue shops"
          value={counts.overdue}
          hint="Active leases with past-due invoices"
          icon={AlertTriangle}
          accent="rose"
        />
        <KpiCard
          title="Outstanding"
          value={`SAR ${formatMoney(outstanding)}`}
          hint={`${collectionRate}% collected of invoiced`}
          icon={Wallet}
          accent="amber"
        >
          <ProgressBar value={collectionRate} className="bg-amber-500" />
        </KpiCard>
        <KpiCard
          title="Active leases"
          value={activeLeases?.length ?? 0}
          hint={`${expiringCount ?? 0} expiring in 30 days`}
          icon={KeyRound}
          accent="sky"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Operations breakdown */}
        <Card className="shadow-sm lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-400">
                <Store className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base">Operations mix</CardTitle>
                <CardDescription>Same status logic as the floor map</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex h-3 overflow-hidden rounded-full bg-muted">
              {statusOrder.map((s) => {
                const n = counts[s];
                if (!n || !total) return null;
                return (
                  <div
                    key={s}
                    title={`${STATUS_LABEL[s]}: ${n}`}
                    style={{ width: `${(n / total) * 100}%`, backgroundColor: STATUS_COLOR[s] }}
                  />
                );
              })}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {statusOrder.map((s) => {
                const n = counts[s];
                const pct = total ? Math.round((n / total) * 100) : 0;
                return (
                  <div key={s} className="flex items-center gap-3 rounded-xl border bg-card/50 px-3 py-2.5">
                    <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLOR[s] }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-medium">{STATUS_LABEL[s]}</span>
                        <span className="tabular-nums text-muted-foreground">{n}</span>
                      </div>
                      <ProgressBar value={pct} className="mt-1.5 h-1.5" style={{ backgroundColor: STATUS_COLOR[s] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Finance summary */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400">
                <CircleDollarSign className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base">Finance</CardTitle>
                <CardDescription>Collections vs dues</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <MoneyRow label="Invoiced" value={invoiced} />
            <MoneyRow label="Collected" value={collected} tone="good" />
            <MoneyRow label="Outstanding" value={outstanding} tone="warn" />
            <Separator />
            <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3 py-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-rose-700/80 dark:text-rose-300">
                  Overdue balance
                </div>
                <div className="text-lg font-semibold tabular-nums text-rose-700 dark:text-rose-300">
                  SAR {formatMoney(overdueBalance)}
                </div>
              </div>
              <Badge variant="destructive">{overdueCount} invoices</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MiniStat icon={Building2} label="Total shops" value={total} />
        <MiniStat icon={TrendingUp} label="Expiring in 30 days" value={expiringCount ?? 0} />
        <MiniStat icon={KeyRound} label="Ended last 90 days" value={endedRecentlyCount ?? 0} />
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-secondary">
                <Download className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base">Export data</CardTitle>
                <CardDescription>CSV downloads for Excel / WPS</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {["units", "leases", "invoices", "merchants", "tickets"].map((entity) => (
            <Button key={entity} variant="outline" size="sm" className="h-10 capitalize" asChild>
              <Link href={`/api/export?entity=${entity}`}>
                <Download className="size-3.5" />
                {entity}.csv
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
            <CardDescription>Audit trail of inserts, updates, and deletes</CardDescription>
          </CardHeader>
          <CardContent>
            {!auditLog || auditLog.length === 0 ? (
              <p className="text-sm text-muted-foreground">No changes recorded yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2.5 font-medium">When</th>
                      <th className="px-3 py-2.5 font-medium">Actor</th>
                      <th className="px-3 py-2.5 font-medium">Entity</th>
                      <th className="px-3 py-2.5 font-medium">Action</th>
                      <th className="px-3 py-2.5 font-medium">Changed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLog.map((row) => (
                      <tr key={row.id} className="border-b last:border-0 align-top hover:bg-muted/30">
                        <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums">
                          {new Date(row.created_at).toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5">
                          {row.profiles?.full_name ?? row.profiles?.role ?? "System"}
                        </td>
                        <td className="px-3 py-2.5">
                          {row.entity_type}
                          <span className="text-muted-foreground"> #{row.entity_id?.slice(0, 8)}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge
                            variant={
                              row.action === "delete" ? "destructive" : row.action === "insert" ? "secondary" : "outline"
                            }
                            className="capitalize"
                          >
                            {row.action}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                          {row.action === "update" ? Object.keys(row.diff as object).join(", ") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatMoney(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ProgressBar({
  value,
  className,
  style,
}: {
  value: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full transition-all", className)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, ...style }}
      />
    </div>
  );
}

function KpiCard({
  title,
  value,
  hint,
  icon: Icon,
  accent,
  children,
}: {
  title: string;
  value: string | number;
  hint: string;
  icon: ComponentType<{ className?: string }>;
  accent: "teal" | "rose" | "amber" | "sky";
  children?: React.ReactNode;
}) {
  const accents = {
    teal: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
    rose: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
    amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    sky: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  };
  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums md:text-[1.65rem]">{value}</div>
          </div>
          <div className={cn("flex size-10 items-center justify-center rounded-xl", accents[accent])}>
            <Icon className="size-5" />
          </div>
        </div>
        {children}
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function MoneyRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "good" | "warn";
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-semibold tabular-nums",
          tone === "good" && "text-emerald-700 dark:text-emerald-400",
          tone === "warn" && "text-amber-700 dark:text-amber-400",
        )}
      >
        SAR {formatMoney(value)}
      </span>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-3 py-4">
        <div className="flex size-10 items-center justify-center rounded-xl bg-secondary">
          <Icon className="size-4" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold tabular-nums">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
