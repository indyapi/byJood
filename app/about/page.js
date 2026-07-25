"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/TranslationsProvider";

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <main className="pg">
      <div className="pg-inner">
        <span className="pg-badge">ABOUT</span>
        <h1 className="pg-title">{t("about.title")}</h1>
        <p className="pg-body">{t("about.body")}</p>

        <div className="cards">
          <div className="card-about">
            <h3>🎯 {t("about.card1Title")}</h3>
            <p>{t("about.card1Desc")}</p>
          </div>
          <div className="card-about">
            <h3>⚙️ {t("about.card2Title")}</h3>
            <p>{t("about.card2Desc")}</p>
          </div>
          <div className="card-about">
            <h3>🔐 {t("about.card3Title")}</h3>
            <p>{t("about.card3Desc")}</p>
          </div>
        </div>

        <Link href="/" className="back-link">← {t("common.back")}</Link>
      </div>

      <style>{`
        .pg { padding: 120px 28px 60px; min-height: 100vh; }
        .pg-inner { max-width: 700px; margin: 0 auto; }
        .pg-badge { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: 0.14em; color: #4fd1c5; }
        .pg-title { font-family: 'Space Grotesk', sans-serif; font-size: 36px; font-weight: 700; margin: 8px 0 20px; }
        .pg-body { color: #8b93a3; font-size: 15px; line-height: 1.7; margin-bottom: 40px; }
        .cards { display: flex; flex-direction: column; gap: 14px; }
        .card-about { background: #1a1e26; border: 1px solid #2a2f3a; border-radius: 12px; padding: 22px; }
        .card-about h3 { font-size: 16px; margin-bottom: 8px; }
        .card-about p { font-size: 13px; color: #8b93a3; line-height: 1.7; }
        .back-link { display: inline-block; margin-top: 32px; color: #4fd1c5; text-decoration: none; font-size: 14px; }
        .back-link:hover { text-decoration: underline; }
      `}</style>
    </main>
  );
}
