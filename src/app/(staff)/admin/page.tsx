import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { PriceStandardForm } from "@/components/admin/price-standard-form";
import { NotificationRuleForm } from "@/components/admin/notification-rule-form";
import { FloorForm } from "@/components/admin/floor-form";
import { cn } from "@/lib/utils";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (profile?.role !== "admin") {
    redirect("/map");
  }

  const { data: priceStandards } = await supabase
    .from("price_standards")
    .select("id, zone_code, category, unit_price, notes")
    .order("zone_code");

  const { data: notificationRules } = await supabase
    .from("notification_rules")
    .select("id, event, offset_days, template, template_i18n")
    .order("event");

  const { data: auditLog } = await supabase
    .from("audit_log")
    .select("id, entity_type, entity_id, action, diff, created_at, profiles(full_name, role)")
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: floors } = await supabase
    .from("floors")
    .select("id, label, bg_image_path, map_width, map_height, sort_order")
    .order("sort_order");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">System admin</h1>
        <p className="text-muted-foreground text-sm">Price standards, notification templates, audit trail, and floors.</p>
      </div>

      <AdminTabs>
        {{
          prices: (
            <div className="space-y-3">
              <PriceStandardForm />
              {(priceStandards ?? []).map((ps) => (
                <PriceStandardForm key={ps.id} standard={ps} />
              ))}
              {(priceStandards ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No price standards yet. Add one above.</p>
              )}
            </div>
          ),
          notifications: (
            <div className="grid gap-4 lg:grid-cols-2">
              {(notificationRules ?? []).map((rule) => (
                <NotificationRuleForm key={rule.id} rule={rule} />
              ))}
              {(notificationRules ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No notification rules configured.</p>
              )}
            </div>
          ),
          audit: (
            <div className="overflow-x-auto rounded-lg border">
              {!auditLog || auditLog.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No audit entries yet.</p>
              ) : (
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
                          {row.profiles?.full_name ?? row.profiles?.role ?? "System"}
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
              )}
            </div>
          ),
          floors: (
            <div className="grid gap-4 lg:grid-cols-2">
              {(floors ?? []).map((floor) => (
                <FloorForm key={floor.id} floor={floor} />
              ))}
              {(floors ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No floors found.</p>
              )}
            </div>
          ),
        }}
      </AdminTabs>
    </div>
  );
}
