"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Lang = "en" | "es";

interface LanguageCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LanguageContext = createContext<LanguageCtx>({ lang: "en", setLang: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("hl-lang");
    if (stored === "es") setLangState("es");
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("hl-lang", l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
