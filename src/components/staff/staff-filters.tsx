"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Input } from "@/components/ui/input";

const SELECT_CLASS =
  "border-input h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

export function StaffFilters({
  defaultQuery,
  defaultRole,
  defaultStatus,
}: {
  defaultQuery: string;
  defaultRole: string;
  defaultStatus: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(defaultQuery);

  function apply(nextQ: string, nextRole: string, nextStatus: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextQ.trim()) params.set("q", nextQ.trim());
    else params.delete("q");
    if (nextRole && nextRole !== "all") params.set("role", nextRole);
    else params.delete("role");
    if (nextStatus && nextStatus !== "all") params.set("status", nextStatus);
    else params.delete("status");
    params.delete("page");
    router.push(`/staff?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply(q, defaultRole, defaultStatus);
        }}
      >
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email…" className="max-w-xs" />
      </form>
      <select value={defaultRole} onChange={(e) => apply(q, e.target.value, defaultStatus)} className={SELECT_CLASS}>
        <option value="all">All roles</option>
        <option value="admin">Admin</option>
        <option value="operations">Operations</option>
        <option value="finance">Finance</option>
        <option value="maintenance">Maintenance</option>
      </select>
      <select value={defaultStatus} onChange={(e) => apply(q, defaultRole, e.target.value)} className={SELECT_CLASS}>
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  );
}
