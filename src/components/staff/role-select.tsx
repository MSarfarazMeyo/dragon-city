"use client";

import { useTransition } from "react";

import { updateStaffRole, type StaffRoleValue } from "@/app/(staff)/staff/actions";

export function RoleSelect({ userId, role }: { userId: string; role: StaffRoleValue }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={role}
      disabled={pending}
      onChange={(e) => startTransition(() => updateStaffRole(userId, e.target.value as StaffRoleValue))}
      className="border-input h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:opacity-60"
    >
      <option value="admin">Admin</option>
      <option value="operations">Operations</option>
      <option value="finance">Finance</option>
      <option value="maintenance">Maintenance</option>
    </select>
  );
}
