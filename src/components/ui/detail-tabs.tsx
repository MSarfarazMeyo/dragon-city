"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Shared tabbed detail-page shell for unit/merchant/invoice/staff pages.
// Unlike admin-tabs.tsx's local useState, the active tab lives in
// `?tab=` — so a link like "/merchants/123?tab=invoices" from another
// page (e.g. an invoice row's "view merchant") lands straight on the
// right tab instead of always resetting to the first one.
export type DetailTab = {
  id: string;
  label: string;
  count?: number;
  content: React.ReactNode;
};

export function DetailTabs({ tabs, defaultTab }: { tabs: DetailTab[]; defaultTab?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("tab") ?? defaultTab ?? tabs[0]?.id;

  function setActive(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <Tabs value={active} onValueChange={setActive}>
      <TabsList variant="line" className="w-full justify-start overflow-x-auto">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5">
            {tab.label}
            {typeof tab.count === "number" && (
              <Badge variant="secondary" className="tabular-nums">
                {tab.count}
              </Badge>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="pt-4">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
