"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";

import { deletePriceStandard, upsertPriceStandard, type AdminFormState } from "@/app/(staff)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PriceStandard = {
  id: string;
  zone_code: string | null;
  category: string | null;
  unit_price: number;
  notes: string | null;
};

export function PriceStandardForm({ standard }: { standard?: PriceStandard }) {
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(upsertPriceStandard, null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2 rounded-md border p-3">
      {standard && <input type="hidden" name="id" value={standard.id} />}
      <div className="space-y-1">
        <Label className="text-xs">Zone</Label>
        <Input name="zone_code" defaultValue={standard?.zone_code ?? ""} placeholder="A" className="h-8 w-24" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Category</Label>
        <Input name="category" defaultValue={standard?.category ?? ""} placeholder="retail" className="h-8 w-28" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Unit price</Label>
        <Input
          name="unit_price"
          type="number"
          step="0.01"
          defaultValue={standard?.unit_price ?? ""}
          required
          className="h-8 w-28"
        />
      </div>
      <div className="min-w-[12rem] flex-1 space-y-1">
        <Label className="text-xs">Notes</Label>
        <Input name="notes" defaultValue={standard?.notes ?? ""} placeholder="Optional" className="h-8" />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {standard ? "Update" : "Add"}
      </Button>
      {standard && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => deletePriceStandard(standard.id)}
          aria-label="Delete price standard"
        >
          <Trash2 className="size-4" />
        </Button>
      )}
      {state?.error && <p className="w-full text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
