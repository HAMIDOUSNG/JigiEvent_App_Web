"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Locale } from "@/types";
import { translate, type TranslationKey } from "./dictionaries";

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "horizon360.locale";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    // One-time hydration from the browser's localStorage (external system sync).
    const saved = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved === "fr" || saved === "en") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback((key: TranslationKey) => translate(locale, key), [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
