"use client";

import { useActionState } from "react";

import { updateStaffName, type StaffFormState } from "@/app/(staff)/staff/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EditNameForm({ userId, fullName }: { userId: string; fullName: string | null }) {
  const [state, formAction, pending] = useActionState<StaffFormState, FormData>(updateStaffName, null);

  return (
    <form action={formAction} className="flex items-end gap-2">
      <input type="hidden" name="user_id" value={userId} />
      <div className="space-y-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" defaultValue={fullName ?? ""} className="w-56" />
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
