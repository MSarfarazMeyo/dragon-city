import Link from "next/link";
import { notFound } from "next/navigation";
import { KeyRound, Store, Ticket, Wallet } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getAvatarUrl } from "@/lib/avatar-actions";
import { getViewerLocale } from "@/lib/locale";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { findMerchantAccount } from "@/app/(staff)/merchants/account-actions";
import { AccountPanel } from "@/components/merchants/account-panel";
import { AssignShopDialog } from "@/components/merchants/assign-shop-dialog";
import { VacateLeaseButton } from "@/components/merchants/vacate-lease-button";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { DetailTabs } from "@/components/ui/detail-tabs";
import { StatCard, StatCardRow } from "@/components/ui/stat-card";
import { DownloadDocumentButton } from "@/components/finance/download-document-button";
import { UploadDocumentDialog } from "@/components/finance/upload-document-dialog";
import { DOC_TYPE_LABEL, type DocType } from "@/lib/doc-types";
import { cn } from "@/lib/utils";

export default async function MerchantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const locale = await getViewerLocale(supabase);
  const t = dictionaries[locale].merchants;
  const tt = dictionaries[locale].tickets;

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, name, type, logo_path, cr_number, contact_name, contact_phone, contact_email, notes, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!merchant) notFound();

  const [{ data: leases }, { data: documents }, { data: tickets }, { data: allUnits }, { data: activeLeaseUnits }, account] =
    await Promise.all([
      supabase
        .from("leases")
        .select("id, start_date, end_date, status, is_locked, rent_amount, service_fee, units(id, code)")
        .eq("merchant_id", id)
        .order("start_date", { ascending: false }),
      supabase
        .from("documents")
        .select("id, name, file_path, doc_type, created_at")
        .eq("merchant_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("tickets")
        .select("id, type, department, status, description, created_at, resolved_at, units(code)")
        .eq("merchant_id", id)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase.from("units").select("id, code").order("code"),
      supabase.from("leases").select("unit_id").eq("status", "active"),
      findMerchantAccount(id),
    ]);

  const activeUnitIds = new Set((activeLeaseUnits ?? []).map((l) => l.unit_id));
  const freeUnits = (allUnits ?? []).filter((u) => !activeUnitIds.has(u.id));

  const leaseIds = (leases ?? []).map((l) => l.id);
  const { data: invoices } =
    leaseIds.length > 0
      ? await supabase
          .from("invoices")
          .select("id, period_start, period_end, due_date, status, lease_id, invoice_line_items(amount), payments(amount)")
          .in("lease_id", leaseIds)
          .order("due_date", { ascending: false })
          .limit(30)
      : { data: [] };

  const logoUrl = await getAvatarUrl(merchant.logo_path);
  const today = new Date().toISOString().slice(0, 10);
  const activeLeases = (leases ?? []).filter((l) => l.status === "active");
  const historyLeases = (leases ?? []).filter((l) => l.status !== "active");
  const openTickets = (tickets ?? []).filter((t) => t.status !== "resolved");

  let totalOutstanding = 0;
  for (const inv of invoices ?? []) {
    if (inv.status !== "pending") continue;
    const total = inv.invoice_line_items.reduce((s, li) => s + li.amount, 0);
    const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
    totalOutstanding += total - paid;
  }

  const typeLabel = merchant.type === "company" ? t.typeCompany : t.typeIndividual;
  const deptLabel = (dept: string) =>
    dept === "finance" ? tt.deptFinance : dept === "maintenance" ? tt.deptMaintenance : tt.deptOperations;
  const ticketStatusLabel = (status: string) =>
    status === "resolved" ? tt.statResolved : status === "in_progress" ? tt.statInProgress : tt.statOpen;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/merchants" className="text-sm text-muted-foreground hover:text-foreground">
          {t.backLink}
        </Link>
        <div className="mt-2 flex items-center gap-4">
          <AvatarUpload
            target="merchant"
            entityId={merchant.id}
            currentUrl={logoUrl}
            fallbackText={merchant.name.slice(0, 2).toUpperCase()}
            revalidate={`/merchants/${merchant.id}`}
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{merchant.name}</h1>
            <p className="text-muted-foreground text-sm">{typeLabel}</p>
          </div>
        </div>
      </div>

      <DetailTabs
        defaultTab="overview"
        tabs={[
          {
            id: "overview",
            label: t.tabOverview,
            content: (
              <div className="space-y-6">
                <StatCardRow>
                  <StatCard label={t.statActiveShops} value={activeLeases.length} icon={Store} tone="teal" />
                  <StatCard
                    label={t.statOutstanding}
                    value={`SAR ${totalOutstanding.toFixed(2)}`}
                    icon={Wallet}
                    tone={totalOutstanding > 0 ? "amber" : "neutral"}
                  />
                  <StatCard label={t.statOpenTickets} value={openTickets.length} icon={Ticket} tone={openTickets.length ? "rose" : "neutral"} />
                  <StatCard label={t.statLogin} value={account ? t.loginActive : t.loginNone} icon={KeyRound} tone={account ? "sky" : "neutral"} />
                </StatCardRow>

                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoCard label={t.infoContact} value={merchant.contact_name ?? "—"} />
                  <InfoCard label={t.infoPhone} value={merchant.contact_phone ?? "—"} />
                  <InfoCard label={t.infoEmail} value={merchant.contact_email ?? "—"} />
                  <InfoCard label={t.infoCrNumber} value={merchant.cr_number ?? "—"} />
                </section>

                {merchant.notes && (
                  <p className="rounded-lg border px-4 py-3 text-sm text-muted-foreground">{merchant.notes}</p>
                )}
              </div>
            ),
          },
          {
            id: "shops",
            label: t.tabShops,
            count: activeLeases.length,
            content: (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{t.activeShopsHeading}</h2>
                  <AssignShopDialog merchantId={merchant.id} freeUnits={freeUnits} />
                </div>
                {activeLeases.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.noActiveShops}</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
                          <th className="px-4 py-2 font-medium">{t.colUnit}</th>
                          <th className="px-4 py-2 font-medium">{t.colPeriod}</th>
                          <th className="px-4 py-2 font-medium text-right">{t.colRent}</th>
                          <th className="px-4 py-2 font-medium"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeLeases.map((l) => (
                          <tr key={l.id} className="border-b last:border-0">
                            <td className="px-4 py-2 font-medium">
                              {l.units ? (
                                <Link href={`/map/units/${l.units.id}`} className="hover:underline">
                                  {l.units.code}
                                </Link>
                              ) : (
                                "?"
                              )}
                            </td>
                            <td className="px-4 py-2 text-muted-foreground">
                              {l.start_date} → {l.end_date ?? t.open}
                            </td>
                            <td className="px-4 py-2 text-right tabular-nums">{l.rent_amount?.toFixed(2) ?? "—"}</td>
                            <td className="px-4 py-2 text-right">
                              <VacateLeaseButton leaseId={l.id} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {historyLeases.length > 0 && (
                  <>
                    <h2 className="text-lg font-semibold">{t.leaseHistoryHeading}</h2>
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
                            <th className="px-4 py-2 font-medium">{t.colUnit}</th>
                            <th className="px-4 py-2 font-medium">{t.colPeriod}</th>
                            <th className="px-4 py-2 font-medium">{t.colStatus}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historyLeases.map((l) => (
                            <tr key={l.id} className="border-b last:border-0">
                              <td className="px-4 py-2 font-medium">{l.units?.code ?? "?"}</td>
                              <td className="px-4 py-2 text-muted-foreground">
                                {l.start_date} → {l.end_date ?? "—"}
                              </td>
                              <td className="px-4 py-2 capitalize">{l.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            ),
          },
          {
            id: "invoices",
            label: t.tabInvoices,
            count: invoices?.length ?? 0,
            content: (
              <div className="space-y-3">
                {!invoices || invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.noInvoicesYet}</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
                          <th className="px-4 py-2 font-medium">{t.colPeriod}</th>
                          <th className="px-4 py-2 font-medium">{t.colDue}</th>
                          <th className="px-4 py-2 font-medium text-right">{t.colTotal}</th>
                          <th className="px-4 py-2 font-medium text-right">{t.colBalance}</th>
                          <th className="px-4 py-2 font-medium">{t.colStatus}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((inv) => {
                          const total = inv.invoice_line_items.reduce((s, li) => s + li.amount, 0);
                          const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
                          const balance = total - paid;
                          const overdue = inv.status === "pending" && inv.due_date < today;
                          return (
                            <tr key={inv.id} className="border-b last:border-0">
                              <td className="px-4 py-2 text-muted-foreground">
                                <Link href={`/invoices/${inv.id}`} className="hover:underline">
                                  {inv.period_start} → {inv.period_end}
                                </Link>
                              </td>
                              <td className="px-4 py-2 text-muted-foreground">{inv.due_date}</td>
                              <td className="px-4 py-2 text-right tabular-nums">{total.toFixed(2)}</td>
                              <td className="px-4 py-2 text-right tabular-nums">{balance.toFixed(2)}</td>
                              <td className="px-4 py-2">
                                <span
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-xs font-medium",
                                    inv.status === "paid" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                                    inv.status === "pending" && !overdue && "bg-sky-500/10 text-sky-700 dark:text-sky-400",
                                    overdue && "bg-rose-500/10 text-rose-700 dark:text-rose-400",
                                  )}
                                >
                                  {overdue ? t.invoiceOverdue : inv.status === "paid" ? t.invoicePaid : t.invoicePending}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ),
          },
          {
            id: "tickets",
            label: t.tabTickets,
            count: openTickets.length,
            content: (
              <div className="space-y-3">
                {!tickets || tickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.noTicketsFromMerchant}</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
                          <th className="px-4 py-2 font-medium">{t.colTicketType}</th>
                          <th className="px-4 py-2 font-medium">{t.colShop}</th>
                          <th className="px-4 py-2 font-medium">{t.colDepartment}</th>
                          <th className="px-4 py-2 font-medium">{t.colStatus}</th>
                          <th className="px-4 py-2 font-medium">{t.colOpened}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.map((t2) => (
                          <tr key={t2.id} className="border-b last:border-0">
                            <td className="px-4 py-2 font-medium">{t2.type}</td>
                            <td className="px-4 py-2 text-muted-foreground">{t2.units?.code ?? "—"}</td>
                            <td className="px-4 py-2 text-muted-foreground">{deptLabel(t2.department)}</td>
                            <td className="px-4 py-2">
                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-xs font-medium",
                                  t2.status === "resolved" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                                  t2.status === "open" && "bg-rose-500/10 text-rose-700 dark:text-rose-400",
                                  t2.status === "in_progress" && "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                                )}
                              >
                                {ticketStatusLabel(t2.status)}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-muted-foreground">{new Date(t2.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ),
          },
          {
            id: "documents",
            label: t.tabDocuments,
            count: documents?.length ?? 0,
            content: (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <UploadDocumentDialog merchants={[{ id: merchant.id, name: merchant.name }]} />
                </div>
                {!documents || documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.noDocuments}</p>
                ) : (
                  <ul className="divide-y rounded-lg border">
                    {documents.map((doc) => (
                      <li key={doc.id} className="flex items-center justify-between px-4 py-2 text-sm">
                        <div>
                          <div className="font-medium">{doc.name}</div>
                          <div className="text-muted-foreground text-xs">
                            {DOC_TYPE_LABEL[doc.doc_type as DocType] ?? doc.doc_type} ·{" "}
                            {new Date(doc.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <DownloadDocumentButton filePath={doc.file_path} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ),
          },
          {
            id: "account",
            label: t.tabAccount,
            content: <AccountPanel merchantId={merchant.id} account={account} />,
          },
        ]}
      />
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border px-4 py-3">
      <div className="text-xs tracking-wide text-muted-foreground uppercase">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
