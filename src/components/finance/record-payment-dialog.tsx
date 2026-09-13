"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { recordPayment, type FinanceFormState } from "@/app/(staff)/finance/actions";
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

export function RecordPaymentDialog({ invoiceId, balance }: { invoiceId: string; balance: number }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<FinanceFormState, FormData>(recordPayment, null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setOpen(false);
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Record payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="invoice_id" value={invoiceId} />
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>Outstanding balance: {balance.toFixed(2)}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" name="amount" type="number" step="0.01" defaultValue={balance > 0 ? balance.toFixed(2) : undefined} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Method</Label>
              <Input id="method" name="method" placeholder="Bank transfer, cash…" />
            </div>
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
