"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

const TABS = [
  { id: "prices", label: "Price standards" },
  { id: "notifications", label: "Notification rules" },
  { id: "audit", label: "Audit log" },
  { id: "floors", label: "Floors" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function AdminTabs({ children }: { children: Record<TabId, React.ReactNode> }) {
  const [active, setActive] = useState<TabId>("prices");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active === tab.id
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {children[active]}
    </div>
  );
}
