import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { applyTemplateVars, resolveNotificationTemplate } from "@/lib/notification-template";
import { renderInvoiceEmail, renderLeaseEmail } from "@/lib/email-templates";

// Hit by an external scheduler (Vercel Cron, or manually while developing).
// Service-role only — reads notification_rules, checks invoices/leases
// against it, and fans each match out to in_app + email.
export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date();
  const created: string[] = [];

  const { data: rules } = await supabase.from("notification_rules").select("*");

  for (const rule of rules ?? []) {
    const targetDate = addDays(today, -rule.offset_days).toISOString().slice(0, 10);

    if (rule.event === "invoice_due") {
      const { data: invoices } = await supabase
        .from("invoices")
        .select(
          "id, due_date, period_start, period_end, lease_id, leases(merchant_id, units(code), merchants(name)), invoice_line_items(amount)",
        )
        .eq("status", "pending")
        .eq("due_date", targetDate);

      // offset_days is "days before due" (-7/-3/0 = due in 7/3/0 days);
      // a positive value is a rule an admin added for days *after* due —
      // the only way this ever fires is a notification_rules row with
      // offset_days > 0 (see the overdue reminder migration), so this is
      // the one place "overdue" (as opposed to "due soon") gets decided.
      const overdue = rule.offset_days > 0;
      const headline = overdue ? "Invoice overdue" : rule.offset_days === 0 ? "Invoice due today" : "Invoice due soon";

      for (const inv of invoices ?? []) {
        const unitCode = inv.leases?.units?.code ?? "?";
        const type = `invoice_due_${rule.offset_days}_${inv.id}`;
        const recipients = await getRecipients(supabase, inv.leases?.merchant_id ?? null, "finance");
        const total = inv.invoice_line_items.reduce((s, li) => s + li.amount, 0);
        for (const r of recipients) {
          if (await alreadySent(supabase, r.id, type)) continue;
          const template = resolveNotificationTemplate(rule, r.locale);
          const body = applyTemplateVars(template, { unit_code: unitCode, due_date: inv.due_date });
          const html = renderInvoiceEmail({
            headline,
            introText: overdue
              ? "This invoice is now past its due date. Please settle the balance as soon as possible."
              : "A friendly reminder about an upcoming invoice due date.",
            merchantName: inv.leases?.merchants?.name ?? "Merchant",
            unitCode,
            periodStart: inv.period_start,
            periodEnd: inv.period_end,
            dueDate: inv.due_date,
            totalAmount: total,
            status: overdue ? "overdue" : "pending",
          });
          await deliver(supabase, r, type, `Invoice due for ${unitCode}`, body, html);
          created.push(type);
        }
      }
    }

    if (rule.event === "lease_expiring") {
      const { data: leases } = await supabase
        .from("leases")
        .select("id, end_date, merchant_id, units(code), merchants(name)")
        .eq("status", "active")
        .eq("end_date", targetDate);

      for (const lease of leases ?? []) {
        const unitCode = lease.units?.code ?? "?";
        const type = `lease_expiring_${rule.offset_days}_${lease.id}`;
        const recipients = await getRecipients(supabase, lease.merchant_id, "operations");
        for (const r of recipients) {
          if (await alreadySent(supabase, r.id, type)) continue;
          const template = resolveNotificationTemplate(rule, r.locale);
          const body = applyTemplateVars(template, {
            unit_code: unitCode,
            end_date: lease.end_date ?? "",
          });
          const html = renderLeaseEmail({
            headline: "Lease expiring soon",
            introText: "A reminder that this lease is approaching its end date.",
            merchantName: lease.merchants?.name ?? "Merchant",
            unitCode,
            endDate: lease.end_date ?? undefined,
          });
          await deliver(supabase, r, type, `Lease expiring for ${unitCode}`, body, html);
          created.push(type);
        }
      }
    }
  }

  return NextResponse.json({ ok: true, notificationsCreated: created.length });
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getRecipients(supabase: any, merchantId: string | null, staffRole: string) {
  const { data: staff } = await supabase.from("profiles").select("id, locale").eq("role", staffRole);
  const recipients: { id: string; locale: string }[] = (staff ?? []).map(
    (p: { id: string; locale?: string }) => ({ id: p.id, locale: p.locale ?? "en" }),
  );

  if (merchantId) {
    const { data: merchantProfile } = await supabase
      .from("profiles")
      .select("id, locale")
      .eq("merchant_id", merchantId)
      .maybeSingle();
    if (merchantProfile) {
      recipients.push({ id: merchantProfile.id, locale: merchantProfile.locale ?? "en" });
    }
  }

  return recipients;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function alreadySent(supabase: any, recipientId: string, type: string) {
  const { data } = await supabase
    .from("notifications")
    .select("id")
    .eq("recipient_id", recipientId)
    .eq("type", type)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function deliver(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  recipient: { id: string },
  type: string,
  title: string,
  body: string,
  html?: string,
) {
  await supabase.from("notifications").insert({ recipient_id: recipient.id, channel: "in_app", type, title, body });

  const { data: userRes } = await supabase.auth.admin.getUserById(recipient.id);
  const email = userRes?.user?.email;
  if (email) {
    const sent = await sendEmail(email, title, body, html);
    await supabase.from("notifications").insert({
      recipient_id: recipient.id,
      channel: "email",
      type,
      title,
      body: sent ? body : `${body} (skipped — SMTP not configured)`,
    });
  }
}
