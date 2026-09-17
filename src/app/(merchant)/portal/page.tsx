import { createClient } from "@/lib/supabase/server";
import { MerchantPortalApp } from "@/components/portal/merchant-portal-app";

export default async function PortalPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("merchant_id, merchants(name)")
    .eq("id", user!.id)
    .single();

  const merchantId = profile?.merchant_id ?? "";

  const { data: leases } = await supabase
    .from("leases")
    .select(
      "id, start_date, end_date, billing_status, is_locked, units(id, code), invoices(id, period_start, period_end, due_date, status, invoice_line_items(label, amount), payments(amount))",
    )
    .eq("merchant_id", merchantId)
    .eq("status", "active");

  const { data: documents } = merchantId
    ? await supabase
        .from("documents")
        .select("id, name, file_path, doc_type, created_at")
        .eq("merchant_id", merchantId)
        .order("created_at", { ascending: false })
    : { data: [] };

  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, type, department, status, created_at, units(code)")
    .order("created_at", { ascending: false });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <MerchantPortalApp
      merchantName={profile?.merchants?.name ?? "My Shop"}
      leases={leases ?? []}
      documents={documents ?? []}
      tickets={tickets ?? []}
      today={today}
    />
  );
}
