"use client";

import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/dictionaries";
import { saveLocalePreference } from "@/app/locale-actions";
import { cn } from "@/lib/utils";

const LOCALES: { value: Locale; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "zh", label: "中文" },
  { value: "ar", label: "عربي" },
];

export function LanguageSwitcher({
  className,
  tone = "default",
}: {
  className?: string;
  tone?: "default" | "onDark";
}) {
  const { locale, setLocale, t } = useI18n();

  function onPick(next: Locale) {
    setLocale(next);
    void saveLocalePreference(next);
  }

  return (
    <div className={cn("flex items-center gap-1", className)} role="group" aria-label={t.common.language}>
      {LOCALES.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onPick(item.value)}
          className={cn(
            "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
            tone === "onDark"
              ? locale === item.value
                ? "bg-white/15 text-white"
                : "text-[var(--sidebar-muted)] hover:bg-white/10 hover:text-white"
              : locale === item.value
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
