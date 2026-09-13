"use client";

import { useTransition } from "react";
import { assignToMe, updateStatus } from "@/app/(staff)/tickets/actions";
import { Button } from "@/components/ui/button";

export function TicketActions({
  ticketId,
  status,
  isAssigned,
}: {
  ticketId: string;
  status: "open" | "in_progress" | "resolved";
  isAssigned: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (status === "resolved") return null;

  return (
    <div className="flex justify-end gap-2">
      {!isAssigned && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => startTransition(() => assignToMe(ticketId))}>
          Assign to me
        </Button>
      )}
      {status === "open" && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => startTransition(() => updateStatus(ticketId, "in_progress"))}>
          Start
        </Button>
      )}
      <Button size="sm" disabled={pending} onClick={() => startTransition(() => updateStatus(ticketId, "resolved"))}>
        Resolve
      </Button>
    </div>
  );
}
