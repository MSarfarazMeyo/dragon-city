"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { dictionaries, isLocale, type Dictionary, type Locale } from "@/lib/i18n/dictionaries";

const STORAGE_KEY = "dc-locale";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveServerLocale(initialLocale?: string | null): Locale {
  if (initialLocale && isLocale(initialLocale)) return initialLocale;
  return "en";
}

// useSyncExternalStore is the React-sanctioned way to read a client-only
// source (localStorage) without a hydration mismatch: it renders
// `getServerSnapshot()` (null) through hydration, then reconciles to the
// real value right after — unlike reading localStorage in a useState
// initializer or writing it back via setState-in-a-mount-effect, both of
// which either desync server/client markup or trigger React's
// set-state-in-effect warning for the same underlying reason.
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}
function getSnapshot(): Locale | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored && isLocale(stored) ? stored : null;
}
function getServerSnapshot(): Locale | null {
  return null;
}

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale?: string | null;
  children: React.ReactNode;
}) {
  const storedLocale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // A locale picked via setLocale this session takes priority over
  // localStorage until the next full reload (setLocale already wrote it
  // to localStorage too, but useSyncExternalStore only re-reads on a
  // "storage" event, which doesn't fire for writes made from this same
  // tab).
  const [overrideLocale, setOverrideLocale] = useState<Locale | null>(null);

  const locale = overrideLocale ?? storedLocale ?? resolveServerLocale(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    localStorage.setItem(STORAGE_KEY, next);
    setOverrideLocale(next);
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
