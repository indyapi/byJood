"use client";

import { useTranslation } from "@/lib/TranslationsProvider";

export default function LangSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="gl-lang">
      <button
        className={`gl-lang-btn ${locale === "th" ? "active" : ""}`}
        onClick={() => setLocale("th")}
      >
        TH
      </button>
      <span className="gl-lang-div">/</span>
      <button
        className={`gl-lang-btn ${locale === "en" ? "active" : ""}`}
        onClick={() => setLocale("en")}
      >
        EN
      </button>
      <style>{`
        .gl-lang {
          display: flex;
          align-items: center;
          gap: 2px;
          margin-left: 8px;
          padding-left: 10px;
          border-left: 1px solid var(--glass-border);
        }
        .gl-lang-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          font-family: var(--font-display);
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
          padding: 3px 5px;
          letter-spacing: .06em;
          transition: color .15s;
        }
        .gl-lang-btn:hover { color: var(--text); }
        .gl-lang-btn.active { color: var(--accent); }
        .gl-lang-div { color: var(--glass-border); font-size: 10px; font-weight: 500; }
      `}</style>
    </div>
  );
}
