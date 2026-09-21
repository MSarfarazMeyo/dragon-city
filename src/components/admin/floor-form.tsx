"use client";

import { useActionState } from "react";

import { updateFloor, type AdminFormState } from "@/app/(staff)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Floor = {
  id: string;
  label: string;
  bg_image_path: string | null;
  map_width: number | null;
  map_height: number | null;
  sort_order: number;
};

export function FloorForm({ floor }: { floor: Floor }) {
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(updateFloor, null);

  return (
    <form action={formAction} className="grid gap-3 rounded-md border p-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={floor.id} />
      <div className="space-y-1 sm:col-span-2">
        <Label className="text-xs">Label</Label>
        <Input name="label" defaultValue={floor.label} required />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label className="text-xs">Background image path</Label>
        <Input name="bg_image_path" defaultValue={floor.bg_image_path ?? ""} placeholder="floor-plans/ground.png" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Map width</Label>
        <Input name="map_width" type="number" defaultValue={floor.map_width ?? ""} placeholder="px" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Map height</Label>
        <Input name="map_height" type="number" defaultValue={floor.map_height ?? ""} placeholder="px" />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" size="sm" disabled={pending}>
          Save floor
        </Button>
        {state?.error && <p className="mt-1 text-xs text-destructive">{state.error}</p>}
      </div>
    </form>
  );
}
