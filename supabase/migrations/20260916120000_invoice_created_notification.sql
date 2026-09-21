-- Sprint 6 (invoices upgrade): invoices previously only emailed the
-- merchant via the daily cron poll (notification_rules events
-- invoice_due/-7/-3/0) — never at the moment the invoice is actually
-- created. offset_days is meaningless for an immediate trigger, so it's
-- stored as 0 and never read by notifyNow() (src/lib/notify.ts); it's
-- kept only because the column is not-null and the Settings page's
-- template editor (notification-rule-form.tsx) expects every row to
-- have one, same as every other rule.
insert into public.notification_rules (event, offset_days, template) values
  ('invoice_created', 0, 'A new invoice has been issued for {{unit_code}}, due {{due_date}}.');
