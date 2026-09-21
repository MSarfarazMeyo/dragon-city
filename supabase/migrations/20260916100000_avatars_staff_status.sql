-- Upgrade sprint 0: shared building blocks for the merchant/staff hubs.
-- Adds a profile-picture/logo slot to merchants and staff, plus an
-- active/inactive switch for staff so deactivating someone doesn't
-- require deleting their auth user.

alter table public.merchants add column logo_path text;
alter table public.profiles add column avatar_path text;
alter table public.profiles add column status text not null default 'active' check (status in ('active', 'inactive'));

comment on column public.profiles.status is 'inactive blocks sign-in (enforced in the login server action) without deleting the auth user or losing history.';

-- Private bucket, shared by both merchant logos and staff avatars
-- (path prefix distinguishes them: merchants/<id>/..., staff/<id>/...).
-- Same read-all-authenticated / write-scoped-by-role shape as the
-- existing floor-plans and documents buckets.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

create policy "avatars_bucket_read" on storage.objects for select
  using (bucket_id = 'avatars' and auth.uid() is not null);

-- Matches merchants' own write policy (admin+operations) — staff avatars
-- are further restricted at the table level (profiles update stays
-- admin-only per Sprint 0 schema), so an operations upload of a staff
-- photo succeeds in storage but the profiles.avatar_path write is
-- rejected by RLS, same as any other cross-role write attempt.
create policy "avatars_bucket_write" on storage.objects for insert
  with check (bucket_id = 'avatars' and public.current_role() in ('admin', 'operations'));

create policy "avatars_bucket_update" on storage.objects for update
  using (bucket_id = 'avatars' and public.current_role() in ('admin', 'operations'));

create policy "avatars_bucket_delete" on storage.objects for delete
  using (bucket_id = 'avatars' and public.current_role() in ('admin', 'operations'));
