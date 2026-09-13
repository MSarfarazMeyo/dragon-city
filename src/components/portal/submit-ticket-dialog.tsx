"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { submitTicket, type PortalFormState } from "@/app/(merchant)/portal/actions";
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

export function SubmitTicketDialog({ units }: { units: { id: string; code: string }[] }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<PortalFormState, FormData>(submitTicket, null);
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
          Raise a ticket
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Raise a ticket</DialogTitle>
            <DialogDescription>Goes straight to the department that handles it.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="department">What&apos;s this about?</Label>
            <select
              id="department"
              name="department"
              required
              className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
              <option value="maintenance">Maintenance / repair</option>
              <option value="finance">Finance / billing</option>
              <option value="operations">Operations / other</option>
            </select>
          </div>

          {units.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="unit_id">Shop</Label>
              <select
                id="unit_id"
                name="unit_id"
                className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.code}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="type">Summary</Label>
            <Input id="type" name="type" placeholder="AC not cooling, billing question…" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Details</Label>
            <Input id="description" name="description" placeholder="Optional" />
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Submitting…" : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
