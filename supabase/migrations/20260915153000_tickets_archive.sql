-- Soft-archive tickets + allow admin hard-delete.
alter table public.tickets
  add column if not exists archived_at timestamptz;

create index if not exists tickets_archived_at_idx on public.tickets (archived_at);
create index if not exists tickets_status_idx on public.tickets (status);
create index if not exists tickets_department_idx on public.tickets (department);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'tickets' and policyname = 'tickets_delete_admin'
  ) then
    create policy "tickets_delete_admin" on public.tickets for delete
      using (public.current_role() = 'admin');
  end if;
end $$;
