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
          border-left: 1px solid var(--border);
        }
        .lang-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 6px;
          border-radius: 4px;
          transition: color .15s, background .15s;
          letter-spacing: .04em;
        }
        .lang-btn:hover { color: var(--text); background: var(--surface-hover); }
        .lang-btn.active { color: var(--accent); background: var(--accent-dim); }
        .lang-divider { color: var(--border); font-size: 11px; font-weight: 500; }
      `}</style>
    </div>
  );
}
