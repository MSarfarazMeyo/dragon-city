import { createClient } from "@/lib/supabase/server";
import { CreateTicketDialog } from "@/components/tickets/create-ticket-dialog";
import { TicketsBoard, type TicketActivityEntry, type TicketRow } from "@/components/tickets/tickets-board";

export default async function TicketsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();

  const { data: tickets } = await supabase
    .from("tickets")
    .select(
      "id, department, type, description, status, assigned_to, created_at, resolved_at, archived_at, units(code), merchants(name), assignee:profiles!tickets_assigned_to_fkey(full_name, role), creator:profiles!tickets_created_by_fkey(full_name, role)",
    )
    .order("created_at", { ascending: false });

  const { data: units } = await supabase.from("units").select("id, code").order("code");
  const { data: merchants } = await supabase.from("merchants").select("id, name").order("name");

  // "Who performed what, and when" — the activity trail that replaces a
  // formal assignment feature (see tickets-board.tsx's Activity section).
  const { data: auditRows } = await supabase
    .from("audit_log")
    .select("id, entity_id, action, diff, created_at, profiles(full_name, role)")
    .eq("entity_type", "tickets")
    .order("created_at", { ascending: true });

  const activityByTicket = new Map<string, TicketActivityEntry[]>();
  for (const row of auditRows ?? []) {
    if (!row.entity_id) continue;
    const list = activityByTicket.get(row.entity_id) ?? [];
    list.push({
      id: row.id,
      action: row.action as TicketActivityEntry["action"],
      diff: row.diff as TicketActivityEntry["diff"],
      created_at: row.created_at,
      actor: row.profiles,
    });
    activityByTicket.set(row.entity_id, list);
  }

  const rows: TicketRow[] = (tickets ?? []).map((t) => ({
    id: t.id,
    department: t.department,
    type: t.type,
    description: t.description,
    status: t.status as TicketRow["status"],
    assigned_to: t.assigned_to,
    created_at: t.created_at,
    resolved_at: t.resolved_at,
    archived_at: t.archived_at,
    units: t.units,
    merchants: t.merchants,
    assignee: t.assignee,
    creator: t.creator,
    activity: (activityByTicket.get(t.id) ?? []).slice().reverse(),
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Tickets</h1>
          <p className="text-sm text-muted-foreground">
            Department-routed work queue — click any ticket for full detail and actions.
          </p>
        </div>
        <CreateTicketDialog units={units ?? []} merchants={merchants ?? []} />
      </div>

      <TicketsBoard tickets={rows} isAdmin={profile?.role === "admin"} />
    </div>
  );
}
