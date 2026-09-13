import { createClient } from "@/lib/supabase/server";
import { CreateTicketDialog } from "@/components/tickets/create-ticket-dialog";
import { TicketActions } from "@/components/tickets/ticket-actions";
import { cn } from "@/lib/utils";

export default async function TicketsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, department, type, description, status, assigned_to, created_at, units(code), merchants(name)")
    .order("created_at", { ascending: false });

  const { data: units } = await supabase.from("units").select("id, code").order("code");
  const { data: merchants } = await supabase.from("merchants").select("id, name").order("name");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground text-sm">Routed to whichever department owns them.</p>
        </div>
        <CreateTicketDialog units={units ?? []} merchants={merchants ?? []} />
      </div>

      {!tickets || tickets.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          No tickets for your department yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Shop</th>
                <th className="px-4 py-2 font-medium">Merchant</th>
                <th className="px-4 py-2 font-medium">Department</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="px-4 py-2">
                    <div className="font-medium">{t.type}</div>
                    {t.description && <div className="text-xs text-muted-foreground">{t.description}</div>}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{t.units?.code ?? "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{t.merchants?.name ?? "—"}</td>
                  <td className="px-4 py-2 capitalize text-muted-foreground">{t.department}</td>
                  <td className="px-4 py-2">
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
                  </td>
                  <td className="px-4 py-2">
                    <TicketActions ticketId={t.id} status={t.status as "open" | "in_progress" | "resolved"} isAssigned={t.assigned_to === user?.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
