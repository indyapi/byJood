"use client";

import { useTranslation } from "@/lib/TranslationsProvider";

export default function LangSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="lang-switcher">
      <button
        className={`lang-btn ${locale === "th" ? "active" : ""}`}
        onClick={() => setLocale("th")}
        aria-label="切换到泰语"
      >
        TH
      </button>
      <span className="lang-divider">/</span>
      <button
        className={`lang-btn ${locale === "en" ? "active" : ""}`}
        onClick={() => setLocale("en")}
        aria-label="Switch to English"
      >
        EN
      </button>
      <style>{`
        .lang-switcher {
          display: flex;
          align-items: center;
          gap: 2px;
          margin-left: 6px;
          padding-left: 10px;
          border-left: 1px solid #2a2f3a;
        }
        .lang-btn {
          background: none;
          border: none;
          color: #5c6270;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 6px;
          border-radius: 4px;
          transition: color 0.15s, background 0.15s;
          letter-spacing: 0.04em;
        }
        .lang-btn:hover { color: #e8eaef; background: #20242e; }
        .lang-btn.active { color: #4fd1c5; background: rgba(79, 209, 197, 0.1); }
        .lang-divider { color: #2a2f3a; font-size: 11px; font-weight: 500; }
      `}</style>
    </div>
  );
}
