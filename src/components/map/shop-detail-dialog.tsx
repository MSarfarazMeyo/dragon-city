"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import {
  createLease,
  getUnitHistory,
  vacateLease,
  type LeaseFormState,
} from "@/app/(staff)/map/lease-actions";
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
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type HistoryLease = Awaited<ReturnType<typeof getUnitHistory>>[number];

export type ShopDetailUnit = {
  id: string;
  code: string;
  category: string | null;
  area_sqm: number | null;
};

export function ShopDetailDialog({
  unit,
  merchants,
  open,
  onOpenChange,
}: {
  unit: ShopDetailUnit | null;
  merchants: { id: string; name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        {/* keyed by unit id so switching shops (or reopening) always starts
            from a clean loading/leasing state, without an effect calling
            setState synchronously to reset it */}
        {/* Both create-lease and vacate mutate data this dialog doesn't
            re-fetch on its own — closing on success is simpler and more
            honest than trying to keep local state in sync, and the map
            behind it has already revalidated by the time this closes. */}
        {unit && (
          <ShopDetailBody key={unit.id} unit={unit} merchants={merchants} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ShopDetailBody({
  unit,
  merchants,
  onClose,
}: {
  unit: ShopDetailUnit;
  merchants: { id: string; name: string }[];
  onClose: () => void;
}) {
  const [history, setHistory] = useState<HistoryLease[] | null>(null);
  const [leasingNow, setLeasingNow] = useState(false);

  useEffect(() => {
    getUnitHistory(unit.id).then(setHistory);
  }, [unit.id]);

  const activeLease = history?.find((l) => l.status === "active");
  const pastLeases = history?.filter((l) => l.status !== "active") ?? [];

  return (
    <>
      <DialogHeader>
        <DialogTitle>{unit.code}</DialogTitle>
        <DialogDescription>
          {[unit.category, unit.area_sqm ? `${unit.area_sqm} m²` : null].filter(Boolean).join(" · ") || "No details set"}
        </DialogDescription>
      </DialogHeader>

      {history === null ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : activeLease ? (
        <ActiveLeaseCard lease={activeLease} onVacated={onClose} />
      ) : leasingNow ? (
        <CreateLeaseForm unitId={unit.id} merchants={merchants} onDone={onClose} onCancel={() => setLeasingNow(false)} />
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="mb-3 text-sm text-muted-foreground">This shop is free.</p>
          <Button size="sm" onClick={() => setLeasingNow(true)}>
            Lease this shop
          </Button>
        </div>
      )}

      {pastLeases.length > 0 && (
        <div className="space-y-2 border-t pt-4">
          <h3 className="text-sm font-medium">History</h3>
          <ul className="space-y-1.5">
            {pastLeases.map((l) => (
              <li key={l.id} className="flex items-center justify-between text-sm">
                <span>{l.merchants?.name ?? "Unknown merchant"}</span>
                <span className="text-muted-foreground">
                  {l.start_date} → {l.end_date ?? "?"} · {l.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function ActiveLeaseCard({ lease, onVacated }: { lease: HistoryLease; onVacated: () => void }) {
  const [state, formAction, pending] = useActionState<LeaseFormState, FormData>(vacateLease, null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      onVacated();
    }
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, state]);

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <span className="font-medium">{lease.merchants?.name ?? "Unknown merchant"}</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            lease.billing_status === "active" && "bg-sky-500/10 text-sky-700 dark:text-sky-400",
            lease.billing_status === "free_use" && "bg-violet-500/10 text-violet-700 dark:text-violet-400",
            lease.billing_status === "fit_out" && "bg-orange-500/10 text-orange-700 dark:text-orange-400",
          )}
        >
          {lease.billing_status.replace("_", " ")}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Term</dt>
        <dd>{lease.start_date} → {lease.end_date ?? "open"}</dd>
        {lease.rent_amount != null && (
          <>
            <dt className="text-muted-foreground">Rent</dt>
            <dd>{lease.rent_amount}</dd>
          </>
        )}
        {lease.service_contract_no && (
          <>
            <dt className="text-muted-foreground">Service contract</dt>
            <dd>{lease.service_contract_no}</dd>
          </>
        )}
        {lease.cooperation_contract_no && (
          <>
            <dt className="text-muted-foreground">Cooperation contract</dt>
            <dd>{lease.cooperation_contract_no}</dd>
          </>
        )}
      </dl>

      <form action={formAction}>
        <input type="hidden" name="lease_id" value={lease.id} />
        {state?.error && <p className="mb-2 text-sm text-destructive">{state.error}</p>}
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "Marking vacated…" : "Mark vacated"}
        </Button>
      </form>
    </div>
  );
}

function CreateLeaseForm({
  unitId,
  merchants,
  onDone,
  onCancel,
}: {
  unitId: string;
  merchants: { id: string; name: string }[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [creatingMerchant, setCreatingMerchant] = useState(merchants.length === 0);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<LeaseFormState, FormData>(createLease, null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      onDone();
    }
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, state]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="unit_id" value={unitId} />

      <div className="space-y-2">
        <Label>Merchant</Label>
        {!creatingMerchant ? (
          <div className="flex gap-2">
            <select
              name="merchant_id"
              required
              className="border-input h-9 flex-1 rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <Button type="button" variant="outline" size="sm" onClick={() => setCreatingMerchant(true)}>
              New
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input name="new_merchant_name" placeholder="Merchant name" required />
            {merchants.length > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setCreatingMerchant(false)}>
                Use existing
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="start_date">Start date</Label>
          <Input id="start_date" name="start_date" type="date" defaultValue={today} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">End date</Label>
          <Input id="end_date" name="end_date" type="date" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="rent_amount">Rent</Label>
          <Input id="rent_amount" name="rent_amount" type="number" step="0.01" placeholder="Optional" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deposit">Deposit</Label>
          <Input id="deposit" name="deposit" type="number" step="0.01" placeholder="Optional" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="service_fee">Service fee</Label>
          <Input id="service_fee" name="service_fee" type="number" step="0.01" placeholder="Optional" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="service_contract_no">Service contract no.</Label>
          <Input id="service_contract_no" name="service_contract_no" placeholder="NDW-2024-…" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cooperation_contract_no">Cooperation contract no.</Label>
          <Input id="cooperation_contract_no" name="cooperation_contract_no" placeholder="EUT-2024-…" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="billing_status">Billing status</Label>
        <select
          id="billing_status"
          name="billing_status"
          defaultValue="active"
          className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        >
          <option value="active">Active (billed normally)</option>
          <option value="fit_out">Fit-out (not yet open)</option>
          <option value="free_use">Free use (occupied, unbilled)</option>
        </select>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Create lease"}
        </Button>
      </DialogFooter>
    </form>
  );
}
