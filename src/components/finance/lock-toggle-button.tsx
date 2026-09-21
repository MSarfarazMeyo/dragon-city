"use client";

import { useTransition } from "react";
import { Lock, LockOpen } from "lucide-react";

import { toggleLock } from "@/app/(staff)/invoices/actions";
import { Button } from "@/components/ui/button";

export function LockToggleButton({ leaseId, locked }: { leaseId: string; locked: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={locked ? "destructive" : "ghost"}
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => toggleLock(leaseId, !locked))}
    >
      {locked ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
      {locked ? "Locked" : "Lock"}
    </Button>
  );
}
