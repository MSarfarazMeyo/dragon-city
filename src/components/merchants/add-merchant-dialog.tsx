"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { addMerchant, type AddMerchantState } from "@/app/(staff)/merchants/actions";
import { useI18n } from "@/lib/i18n/context";
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

export function AddMerchantDialog() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<AddMerchantState, FormData>(addMerchant, null);
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
        <Button size="sm">
          <Plus className="size-4" />
          {t.merchants.addMerchant}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t.merchants.addDialogTitle}</DialogTitle>
            <DialogDescription>{t.merchants.addDialogDesc}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">{t.merchants.fieldName}</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">{t.merchants.fieldType}</Label>
              <select
                id="type"
                name="type"
                defaultValue="individual"
                className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                <option value="individual">{t.merchants.typeIndividual}</option>
                <option value="company">{t.merchants.typeCompany}</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cr_number">{t.merchants.fieldCrNumber}</Label>
              <Input id="cr_number" name="cr_number" placeholder={t.merchants.optional} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_name">{t.merchants.fieldContactName}</Label>
              <Input id="contact_name" name="contact_name" placeholder={t.merchants.optional} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone">{t.merchants.fieldPhone}</Label>
              <Input id="contact_phone" name="contact_phone" placeholder={t.merchants.optional} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="contact_email">{t.merchants.fieldEmail}</Label>
              <Input id="contact_email" name="contact_email" type="email" placeholder={t.merchants.optional} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">{t.merchants.fieldNotes}</Label>
              <Input id="notes" name="notes" placeholder={t.merchants.optional} />
            </div>
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? t.merchants.saving : t.merchants.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
