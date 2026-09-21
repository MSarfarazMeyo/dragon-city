-- Sprint 5 (tickets upgrade): the ticket detail Activity trail is meant
-- to be visible to every staff role, not just admins ("all can see, who
-- performed operation on it" — tickets have no per-role visibility
-- restriction elsewhere). audit_log itself stays admin-only for every
-- other entity; this adds one narrow, additive read policy scoped to
-- entity_type = 'tickets' so operations/finance/maintenance can read
-- just that slice.

create policy "audit_log_select_tickets_staff" on public.audit_log for select
  using (
    entity_type = 'tickets'
    and public.current_role() in ('admin', 'operations', 'finance', 'maintenance')
  );
