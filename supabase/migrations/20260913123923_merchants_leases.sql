-- Sprint 2: merchants and leases. leases is the occupancy-history table —
-- a new tenant is a new row, never an edit — so "who has ever held this
-- shop" is just `select * from leases where unit_id = X order by start_date`.

create table public.merchants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'individual' check (type in ('individual', 'company')),
  cr_number text,
  contact_name text,
  contact_phone text,
  contact_email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger merchants_set_updated_at
  before update on public.merchants
  for each row execute function public.set_updated_at();

-- A merchant-role account is scoped to exactly one merchant (the portal
-- lands in Sprint 5, but the column belongs with the table it points at).
alter table public.profiles add column merchant_id uuid references public.merchants (id);

create or replace function public.current_merchant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select merchant_id from public.profiles where id = auth.uid();
$$;

create table public.leases (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units (id),
  merchant_id uuid not null references public.merchants (id),
  start_date date not null,
  end_date date,
  status text not null default 'active' check (status in ('active', 'expired', 'terminated')),
  billing_status text not null default 'active' check (billing_status in ('active', 'free_use', 'fit_out')),
  rent_amount numeric,
  deposit numeric,
  service_fee numeric,
  service_contract_no text,
  cooperation_contract_no text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.leases is 'One row per occupancy period. Never updated to change tenant — a new tenant is a new row. This table IS the unit''s history.';

-- A shop can only have one *active* tenancy at a time.
create unique index leases_one_active_per_unit on public.leases (unit_id) where (status = 'active');

create trigger leases_set_updated_at
  before update on public.leases
  for each row execute function public.set_updated_at();

alter table public.merchants enable row level security;
alter table public.leases enable row level security;

-- Staff read everything; a merchant account reads only its own row.
create policy "merchants_select" on public.merchants for select
  using (public.current_role() != 'merchant' or id = public.current_merchant_id());
create policy "merchants_write_admin_ops" on public.merchants for insert with check (public.current_role() in ('admin', 'operations'));
create policy "merchants_update_admin_ops" on public.merchants for update using (public.current_role() in ('admin', 'operations'));
create policy "merchants_delete_admin_ops" on public.merchants for delete using (public.current_role() in ('admin', 'operations'));

create policy "leases_select" on public.leases for select
  using (public.current_role() != 'merchant' or merchant_id = public.current_merchant_id());
create policy "leases_write_admin_ops" on public.leases for insert with check (public.current_role() in ('admin', 'operations'));
create policy "leases_update_admin_ops" on public.leases for update using (public.current_role() in ('admin', 'operations'));
create policy "leases_delete_admin_ops" on public.leases for delete using (public.current_role() in ('admin', 'operations'));
