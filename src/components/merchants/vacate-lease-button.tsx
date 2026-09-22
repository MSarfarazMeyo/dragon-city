"use client";

import { useActionState } from "react";

import { vacateLease, type LeaseFormState } from "@/app/(staff)/map/lease-actions";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";

export function VacateLeaseButton({ leaseId }: { leaseId: string }) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState<LeaseFormState, FormData>(vacateLease, null);

  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="lease_id" value={leaseId} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? t.merchants.ending : t.merchants.endLease}
      </Button>
      {state?.error && <span className="text-xs text-destructive">{state.error}</span>}
    </form>
  );
}
