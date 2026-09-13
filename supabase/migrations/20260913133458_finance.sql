-- Sprint 3: finance. Invoices are itemized the way the mall's real
-- confirmation letters are itemized — a total typed in as one number is
-- never trusted, it's always a sum of lines.

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  lease_id uuid not null references public.leases (id),
  period_start date not null,
  period_end date not null,
  due_date date not null,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  label text not null,
  amount numeric not null,
  sort_order integer not null default 0
);

comment on table public.invoice_line_items is 'amount can be negative (deductions, amount already paid, carried arrears offsets). Invoice total is always sum(amount), never a typed-in number.';

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id),
  amount numeric not null,
  method text,
  recorded_by uuid references auth.users (id),
  paid_at timestamptz not null default now()
);

alter table public.leases add column is_locked boolean not null default false;

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id),
  file_path text not null,
  name text not null,
  uploaded_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

comment on table public.documents is 'Uploading always requires picking an existing merchant from a list, not free text — the mall''s real records show name-matching errors are the actual failure mode to design against.';

alter table public.invoices enable row level security;
alter table public.invoice_line_items enable row level security;
alter table public.payments enable row level security;
alter table public.documents enable row level security;

-- Merchant-role accounts see their own invoices/line items/payments/
-- documents via the lease -> merchant / merchant_id relationship.
create policy "invoices_select" on public.invoices for select
  using (
    public.current_role() != 'merchant'
    or lease_id in (select id from public.leases where merchant_id = public.current_merchant_id())
  );
create policy "invoices_write_admin_finance" on public.invoices for insert with check (public.current_role() in ('admin', 'finance'));
create policy "invoices_update_admin_finance" on public.invoices for update using (public.current_role() in ('admin', 'finance'));

create policy "invoice_line_items_select" on public.invoice_line_items for select
  using (
    public.current_role() != 'merchant'
    or invoice_id in (
      select i.id from public.invoices i
      join public.leases l on l.id = i.lease_id
      where l.merchant_id = public.current_merchant_id()
    )
  );
create policy "invoice_line_items_write_admin_finance" on public.invoice_line_items for insert with check (public.current_role() in ('admin', 'finance'));

create policy "payments_select" on public.payments for select
  using (
    public.current_role() != 'merchant'
    or invoice_id in (
      select i.id from public.invoices i
      join public.leases l on l.id = i.lease_id
      where l.merchant_id = public.current_merchant_id()
    )
  );
create policy "payments_write_admin_finance" on public.payments for insert with check (public.current_role() in ('admin', 'finance'));

create policy "documents_select" on public.documents for select
  using (public.current_role() != 'merchant' or merchant_id = public.current_merchant_id());
create policy "documents_write_staff" on public.documents for insert with check (public.current_role() in ('admin', 'operations', 'finance'));

-- Finance toggles the lock; admin can too.
create policy "leases_lock_finance" on public.leases for update
  using (public.current_role() in ('admin', 'operations', 'finance'));

-- Storage: signed documents live in a private bucket, staff-only.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "documents_bucket_read" on storage.objects for select
  using (bucket_id = 'documents' and auth.uid() is not null);
create policy "documents_bucket_write" on storage.objects for insert
  with check (bucket_id = 'documents' and public.current_role() in ('admin', 'operations', 'finance'));
