import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export { applyTemplateVars, resolveNotificationTemplate } from "@/lib/notification-template";

// Takes whichever client the caller already has (RLS-scoped for
// interactive ticket actions, service-role for the cron route) so the
// same helper works from both places.
export async function notifyInApp(
  supabase: SupabaseClient<Database>,
  recipientId: string,
  type: string,
  title: string,
  body?: string,
  relatedTicketId?: string,
) {
  await supabase.from("notifications").insert({
    recipient_id: recipientId,
    channel: "in_app",
    type,
    title,
    body: body ?? null,
    related_ticket_id: relatedTicketId ?? null,
  });
}
