"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { addShop, type AddShopState } from "@/app/(staff)/map/actions";
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
import { cn } from "@/lib/utils";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function AddShopDialog({
  zones,
}: {
  zones: { id: string; code: string; label: string | null }[];
}) {
  const [open, setOpen] = useState(false);
  const [creatingZone, setCreatingZone] = useState(zones.length === 0);
  const [code, setCode] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState<AddShopState, FormData>(addShop, null);
  const wasPending = useRef(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    // zones arrives as a prop, not state — re-sync the "new zone" default
    // each time the dialog opens, since the first shop created a zone
    // that didn't exist when this component first mounted.
    if (next) setCreatingZone(zones.length === 0);
  }

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setOpen(false);
      setCode("");
      setSlug("");
      setSlugTouched(false);
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Add shop
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add a shop</DialogTitle>
            <DialogDescription>Pick a zone, name the shop, save.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Zone</Label>
            {!creatingZone ? (
              <div className="flex gap-2">
                <select
                  name="zone_id"
                  required
                  className="border-input h-9 flex-1 rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.code}
                      {zone.label ? ` — ${zone.label}` : ""}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="outline" size="sm" onClick={() => setCreatingZone(true)}>
                  New zone
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input name="new_zone_code" placeholder="Zone code, e.g. H" required />
                <Input name="new_zone_label" placeholder="Label (optional)" />
                {zones.length > 0 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setCreatingZone(false)}>
                    Use existing
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="code">Shop code</Label>
              <Input
                id="code"
                name="code"
                placeholder="A-58"
                required
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                required
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area_sqm">Area (m&sup2;)</Label>
              <Input id="area_sqm" name="area_sqm" type="number" step="0.01" placeholder="Optional" />
            </div>
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={pending} className={cn(pending && "opacity-70")}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
