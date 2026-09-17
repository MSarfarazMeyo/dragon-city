"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { createInvoice, type FinanceFormState } from "@/app/(staff)/finance/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

type Lease = { id: string; unit_code: string; merchant_name: string };
type Template = { code: string; label: string; is_deduction: boolean; sort_order: number };
type Row = { label: string; amount: string };

export function CreateInvoiceDialog({
  leases,
  templates,
}: {
  leases: Lease[];
  templates: Template[];
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([{ label: "Service fee", amount: "" }]);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<FinanceFormState, FormData>(createInvoice, null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setOpen(false);
      setRows([{ label: "Service fee", amount: "" }]);
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  function applyTemplate() {
    const sorted = [...templates].sort((a, b) => a.sort_order - b.sort_order);
    setRows(
      sorted.map((t) => ({
        label: t.label,
        amount: "",
      })),
    );
  }

  const lineItemsJson = JSON.stringify(
    rows
      .filter((r) => r.label.trim() && r.amount.trim())
      .map((r) => ({ label: r.label.trim(), amount: Number(r.amount) })),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Create invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form ref={formRef} action={formAction} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create an invoice</DialogTitle>
            <DialogDescription>Itemized, the way the mall&apos;s real letters are itemized — the total is always a sum.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="lease_id">Lease</Label>
            <select
              id="lease_id"
              name="lease_id"
              required
              className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
              {leases.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.unit_code} — {l.merchant_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="period_start">Period start</Label>
              <Input id="period_start" name="period_start" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period_end">Period end</Label>
              <Input id="period_end" name="period_end" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due date</Label>
              <Input id="due_date" name="due_date" type="date" required />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Line items</Label>
              {templates.length > 0 && (
                <Button type="button" variant="outline" size="sm" onClick={applyTemplate}>
                  Apply confirmation-letter template
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {rows.map((row, i) => {
                const isDeduction = templates.some(
                  (t) => t.label === row.label && t.is_deduction,
                );
                return (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="Label"
                    value={row.label}
                    onChange={(e) => setRows((r) => r.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                    className="flex-1"
                  />
                  <Input
                    placeholder={isDeduction ? "-0.00" : "Amount"}
                    type="number"
                    step="0.01"
                    value={row.amount}
                    onChange={(e) => setRows((r) => r.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))}
                    className="w-32"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setRows((r) => r.filter((_, j) => j !== i))}
                    disabled={rows.length === 1}
                    aria-label="Remove line"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              );
              })}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRows((r) => [...r, { label: "", amount: "" }])}
            >
              <Plus className="size-4" />
              Add line
            </Button>
            <p className="text-xs text-muted-foreground">
              Use a negative amount for deductions or an amount already paid. Unpaid balance from this lease&apos;s last invoice is added automatically as carried arrears.
            </p>
          </div>

          <input type="hidden" name="line_items" value={lineItemsJson} />

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Create invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
