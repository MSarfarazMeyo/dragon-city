-- Full product schema: visual map geometries, property status, document types,
-- price standards, leasing leads, floor backgrounds, invoice line templates,
-- and search indexes. Extends Sprints 0–6 without replacing them.

-- ---------------------------------------------------------------------------
-- Floors: background image for interactive map + i18n label
-- ---------------------------------------------------------------------------

alter table public.floors
  add column if not exists bg_image_path text,
  add column if not exists map_width integer,
  add column if not exists map_height integer,
  add column if not exists sort_order integer not null default 0,
  add column if not exists label_i18n jsonb;

comment on column public.floors.bg_image_path is 'Storage path in floor-plans bucket for interactive map background.';
comment on column public.floors.label_i18n is 'Optional {zh,en,ar} labels; falls back to label.';

-- Seed Food Court floor if missing (1F already seeded).
insert into public.floors (label, sort_order, label_i18n)
select 'Dragon City — Food Court', 1, '{"zh":"二楼餐厅","en":"Food Court","ar":"ساحة الطعام"}'::jsonb
where not exists (
  select 1 from public.floors where label ilike '%food%' or label ilike '%餐厅%'
);

update public.floors
set label_i18n = '{"zh":"一楼","en":"1F","ar":"الطابق الأول"}'::jsonb,
    sort_order = 0
where label ilike '%1F%' or label ilike '%一楼%' or label = 'Dragon City — 1F';

-- ---------------------------------------------------------------------------
-- Units: property status (ops) separate from finance overdue
-- ---------------------------------------------------------------------------

alter table public.units
  add column if not exists property_status text not null default 'unknown'
    check (property_status in (
      'normal', 'inventory', 'absconded', 'moved_out', 'showroom',
      'holding', 'follow_up', 'unknown', 'empty'
    ));

create index if not exists units_code_idx on public.units (code);
create index if not exists units_property_status_idx on public.units (property_status);

-- ---------------------------------------------------------------------------
-- Unit geometries for interactive map overlay
-- ---------------------------------------------------------------------------

create table if not exists public.unit_geometries (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units (id) on delete cascade,
  floor_id uuid not null references public.floors (id) on delete cascade,
  shape jsonb not null,
  map_width integer not null,
  map_height integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (unit_id)
);

comment on table public.unit_geometries is
  'shape is either {"type":"box","x":n,"y":n,"w":n,"h":n} or {"type":"polygon","points":[[x,y],...]} in map pixel coords.';

create trigger unit_geometries_set_updated_at
  before update on public.unit_geometries
  for each row execute function public.set_updated_at();

alter table public.unit_geometries enable row level security;

create policy "unit_geometries_select_authenticated"
  on public.unit_geometries for select using (auth.uid() is not null);
create policy "unit_geometries_write_admin_ops"
  on public.unit_geometries for insert with check (public.current_role() in ('admin', 'operations'));
create policy "unit_geometries_update_admin_ops"
  on public.unit_geometries for update using (public.current_role() in ('admin', 'operations'));
create policy "unit_geometries_delete_admin_ops"
  on public.unit_geometries for delete using (public.current_role() in ('admin', 'operations'));

create trigger audit_unit_geometries
  after insert or update or delete on public.unit_geometries
  for each row execute function public.audit_row_change();

-- ---------------------------------------------------------------------------
-- Documents: typed archive + optional lease/period link
-- ---------------------------------------------------------------------------

alter table public.documents
  add column if not exists doc_type text not null default 'other'
    check (doc_type in (
      'confirmation_letter', 'fee_notice', 'cr', 'iqama', 'contract', 'other'
    )),
  add column if not exists lease_id uuid references public.leases (id) on delete set null,
  add column if not exists period_start date,
  add column if not exists period_end date;

create index if not exists documents_merchant_id_idx on public.documents (merchant_id);
create index if not exists documents_doc_type_idx on public.documents (doc_type);

-- ---------------------------------------------------------------------------
-- Price standards (quoting)
-- ---------------------------------------------------------------------------

create table if not exists public.price_standards (
  id uuid primary key default gen_random_uuid(),
  zone_code text,
  category text,
  unit_price numeric not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger price_standards_set_updated_at
  before update on public.price_standards
  for each row execute function public.set_updated_at();

alter table public.price_standards enable row level security;

create policy "price_standards_select_authenticated"
  on public.price_standards for select using (auth.uid() is not null);
create policy "price_standards_write_admin"
  on public.price_standards for all
  using (public.current_role() in ('admin', 'operations', 'finance'))
  with check (public.current_role() in ('admin', 'operations', 'finance'));

-- ---------------------------------------------------------------------------
-- Invoice line templates (confirmation-letter grade defaults)
-- ---------------------------------------------------------------------------

create table if not exists public.invoice_line_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  label_i18n jsonb,
  default_amount numeric,
  is_deduction boolean not null default false,
  sort_order integer not null default 0
);

alter table public.invoice_line_templates enable row level security;

