"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/TranslationsProvider";
import AuthGuard from "@/components/AuthGuard";

export default function ControlRoomPage() {
  const { t } = useTranslation();

  return (
    <AuthGuard>
    <main className="pg">
      <div className="pg-inner">
        <span className="pg-badge">CONTROL ROOM</span>
        <h1 className="pg-title">{t("controlRoom.title")}</h1>
        <p className="pg-body">{t("controlRoom.subtitle")}</p>

        <div className="cr-cards">
          <div className="cr-card">
            <div className="cr-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4fd1c5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div>
            <h3>{t("controlRoom.card1Title")}</h3>
            <p>{t("controlRoom.card1Desc")}</p>
            <div className="cr-tags">
              {["Facebook", "Instagram", "TikTok", "Threads", "Website"].map((t) => <span key={t} className="cr-tag">{t}</span>)}
            </div>
          </div>
          <div className="cr-card">
            <div className="cr-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f2b84b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
            <h3>{t("controlRoom.card2Title")}</h3>
            <p>{t("controlRoom.card2Desc")}</p>
          </div>
          <div className="cr-card">
            <div className="cr-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f2795c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
            <h3>{t("controlRoom.card3Title")}</h3>
            <p>{t("controlRoom.card3Desc")}</p>
          </div>
          <div className="cr-card">
            <div className="cr-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg></div>
            <h3>{t("controlRoom.card4Title")}</h3>
            <p>{t("controlRoom.card4Desc")}</p>
          </div>
        </div>

        <div className="cr-cta">
          <Link href="/sign-up" className="btn-primary-lg">{t("hero.ctaStart")} →</Link>
        </div>
      </div>

      <style>{`
        .pg { padding: 120px 28px 60px; min-height: 100vh; }
        .pg-inner { max-width: 800px; margin: 0 auto; }
        .pg-badge { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: 0.14em; color: #4fd1c5; }
        .pg-title { font-family: 'Space Grotesk', sans-serif; font-size: 36px; font-weight: 700; margin: 8px 0 20px; }
        .pg-body { color: #8b93a3; font-size: 15px; line-height: 1.7; margin-bottom: 40px; }
        .cr-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .cr-card { background: #1a1e26; border: 1px solid #2a2f3a; border-radius: 12px; padding: 22px; }
        .cr-icon { margin-bottom: 10px; }
        .cr-card h3 { font-size: 15px; margin-bottom: 6px; }
        .cr-card p { font-size: 12.5px; color: #8b93a3; line-height: 1.6; }
        .cr-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
        .cr-tag { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: #5c6270; background: #20242e; border: 1px solid #2a2f3a; padding: 3px 8px; border-radius: 4px; }
        .cr-cta { display: flex; gap: 12px; margin-top: 40px; }
        .btn-primary-lg { display: inline-flex; align-items: center; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none; background: #4fd1c5; color: #0c1210; }
        .btn-primary-lg:hover { filter: brightness(1.08); }
        .btn-ghost-lg { display: inline-flex; align-items: center; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none; background: transparent; color: #8b93a3; border: 1px solid #2a2f3a; }
        .btn-ghost-lg:hover { color: #e8eaef; border-color: #5c6270; }
        @media (max-width: 640px) { .cr-cards { grid-template-columns: 1fr; } }
      `}</style>
    </main>
    </AuthGuard>
  );
}
