"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type LineItem = { label: string; amount: number };
type Invoice = {
  id: string;
  period_start: string;
  period_end: string;
  due_date: string;
  status: string;
  invoice_line_items: LineItem[];
  payments: { amount: number }[];
  unitCode?: string;
};

function money(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PortalInvoiceCards({ invoices, today }: { invoices: Invoice[]; today: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {invoices.map((inv) => {
        const total = inv.invoice_line_items.reduce((s, li) => s + li.amount, 0);
        const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
        const balance = total - paid;
        const overdue = inv.status === "pending" && inv.due_date < today;
        const isOpen = expanded === inv.id;

        return (
          <Card key={inv.id} className="shadow-sm overflow-hidden">
            <button
              type="button"
              className="w-full text-start"
              onClick={() => setExpanded(isOpen ? null : inv.id)}
            >
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="text-base">
                    {inv.unitCode ? `${inv.unitCode} · ` : ""}
                    {inv.period_start} → {inv.period_end}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Due {inv.due_date}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={overdue ? "destructive" : inv.status === "paid" ? "secondary" : "outline"}
                  >
                    {overdue ? "Overdue" : inv.status === "paid" ? "Paid" : "Pending"}
                  </Badge>
                  {isOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 pb-4 pt-0 text-sm">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</div>
                  <div className="font-semibold tabular-nums">SAR {money(total)}</div>
                </div>
                <div className="text-end">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Balance</div>
                  <div
                    className={cn(
                      "font-semibold tabular-nums",
                      balance > 0.01 && "text-rose-600 dark:text-rose-400",
                    )}
                  >
                    SAR {money(balance)}
                  </div>
                </div>
              </CardContent>
            </button>

            {isOpen && (
              <>
                <Separator />
                <CardContent className="space-y-2 py-3">
                  {inv.invoice_line_items.map((li, i) => (
                    <div key={i} className="flex justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{li.label}</span>
                      <span className="tabular-nums shrink-0">{money(li.amount)}</span>
                    </div>
                  ))}
                </CardContent>
              </>
            )}
          </Card>
        );
      })}
    </div>
  );
}
