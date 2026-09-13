-- Bug fix: handle_new_user() was written in Sprint 0, before profiles
-- even had a merchant_id column (added in Sprint 2). It was never
-- updated, so every merchant account created since then — including via
-- the Sprint 5 "Create merchant account" flow, which passes merchant_id
-- in user_metadata exactly as role/full_name are passed — silently
-- ended up with merchant_id left null.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, merchant_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'operations'),
    new.raw_user_meta_data ->> 'full_name',
    nullif(new.raw_user_meta_data ->> 'merchant_id', '')::uuid
  );
  return new;
end;
$$;
