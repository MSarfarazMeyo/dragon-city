"use client";

import { useMemo, useState, useTransition, type ComponentType } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Filter,
  Lock,
  LockOpen,
  RotateCcw,
  Search,
  Store,
  Trash2,
  UserRound,
} from "lucide-react";

import { deleteInvoice, toggleLock } from "@/app/(staff)/invoices/actions";
import { RecordPaymentDialog } from "@/components/finance/record-payment-dialog";
import { ResendInvoiceEmail } from "@/components/finance/resend-invoice-email";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type FinanceInvoiceRow = {
  id: string;
  lease_id: string;
  period_start: string;
  period_end: string;
  due_date: string;
  status: string;
  paid_at: string | null;
  created_at: string;
  unit_code: string;
  merchant_name: string;
  is_locked: boolean;
  line_items: { label: string; amount: number; sort_order: number }[];
  payments: { id: string; amount: number; method: string | null; paid_at: string }[];
};

type StatusFilter = "all" | "pending" | "overdue" | "paid" | "locked";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

function money(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function totals(inv: FinanceInvoiceRow) {
  const total = inv.line_items.reduce((s, li) => s + li.amount, 0);
  const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
  return { total, paid, balance: total - paid };
}

function isOverdue(inv: FinanceInvoiceRow, today: string) {
  return inv.status === "pending" && inv.due_date < today;
}

export function FinanceBoard({
  invoices,
  today,
  canDelete,
}: {
  invoices: FinanceInvoiceRow[];
  today: string;
  canDelete: boolean;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [lockConfirm, setLockConfirm] = useState<{ leaseId: string; lock: boolean; label: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const enriched = useMemo(
    () =>
      invoices.map((inv) => {
        const t = totals(inv);
        const overdue = isOverdue(inv, today);
        return { ...inv, ...t, overdue };
      }),
    [invoices, today],
  );

  const counts = useMemo(() => {
    return {
      all: enriched.length,
      pending: enriched.filter((i) => i.status === "pending" && !i.overdue).length,
      overdue: enriched.filter((i) => i.overdue).length,
      paid: enriched.filter((i) => i.status === "paid").length,
      locked: enriched.filter((i) => i.is_locked).length,
      outstanding: enriched.reduce((s, i) => s + Math.max(0, i.balance), 0),
      overdueBalance: enriched.filter((i) => i.overdue).reduce((s, i) => s + Math.max(0, i.balance), 0),
    };
  }, [enriched]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enriched.filter((inv) => {
      if (status === "pending" && !(inv.status === "pending" && !inv.overdue)) return false;
      if (status === "overdue" && !inv.overdue) return false;
      if (status === "paid" && inv.status !== "paid") return false;
      if (status === "locked" && !inv.is_locked) return false;
      if (!q) return true;
      return (
        inv.unit_code.toLowerCase().includes(q) ||
        inv.merchant_name.toLowerCase().includes(q) ||
        inv.period_start.includes(q) ||
        inv.period_end.includes(q)
      );
    });
  }, [enriched, query, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, filtered.length);
  const paged = filtered.slice(pageStart, pageEnd);
  const selected = enriched.find((i) => i.id === selectedId) ?? null;

  function setStatusFilter(next: StatusFilter) {
    setStatus(next);
    setPage(1);
  }

  function run(action: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result && typeof result === "object" && "error" in result && result.error) {
        setError(String(result.error));
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryChip label="Pending" value={counts.pending} tone="sky" active={status === "pending"} onClick={() => setStatusFilter("pending")} />
        <SummaryChip label="Overdue" value={counts.overdue} tone="rose" active={status === "overdue"} onClick={() => setStatusFilter("overdue")} hint={`SAR ${money(counts.overdueBalance)}`} />
        <SummaryChip label="Paid" value={counts.paid} tone="emerald" active={status === "paid"} onClick={() => setStatusFilter("paid")} />
        <SummaryChip label="Locked leases" value={counts.locked} tone="amber" active={status === "locked"} onClick={() => setStatusFilter("locked")} />
      </div>

      <Card className="shadow-sm">
        <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Outstanding balance</div>
            <div className="text-2xl font-semibold tabular-nums">SAR {money(counts.outstanding)}</div>
          </div>
          <div className="text-sm text-muted-foreground">
            {counts.all} invoices total · never trust a flat total — always sum of lines
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="space-y-3 p-3 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search shop, merchant, period…"
                className="h-11 ps-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={status}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="border-input h-11 rounded-md border bg-transparent px-3 text-sm"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="paid">Paid</option>
                <option value="locked">Locked leases</option>
              </select>
              {(status !== "all" || query) && (
                <Button
                  variant="ghost"
                  className="h-11"
                  onClick={() => {
                    setQuery("");
                    setStatus("all");
                    setPage(1);
                  }}
                >
                  <RotateCcw className="size-4" />
                  Reset
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Filter className="size-3.5" />
            {filtered.length === 0
              ? "No invoices match these filters"
              : `Showing ${pageStart + 1}–${pageEnd} of ${filtered.length} invoices`}
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">No invoices match these filters.</CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {paged.map((inv) => (
              <button
                key={inv.id}
                type="button"
                onClick={() => setSelectedId(inv.id)}
                className="w-full rounded-xl border bg-card p-4 text-start shadow-sm transition hover:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{inv.unit_code}</div>
                    <div className="text-xs text-muted-foreground">{inv.merchant_name}</div>
                  </div>
                  <StatusBadge overdue={inv.overdue} status={inv.status} locked={inv.is_locked} />
                </div>
                <div className="mt-3 flex items-end justify-between text-sm">
                  <span className="text-xs text-muted-foreground">Due {inv.due_date}</span>
                  <span className="font-semibold tabular-nums">SAR {money(inv.balance)}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-xl border bg-card shadow-sm md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Shop</th>
                  <th className="px-4 py-3 font-medium">Merchant</th>
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium text-right">Balance</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((inv) => (
                  <tr
                    key={inv.id}
                    className="cursor-pointer border-b last:border-0 hover:bg-muted/30"
                    onClick={() => setSelectedId(inv.id)}
                  >
                    <td className="px-4 py-3 font-medium">{inv.unit_code}</td>
                    <td className="px-4 py-3">{inv.merchant_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {inv.period_start} → {inv.period_end}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.due_date}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{money(inv.total)}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">{money(inv.balance)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge overdue={inv.overdue} status={inv.status} locked={inv.is_locked} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border bg-card px-3 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number]);
                  setPage(1);
                }}
                className="border-input h-9 rounded-md border bg-transparent px-2 text-sm"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="text-sm tabular-nums text-muted-foreground">
                Page {safePage} of {totalPages}
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="size-9" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="icon" className="size-9" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
          {selected && (
            <InvoiceDetailPanel
              invoice={selected}
              canDelete={canDelete}
              pending={pending}
              error={error}
              onClose={() => setSelectedId(null)}
              onRequestLock={() =>
                setLockConfirm({
                  leaseId: selected.lease_id,
                  lock: !selected.is_locked,
                  label: `${selected.unit_code} · ${selected.merchant_name}`,
                })
              }
              onRequestDelete={() => setDeleteConfirm(selected.id)}
            />
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={Boolean(lockConfirm)}
        onOpenChange={(open) => !open && setLockConfirm(null)}
        title={lockConfirm?.lock ? "Lock this lease?" : "Unlock this lease?"}
        description={
          lockConfirm?.lock
            ? `Lock ${lockConfirm.label}. The merchant portal will show a lock banner until finance unlocks it.`
            : `Unlock ${lockConfirm?.label}. Confirm only if dues are settled or an exception was approved.`
        }
        confirmLabel={lockConfirm?.lock ? "Lock lease" : "Unlock lease"}
        destructive={lockConfirm?.lock}
        pending={pending}
        onConfirm={() => {
          if (!lockConfirm) return;
          run(async () => {
            await toggleLock(lockConfirm.leaseId, lockConfirm.lock);
            setLockConfirm(null);
          });
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteConfirm)}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Delete this invoice?"
        description="This permanently removes the invoice, its line items, and recorded payments. This cannot be undone."
        confirmLabel="Delete invoice"
        destructive
        pending={pending}
        onConfirm={() => {
          if (!deleteConfirm) return;
          run(async () => {
            const result = await deleteInvoice(deleteConfirm);
            if (!result?.error) {
              setDeleteConfirm(null);
              setSelectedId(null);
            }
            return result;
          });
        }}
      />
    </div>
  );
}

function InvoiceDetailPanel({
  invoice,
  canDelete,
  pending,
  error,
  onClose,
  onRequestLock,
  onRequestDelete,
}: {
  invoice: FinanceInvoiceRow & { total: number; paid: number; balance: number; overdue: boolean };
  canDelete: boolean;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onRequestLock: () => void;
  onRequestDelete: () => void;
}) {
  const tone = invoice.overdue
    ? "from-rose-500/25 via-rose-500/5 to-transparent"
    : invoice.status === "paid"
      ? "from-emerald-500/25 via-emerald-500/5 to-transparent"
      : "from-sky-500/25 via-sky-500/5 to-transparent";

  return (
    <>
      <div className={cn("border-b bg-gradient-to-b px-5 pb-4 pt-5", tone)}>
        <div className="pr-10">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <StatusBadge overdue={invoice.overdue} status={invoice.status} locked={invoice.is_locked} />
            <Badge variant="secondary" className="font-mono">
              {invoice.unit_code}
            </Badge>
            <Link
              href={`/invoices/${invoice.id}`}
              className="ml-auto flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Full details
              <ExternalLink className="size-3" />
            </Link>
          </div>
          <h2 className="text-lg font-semibold tracking-tight">{invoice.merchant_name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {invoice.period_start} → {invoice.period_end} · due {invoice.due_date}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <div className="grid grid-cols-2 gap-2">
          <MiniMoney label="Total" value={invoice.total} />
          <MiniMoney label="Paid" value={invoice.paid} tone="good" />
          <MiniMoney label="Balance" value={invoice.balance} tone={invoice.balance > 0.01 ? "warn" : "good"} className="col-span-2" />
        </div>

        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <MetaRow icon={Store} label="Shop" value={invoice.unit_code} />
          <MetaRow icon={UserRound} label="Merchant" value={invoice.merchant_name} />
          <MetaRow
            icon={invoice.is_locked ? Lock : LockOpen}
            label="Lease lock"
            value={invoice.is_locked ? "Locked" : "Unlocked"}
            emphasize={invoice.is_locked}
            last
          />
        </section>

        <section className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Line items</div>
          <div className="space-y-2">
            {[...invoice.line_items]
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((li, i) => (
                <div key={i} className="flex justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{li.label}</span>
                  <span className={cn("tabular-nums shrink-0", li.amount < 0 && "text-emerald-700 dark:text-emerald-400")}>
                    {money(li.amount)}
                  </span>
                </div>
              ))}
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payments</div>
          {invoice.payments.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {invoice.payments.map((p) => (
                <div key={p.id} className="flex justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">
                    {new Date(p.paid_at).toLocaleString()}
                    {p.method ? ` · ${p.method}` : ""}
                  </span>
                  <span className="tabular-nums font-medium text-emerald-700 dark:text-emerald-400">
                    {money(p.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 space-y-2 border-t bg-background/95 px-4 py-3 backdrop-blur">
        {invoice.balance > 0.01 && (
          <div onClick={(e) => e.stopPropagation()}>
            <RecordPaymentDialog invoiceId={invoice.id} balance={invoice.balance} fullWidth />
          </div>
        )}
        <div className="flex gap-2">
          <Button type="button" variant={invoice.is_locked ? "destructive" : "outline"} className="h-10 flex-1" disabled={pending} onClick={onRequestLock}>
            {invoice.is_locked ? <LockOpen className="size-4" /> : <Lock className="size-4" />}
            {invoice.is_locked ? "Unlock" : "Lock"}
          </Button>
          <div className="flex-1" onClick={(e) => e.stopPropagation()}>
            <ResendInvoiceEmail invoiceId={invoice.id} fullWidth />
          </div>
          {canDelete && (
            <Button type="button" variant="destructive" size="icon" className="size-10" disabled={pending} onClick={onRequestDelete} aria-label="Delete invoice">
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
        <Button type="button" variant="ghost" className="h-9 w-full text-muted-foreground" onClick={onClose}>
          Close
        </Button>
      </div>
    </>
  );
}

function SummaryChip({
  label,
  value,
  hint,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number;
  hint?: string;
  tone: "sky" | "rose" | "emerald" | "amber";
  active: boolean;
  onClick: () => void;
}) {
  const tones = {
    sky: "data-[active=true]:border-sky-500/40 data-[active=true]:bg-sky-500/10",
    rose: "data-[active=true]:border-rose-500/40 data-[active=true]:bg-rose-500/10",
    emerald: "data-[active=true]:border-emerald-500/40 data-[active=true]:bg-emerald-500/10",
    amber: "data-[active=true]:border-amber-500/40 data-[active=true]:bg-amber-500/10",
  };
  return (
    <button
      type="button"
      data-active={active}
      onClick={onClick}
      className={cn("rounded-xl border bg-card px-4 py-3 text-start shadow-sm transition hover:bg-muted/40", tones[tone])}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
    </button>
  );
}

function StatusBadge({
  status,
  overdue,
  locked,
}: {
  status: string;
  overdue: boolean;
  locked?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      <Badge
        className={cn(
          overdue && "bg-rose-500/10 text-rose-700 hover:bg-rose-500/10 dark:text-rose-300",
          !overdue && status === "pending" && "bg-sky-500/10 text-sky-700 hover:bg-sky-500/10 dark:text-sky-300",
          status === "paid" && "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300",
        )}
        variant="secondary"
      >
        {overdue ? "Overdue" : status === "paid" ? "Paid" : "Pending"}
      </Badge>
      {locked && <Badge variant="destructive">Locked</Badge>}
    </div>
  );
}

function MiniMoney({
  label,
  value,
  tone,
  className,
}: {
  label: string;
  value: number;
  tone?: "good" | "warn";
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border bg-card px-3 py-3 shadow-sm", className)}>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 text-lg font-semibold tabular-nums",
          tone === "good" && "text-emerald-700 dark:text-emerald-400",
          tone === "warn" && "text-rose-700 dark:text-rose-400",
        )}
      >
        SAR {money(value)}
      </div>
    </div>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
  emphasize,
  last,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  emphasize?: boolean;
  last?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3 px-3.5 py-3", !last && "border-b")}>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={cn("truncate text-sm font-medium", emphasize && "text-rose-700 dark:text-rose-400")}>{value}</div>
      </div>
    </div>
  );
}
