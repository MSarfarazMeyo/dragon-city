"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

import { resendInvoiceEmail, type ResendEmailState } from "@/app/(staff)/invoices/actions";
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

// Reused on both the invoice side-panel (finance-board.tsx) and the
// full /invoices/[id] page — the merchant's own portal login always
// gets notified (in-app + email, same trigger as invoice creation);
// `merchantEmail` is just what's shown here for context, and an
// additional address can be added each time this is sent, e.g. to
// loop in someone at the company who doesn't have a portal login.
// Pass `null` when the caller already confirmed there's no portal
// account, or leave it `undefined` when that hasn't been looked up.
export function ResendInvoiceEmail({
  invoiceId,
  merchantEmail,
  fullWidth,
}: {
  invoiceId: string;
  merchantEmail?: string | null;
  fullWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<ResendEmailState, FormData>(resendInvoiceEmail, null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && state?.sent && !state.error) {
      setOpen(false);
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size={fullWidth ? "default" : "sm"}
          variant="outline"
          className={fullWidth ? "h-10 w-full" : undefined}
          onClick={(e) => e.stopPropagation()}
        >
          <Send className="size-4" />
          Resend email
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="invoice_id" value={invoiceId} />
          <DialogHeader>
            <DialogTitle>Resend invoice email</DialogTitle>
            <DialogDescription>
              {merchantEmail ? (
                <>
                  Always sent to the merchant&apos;s portal login (<span className="font-medium text-foreground">{merchantEmail}</span>), in-app and email.
                </>
              ) : merchantEmail === null ? (
                "This merchant has no portal login yet — only the extra address below will be emailed."
              ) : (
                "Always sent to the merchant's portal login, if they have one — in-app and email."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="extra_email">Also send to (optional)</Label>
            <Input id="extra_email" name="extra_email" type="email" placeholder="name@example.com" className="h-11" />
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
