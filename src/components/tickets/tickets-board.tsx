"use client";

import { useMemo, useState, useTransition, type ComponentType } from "react";
import {
  Archive,
  ArchiveRestore,
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
  History,
  MessageSquareText,
  RotateCcw,
  Search,
  Store,
  Trash2,
  UserRound,
  CheckCircle2,
  Play,
} from "lucide-react";

import {
  archiveTicket,
  deleteTicket,
  reopenTicket,
  unarchiveTicket,
  updateStatus,
} from "@/app/(staff)/tickets/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type TicketActivityEntry = {
  id: string;
  action: "insert" | "update" | "delete";
  diff: Record<string, [unknown, unknown]> | null;
  created_at: string;
  actor: { full_name: string | null; role: string | null } | null;
};

export type TicketRow = {
  id: string;
  department: string;
  type: string;
  description: string | null;
  status: "open" | "in_progress" | "resolved";
  assigned_to: string | null;
  created_at: string;
  resolved_at: string | null;
  archived_at: string | null;
  units: { code: string } | null;
  merchants: { name: string } | null;
  assignee: { full_name: string | null; role: string | null } | null;
  creator: { full_name: string | null; role: string | null } | null;
  activity: TicketActivityEntry[];
};

type StatusFilter = "all" | "open" | "in_progress" | "resolved";
type DeptFilter = "all" | "operations" | "finance" | "maintenance";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export function TicketsBoard({
  tickets,
  isAdmin,
}: {
  tickets: TicketRow[];
  isAdmin: boolean;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [department, setDepartment] = useState<DeptFilter>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const active = tickets.filter((t) => !t.archived_at);
    return {
      all: active.length,
      open: active.filter((t) => t.status === "open").length,
      in_progress: active.filter((t) => t.status === "in_progress").length,
      resolved: active.filter((t) => t.status === "resolved").length,
      archived: tickets.filter((t) => t.archived_at).length,
    };
  }, [tickets]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets.filter((t) => {
      if (showArchived ? !t.archived_at : t.archived_at) return false;
      if (status !== "all" && t.status !== status) return false;
      if (department !== "all" && t.department !== department) return false;
      if (!q) return true;
      return (
        t.type.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q) ||
        (t.units?.code ?? "").toLowerCase().includes(q) ||
        (t.merchants?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [tickets, query, status, department, showArchived]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, filtered.length);
  const paged = filtered.slice(pageStart, pageEnd);

  const selected = tickets.find((t) => t.id === selectedId) ?? null;

  function resetFilters() {
    setQuery("");
    setStatus("all");
    setDepartment("all");
    setShowArchived(false);
    setPage(1);
  }

  function setStatusFilter(next: StatusFilter, archived = false) {
    setShowArchived(archived);
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
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryChip label="Open" value={counts.open} tone="sky" active={status === "open" && !showArchived} onClick={() => setStatusFilter("open")} />
        <SummaryChip label="In progress" value={counts.in_progress} tone="amber" active={status === "in_progress" && !showArchived} onClick={() => setStatusFilter("in_progress")} />
        <SummaryChip label="Resolved" value={counts.resolved} tone="emerald" active={status === "resolved" && !showArchived} onClick={() => setStatusFilter("resolved")} />
        <SummaryChip label="Archived" value={counts.archived} tone="slate" active={showArchived} onClick={() => setStatusFilter("all", true)} />
      </div>

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
                placeholder="Search type, shop, merchant…"
                className="h-11 ps-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterSelect
                label="Status"
                value={status}
                onChange={(v) => {
                  setStatus(v as StatusFilter);
                  setPage(1);
                }}
                options={[
                  { value: "all", label: "All statuses" },
                  { value: "open", label: "Open" },
                  { value: "in_progress", label: "In progress" },
                  { value: "resolved", label: "Resolved" },
                ]}
              />
              <FilterSelect
                label="Department"
                value={department}
                onChange={(v) => {
                  setDepartment(v as DeptFilter);
                  setPage(1);
                }}
                options={[
                  { value: "all", label: "All departments" },
                  { value: "operations", label: "Operations" },
                  { value: "finance", label: "Finance" },
                  { value: "maintenance", label: "Maintenance" },
                ]}
              />
              {(status !== "all" || department !== "all" || query || showArchived) && (
                <Button variant="ghost" className="h-11" onClick={resetFilters}>
                  <RotateCcw className="size-4" />
                  Reset
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Filter className="size-3.5" />
            {filtered.length === 0
              ? "No tickets match these filters"
              : `Showing ${pageStart + 1}–${pageEnd} of ${filtered.length} tickets`}
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No tickets match these filters.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 md:hidden">
          {paged.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedId(t.id)}
              className="w-full rounded-xl border bg-card p-4 text-start shadow-sm transition hover:bg-muted/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{t.type}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {t.units?.code ?? "No shop"} · {t.merchants?.name ?? "No merchant"}
                  </div>
                </div>
                <StatusBadge status={t.status} archived={Boolean(t.archived_at)} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span className="capitalize">{t.department}</span>
                <span className="tabular-nums">{formatWhen(t.created_at)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="hidden overflow-hidden rounded-xl border bg-card shadow-sm md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Ticket</th>
                <th className="px-4 py-3 font-medium">Shop</th>
                <th className="px-4 py-3 font-medium">Merchant</th>
                <th className="px-4 py-3 font-medium">Dept</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((t) => (
                <tr
                  key={t.id}
                  className="cursor-pointer border-b last:border-0 hover:bg-muted/30"
                  onClick={() => setSelectedId(t.id)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{t.type}</div>
                    {t.description && (
                      <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{t.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t.units?.code ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.merchants?.name ?? "—"}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{t.department}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} archived={Boolean(t.archived_at)} />
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{formatWhen(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 && (
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
              <Button
                variant="outline"
                size="icon"
                className="size-9"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-9"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        >
          {selected && (
            <TicketDetailPanel
              ticket={selected}
              isAdmin={isAdmin}
              pending={pending}
              error={error}
              onClose={() => setSelectedId(null)}
              onAction={run}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function TicketDetailPanel({
  ticket,
  isAdmin,
  pending,
  error,
  onClose,
  onAction,
}: {
  ticket: TicketRow;
  isAdmin: boolean;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onAction: (action: () => Promise<unknown>) => void;
}) {
  const creatorLabel = ticket.creator?.full_name ?? ticket.creator?.role ?? "Unknown";
  const statusTone =
    ticket.archived_at
      ? "from-slate-500/20 via-slate-500/5 to-transparent"
      : ticket.status === "in_progress"
        ? "from-amber-500/25 via-amber-500/5 to-transparent"
        : ticket.status === "resolved"
          ? "from-emerald-500/25 via-emerald-500/5 to-transparent"
          : "from-sky-500/25 via-sky-500/5 to-transparent";

  return (
    <>
      <div className={cn("relative border-b bg-gradient-to-b px-5 pb-4 pt-5", statusTone)}>
        <div className="pr-10">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <StatusBadge status={ticket.status} archived={Boolean(ticket.archived_at)} />
            <Badge variant="outline" className="capitalize">
              {ticket.department}
            </Badge>
            {ticket.units?.code && (
              <Badge variant="secondary" className="font-mono">
                {ticket.units.code}
              </Badge>
            )}
          </div>
          <h2 className="text-lg font-semibold leading-snug tracking-tight">{ticket.type}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Opened {formatWhen(ticket.created_at)} · {new Date(ticket.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <MetaRow icon={Store} label="Shop" value={ticket.units?.code ?? "Not linked"} />
          <MetaRow icon={Building2} label="Merchant" value={ticket.merchants?.name ?? "Not linked"} />
          <MetaRow icon={UserRound} label="Created by" value={creatorLabel} last />
        </section>

        <section className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <MessageSquareText className="size-3.5" />
            Description
          </div>
          <p
            className={cn(
              "text-sm leading-relaxed",
              !ticket.description?.trim() && "italic text-muted-foreground",
            )}
          >
            {ticket.description?.trim() || "No description was added for this ticket."}
          </p>
        </section>

        <section className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timeline</div>
          <ol className="space-y-3">
            <TimelineItem
              title="Created"
              detail={new Date(ticket.created_at).toLocaleString()}
              active
            />
            {ticket.resolved_at && (
              <TimelineItem title="Resolved" detail={new Date(ticket.resolved_at).toLocaleString()} />
            )}
            {ticket.archived_at && (
              <TimelineItem title="Archived" detail={new Date(ticket.archived_at).toLocaleString()} />
            )}
          </ol>
        </section>

        <section className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <History className="size-3.5" />
            Activity
          </div>
          {ticket.activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No changes recorded yet.</p>
          ) : (
            <ol className="space-y-2.5">
              {ticket.activity.map((entry) => (
                <li key={entry.id} className="text-sm">
                  <span className="font-medium">{entry.actor?.full_name ?? entry.actor?.role ?? "System"}</span>{" "}
                  <span className="text-muted-foreground">
                    {entry.action === "insert" ? "created this ticket" : describeTicketDiff(entry.diff)}
                    {" · "}
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 space-y-2 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        {!ticket.archived_at && ticket.status !== "resolved" && (
          <div className={cn("grid gap-2", ticket.status === "open" && "grid-cols-2")}>
            {ticket.status === "open" && (
              <Button
                disabled={pending}
                variant="outline"
                className="h-10"
                onClick={() => onAction(() => updateStatus(ticket.id, "in_progress"))}
              >
                <Play className="size-4" />
                Start
              </Button>
            )}
            <Button disabled={pending} className="h-10" onClick={() => onAction(() => updateStatus(ticket.id, "resolved"))}>
              <CheckCircle2 className="size-4" />
              Resolve
            </Button>
          </div>
        )}

        {!ticket.archived_at && ticket.status === "resolved" && (
          <Button
            disabled={pending}
            variant="outline"
            className="h-10 w-full"
            onClick={() => onAction(() => reopenTicket(ticket.id))}
          >
            <RotateCcw className="size-4" />
            Reopen ticket
          </Button>
        )}

        <div className="flex gap-2">
          {!ticket.archived_at ? (
            <Button
              disabled={pending}
              variant="secondary"
              className="h-10 flex-1"
              onClick={() =>
                onAction(async () => {
                  await archiveTicket(ticket.id);
                  onClose();
                })
              }
            >
              <Archive className="size-4" />
              Archive
            </Button>
          ) : (
            <Button
              disabled={pending}
              variant="secondary"
              className="h-10 flex-1"
              onClick={() => onAction(() => unarchiveTicket(ticket.id))}
            >
              <ArchiveRestore className="size-4" />
              Restore
            </Button>
          )}

          {isAdmin && (
            <Button
              disabled={pending}
              variant="destructive"
              size="icon"
              className="size-10 shrink-0"
              aria-label="Delete permanently"
              onClick={() => {
                if (!confirm("Permanently delete this ticket? This cannot be undone.")) return;
                onAction(async () => {
                  const result = await deleteTicket(ticket.id);
                  if (!result?.error) onClose();
                  return result;
                });
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </>
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
        <div className={cn("truncate text-sm font-medium", emphasize && "text-amber-700 dark:text-amber-400")}>
          {value}
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ title, detail, active }: { title: string; detail: string; active?: boolean }) {
  return (
    <li className="relative flex gap-3 ps-1">
      <div className="mt-1.5 flex flex-col items-center">
        <span
          className={cn(
            "size-2.5 rounded-full ring-4 ring-background",
            active ? "bg-primary" : "bg-muted-foreground/40",
          )}
        />
      </div>
      <div className="min-w-0 pb-0.5">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{detail}</div>
      </div>
    </li>
  );
}

function SummaryChip({
  label,
  value,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number;
  tone: "sky" | "amber" | "emerald" | "slate";
  active: boolean;
  onClick: () => void;
}) {
  const tones = {
    sky: "data-[active=true]:border-sky-500/40 data-[active=true]:bg-sky-500/10",
    amber: "data-[active=true]:border-amber-500/40 data-[active=true]:bg-amber-500/10",
    emerald: "data-[active=true]:border-emerald-500/40 data-[active=true]:bg-emerald-500/10",
    slate: "data-[active=true]:border-slate-500/40 data-[active=true]:bg-slate-500/10",
  };
  return (
    <button
      type="button"
      data-active={active}
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-card px-4 py-3 text-start shadow-sm transition hover:bg-muted/40",
        tones[tone],
      )}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </button>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="sr-only-focusable flex flex-col gap-1 text-xs text-muted-foreground">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-input h-11 rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusBadge({ status, archived }: { status: TicketRow["status"]; archived?: boolean }) {
  if (archived) return <Badge variant="secondary">Archived</Badge>;
  return (
    <Badge
      variant={status === "resolved" ? "secondary" : status === "in_progress" ? "outline" : "default"}
      className={cn(
        "capitalize",
        status === "open" && "bg-sky-500/10 text-sky-700 hover:bg-sky-500/10 dark:text-sky-300",
        status === "in_progress" && "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
        status === "resolved" && "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
      )}
    >
      {status.replace("_", " ")}
    </Badge>
  );
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return d.toLocaleDateString();
}

// Turns an audit_log row's {field: [old, new]} diff into one readable
// clause — this is the "who performed operation on it, track status"
// trail requested in place of a formal assignment feature.
// assigned_to is excluded on purpose — assignment is a hidden schema
// field for now (see Sprint 5), so a raw UUID has no business showing
// up in an activity trail meant for non-technical readers.
const HIDDEN_DIFF_FIELDS = new Set(["resolved_at", "archived_at", "assigned_to"]);

function describeTicketDiff(diff: Record<string, [unknown, unknown]> | null) {
  if (!diff) return "made a change";
  const parts = Object.entries(diff)
    .filter(([field]) => !HIDDEN_DIFF_FIELDS.has(field))
    .map(([field, [, next]]) => `${field.replace(/_/g, " ")} → ${next ?? "—"}`);
  return parts.length > 0 ? `changed ${parts.join(", ")}` : "made a change";
}
