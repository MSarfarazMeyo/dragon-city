-- Sprint 0: foundation schema — profiles (roles), floors, zones, units.
-- The floor plan is a reference document only (floors.reference_pdf_url);
-- zones and units are the logical map, entered by hand via the app.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth.users row, carries the fixed role.
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'operations', 'finance', 'maintenance', 'merchant')),
  full_name text,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per auth user. role drives every RLS policy in the system.';

-- Auto-create a profile row whenever a user is created via the Auth admin
-- API. Role/full_name come from user_metadata, set by whoever provisions
-- the account (admin-provisioned accounts only — no public self-signup).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'operations'),
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Reads the caller's own role. security definer + a fixed search_path so it
-- can be called from inside other tables' RLS policies without those
-- policies recursing back into profiles' own RLS.
create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

alter table public.profiles enable row level security;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.current_role() = 'admin');

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (id = auth.uid() or public.current_role() = 'admin');

-- No insert/delete policy for clients: rows are created only by the
-- handle_new_user trigger (security definer) and managed via the
-- service-role admin API.

-- ---------------------------------------------------------------------------
-- floors / zones / units: the logical map.
-- ---------------------------------------------------------------------------

create table public.floors (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  reference_pdf_url text,
  created_at timestamptz not null default now()
);

comment on table public.floors is 'reference_pdf_url is a static reference document for humans — never parsed by the app.';

create table public.zones (
  id uuid primary key default gen_random_uuid(),
  floor_id uuid not null references public.floors (id) on delete cascade,
  code text not null,
  label text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (floor_id, code)
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.zones (id) on delete cascade,
  code text not null unique,
  slug text not null unique,
  category text,
  area_sqm numeric,
  grid_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.units is 'A shop. Added by hand via the "Add shop" form — never derived from the reference PDF.';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger units_set_updated_at
  before update on public.units
  for each row execute function public.set_updated_at();

alter table public.floors enable row level security;
alter table public.zones enable row level security;
alter table public.units enable row level security;

-- Any signed-in staff/merchant account can read the map. Only admin/
-- operations can author it (Sprint 0 has no leases yet, so there is no
-- merchant-specific scoping to enforce here — that lands with Sprint 2/3).
create policy "floors_select_authenticated" on public.floors for select using (auth.uid() is not null);
create policy "floors_write_admin_ops" on public.floors for insert with check (public.current_role() in ('admin', 'operations'));
create policy "floors_update_admin_ops" on public.floors for update using (public.current_role() in ('admin', 'operations'));
create policy "floors_delete_admin_ops" on public.floors for delete using (public.current_role() in ('admin', 'operations'));

create policy "zones_select_authenticated" on public.zones for select using (auth.uid() is not null);
create policy "zones_write_admin_ops" on public.zones for insert with check (public.current_role() in ('admin', 'operations'));
create policy "zones_update_admin_ops" on public.zones for update using (public.current_role() in ('admin', 'operations'));
create policy "zones_delete_admin_ops" on public.zones for delete using (public.current_role() in ('admin', 'operations'));

create policy "units_select_authenticated" on public.units for select using (auth.uid() is not null);
create policy "units_write_admin_ops" on public.units for insert with check (public.current_role() in ('admin', 'operations'));
create policy "units_update_admin_ops" on public.units for update using (public.current_role() in ('admin', 'operations'));
create policy "units_delete_admin_ops" on public.units for delete using (public.current_role() in ('admin', 'operations'));
