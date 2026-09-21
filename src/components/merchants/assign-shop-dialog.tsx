"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { createLease, type LeaseFormState } from "@/app/(staff)/map/lease-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Assigns an existing free shop to this merchant — the merchant side of
// the same createLease action the map's shop popup uses (map/lease-actions.ts),
// with merchant_id fixed instead of picked, since we're already on their page.
export function AssignShopDialog({
  merchantId,
  freeUnits,
}: {
  merchantId: string;
  freeUnits: { id: string; code: string }[];
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<LeaseFormState, FormData>(createLease, null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setOpen(false);
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={freeUnits.length === 0}>
          <Plus className="size-4" />
          Assign a shop
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Assign a shop to this merchant</DialogTitle>
            <DialogDescription>Only shops with no active lease are listed.</DialogDescription>
          </DialogHeader>

          <input type="hidden" name="merchant_id" value={merchantId} />

          <div className="space-y-2">
            <Label htmlFor="unit_id">Shop</Label>
            <select
              id="unit_id"
              name="unit_id"
              required
              className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
              {freeUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.code}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start date</Label>
              <Input id="start_date" name="start_date" type="date" defaultValue={today} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End date</Label>
              <Input id="end_date" name="end_date" type="date" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="rent_amount">Rent</Label>
              <Input id="rent_amount" name="rent_amount" type="number" step="0.01" placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit">Deposit</Label>
              <Input id="deposit" name="deposit" type="number" step="0.01" placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_fee">Service fee</Label>
              <Input id="service_fee" name="service_fee" type="number" step="0.01" placeholder="Optional" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing_status">Billing status</Label>
            <select
              id="billing_status"
              name="billing_status"
              defaultValue="active"
              className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
              <option value="active">Active (billed normally)</option>
              <option value="fit_out">Fit-out (not yet open)</option>
              <option value="free_use">Free use (occupied, unbilled)</option>
            </select>
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Assign shop"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
