"use client";

import { useActionState, useRef } from "react";
import { Camera } from "lucide-react";

import { uploadAvatar, type AvatarFormState } from "@/lib/avatar-actions";
import { cn } from "@/lib/utils";

// Reused by the merchant Overview tab (logo) and the staff detail page
// (profile pic) — see src/lib/avatar-actions.ts for the shared server
// action. Renders the current image (signed URL resolved by the caller,
// since the bucket is private) or a set of initials, with a small
// camera-button overlay to replace it.
export function AvatarUpload({
  target,
  entityId,
  currentUrl,
  fallbackText,
  revalidate,
  size = "lg",
}: {
  target: "merchant" | "staff";
  entityId: string;
  currentUrl: string | null;
  fallbackText: string;
  revalidate: string;
  size?: "md" | "lg";
}) {
  const [state, formAction, pending] = useActionState<AvatarFormState, FormData>(uploadAvatar, null);
  const formRef = useRef<HTMLFormElement>(null);

  const dims = size === "lg" ? "size-20 text-xl" : "size-12 text-sm";

  return (
    <div className="flex items-center gap-3">
      <form ref={formRef} action={formAction} className="relative">
        <input type="hidden" name="target" value={target} />
        <input type="hidden" name="entity_id" value={entityId} />
        <input type="hidden" name="revalidate" value={revalidate} />
        <label
          className={cn(
            "relative flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border bg-secondary font-semibold text-secondary-foreground",
            dims,
            pending && "opacity-60",
          )}
        >
          {currentUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentUrl} alt="" className="size-full object-cover" />
          ) : (
            <span>{fallbackText}</span>
          )}
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/50 py-1 text-white">
            <Camera className="size-3.5" />
          </span>
          <input
            type="file"
            name="file"
            accept="image/*"
            className="sr-only"
            disabled={pending}
            onChange={() => formRef.current?.requestSubmit()}
          />
        </label>
      </form>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </div>
  );
}
