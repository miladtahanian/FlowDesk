import { create } from "zustand";
import i18n from "@/lib/i18n";

type Language = "en" | "fa";

interface LanguageState {
  language: Language;
  dir: "ltr" | "rtl";
  hydrated: boolean;
  setLanguage: (lang: Language) => void;
  hydrate: () => void;
}

function getDir(lang: Language): "ltr" | "rtl" {
  return lang === "fa" ? "rtl" : "ltr";
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: "en",
  dir: "ltr",
  hydrated: false,
  setLanguage: (lang) => {
    localStorage.setItem("language", lang);
    i18n.changeLanguage(lang);
    document.documentElement.dir = getDir(lang);
    document.documentElement.lang = lang;
    set({ language: lang, dir: getDir(lang) });
  },
  hydrate: () => {
    if (get().hydrated) return;
    try {
      const savedLang = (localStorage.getItem("language") as Language) || "en";
      document.documentElement.dir = getDir(savedLang);
      document.documentElement.lang = savedLang;
      i18n.changeLanguage(savedLang);
      set({ language: savedLang, dir: getDir(savedLang), hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
}));
