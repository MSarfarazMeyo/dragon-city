"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { UserPlus } from "lucide-react";

import { convertLeadToMerchant, type LeasingFormState } from "@/app/(staff)/leads/actions";
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

type Lead = {
  id: string;
  prospect_name: string;
  contact_phone: string | null;
  notes: string | null;
};

export function ConvertLeadDialog({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<LeasingFormState, FormData>(convertLeadToMerchant, null);
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
          <UserPlus className="size-4" />
          Convert
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="lead_id" value={lead.id} />
          <DialogHeader>
            <DialogTitle>Convert to merchant</DialogTitle>
            <DialogDescription>
              Creates a merchant record and marks this lead as won.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor={`name-${lead.id}`}>Merchant name</Label>
            <Input id={`name-${lead.id}`} name="name" defaultValue={lead.prospect_name} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`type-${lead.id}`}>Type</Label>
              <select
                id={`type-${lead.id}`}
                name="type"
                defaultValue="individual"
                className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                <option value="individual">Individual</option>
                <option value="company">Company</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`phone-${lead.id}`}>Phone</Label>
              <Input
                id={`phone-${lead.id}`}
                name="contact_phone"
                defaultValue={lead.contact_phone ?? ""}
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`notes-${lead.id}`}>Notes</Label>
            <Input id={`notes-${lead.id}`} name="notes" defaultValue={lead.notes ?? ""} placeholder="Optional" />
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Converting…" : "Create merchant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
