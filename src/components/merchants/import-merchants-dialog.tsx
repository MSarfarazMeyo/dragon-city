"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";

import { importMerchants, type ImportMerchantsState } from "@/app/(staff)/merchants/actions";
import { useI18n } from "@/lib/i18n/context";
import { applyTemplateVars } from "@/lib/notification-template";
import { Button } from "@/components/ui/button";
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

export function ImportMerchantsDialog() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<ImportMerchantsState, FormData>(importMerchants, null);
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
          {t.merchants.importCsv}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t.merchants.importDialogTitle}</DialogTitle>
            <DialogDescription>{t.merchants.importDialogDesc}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="file">{t.merchants.csvFile}</Label>
            <input
              id="file"
              name="file"
              type="file"
              accept=".csv,text/csv"
              required
              className="border-input flex h-9 w-full rounded-md border bg-transparent text-sm file:mr-3 file:h-full file:border-0 file:bg-secondary file:px-3 file:text-sm file:font-medium"
            />
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state?.imported != null && state.imported > 0 && (
            <p className="text-sm text-emerald-600">{applyTemplateVars(t.merchants.imported, { n: String(state.imported) })}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? t.merchants.importing : t.merchants.import}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
