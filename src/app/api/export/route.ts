import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";

// Session-scoped, not service-role: exports respect the same RLS as
// every other read in the app, so a finance/ops/admin session gets
// what it's allowed to see and nothing more.
export async function GET(request: NextRequest) {
  const entity = request.nextUrl.searchParams.get("entity");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rows: Record<string, unknown>[] = [];

  if (entity === "units") {
    const { data } = await supabase.from("units").select("code, category, area_sqm, grid_order, zones(code)");
    rows = (data ?? []).map((u) => ({
      code: u.code,
      zone: u.zones?.code ?? "",
      category: u.category ?? "",
      area_sqm: u.area_sqm ?? "",
      grid_order: u.grid_order,
    }));
  } else if (entity === "leases") {
    const { data } = await supabase
      .from("leases")
      .select("start_date, end_date, status, billing_status, rent_amount, deposit, service_fee, is_locked, units(code), merchants(name)");
    rows = (data ?? []).map((l) => ({
      shop: l.units?.code ?? "",
      merchant: l.merchants?.name ?? "",
      start_date: l.start_date,
      end_date: l.end_date ?? "",
      status: l.status,
      billing_status: l.billing_status,
      rent_amount: l.rent_amount ?? "",
      deposit: l.deposit ?? "",
      service_fee: l.service_fee ?? "",
      is_locked: l.is_locked,
    }));
  } else if (entity === "invoices") {
    const { data } = await supabase
      .from("invoices")
      .select("period_start, period_end, due_date, status, leases(units(code), merchants(name)), invoice_line_items(amount), payments(amount)");
    rows = (data ?? []).map((inv) => {
      const total = inv.invoice_line_items.reduce((s, li) => s + li.amount, 0);
      const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
      return {
        shop: inv.leases?.units?.code ?? "",
        merchant: inv.leases?.merchants?.name ?? "",
        period_start: inv.period_start,
        period_end: inv.period_end,
        due_date: inv.due_date,
        status: inv.status,
        total: total.toFixed(2),
        paid: paid.toFixed(2),
        balance: (total - paid).toFixed(2),
      };
    });
  } else if (entity === "merchants") {
    const { data } = await supabase
      .from("merchants")
      .select("name, type, contact_phone, contact_name, cr_number, contact_email");
    rows = (data ?? []).map((m) => ({
      name: m.name,
      type: m.type,
      phone: m.contact_phone ?? "",
      contact_name: m.contact_name ?? "",
      cr_number: m.cr_number ?? "",
      contact_email: m.contact_email ?? "",
    }));
  } else if (entity === "tickets") {
    const { data } = await supabase
      .from("tickets")
      .select("type, department, status, description, created_at, resolved_at, units(code), merchants(name)");
    rows = (data ?? []).map((t) => ({
      type: t.type,
      department: t.department,
      status: t.status,
      shop: t.units?.code ?? "",
      merchant: t.merchants?.name ?? "",
      description: t.description ?? "",
      created_at: t.created_at,
      resolved_at: t.resolved_at ?? "",
    }));
  } else {
    return NextResponse.json(
      { error: "Unknown entity. Use units, leases, invoices, merchants, or tickets." },
      { status: 400 },
    );
  }

  const csv = toCsv(rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${entity}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
