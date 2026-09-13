-- Sprint 4: department-routed tickets and the notification engine.

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references public.units (id),
  merchant_id uuid references public.merchants (id),
  department text not null check (department in ('operations', 'finance', 'maintenance')),
  type text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  assigned_to uuid references public.profiles (id),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- notifications is generic: recipient_id works for a staff profile today
-- and a merchant-portal profile once Sprint 5 exists, no schema change
-- needed either way.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id),
  channel text not null check (channel in ('in_app', 'email')),
  type text not null,
  title text not null,
  body text,
  related_ticket_id uuid references public.tickets (id),
  sent_at timestamptz not null default now(),
  read_at timestamptz
);

create table public.notification_rules (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  offset_days integer not null,
  template text not null
);

insert into public.notification_rules (event, offset_days, template) values
  ('invoice_due', -7, 'Invoice for {{unit_code}} is due in 7 days ({{due_date}}).'),
  ('invoice_due', -3, 'Invoice for {{unit_code}} is due in 3 days ({{due_date}}).'),
  ('invoice_due', 0, 'Invoice for {{unit_code}} is due today ({{due_date}}).'),
  ('lease_expiring', -30, 'Lease for {{unit_code}} expires in 30 days ({{end_date}}).');

alter table public.tickets enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_rules enable row level security;

-- department names line up with role names for finance/maintenance/
-- operations, so a department's own role can see and update its tickets;
-- admin sees and updates everything; a merchant sees tickets on their
-- own merchant_id.
create policy "tickets_select" on public.tickets for select
  using (
    public.current_role() = 'admin'
    or public.current_role() = department
    or (public.current_role() = 'merchant' and merchant_id = public.current_merchant_id())
  );
create policy "tickets_insert_staff" on public.tickets for insert
  with check (public.current_role() in ('admin', 'operations', 'finance', 'maintenance'));
create policy "tickets_update" on public.tickets for update
  using (public.current_role() = 'admin' or public.current_role() = department);

create policy "notifications_select_own" on public.notifications for select
  using (recipient_id = auth.uid());
create policy "notifications_update_own" on public.notifications for update
  using (recipient_id = auth.uid());
create policy "notifications_insert_staff" on public.notifications for insert
  with check (public.current_role() in ('admin', 'operations', 'finance', 'maintenance'));

create policy "notification_rules_select_authenticated" on public.notification_rules for select
  using (auth.uid() is not null);
create policy "notification_rules_write_admin" on public.notification_rules for all
  using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
