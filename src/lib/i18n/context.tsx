"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { dictionaries, isLocale, type Dictionary, type Locale } from "@/lib/i18n/dictionaries";

const STORAGE_KEY = "dc-locale";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveInitialLocale(initialLocale?: string | null): Locale {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isLocale(stored)) return stored;
  }
  if (initialLocale && isLocale(initialLocale)) return initialLocale;
  return "en";
}

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale?: string | null;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(() => resolveInitialLocale(initialLocale));

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: dictionaries[locale],
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
