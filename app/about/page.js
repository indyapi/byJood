"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/TranslationsProvider";
import { ArrowLeft } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <main className="gl-about">
      <div className="gl-card-lg">
        <Breadcrumb paths={[{ label: t("nav.about"), href: "/about" }]} />
        <Link href="/" className="gl-back">
          <ArrowLeft size={15} /> {t("common.back")}
        </Link>
        <span className="gl-badge-sm">ABOUT</span>
        <h1 className="gl-about-title">{t("about.title")}</h1>
        <p className="gl-about-body">{t("about.body")}</p>
        <div className="gl-about-cards">
          <div className="gl-info-card">
            <div className="gl-info-shape"><div className="gl-fig-circle" /></div>
            <h3>{t("about.card1Title")}</h3>
            <p>{t("about.card1Desc")}</p>
          </div>
          <div className="gl-info-card">
            <div className="gl-info-shape"><div className="gl-fig-square" /></div>
            <h3>{t("about.card2Title")}</h3>
            <p>{t("about.card2Desc")}</p>
          </div>
          <div className="gl-info-card">
            <div className="gl-info-shape"><div className="gl-fig-triangle" /></div>
            <h3>{t("about.card3Title")}</h3>
            <p>{t("about.card3Desc")}</p>
          </div>
        </div>
      </div>
      <style>{`
        .gl-about {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 84px 24px 24px;
          background: var(--bg-body);
        }
        .gl-card-lg {
          width: 100%;
          max-width: 680px;
          background: var(--glass-bg);
          backdrop-filter: blur(var(--glass-blur-lg));
          -webkit-backdrop-filter: blur(var(--glass-blur-lg));
          border: 1px solid var(--glass-border);
          border-radius: var(--radius);
          padding: 40px;
        }
        .gl-back {
          display: inline-flex; align-items: center; gap: 6px;
          color: var(--text-secondary); font-size: 12px;
          padding: 7px 12px;
          border-radius: var(--radius-sm);
          margin-bottom: 18px;
          background: var(--glass-bg-dark);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--glass-border);
          text-decoration: none;
          transition: border-color .15s;
        }
        .gl-back:hover { border-color: var(--glass-border-light); }
        .gl-badge-sm {
          font-family: var(--font-mono);
          font-size: 9.5px; letter-spacing: .14em;
          color: var(--accent);
        }
        .gl-about-title {
          font-family: var(--font-display);
          font-size: 30px; font-weight: 600;
          margin: 6px 0 14px;
        }
        .gl-about-body {
          color: var(--text-secondary);
          font-size: 14px; line-height: 1.7;
          margin-bottom: 32px;
        }
        .gl-about-cards { display: flex; flex-direction: column; gap: 12px; }
        .gl-info-card {
          background: var(--glass-bg-dark);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius);
          padding: 22px;
        }
        .gl-info-shape { margin-bottom: 10px; }
        .gl-fig-circle { width: 18px; height: 18px; border-radius: 50%; background: var(--accent); }
        .gl-fig-square { width: 18px; height: 18px; background: var(--bokeh-4); }
        .gl-fig-triangle {
          width: 0; height: 0;
          border-left: 9px solid transparent;
          border-right: 9px solid transparent;
          border-bottom: 16px solid var(--bokeh-2);
        }
        .gl-info-card h3 {
          font-family: var(--font-display);
          font-size: 14px; font-weight: 600;
          margin-bottom: 6px;
        }
        .gl-info-card p {
          font-size: 12.5px;
          color: var(--text-secondary);
          line-height: 1.65;
        }
        @media (max-width: 720px) {
          .gl-about { padding: 80px 14px 20px; }
          .gl-card-lg { padding: 24px 18px; }
        }
      `}</style>
    </main>
  );
}
