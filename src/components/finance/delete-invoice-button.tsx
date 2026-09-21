"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { deleteInvoice } from "@/app/(staff)/invoices/actions";
import { Button } from "@/components/ui/button";

export function DeleteInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Permanently delete this invoice? This cannot be undone.")) return;
        startTransition(async () => {
          const result = await deleteInvoice(invoiceId);
          if (!result?.error) router.push("/invoices");
        });
      }}
    >
      <Trash2 className="size-4" />
      {pending ? "Deleting…" : "Delete invoice"}
    </Button>
  );
}
