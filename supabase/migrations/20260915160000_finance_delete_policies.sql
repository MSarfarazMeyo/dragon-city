-- Allow finance/admin to delete invoices (and related rows via app code).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'invoices' and policyname = 'invoices_delete_admin_finance'
  ) then
    create policy "invoices_delete_admin_finance" on public.invoices for delete
      using (public.current_role() in ('admin', 'finance'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'invoice_line_items' and policyname = 'invoice_line_items_delete_admin_finance'
  ) then
    create policy "invoice_line_items_delete_admin_finance" on public.invoice_line_items for delete
      using (public.current_role() in ('admin', 'finance'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'payments' and policyname = 'payments_delete_admin_finance'
  ) then
    create policy "payments_delete_admin_finance" on public.payments for delete
      using (public.current_role() in ('admin', 'finance'));
  end if;
end $$;
