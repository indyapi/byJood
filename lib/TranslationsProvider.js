"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import en from "./translations/en.json";
import th from "./translations/th.json";

const ALL_TRANSLATIONS = { en, th };

const LangContext = createContext(null);

const STORAGE_KEY = "locale";

function resolve(obj, path) {
  return path.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
}

export function TranslationsProvider({ children }) {
  const [locale, setLocaleState] = useState("th");
  const [ready, setReady] = useState(false);
  const [fading, setFading] = useState(false);
  const [translations, setTranslations] = useState(null);
  const pendingLocale = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const lang = saved === "en" ? "en" : "th";
    setTranslations(ALL_TRANSLATIONS[lang]);
    setLocaleState(lang);
    setReady(true);
    document.documentElement.lang = lang;
  }, []);

  const setLocale = useCallback((next) => {
    if (next === locale || fading) return;
    pendingLocale.current = next;
    setFading(true);
    setTimeout(() => {
      const lang = pendingLocale.current;
      setTranslations(ALL_TRANSLATIONS[lang]);
      setLocaleState(lang);
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
      requestAnimationFrame(() => setFading(false));
    }, 160);
  }, [locale, fading]);

  const t = useCallback((key, vars) => {
    const str = translations ? resolve(translations, key) : null;
    if (str == null) return key;
    if (vars) {
      return str.replace(/\{\{([\w.]+)\}\}|\{([\w.]+)\}/g, (m, d1, d2) => {
        const name = d1 || d2;
        return Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : m;
      });
    }
    return str;
  }, [translations]);

  if (!ready) {
    return <div style={{ background: "#12151b", minHeight: "100vh" }} />;
  }

  return (
    <LangContext.Provider value={{ locale, setLocale, t }}>
      <div className={`page-wrap ${fading ? "fade-out" : "fade-in"}`}>
        {children}
      </div>
      <style>{`
        .page-wrap { transition: opacity 0.16s ease, transform 0.16s ease; }
        .page-wrap.fade-out { opacity: 0; transform: translateY(4px); }
        .page-wrap.fade-in { opacity: 1; transform: translateY(0); }
      `}</style>
    </LangContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LangContext);
  if (!ctx) return { locale: "th", setLocale: () => {}, t: (k) => k };
  return ctx;
}
