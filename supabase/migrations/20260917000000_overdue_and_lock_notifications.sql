-- Rounds out the notification_rules set with the two event types that were
-- missing a row: an overdue reminder (invoice_due with a *positive*
-- offset_days — the cron route at src/app/api/cron/notify/route.ts reads a
-- positive offset as "days after due date" and renders it with the new
-- "Invoice overdue" email template), and lease_lock_changed (fired
-- immediately by toggleLock in src/app/(staff)/invoices/actions.ts, same
-- notifyNow() pattern as invoice_created/payment_recorded — this row just
-- makes its fallback template editable from Settings like every other
-- event, though notifyNow() works fine without it).
insert into public.notification_rules (event, offset_days, template) values
  ('invoice_due', 3, 'Invoice for {{unit_code}} is overdue — it was due {{due_date}}.'),
  ('lease_lock_changed', 0, 'Your lease for {{unit_code}} lock status has changed.');
