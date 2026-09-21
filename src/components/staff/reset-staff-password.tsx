"use client";

import { useActionState, useState } from "react";
import { KeyRound } from "lucide-react";

import { resetStaffPassword, type StaffFormState } from "@/app/(staff)/staff/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetStaffPassword({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState<StaffFormState, FormData>(resetStaffPassword, null);
  const [resetting, setResetting] = useState(false);

  if (!resetting) {
    return (
      <Button variant="outline" size="sm" onClick={() => setResetting(true)}>
        <KeyRound className="size-4" />
        Reset password
      </Button>
    );
  }

  return (
    <form action={formAction} className="max-w-sm space-y-3">
      <input type="hidden" name="user_id" value={userId} />
      <div className="space-y-2">
        <Label htmlFor="new_password">New password</Label>
        <Input id="new_password" name="password" type="text" placeholder="At least 8 characters" required minLength={8} />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save new password"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setResetting(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
