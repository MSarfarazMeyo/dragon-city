import type { ComponentType } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Shared stat-card row for detail-page tabs (unit/merchant/invoice/staff/
// tickets) — the "state card over each tab" pattern requested across the
// upgrade. Mirrors the KpiCard/MiniStat look already used on the
// dashboards page (src/app/(staff)/dashboards/page.tsx) so the whole app
// reads as one system instead of two different stat-tile styles.

export type StatTone = "neutral" | "teal" | "rose" | "amber" | "sky" | "violet";

const TONES: Record<StatTone, string> = {
  neutral: "bg-secondary text-secondary-foreground",
  teal: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
  rose: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  sky: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  violet: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
};

export type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ComponentType<{ className?: string }>;
  tone?: StatTone;
};

export function StatCard({ label, value, hint, icon: Icon, tone = "neutral" }: StatCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-3 py-4">
        {Icon && (
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", TONES[tone])}>
            <Icon className="size-4" />
          </div>
        )}
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold tabular-nums">{value}</div>
          {hint && <div className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatCardRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>{children}</div>;
}
