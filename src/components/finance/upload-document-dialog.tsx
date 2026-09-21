"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";

import { uploadDocument, type FinanceFormState } from "@/app/(staff)/invoices/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DOC_TYPES, DOC_TYPE_LABEL } from "@/lib/doc-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

export function UploadDocumentDialog({ merchants }: { merchants: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<FinanceFormState, FormData>(uploadDocument, null);
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
          <Upload className="size-4" />
          Upload document
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Upload a signed document</DialogTitle>
            <DialogDescription>
              Always tied to a merchant picked from this list — never free-typed, since that&apos;s exactly where the old paper trail broke.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="merchant_id">Merchant</Label>
            <select
              id="merchant_id"
              name="merchant_id"
              required
              className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc_type">Document type</Label>
            <select
              id="doc_type"
              name="doc_type"
              defaultValue="other"
              className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {DOC_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <input
              id="file"
              name="file"
              type="file"
              required
              className="border-input flex h-9 w-full rounded-md border bg-transparent text-sm file:mr-3 file:h-full file:border-0 file:bg-secondary file:px-3 file:text-sm file:font-medium"
            />
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Uploading…" : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
