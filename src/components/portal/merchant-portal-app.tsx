"use client";

import { Store } from "lucide-react";

import { MerchantShell, type MerchantTab } from "@/components/merchant-shell";
import { SubmitTicketDialog } from "@/components/portal/submit-ticket-dialog";
import { PortalInvoiceCards } from "@/components/portal/invoice-cards";
import { DownloadDocumentButton } from "@/components/finance/download-document-button";
import { DOC_TYPE_LABEL, type DocType } from "@/lib/doc-types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Unit = { id: string; code: string };
type LineItem = { label: string; amount: number };
type Invoice = {
  id: string;
  period_start: string;
  period_end: string;
  due_date: string;
  status: string;
  invoice_line_items: LineItem[];
  payments: { amount: number }[];
};
type Lease = {
  id: string;
  start_date: string;
  end_date: string | null;
  billing_status: string;
  is_locked: boolean;
  units: Unit | null;
  invoices: Invoice[];
};
type DocumentRow = {
  id: string;
  name: string;
  file_path: string;
  doc_type: string;
  created_at: string;
};
type TicketRow = {
  id: string;
  type: string;
  department: string;
  status: string;
  created_at: string;
  units: { code: string } | null;
};

export function MerchantPortalApp({
  merchantName,
  leases,
  documents,
  tickets,
  today,
}: {
  merchantName: string;
  leases: Lease[];
  documents: DocumentRow[];
  tickets: TicketRow[];
  today: string;
}) {
  const units = leases.map((l) => ({ id: l.units!.id, code: l.units!.code }));
  const anyLocked = leases.some((l) => l.is_locked);
  const allInvoices = leases.flatMap((l) =>
    l.invoices.map((inv) => ({ ...inv, unitCode: l.units?.code ?? "?" })),
  );

  return (
    <MerchantShell title={merchantName}>
      {(tab: MerchantTab) => {
        if (tab === "stall") {
          return (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">{merchantName}</h1>
                  <p className="text-sm text-muted-foreground">Your active shops and lease terms.</p>
                </div>
                <SubmitTicketDialog units={units} />
              </div>

              {anyLocked && (
                <Alert variant="destructive">
                  <AlertTitle>Account locked</AlertTitle>
                  <AlertDescription>
                    One or more shops is locked due to overdue payment. Contact mall finance to restore access.
                  </AlertDescription>
                </Alert>
              )}

              {leases.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
                    <Store className="size-8 opacity-40" />
                    <p>No active shops linked yet.</p>
                  </CardContent>
                </Card>
              ) : (
                leases.map((lease) => (
                  <Card key={lease.id} className="shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-lg">{lease.units?.code}</CardTitle>
                        <div className="flex gap-1.5">
                          {lease.is_locked && <Badge variant="destructive">Locked</Badge>}
                          <Badge variant="secondary" className="capitalize">
                            {lease.billing_status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription>
                        {lease.start_date} → {lease.end_date ?? "open"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      {lease.invoices.length} invoice{lease.invoices.length === 1 ? "" : "s"} on file
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          );
        }

        if (tab === "invoices") {
          return (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Invoices</h1>
                <p className="text-sm text-muted-foreground">What you owe and what is settled.</p>
              </div>
              {allInvoices.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">No invoices yet.</CardContent>
                </Card>
              ) : (
                <PortalInvoiceCards invoices={allInvoices} today={today} />
              )}
            </div>
          );
        }

        if (tab === "requests") {
          return (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">Requests</h1>
                  <p className="text-sm text-muted-foreground">Report a problem to mall staff.</p>
                </div>
                <SubmitTicketDialog units={units} />
              </div>
              {tickets.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">No tickets yet.</CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <Card key={ticket.id} className="shadow-sm">
                      <CardContent className="flex items-center justify-between gap-3 py-4">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{ticket.type}</div>
                          <div className="text-xs text-muted-foreground">
                            {ticket.units?.code ?? "General"} · {ticket.department}
                          </div>
                        </div>
                        <Badge
                          variant={
                            ticket.status === "resolved"
                              ? "secondary"
                              : ticket.status === "in_progress"
                                ? "outline"
                                : "default"
                          }
                          className="capitalize shrink-0"
                        >
                          {ticket.status.replace("_", " ")}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Documents</h1>
              <p className="text-sm text-muted-foreground">Contracts and confirmation letters on file.</p>
            </div>
            {documents.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">No documents on file.</CardContent>
              </Card>
            ) : (
              <Card className="shadow-sm">
                <CardContent className="divide-y p-0">
                  {documents.map((doc, i) => (
                    <div key={doc.id}>
                      {i > 0 && <Separator />}
                      <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{doc.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {DOC_TYPE_LABEL[doc.doc_type as DocType] ?? doc.doc_type} ·{" "}
                            {new Date(doc.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <DownloadDocumentButton filePath={doc.file_path} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        );
      }}
    </MerchantShell>
  );
}
