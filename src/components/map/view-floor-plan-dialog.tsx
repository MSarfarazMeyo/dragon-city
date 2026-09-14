"use client";

import { useState } from "react";
import { FileText, ExternalLink } from "lucide-react";

import { getFloorPlanUrl } from "@/app/(staff)/map/floor-plan-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function ViewFloorPlanDialog({ path }: { path: string }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setUrl(await getFloorPlanUrl(path));
    } else {
      setUrl(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button variant="outline" size="sm" onClick={() => handleOpenChange(true)}>
        <FileText className="size-4" />
        Reference plan
      </Button>
      <DialogContent className="flex h-[85vh] max-w-4xl flex-col sm:max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4 pr-8">
            <div>
              <DialogTitle>Architectural reference</DialogTitle>
              <DialogDescription>
                For reference only — the map itself is entered by hand, never extracted from this file.
              </DialogDescription>
            </div>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="size-3.5" />
                Open in new tab
              </a>
            )}
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-hidden rounded-md border">
          {url ? (
            <iframe src={url} className="h-full w-full" title="Architectural reference floor plan" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
