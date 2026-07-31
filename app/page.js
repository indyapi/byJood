"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/TranslationsProvider";
import { ArrowRight, Zap, Globe, Clock, Shield } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook, faInstagram, faTiktok, faThreads } from "@fortawesome/free-brands-svg-icons";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";
import Breadcrumb from "@/components/Breadcrumb";

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <>
      <section className="gl-hero">
        <div className="gl-hero-body">
          <span className="gl-badge">{t("hero.badge")}</span>
          <h1 className="gl-title">
            {t("hero.title")}
            <br />
            <span className="gl-title-accent">{t("hero.titleAccent")}</span>
          </h1>
          <p className="gl-sub">{t("hero.subtitle")}</p>
          <div className="gl-hero-actions">
            <Link href="/sign-up" className="gl-btn-lg gl-btn-primary">{t("hero.ctaStart")}</Link>
            <Link href="/about" className="gl-btn-lg gl-btn-ghost">{t("hero.ctaLearn")}</Link>
          </div>
          <div className="gl-tags">
            {["FACEBOOK", "INSTAGRAM", "TIKTOK", "THREADS", "WEBSITE"].map((p) => (
              <span key={p} className="gl-tag">{p}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="gl-section">
        <div className="gl-section-head">
          <h2 className="gl-section-title">{t("home.howItWorks")}</h2>
          <div className="gl-head-bar" />
        </div>
        <div className="gl-features">
          {[
            { icon: Zap, title: t("home.step1Title"), desc: t("home.step1Desc") },
            { icon: Globe, title: t("home.step2Title"), desc: t("home.step2Desc") },
            { icon: Clock, title: t("home.step3Title"), desc: t("home.step3Desc") },
            { icon: Shield, title: t("home.step4Title"), desc: t("home.step4Desc") },
          ].map((f, i) => (
            <div key={i} className="gl-card">
              <div className="gl-card-icon">
                <f.icon size={20} />
              </div>
              <h3 className="gl-card-title">{f.title}</h3>
              <p className="gl-card-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="gl-section gl-section-alt">
        <div className="gl-section-head">
          <h2 className="gl-section-title">{t("home.archTitle")}</h2>
          <div className="gl-head-bar" />
        </div>
        <div className="gl-arch">
          <div className="gl-arch-text">
            <p className="gl-arch-body">{t("home.archBody")}</p>
          </div>
          <div className="gl-arch-diagram">
            <div className="gl-arch-node">
              <span className="gl-node-dot" />
              Cron */5 * * * *
            </div>
            <div className="gl-arch-arrow">&darr;</div>
            <div className="gl-arch-node">
              <span className="gl-node-dot" />
              enqueueDuePosts()
            </div>
            <div className="gl-arch-arrow">&darr;</div>
            <div className="gl-arch-node">
              <span className="gl-node-dot" />
              Queue post-jobs
            </div>
            <div className="gl-arch-arrow">&darr;</div>
            <div className="gl-arch-node">
              <span className="gl-node-dot" />
              Consumer &rarr; Platform API
            </div>
          </div>
        </div>
      </section>

      <section className="gl-section">
        <div className="gl-section-head">
          <h2 className="gl-section-title">{t("tutorial.title")}</h2>
          <p className="gl-section-desc">{t("tutorial.subtitle")}</p>
          <div className="gl-head-bar" />
        </div>
        <div className="gl-guides">
          {[
            { key: "facebook", color: "#3D7DF6", fa: faFacebook },
            { key: "instagram", color: "#E14A8E", fa: faInstagram },
            { key: "tiktok", color: "#FE4D6F", fa: faTiktok },
            { key: "threads", color: "#EDEDED", fa: faThreads },
            { key: "website", color: "#6C93A8", fa: faGlobe },
          ].map((p) => (
            <Link key={p.key} href={`/guide/${p.key}`} className="gl-guide-card">
              <div className="gl-guide-icon" style={{ borderColor: p.color }}>
                <FontAwesomeIcon icon={p.fa} className="gl-guide-fa" />
              </div>
              <div className="gl-guide-body">
                <h3>{t(`tutorial.${p.key}Title`)}</h3>
                <p>{t(`tutorial.${p.key}Desc`)}</p>
              </div>
              <span className="gl-guide-arrow"><ArrowRight size={15} /></span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="gl-footer">
        <div className="gl-footer-top">
          <div className="gl-footer-brand">
            <div className="gl-footer-logo">
              <img src="/logo_white.png" alt="byJood Logo" className="gl-footer-logo-dark" />
              <img src="/logo_black.png" alt="byJood Logo" className="gl-footer-logo-light" />
            </div>
            <p className="gl-footer-tagline">{t("footer.tagline")}</p>
          </div>
          <div className="gl-footer-links">
            <div className="gl-footer-col">
              <h4>{t("footer.product")}</h4>
              <a href="#how-it-works">{t("footer.productHow")}</a>
              <a href="/dashboard">{t("footer.productDashboard")}</a>
              <a href="/about">{t("footer.productAbout")}</a>
            </div>
            <div className="gl-footer-col">
              <h4>{t("footer.platforms")}</h4>
              <span>{t("footer.platformFacebook")}</span>
              <span>{t("footer.platformInstagram")}</span>
              <span>{t("footer.platformTikTok")}</span>
              <span>{t("footer.platformThreads")}</span>
              <span>{t("footer.platformWebsite")}</span>
            </div>
            <div className="gl-footer-col">
              <h4>{t("footer.legal")}</h4>
              <a href="https://www.termsfeed.com/live/950784bf-83bd-410d-847f-86e89b53bffc" target="_blank" rel="noopener">{t("footer.legalPrivacy")}</a>
              <a href="https://www.freeprivacypolicy.com/live/64bbdfb6-810b-4b1e-9b82-ca0ae2a82a3e" target="_blank" rel="noopener">{t("footer.legalTerms")}</a>
            </div>
          </div>
        </div>
        <div className="gl-footer-bottom">{t("footer.copyright")}</div>
      </footer>

      <style>{`
        @keyframes heroGrad {
          0% { background-position: 0% 50%; opacity: .1; }
          50% { background-position: 100% 50%; opacity: .8; }
          100% { background-position: 0% 50%; opacity: .1; }
        }
        .gl-hero {
          min-height: 90dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 100px 24px 60px;
          position: relative;
          overflow: hidden;
        }
        .gl-hero::before {
          content: '';
          position: absolute; inset: 0;
          background: url(/images/hero-bg.jpg) center/cover no-repeat;
          opacity: .1;
          z-index: 0;
          animation: heroGrad 12s ease infinite;
        }
        .gl-hero::after {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(circle at 50% 30%, var(--glow-accent), transparent 70%),
            linear-gradient(135deg, var(--glass-bg), var(--glass-bg-dark), var(--glass-bg), var(--bokeh-1));
          background-size: 300% 300%;
          animation: heroGrad 12s ease infinite;
          z-index: 1;
        }
        .gl-hero-body { position: relative; z-index: 2; }
        .gl-hero-body {
          max-width: 600px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
        }
        .gl-badge {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: .12em;
          color: var(--text-secondary);
          background: var(--glass-bg);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid var(--glass-border);
        }
        .gl-title {
          font-family: var(--font-display);
          font-size: clamp(32px, 7vw, 54px);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -.025em;
        }
        .gl-title-accent { color: var(--accent); }
        .gl-sub {
          font-size: 14px;
          line-height: 1.7;
          color: var(--text-secondary);
          max-width: 440px;
        }
        .gl-hero-actions {
          display: flex;
          gap: 10px;
          margin-top: 4px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .gl-btn-lg {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 12px 28px;
          border-radius: var(--radius);
          font-size: 14px;
          font-weight: 600;
          transition: opacity .2s;
        }
        .gl-btn-primary {
          background: var(--gradient-btn);
          color: #fff;
          border: 1px solid transparent;
          box-shadow: 0 6px 22px rgba(86,49,209,.32);
        }
        .gl-btn-primary:hover { background: var(--gradient-btn); filter: brightness(1.08); }
        .gl-btn-ghost {
          background: var(--glass-bg);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--glass-border);
          color: var(--text-secondary);
        }
        .gl-btn-ghost:hover { border-color: var(--glass-border-light); }

        .gl-tags {
          display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 6px;
        }
        .gl-tag {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: .1em;
          color: var(--text-muted);
          background: var(--glass-bg);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 6px 14px;
          border-radius: 12px;
          border: 1px solid var(--glass-border);
        }

        .gl-section {
          padding: 60px 24px;
          background: var(--glass-bg-light);
        }
        .gl-section-alt { background: var(--glass-bg-dark); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
        .gl-section-head {
          max-width: 1000px; margin: 0 auto 32px; display: flex; flex-direction: column; gap: 8px;
        }
        .gl-head-bar {
          width: 50px; height: 3px;
          background: var(--accent);
          border-radius: 2px;
        }
        .gl-section-title {
          font-family: var(--font-display);
          font-size: clamp(22px, 3.5vw, 30px);
          font-weight: 600;
        }
        .gl-section-desc {
          color: var(--text-secondary);
          font-size: 13.5px; line-height: 1.6; max-width: 420px;
        }

        .gl-features {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          max-width: 1000px; margin: 0 auto;
        }
        .gl-card {
          background: var(--glass);
          backdrop-filter: blur(var(--glass-blur));
          -webkit-backdrop-filter: blur(var(--glass-blur));
          border: 1px solid var(--glass-border);
          border-radius: var(--radius);
          padding: 26px 22px;
          display: flex; flex-direction: column; gap: 12px;
          transition: border-color .2s, box-shadow .2s;
          box-shadow: var(--shadow);
        }
        .gl-card:hover { border-color: var(--glass-border-accent); }
        .gl-card-icon {
          width: 44px; height: 44px;
          border-radius: 14px;
          background: var(--glass-bg-light);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--glass-border);
          color: var(--accent);
          display: flex; align-items: center; justify-content: center;
        }
        .gl-card-title {
          font-family: var(--font-display);
          font-size: 15px; font-weight: 600;
        }
        .gl-card-desc {
          font-size: 12.5px;
          color: var(--text-secondary);
          line-height: 1.65;
        }

        .gl-arch {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 36px;
          max-width: 1000px; margin: 0 auto; align-items: center;
        }
        .gl-arch-body {
          color: var(--text-secondary);
          font-size: 13.5px; line-height: 1.7;
        }
        .gl-arch-diagram {
          background: var(--glass-bg);
          backdrop-filter: blur(var(--glass-blur));
          -webkit-backdrop-filter: blur(var(--glass-blur));
          border: 1px solid var(--glass-border);
          border-radius: var(--radius);
          padding: 24px 28px;
          font-family: var(--font-mono);
          font-size: 12px;
          display: flex; flex-direction: column; align-items: center; gap: 2px;
        }
        .gl-arch-node {
          display: flex; align-items: center; gap: 10px;
          color: var(--text);
          background: var(--glass-bg-dark);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 10px 16px;
          border-radius: var(--radius-sm);
          width: 100%;
          border: 1px solid var(--glass-border);
        }
        .gl-node-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--accent); flex-shrink: 0;
        }
        .gl-arch-arrow { text-align: center; color: var(--text-muted); font-size: 13px; line-height: 1; padding: 2px 0; }

        .gl-guides {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 14px;
          max-width: 1000px; margin: 0 auto;
        }
        .gl-guide-card {
          display: flex; align-items: center; gap: 14px;
          padding: 16px 18px;
          border-radius: var(--radius);
          background: var(--glass);
          backdrop-filter: blur(var(--glass-blur));
          -webkit-backdrop-filter: blur(var(--glass-blur));
          border: 1px solid var(--glass-border);
          text-decoration: none;
          transition: border-color .2s, box-shadow .2s;
          box-shadow: var(--shadow);
        }
        .gl-guide-card:hover { border-color: var(--glass-border-accent); }
        .gl-guide-icon {
          width: 40px; height: 40px;
          border-radius: 12px;
          background: var(--glass-bg-light);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--glass-border);
          display: flex; align-items: center; justify-content: center;
          padding: 7px; flex-shrink: 0;
        }
        .gl-guide-img { width: 100%; height: 100%; object-fit: contain; }
        .gl-guide-fa { font-size: 20px; color: var(--text-secondary); }
        .gl-guide-body { flex: 1; }
        .gl-guide-body h3 {
          font-family: var(--font-display);
          font-size: 14px; font-weight: 600;
        }
        .gl-guide-body p {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5; margin-top: 2px;
        }
        .gl-guide-arrow { color: var(--text-muted); transition: color .2s; }
        .gl-guide-card:hover .gl-guide-arrow { color: var(--accent); }

        .gl-footer {
          border-top: 1px solid var(--glass-border);
          padding: 40px 24px 20px;
          background: var(--glass-bg-dark);
        }
        .gl-footer-top {
          max-width: 1000px; margin: 0 auto 24px;
          display: flex; gap: 48px;
        }
        .gl-footer-logo {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }
        .gl-footer-logo img {
          height: 30px;
          width: auto;
          display: block;
        }
        .gl-footer-logo img.gl-footer-logo-light { display: none; }
        @media (min-width: 721px) {
          [data-desktop-theme="light"] .gl-footer-logo img.gl-footer-logo-dark { display: none; }
          [data-desktop-theme="light"] .gl-footer-logo img.gl-footer-logo-light { display: block; }
        }
        @media (max-width: 720px) {
          [data-mobile-theme="light"] .gl-footer-logo img.gl-footer-logo-dark { display: none; }
          [data-mobile-theme="light"] .gl-footer-logo img.gl-footer-logo-light { display: block; }
        }
        .gl-footer-tagline {
          color: var(--text-muted);
          font-size: 12.5px; line-height: 1.5; max-width: 200px;
        }
        .gl-footer-links { display: flex; gap: 36px; flex: 1; justify-content: flex-end; }
        .gl-footer-col { display: flex; flex-direction: column; gap: 7px; }
        .gl-footer-col h4 {
          font-family: var(--font-display);
          font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: .06em;
          color: var(--text-muted); margin-bottom: 4px;
        }
        .gl-footer-col a, .gl-footer-col span {
          color: var(--text-secondary); font-size: 12px;
        }
        .gl-footer-col a { cursor: pointer; }
        .gl-footer-col a:hover { color: var(--text); }
        .gl-footer-bottom {
          max-width: 1000px; margin: 0 auto;
          padding-top: 16px;
          border-top: 1px solid var(--glass-border);
          text-align: center;
          font-size: 11px; color: var(--text-muted);
        }

        @media (max-width: 720px) {
          .gl-hero { min-height: 85dvh; padding: 80px 18px 50px; }
          .gl-hero-actions { flex-direction: column; align-items: center; width: 100%; }
          .gl-btn-lg { width: 100%; justify-content: center; }
          .gl-section { padding: 48px 18px; }
          .gl-features { grid-template-columns: 1fr; }
          .gl-arch { grid-template-columns: 1fr; gap: 24px; }
          .gl-guides { grid-template-columns: 1fr; }
          .gl-footer-top { flex-direction: column; gap: 28px; }
          .gl-footer-links { flex-wrap: wrap; gap: 24px; justify-content: flex-start; }
        }
        @media (min-width: 721px) {
          .gl-features { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>
    </>
  );
}
