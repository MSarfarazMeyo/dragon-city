-- Sprint 6: audit log. This was in the original data model (every write
-- was supposed to mirror into it) but never actually got built in any
-- earlier sprint — this is the real thing, generic triggers included,
-- not just a page. Only starts capturing from here forward; nothing
-- retroactive for changes made in Sprints 0-5.

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  actor_id uuid references public.profiles (id),
  action text not null check (action in ('insert', 'update', 'delete')),
  diff jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_entity_idx on public.audit_log (entity_type, entity_id);
create index audit_log_created_at_idx on public.audit_log (created_at desc);

-- One generic function, attached to every audited table. security definer
-- so it can write here regardless of the acting role's own privileges —
-- the same pattern as current_role()/current_merchant_id(). On UPDATE it
-- stores only the fields that actually changed, as [old, new] pairs.
create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  changed jsonb := '{}'::jsonb;
  key text;
  old_json jsonb;
  new_json jsonb;
begin
  if TG_OP = 'UPDATE' then
    old_json := to_jsonb(OLD);
    new_json := to_jsonb(NEW);
    for key in select jsonb_object_keys(new_json) loop
      if new_json -> key is distinct from old_json -> key then
        changed := changed || jsonb_build_object(key, jsonb_build_array(old_json -> key, new_json -> key));
      end if;
    end loop;
    if changed = '{}'::jsonb then
      return NEW;
    end if;
    insert into public.audit_log (entity_type, entity_id, actor_id, action, diff)
    values (TG_TABLE_NAME, NEW.id, auth.uid(), 'update', changed);
    return NEW;
  elsif TG_OP = 'INSERT' then
    insert into public.audit_log (entity_type, entity_id, actor_id, action, diff)
    values (TG_TABLE_NAME, NEW.id, auth.uid(), 'insert', to_jsonb(NEW));
    return NEW;
  elsif TG_OP = 'DELETE' then
    insert into public.audit_log (entity_type, entity_id, actor_id, action, diff)
    values (TG_TABLE_NAME, OLD.id, auth.uid(), 'delete', to_jsonb(OLD));
    return OLD;
  end if;
  return null;
end;
$$;

create trigger audit_units after insert or update or delete on public.units for each row execute function public.audit_row_change();
create trigger audit_merchants after insert or update or delete on public.merchants for each row execute function public.audit_row_change();
create trigger audit_leases after insert or update or delete on public.leases for each row execute function public.audit_row_change();
create trigger audit_invoices after insert or update or delete on public.invoices for each row execute function public.audit_row_change();
create trigger audit_payments after insert or update or delete on public.payments for each row execute function public.audit_row_change();
create trigger audit_tickets after insert or update or delete on public.tickets for each row execute function public.audit_row_change();

alter table public.audit_log enable row level security;

create policy "audit_log_select_admin" on public.audit_log for select
  using (public.current_role() = 'admin');
