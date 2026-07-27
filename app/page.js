"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/TranslationsProvider";
import { ArrowRight, CheckCircle, Zap, Globe, Clock, Shield } from "lucide-react";

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <>
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <span className="hero-badge">{t("hero.badge")}</span>
          <h1 className="hero-title">
            {t("hero.title")}
            <span className="hero-accent"> {t("hero.titleAccent")}</span>
          </h1>
          <p className="hero-sub">{t("hero.subtitle")}</p>
          <div className="hero-actions">
            <Link href="/sign-up" className="btn-primary">{t("hero.ctaStart")}</Link>
            <Link href="/about" className="btn-ghost">{t("hero.ctaLearn")}</Link>
          </div>
          <div className="hero-platforms">
            {["FACEBOOK", "INSTAGRAM", "TIKTOK", "THREADS", "WEBSITE"].map((p) => (
              <span key={p} className="platform-tag">{p}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="section features">
        <div className="section-inner">
          <div className="section-head">
            <span className="section-badge">FEATURES</span>
            <h2 className="section-title">{t("home.howItWorks")}</h2>
          </div>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon"><Zap size={20} /></div>
              <h3>{t("home.step1Title")}</h3>
              <p>{t("home.step1Desc")}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Globe size={20} /></div>
              <h3>{t("home.step2Title")}</h3>
              <p>{t("home.step2Desc")}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Clock size={20} /></div>
              <h3>{t("home.step3Title")}</h3>
              <p>{t("home.step3Desc")}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Shield size={20} /></div>
              <h3>{t("home.step4Title")}</h3>
              <p>{t("home.step4Desc")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="section-inner">
          <div className="arch-grid">
            <div className="arch-text">
              <span className="section-badge">{t("home.archBadge")}</span>
              <h2 className="section-title">{t("home.archTitle")}</h2>
              <p className="arch-body">{t("home.archBody")}</p>
            </div>
            <div className="arch-card">
              <div className="arch-line"><span className="arch-dot green" /> Cron */5 * * * *</div>
              <div className="arch-line"><span className="arch-dot blue" /> enqueueDuePosts()</div>
              <div className="arch-line"><span className="arch-dot yellow" /> Queue post-jobs</div>
              <div className="arch-line"><span className="arch-dot purple" /> Consumer → Platform API</div>
              <div className="arch-card-glow" />
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="setup-guide">
        <div className="section-inner">
          <div className="section-head">
            <span className="section-badge">GUIDE</span>
            <h2 className="section-title">{t("tutorial.title")}</h2>
            <p className="section-desc">{t("tutorial.subtitle")}</p>
          </div>
          <div className="tutorial-grid">
            {[
              { key: "facebook", color: "#3D7DF6", icon: "/icons/facebook.svg" },
              { key: "instagram", color: "#E14A8E", icon: "/icons/instagram.svg" },
              { key: "tiktok", color: "#FE4D6F", icon: "/icons/tiktok.svg" },
              { key: "threads", color: "#EDEDED", icon: "/icons/threads.svg" },
              { key: "website", color: "#6C93A8", icon: "/icons/website.svg" },
            ].map((p) => (
              <Link key={p.key} href={`/guide/${p.key}`} className="tutorial-card">
                <div className="tutorial-icon" style={{ background: `${p.color}1a` }}>
                  <img src={p.icon} alt="" className="tutorial-icon-img" />
                </div>
                <h3>{t(`tutorial.${p.key}Title`)}</h3>
                <p className="tutorial-desc">{t(`tutorial.${p.key}Desc`)}</p>
                <span className="tutorial-link">
                  {t("tutorial.readMore")} <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-logo">bJ</div>
              <p className="footer-tagline">{t("footer.tagline")}</p>
            </div>
            <div className="footer-links">
              <div className="footer-col">
                <h4>{t("footer.product")}</h4>
                <a href="#how-it-works">{t("footer.productHow")}</a>
                <a href="/dashboard">{t("footer.productDashboard")}</a>
                <a href="/about">{t("footer.productAbout")}</a>
              </div>
              <div className="footer-col">
                <h4>{t("footer.platforms")}</h4>
                <span>{t("footer.platformFacebook")}</span>
                <span>{t("footer.platformInstagram")}</span>
                <span>{t("footer.platformTikTok")}</span>
                <span>{t("footer.platformThreads")}</span>
                <span>{t("footer.platformWebsite")}</span>
              </div>
              <div className="footer-col">
                <h4>{t("footer.legal")}</h4>
                <a href="https://www.termsfeed.com/live/950784bf-83bd-410d-847f-86e89b53bffc" target="_blank" rel="noopener">{t("footer.legalPrivacy")}</a>
                <a href="https://www.freeprivacypolicy.com/live/64bbdfb6-810b-4b1e-9b82-ca0ae2a82a3e" target="_blank" rel="noopener">{t("footer.legalTerms")}</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">{t("footer.copyright")}</div>
        </div>
      </footer>

      <style>{`
        .hero {
          position: relative;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 100px 24px 80px;
          overflow: hidden;
        }
        .hero-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 800px 500px at 50% 30%, rgba(79,209,197,.08), transparent),
            radial-gradient(ellipse 500px 400px at 80% 70%, rgba(79,209,197,.04), transparent);
          pointer-events: none;
        }
        .hero-content {
          position: relative;
          max-width: 640px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
        }
        .hero-badge {
          font-family: var(--font-mono);
          font-size: 10.5px;
          letter-spacing: .12em;
          color: var(--text-secondary);
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 5px 14px;
          border-radius: 20px;
        }
        .hero-title {
          font-family: var(--font-display);
          font-size: clamp(32px, 7vw, 56px);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -.025em;
        }
        .hero-accent { color: var(--accent); }
        .hero-sub {
          font-size: 14.5px;
          line-height: 1.7;
          color: var(--text-secondary);
          max-width: 480px;
        }
        .hero-actions {
          display: flex;
          gap: 10px;
          margin-top: 4px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .btn-primary, .btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 11px 24px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          transition: filter .15s, border-color .15s, color .15s;
        }
        .btn-primary {
          background: var(--accent);
          color: #0c1210;
        }
        .btn-primary:hover { filter: brightness(1.08); }
        .btn-ghost {
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }
        .btn-ghost:hover { color: var(--text); border-color: var(--text-muted); }
        .hero-platforms {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
          margin-top: 8px;
        }
        .platform-tag {
          font-family: var(--font-mono);
          font-size: 9.5px;
          letter-spacing: .08em;
          color: var(--text-muted);
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 4px 11px;
          border-radius: 6px;
        }

        .section { padding: 64px 24px; }
        .section.alt { background: var(--bg-alt); }
        .section-inner { max-width: 1000px; margin: 0 auto; }
        .section-head { margin-bottom: 32px; }
        .section-badge {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: .14em;
          color: var(--accent);
        }
        .section-title {
          font-family: var(--font-display);
          font-size: clamp(24px, 4vw, 32px);
          font-weight: 600;
          margin: 6px 0 12px;
        }
        .section-desc {
          color: var(--text-secondary);
          font-size: 14px;
          line-height: 1.6;
          max-width: 480px;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px;
        }
        .feature-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: border-color .2s;
        }
        .feature-card:hover { border-color: var(--text-muted); }
        .feature-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: var(--accent-dim);
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .feature-card h3 {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 600;
        }
        .feature-card p {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .arch-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: center;
        }
        .arch-body {
          color: var(--text-secondary);
          font-size: 14px;
          line-height: 1.7;
        }
        .arch-card {
          position: relative;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 22px 26px;
          font-family: var(--font-mono);
          font-size: 12.5px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          overflow: hidden;
        }
        .arch-card-glow {
          position: absolute;
          top: -50%;
          right: -30%;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(79,209,197,.06), transparent);
          pointer-events: none;
        }
        .arch-line { display: flex; align-items: center; gap: 10px; color: var(--text-secondary); }
        .arch-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .arch-dot.green { background: #5fd068; }
        .arch-dot.blue { background: #3d7df6; }
        .arch-dot.yellow { background: #f2b84b; }
        .arch-dot.purple { background: #a78bfa; }

        .tutorial-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 14px;
        }
        .tutorial-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 22px;
          display: flex;
          flex-direction: column;
          transition: border-color .2s;
          text-decoration: none;
        }
        .tutorial-card:hover { border-color: var(--text-muted); }
        .tutorial-icon {
          width: 36px; height: 36px;
          border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 12px;
          padding: 6px;
        }
        .tutorial-icon-img { width: 100%; height: 100%; object-fit: contain; }
        .tutorial-card h3 {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .tutorial-desc {
          font-size: 12.5px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: auto;
        }
        .tutorial-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 14px;
          font-size: 12.5px;
          font-weight: 600;
          color: var(--accent);
        }

        .footer {
          border-top: 1px solid var(--border);
          padding: 44px 24px 24px;
        }
        .footer-inner { max-width: 1000px; margin: 0 auto; }
        .footer-top {
          display: flex;
          gap: 48px;
          margin-bottom: 32px;
        }
        .footer-logo {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--accent);
          color: #0c1210;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
        }
        .footer-tagline {
          color: var(--text-muted);
          font-size: 13px;
          line-height: 1.5;
          max-width: 220px;
        }
        .footer-links {
          display: flex;
          gap: 40px;
          flex: 1;
          justify-content: flex-end;
        }
        .footer-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .footer-col h4 {
          font-family: var(--font-display);
          font-size: 11.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: .06em;
          color: var(--text-muted);
          margin-bottom: 4px;
        }
        .footer-col a, .footer-col span {
          color: var(--text-secondary);
          font-size: 12.5px;
          cursor: default;
        }
        .footer-col a { cursor: pointer; }
        .footer-col a:hover { color: var(--text); }
        .footer-bottom {
          border-top: 1px solid var(--border);
          padding-top: 18px;
          text-align: center;
          font-size: 11.5px;
          color: var(--text-muted);
        }

        @media (max-width: 720px) {
          .hero { padding: 80px 18px 60px; min-height: 90dvh; }
          .hero-title { font-size: clamp(28px, 10vw, 40px); }
          .hero-actions { flex-direction: column; align-items: center; width: 100%; }
          .btn-primary, .btn-ghost { width: 100%; justify-content: center; }
          .section { padding: 48px 18px; }
          .feature-grid { grid-template-columns: 1fr; }
          .arch-grid { grid-template-columns: 1fr; gap: 24px; }
          .tutorial-grid { grid-template-columns: 1fr; }
          .footer-top { flex-direction: column; gap: 28px; }
          .footer-links { flex-wrap: wrap; gap: 24px; justify-content: flex-start; }
        }

        @media (min-width: 721px) {
          .feature-grid { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>
    </>
  );
}
