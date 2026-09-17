"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

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
};

export function PortalInvoiceTable({ invoices, today }: { invoices: Invoice[]; today: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
            <th className="px-3 py-2 font-medium w-8"></th>
            <th className="px-3 py-2 font-medium">Period</th>
            <th className="px-3 py-2 font-medium">Due</th>
            <th className="px-3 py-2 font-medium text-right">Total</th>
            <th className="px-3 py-2 font-medium text-right">Balance</th>
            <th className="px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const total = inv.invoice_line_items.reduce((s, li) => s + li.amount, 0);
            const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
            const balance = total - paid;
            const overdue = inv.status === "pending" && inv.due_date < today;
            const isOpen = expanded === inv.id;

            return (
              <Fragment key={inv.id}>
                <tr className="border-b">
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : inv.id)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={isOpen ? "Collapse line items" : "Expand line items"}
                    >
                      {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {inv.period_start} → {inv.period_end}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{inv.due_date}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{total.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{balance.toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        inv.status === "paid" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                        inv.status === "pending" && !overdue && "bg-sky-500/10 text-sky-700 dark:text-sky-400",
                        overdue && "bg-rose-500/10 text-rose-700 dark:text-rose-400",
                      )}
                    >
                      {overdue ? "Overdue" : inv.status === "paid" ? "Paid" : "Pending"}
                    </span>
                  </td>
                </tr>
                {isOpen && (
                  <tr className="border-b bg-muted/20">
                    <td colSpan={6} className="px-3 py-2">
                      <ul className="space-y-1 text-xs">
                        {inv.invoice_line_items.map((li, i) => (
                          <li key={i} className="flex justify-between gap-4">
                            <span className="text-muted-foreground">{li.label}</span>
                            <span className="tabular-nums">{li.amount.toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
