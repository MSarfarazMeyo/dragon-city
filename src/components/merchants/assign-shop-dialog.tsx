"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { createLease, type LeaseFormState } from "@/app/(staff)/map/lease-actions";
import { useI18n } from "@/lib/i18n/context";
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
  const { t } = useI18n();
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
          {t.merchants.assignShop}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t.merchants.assignDialogTitle}</DialogTitle>
            <DialogDescription>{t.merchants.assignDialogDesc}</DialogDescription>
          </DialogHeader>

          <input type="hidden" name="merchant_id" value={merchantId} />

          <div className="space-y-2">
            <Label htmlFor="unit_id">{t.merchants.shopLabel}</Label>
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
              <Label htmlFor="start_date">{t.merchants.startDate}</Label>
              <Input id="start_date" name="start_date" type="date" defaultValue={today} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">{t.merchants.endDate}</Label>
              <Input id="end_date" name="end_date" type="date" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="rent_amount">{t.merchants.rent}</Label>
              <Input id="rent_amount" name="rent_amount" type="number" step="0.01" placeholder={t.merchants.optional} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit">{t.merchants.deposit}</Label>
              <Input id="deposit" name="deposit" type="number" step="0.01" placeholder={t.merchants.optional} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_fee">{t.merchants.serviceFee}</Label>
              <Input id="service_fee" name="service_fee" type="number" step="0.01" placeholder={t.merchants.optional} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing_status">{t.merchants.billingStatus}</Label>
            <select
              id="billing_status"
              name="billing_status"
              defaultValue="active"
              className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
              <option value="active">{t.merchants.billingActive}</option>
              <option value="fit_out">{t.merchants.billingFitOut}</option>
              <option value="free_use">{t.merchants.billingFreeUse}</option>
            </select>
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? t.merchants.assigning : t.merchants.assign}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
