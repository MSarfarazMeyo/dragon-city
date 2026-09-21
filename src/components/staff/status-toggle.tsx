"use client";

import { useTransition } from "react";
import { Ban, CheckCircle2 } from "lucide-react";

import { updateStaffStatus } from "@/app/(staff)/staff/actions";
import { Button } from "@/components/ui/button";

export function StatusToggle({ userId, status }: { userId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const isActive = status === "active";

  return (
    <Button
      type="button"
      size="sm"
      variant={isActive ? "outline" : "default"}
      disabled={pending}
      onClick={() => startTransition(() => updateStaffStatus(userId, isActive ? "inactive" : "active"))}
    >
      {isActive ? <Ban className="size-4" /> : <CheckCircle2 className="size-4" />}
      {isActive ? "Deactivate" : "Reactivate"}
    </Button>
  );
}