create policy "invoice_line_templates_select_authenticated"
  on public.invoice_line_templates for select using (auth.uid() is not null);
create policy "invoice_line_templates_write_admin_finance"
  on public.invoice_line_templates for all
  using (public.current_role() in ('admin', 'finance'))
  with check (public.current_role() in ('admin', 'finance'));

insert into public.invoice_line_templates (code, label, label_i18n, is_deduction, sort_order) values
  ('service_fee', 'Service Fee for Current Term', '{"zh":"本期服务费","en":"Service Fee for Current Term","ar":"رسوم الخدمة للفترة الحالية"}', false, 10),
  ('mgmt_fee', 'Management Fee for Current Term', '{"zh":"本期管理费","en":"Management Fee for Current Term","ar":"رسوم الإدارة للفترة الحالية"}', false, 20),
  ('deposit_delta', 'Deposit Difference Offset/Payment', '{"zh":"保证金差额","en":"Deposit Difference Offset/Payment","ar":"فرق التأمين"}', false, 30),
  ('balady', 'Balady Closure Deduction', '{"zh":"市政关闭扣减","en":"Balady Closure Deduction","ar":"خصم إغلاق البلدية"}', true, 40),
  ('pillar', 'Pillar Deduction', '{"zh":"柱子扣减","en":"Pillar Deduction","ar":"خصم العمود"}', true, 50),
  ('pos_balance', 'POS Balance Deduction', '{"zh":"POS余额扣减","en":"POS Balance Deduction","ar":"خصم رصيد نقاط البيع"}', true, 60),
  ('already_paid', 'Amount Already Paid for Current Term', '{"zh":"本期已付","en":"Amount Already Paid for Current Term","ar":"المبلغ المدفوع مسبقاً"}', true, 70),
  ('carried_arrears', 'Carried Arrears', '{"zh":"结转欠款","en":"Carried Arrears","ar":"متأخرات مرحلة"}', false, 80)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Leasing leads pipeline
-- ---------------------------------------------------------------------------

create table if not exists public.leasing_leads (
  id uuid primary key default gen_random_uuid(),
  prospect_name text not null,
  contact_phone text,
  contact_email text,
  interested_unit_ids uuid[] default '{}',
  stage text not null default 'inquiry'
    check (stage in ('inquiry', 'negotiation', 'won', 'lost')),
  notes text,
  converted_merchant_id uuid references public.merchants (id) on delete set null,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger leasing_leads_set_updated_at
  before update on public.leasing_leads
  for each row execute function public.set_updated_at();

alter table public.leasing_leads enable row level security;

create policy "leasing_leads_select_staff"
  on public.leasing_leads for select
  using (public.current_role() in ('admin', 'operations', 'finance'));
create policy "leasing_leads_write_admin_ops"
  on public.leasing_leads for insert
  with check (public.current_role() in ('admin', 'operations'));
create policy "leasing_leads_update_admin_ops"
  on public.leasing_leads for update
  using (public.current_role() in ('admin', 'operations'));
create policy "leasing_leads_delete_admin_ops"
  on public.leasing_leads for delete
  using (public.current_role() in ('admin', 'operations'));

create trigger audit_leasing_leads
  after insert or update or delete on public.leasing_leads
  for each row execute function public.audit_row_change();

-- ---------------------------------------------------------------------------
-- Employees (ops identity linked to profiles)
-- ---------------------------------------------------------------------------

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete set null,
  full_name text not null,
  department text check (department in ('operations', 'finance', 'maintenance', 'admin')),
  phone text,
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger employees_set_updated_at
  before update on public.employees
  for each row execute function public.set_updated_at();

alter table public.employees enable row level security;

create policy "employees_select_staff"
  on public.employees for select
  using (public.current_role() in ('admin', 'operations', 'finance', 'maintenance'));
create policy "employees_write_admin"
  on public.employees for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- ---------------------------------------------------------------------------
-- Profiles: language preference
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists locale text not null default 'en'
    check (locale in ('en', 'zh', 'ar'));

-- ---------------------------------------------------------------------------
-- Merchants search index
-- ---------------------------------------------------------------------------

create index if not exists merchants_name_idx on public.merchants (name);
create index if not exists leases_service_contract_idx on public.leases (service_contract_no);
create index if not exists leases_cooperation_contract_idx on public.leases (cooperation_contract_no);

-- ---------------------------------------------------------------------------
-- Notification rules: bilingual template columns (optional)
-- ---------------------------------------------------------------------------

alter table public.notification_rules
  add column if not exists template_i18n jsonb;

update public.notification_rules
set template_i18n = jsonb_build_object(
  'en', template,
  'zh', template,
  'ar', template
)
where template_i18n is null;

-- Allow floor-plans bucket updates (overwrite bg)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and policyname = 'floor_plans_bucket_update'
  ) then
    create policy "floor_plans_bucket_update" on storage.objects for update
      using (bucket_id = 'floor-plans' and public.current_role() in ('admin', 'operations'));
  end if;
end $$;
