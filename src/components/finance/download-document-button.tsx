"use client";

import { getDocumentUrl } from "@/app/(staff)/finance/documents-actions";
import { Button } from "@/components/ui/button";

export function DownloadDocumentButton({ filePath }: { filePath: string }) {
  return (
    <Button
      type="button"
      variant="link"
      size="sm"
      className="h-auto p-0"
      onClick={async () => {
        const url = await getDocumentUrl(filePath);
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      }}
    >
      Download
    </Button>
  );
}
