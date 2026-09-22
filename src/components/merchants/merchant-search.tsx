"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/context";

const SELECT_CLASS =
  "border-input h-11 rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export function MerchantSearch({
  defaultQuery,
  defaultType,
}: {
  defaultQuery: string;
  defaultType: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [q, setQ] = useState(defaultQuery);

  function apply(nextQ: string, nextType: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextQ.trim()) params.set("q", nextQ.trim());
    else params.delete("q");
    if (nextType && nextType !== "all") params.set("type", nextType);
    else params.delete("type");
    params.delete("page");
    router.push(`/merchants?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <form
        className="relative flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          apply(q, defaultType);
        }}
      >
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.merchants.searchPlaceholder}
          className="h-11 ps-9"
        />
      </form>
      <select value={defaultType} onChange={(e) => apply(q, e.target.value)} className={SELECT_CLASS}>
        <option value="all">{t.merchants.typeAll}</option>
        <option value="individual">{t.merchants.typeIndividual}</option>
        <option value="company">{t.merchants.typeCompany}</option>
      </select>
    </div>
  );
}
