"use client";

import { useEffect } from "react";
import "@/lib/i18n";
import { useLanguageStore } from "@/stores/languageStore";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { dir, language, hydrate } = useLanguageStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [dir, language]);

  return <>{children}</>;
}
