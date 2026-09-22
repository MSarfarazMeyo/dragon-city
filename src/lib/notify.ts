import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { renderGenericEmail } from "@/lib/email-templates";
import { notifyInApp, applyTemplateVars, resolveNotificationTemplate } from "@/lib/notifications";

// Same delivery shape as the cron route's deliver()/getRecipients()
// (src/app/api/cron/notify/route.ts) — in-app row + email, using the
// notification_rules template when one exists for the event — but
// callable synchronously from a server action, so an event like
// "invoice_created" doesn't have to wait for the next cron poll to
// reach the merchant's inbox.
export async function notifyNow({
  recipientProfileId,
  event,
  title,
  vars,
  fallbackBody,
  relatedTicketId,
  html,
}: {
  recipientProfileId: string;
  event: string;
  title: string;
  vars: Record<string, string>;
  fallbackBody: string;
  relatedTicketId?: string;
  /** Pre-rendered branded HTML (see src/lib/email-templates.ts) for a richer
   * email than the plain notification_rules template — e.g. invoice emails
   * built with renderInvoiceEmail(). Falls back to a generic branded wrapper
   * around the resolved text body when omitted. */
  html?: string;
}) {
  const supabase = createAdminClient();

  // notification_rules.event isn't unique (invoice_due has one row per
  // offset_days, e.g. -7/-3/0 — see the tickets_notifications migration)
  // so this takes the first match rather than .maybeSingle(). Events
  // meant for notifyNow() (immediate, not cron-scheduled) should only
  // ever have one row.
  const { data: rules } = await supabase
    .from("notification_rules")
    .select("template, template_i18n")
    .eq("event", event)
    .limit(1);
  const rule = rules?.[0];
  const { data: profile } = await supabase.from("profiles").select("locale").eq("id", recipientProfileId).maybeSingle();
  const locale = profile?.locale ?? "en";

  const body = rule ? applyTemplateVars(resolveNotificationTemplate(rule, locale), vars) : fallbackBody;

  await notifyInApp(supabase, recipientProfileId, event, title, body, relatedTicketId);

  const { data: userRes } = await supabase.auth.admin.getUserById(recipientProfileId);
  const email = userRes?.user?.email;
  if (!email) return;

  const sent = await sendEmail(email, title, body, html ?? renderGenericEmail(title, body));
  await supabase.from("notifications").insert({
    recipient_id: recipientProfileId,
    channel: "email",
    type: event,
    title,
    body: sent ? body : `${body} (skipped — SMTP not configured)`,
  });
}

// Convenience for the common "notify this merchant's portal user" case
// (invoice created, ticket update, etc.) — resolves the merchant's
// profile id first, no-ops if the merchant has no portal login yet.
export async function notifyMerchant(
  merchantId: string,
  args: Omit<Parameters<typeof notifyNow>[0], "recipientProfileId">,
) {
  const supabase = createAdminClient();
  const { data: profile } = await supabase.from("profiles").select("id").eq("merchant_id", merchantId).maybeSingle();
  if (!profile) return;
  await notifyNow({ ...args, recipientProfileId: profile.id });
}

// Department-routed counterpart to notifyMerchant — used when a
// merchant opens a ticket and the relevant staff (operations/finance/
// maintenance, matched on profiles.role) need to hear about it, same
// role-matching the cron route uses for invoice_due/lease_expiring.
export async function notifyStaffRole(
  role: string,
  args: Omit<Parameters<typeof notifyNow>[0], "recipientProfileId">,
) {
  const supabase = createAdminClient();
  const { data: staff } = await supabase.from("profiles").select("id").eq("role", role).eq("status", "active");
  for (const s of staff ?? []) {
    await notifyNow({ ...args, recipientProfileId: s.id });
  }
}
