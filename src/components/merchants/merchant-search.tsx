"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Input } from "@/components/ui/input";

export function MerchantSearch({ defaultQuery }: { defaultQuery: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(defaultQuery);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = q.trim();
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
    router.push(`/merchants?${params.toString()}`);
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name or phone…"
        className="max-w-xs"
      />
    </form>
  );
}
