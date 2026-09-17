import { createClient } from "@/lib/supabase/server";
import { CreateInvoiceDialog } from "@/components/finance/create-invoice-dialog";
import { UploadDocumentDialog } from "@/components/finance/upload-document-dialog";
import { DownloadDocumentButton } from "@/components/finance/download-document-button";
import { FinanceBoard, type FinanceInvoiceRow } from "@/components/finance/finance-board";
import { DOC_TYPE_LABEL, type DocType } from "@/lib/doc-types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function FinancePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();

  const { data: activeLeases } = await supabase
    .from("leases")
    .select("id, is_locked, units(code), merchants(name)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const { data: invoices } = await supabase
    .from("invoices")
    .select(
      "id, period_start, period_end, due_date, status, paid_at, created_at, lease_id, leases(is_locked, units(code), merchants(name)), invoice_line_items(label, amount, sort_order), payments(id, amount, method, paid_at)",
    )
    .order("due_date", { ascending: false });

  const { data: merchants } = await supabase.from("merchants").select("id, name").order("name");

  const { data: templates } = await supabase
    .from("invoice_line_templates")
    .select("code, label, is_deduction, sort_order")
    .order("sort_order");

  const { data: documents } = await supabase
    .from("documents")
    .select("id, name, file_path, doc_type, created_at, merchants(name)")
    .order("created_at", { ascending: false })
    .limit(50);

  const leaseOptions = (activeLeases ?? []).map((l) => ({
    id: l.id,
    unit_code: l.units?.code ?? "?",
    merchant_name: l.merchants?.name ?? "?",
  }));

  const rows: FinanceInvoiceRow[] = (invoices ?? []).map((inv) => ({
    id: inv.id,
    lease_id: inv.lease_id,
    period_start: inv.period_start,
    period_end: inv.period_end,
    due_date: inv.due_date,
    status: inv.status,
    paid_at: inv.paid_at,
    created_at: inv.created_at,
    unit_code: inv.leases?.units?.code ?? "?",
    merchant_name: inv.leases?.merchants?.name ?? "?",
    is_locked: inv.leases?.is_locked ?? false,
    line_items: inv.invoice_line_items ?? [],
    payments: inv.payments ?? [],
  }));

  const today = new Date().toISOString().slice(0, 10);
  const canDelete = profile?.role === "admin" || profile?.role === "finance";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Finance</h1>
          <p className="text-sm text-muted-foreground">
            Click an invoice for line items, payments, lock confirmation, and delete.
          </p>
        </div>
        <CreateInvoiceDialog leases={leaseOptions} templates={templates ?? []} />
      </div>

      <FinanceBoard invoices={rows} today={today} canDelete={canDelete} />

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Documents</h2>
            <p className="text-xs text-muted-foreground">Recent uploads linked to merchants</p>
          </div>
          <UploadDocumentDialog merchants={merchants ?? []} />
        </div>

        {!documents || documents.length === 0 ? (
          <Card className="border-dashed shadow-none">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">No documents uploaded yet.</CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm overflow-hidden">
            <CardContent className="divide-y p-0">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{doc.name}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{doc.merchants?.name ?? "Unknown merchant"}</span>
                      <Badge variant="outline" className="font-normal">
                        {DOC_TYPE_LABEL[doc.doc_type as DocType] ?? doc.doc_type}
                      </Badge>
                    </div>
                  </div>
                  <DownloadDocumentButton filePath={doc.file_path} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
