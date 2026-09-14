-- Reference floor plan storage. floors.reference_pdf_url has existed
-- since Sprint 0 but nothing ever populated or displayed it — this is
-- that missing piece: a private bucket, staff-readable, admin/ops write.
-- The file itself is decorative only, same as always — never parsed.

insert into storage.buckets (id, name, public)
values ('floor-plans', 'floor-plans', false)
on conflict (id) do nothing;

create policy "floor_plans_bucket_read" on storage.objects for select
  using (bucket_id = 'floor-plans' and auth.uid() is not null);

create policy "floor_plans_bucket_write" on storage.objects for insert
  with check (bucket_id = 'floor-plans' and public.current_role() in ('admin', 'operations'));
