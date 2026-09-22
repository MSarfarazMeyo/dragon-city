import Link from "next/link";
import { Suspense } from "react";
import { Building2, Download, Filter, KeyRound, Store, UserRound } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getAvatarUrl } from "@/lib/avatar-actions";
import { parsePageParams, pageCount } from "@/lib/pagination";
import { getViewerLocale } from "@/lib/locale";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { applyTemplateVars } from "@/lib/notification-template";
import { AddMerchantDialog } from "@/components/merchants/add-merchant-dialog";
import { ImportMerchantsDialog } from "@/components/merchants/import-merchants-dialog";
import { MerchantSearch } from "@/components/merchants/merchant-search";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { StatCard, StatCardRow } from "@/components/ui/stat-card";

export default async function MerchantsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const type = typeof params.type === "string" ? params.type : "all";
  const { page, pageSize, from, to } = parsePageParams(params);
  const supabase = await createClient();
  const locale = await getViewerLocale(supabase);
  const t = dictionaries[locale].merchants;

  let query = supabase
    .from("merchants")
    .select("id, name, type, logo_path, cr_number, contact_name, contact_phone, leases(status, units(code))", {
      count: "exact",
    })
    .order("name")
    .range(from, to);

  if (q.trim()) {
    const term = `%${q.trim()}%`;
    query = query.or(`name.ilike.${term},contact_phone.ilike.${term}`);
  }
  if (type !== "all") {
    query = query.eq("type", type);
  }

  const [{ data: merchants, count }, { count: totalCount }, { count: companyCount }, { count: individualCount }, { count: activeLeaseCount }, { count: loginCount }] =
    await Promise.all([
      query,
      supabase.from("merchants").select("id", { count: "exact", head: true }),
      supabase.from("merchants").select("id", { count: "exact", head: true }).eq("type", "company"),
      supabase.from("merchants").select("id", { count: "exact", head: true }).eq("type", "individual"),
      supabase.from("leases").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "merchant"),
    ]);

  const totalPages = pageCount(count, pageSize);

  const logoUrls = new Map(
    await Promise.all((merchants ?? []).map(async (m) => [m.id, await getAvatarUrl(m.logo_path)] as const)),
  );

  const hasFilters = Boolean(q || type !== "all");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <AddMerchantDialog />
      </div>

      <StatCardRow>
        <StatCard label={t.statTotal} value={totalCount ?? 0} icon={Store} tone="teal" />
        <StatCard label={t.statCompanies} value={companyCount ?? 0} icon={Building2} tone="sky" />
        <StatCard label={t.statIndividuals} value={individualCount ?? 0} icon={UserRound} tone="violet" />
        <StatCard
          label={t.statActiveShops}
          value={activeLeaseCount ?? 0}
          icon={KeyRound}
          tone="amber"
          hint={applyTemplateVars(t.statLogins, { n: String(loginCount ?? 0) })}
        />
      </StatCardRow>

      <Card className="shadow-sm">
        <CardContent className="space-y-3 p-3 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Suspense fallback={null}>
              <MerchantSearch defaultQuery={q} defaultType={type} />
            </Suspense>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" className="h-11" asChild>
                <a href="/api/export?entity=merchants">
                  <Download className="size-4" />
                  {t.exportCsv}
                </a>
              </Button>
              <ImportMerchantsDialog />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Filter className="size-3.5" />
            {!merchants || merchants.length === 0
              ? t.noMatchFilters
              : applyTemplateVars(t.showing, { from: String(from + 1), to: String(from + merchants.length), count: String(count ?? 0) })}
          </div>
        </CardContent>
      </Card>

      {!merchants || merchants.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {hasFilters ? (
              t.noMatchFiltersLong
            ) : (
              <>
                {t.emptyPrefix} <span className="font-medium text-foreground">{t.addMerchant}</span> {t.emptySuffix}
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">{t.colName}</th>
                <th className="px-4 py-3 font-medium">{t.colType}</th>
                <th className="px-4 py-3 font-medium">{t.colContact}</th>
                <th className="px-4 py-3 font-medium">{t.colActiveShops}</th>
              </tr>
            </thead>
            <tbody>
              {merchants.map((m) => {
                const activeShops = m.leases
                  .filter((l) => l.status === "active")
                  .map((l) => l.units?.code)
                  .filter(Boolean);
                const logoUrl = logoUrls.get(m.id);
                const typeLabel = m.type === "company" ? t.typeCompany : t.typeIndividual;
                return (
                  <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/merchants/${m.id}`} className="flex items-center gap-2.5 hover:underline">
                        <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground">
                          {logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={logoUrl} alt="" className="size-full object-cover" />
                          ) : (
                            m.name.slice(0, 2).toUpperCase()
                          )}
                        </span>
                        {m.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{typeLabel}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {m.contact_name || m.contact_phone
                        ? [m.contact_name, m.contact_phone].filter(Boolean).join(" · ")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {activeShops.length === 0 ? (
                        <span className="text-muted-foreground">{t.none}</span>
                      ) : (
                        <span title={activeShops.join(", ")}>
                          {activeShops.slice(0, 3).join(", ")}
                          {activeShops.length > 3 && (
                            <span className="text-muted-foreground">
                              {" "}
                              {applyTemplateVars(t.more, { n: String(activeShops.length - 3) })}
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}
