"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { createTicket, type TicketFormState } from "@/app/(staff)/tickets/actions";
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

export function CreateTicketDialog({
  units,
  merchants,
}: {
  units: { id: string; code: string }[];
  merchants: { id: string; name: string }[];
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<TicketFormState, FormData>(createTicket, null);
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
          {t.tickets.newTicket}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t.tickets.createDialogTitle}</DialogTitle>
            <DialogDescription>{t.tickets.createDialogDesc}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="department">{t.tickets.fieldDepartment}</Label>
            <select
              id="department"
              name="department"
              required
              className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
              <option value="maintenance">{t.tickets.deptMaintenance}</option>
              <option value="finance">{t.tickets.deptFinance}</option>
              <option value="operations">{t.tickets.deptOperations}</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">{t.tickets.fieldType}</Label>
            <Input id="type" name="type" placeholder={t.tickets.typePlaceholder} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="unit_id">{t.tickets.fieldShop}</Label>
              <select
                id="unit_id"
                name="unit_id"
                className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                <option value="">{t.tickets.none}</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.code}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="merchant_id">{t.tickets.fieldMerchant}</Label>
              <select
                id="merchant_id"
                name="merchant_id"
                className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                <option value="">{t.tickets.none}</option>
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t.tickets.fieldDescription}</Label>
            <textarea
              id="description"
              name="description"
              placeholder={t.tickets.descPlaceholder}
              rows={4}
              className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            />
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? t.tickets.creating : t.tickets.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
