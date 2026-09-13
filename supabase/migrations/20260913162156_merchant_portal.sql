-- Sprint 5: merchant portal. Accounts are still admin-provisioned only
-- (no self-signup) — this just lets an existing merchant account raise
-- its own tickets, scoped to its own merchant_id.

create policy "tickets_insert_merchant" on public.tickets for insert
  with check (public.current_role() = 'merchant' and merchant_id = public.current_merchant_id());
