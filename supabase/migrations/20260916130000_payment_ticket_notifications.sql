-- Extends the immediate-notification set from Sprint 6 (invoice_created)
-- to payments and tickets, per the same notifyNow() pattern
-- (src/lib/notify.ts). offset_days is unused for these (see the
-- comment on invoice_created's migration) but kept 0 since the column
-- is not-null.
insert into public.notification_rules (event, offset_days, template) values
  ('payment_recorded', 0, 'A payment of {{amount}} was recorded for {{unit_code}}.'),
  ('ticket_created', 0, 'New {{ticket_type}} ticket for {{unit_code}}.'),
  ('ticket_resolved', 0, 'Ticket resolved: {{ticket_type}} ({{unit_code}}).');
