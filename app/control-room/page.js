"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/TranslationsProvider";
import AuthGuard from "@/components/AuthGuard";
import Breadcrumb from "@/components/Breadcrumb";

export default function ControlRoomPage() {
  const { t } = useTranslation();

  return (
    <AuthGuard>
    <main className="gl-cr">
      <div className="gl-card-lg">
        <Breadcrumb paths={[{ label: t("nav.controlRoom"), href: "/control-room" }]} />
        <span className="gl-badge-sm">CONTROL ROOM</span>
        <h1 className="gl-cr-title">{t("controlRoom.title")}</h1>
        <p className="gl-cr-sub">{t("controlRoom.subtitle")}</p>
        <div className="gl-cr-grid">
          {[
            { icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>', title: t("controlRoom.card1Title"), desc: t("controlRoom.card1Desc"), tags: ["Facebook","Instagram","TikTok","Threads","Website"] },
            { icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--bokeh-4)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>', title: t("controlRoom.card2Title"), desc: t("controlRoom.card2Desc") },
            { icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--bokeh-3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>', title: t("controlRoom.card3Title"), desc: t("controlRoom.card3Desc") },
            { icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--bokeh-5)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>', title: t("controlRoom.card4Title"), desc: t("controlRoom.card4Desc") },
          ].map((c, i) => (
            <div key={i} className="gl-cr-box">
              <div className="gl-cr-icon" dangerouslySetInnerHTML={{ __html: c.icon }} />
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
              {c.tags && (
                <div className="gl-cr-tags">
                  {c.tags.map((t) => <span key={t} className="gl-cr-tag">{t}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="gl-cr-cta">
          <Link href="/sign-up" className="gl-btn-lg gl-btn-primary">{t("hero.ctaStart")} &rarr;</Link>
        </div>
      </div>
      <style>{`
        .gl-cr {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 84px 24px 24px;
          background: var(--bg-body);
        }
        .gl-card-lg {
          width: 100%;
          max-width: 800px;
          background: var(--glass-bg);
          backdrop-filter: blur(var(--glass-blur-lg));
          -webkit-backdrop-filter: blur(var(--glass-blur-lg));
          border: 1px solid var(--glass-border);
          border-radius: var(--radius);
          padding: 40px;
        }
        .gl-badge-sm {
          font-family: var(--font-mono);
          font-size: 9.5px; letter-spacing: .14em; color: var(--accent);
        }
        .gl-cr-title {
          font-family: var(--font-display);
          font-size: 30px; font-weight: 600;
          margin: 6px 0 6px;
        }
        .gl-cr-sub {
          color: var(--text-secondary);
          font-size: 14px; line-height: 1.6;
          margin-bottom: 32px;
        }
        .gl-cr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .gl-cr-box {
          background: var(--glass-bg-dark);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius);
          padding: 22px;
        }
        .gl-cr-icon { margin-bottom: 10px; }
        .gl-cr-box h3 {
          font-family: var(--font-display);
          font-size: 14px; font-weight: 600;
          margin-bottom: 6px;
        }
        .gl-cr-box p {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .gl-cr-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
        .gl-cr-tag {
          font-family: var(--font-mono); font-size: 9px;
          color: var(--text-muted);
          background: var(--glass-bg);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 4px 9px;
          border-radius: 6px;
          border: 1px solid var(--glass-border);
        }
        .gl-cr-cta { display: flex; gap: 12px; margin-top: 32px; }
        .gl-btn-lg {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 12px 28px;
          border-radius: var(--radius);
          font-size: 14px; font-weight: 600;
          text-decoration: none;
          transition: opacity .2s;
        }
        .gl-btn-primary {
          background: var(--accent); color: #fff;
          border: 1px solid var(--glass-border-accent);
        }
        .gl-btn-primary:hover { background: var(--accent-hover); }

        @media (max-width: 720px) {
          .gl-cr { padding: 80px 14px 20px; }
          .gl-card-lg { padding: 24px 18px; }
          .gl-cr-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
    </AuthGuard>
  );
}
