"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/TranslationsProvider";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook, faInstagram, faTiktok, faThreads } from "@fortawesome/free-brands-svg-icons";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";
import Breadcrumb from "@/components/Breadcrumb";

const PLATFORM_META = {
  facebook: { code: "FB", color: "#3D7DF6", fa: faFacebook },
  instagram: { code: "IG", color: "#E14A8E", fa: faInstagram },
  tiktok: { code: "TT", color: "#FE4D6F", fa: faTiktok },
  threads: { code: "TH", color: "#EDEDED", fa: faThreads },
  website: { code: "WEB", color: "#6C93A8", fa: faGlobe },
};

export default function GuidePage() {
  const params = useParams();
  const platform = params.platform;
  const { t } = useTranslation();
  const meta = PLATFORM_META[platform];

  if (!meta) {
    return (
      <div className="gl-guide-wrap">
        <div className="gl-guide-box">
          <h1>Platform not found</h1>
          <Link href="/" className="gl-guide-back"><ArrowLeft size={16} /> Back to Home</Link>
        </div>
        <style>{guideStyles}</style>
      </div>
    );
  }

  const title = t(`tutorial.${platform}Title`);
  const desc = t(`tutorial.${platform}Desc`);
  const article = t(`tutorial.${platform}Article`);
  const paragraphs = article.split("\n\n").filter(Boolean);

  return (
    <div className="gl-guide-wrap">
      <div className="gl-guide-box">
        <Breadcrumb paths={[
          { label: t("tutorial.title"), href: "/#setup-guide" },
          { label: title, href: `/guide/${platform}` },
        ]} />
        <Link href="/#setup-guide" className="gl-guide-back">
          <ArrowLeft size={15} /> {t("common.back")}
        </Link>
        <div className="gl-guide-head">
          <div className="gl-guide-icon">
            <FontAwesomeIcon icon={meta.fa} className="gl-guide-fa" />
          </div>
          <div>
            <h1>{title}</h1>
            <p className="gl-guide-sub">{desc}</p>
          </div>
        </div>
        <div className="gl-guide-article">
          {paragraphs.map((p, i) =>
            p.startsWith("###") ? (
              <h3 key={i} className="gl-guide-h3">{p.replace(/^###\s*/, "")}</h3>
            ) : (
              <p key={i} className="gl-guide-p">{p}</p>
            )
          )}
        </div>
        <div className="gl-guide-footer">
          <CheckCircle size={16} style={{ color: "var(--accent)" }} />
          <span>Ready to connect? <Link href="/dashboard" className="gl-guide-cta">Go to Dashboard</Link></span>
        </div>
      </div>
      <style>{guideStyles}</style>
    </div>
  );
}

const guideStyles = `
  .gl-guide-wrap {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 84px 24px 24px;
    background: var(--bg-body);
  }
  .gl-guide-box {
    width: 100%;
    max-width: 720px;
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur-lg));
    -webkit-backdrop-filter: blur(var(--glass-blur-lg));
    border: 1px solid var(--glass-border);
    border-radius: var(--radius);
    padding: 36px;
  }
  .gl-guide-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--text-secondary);
    font-size: 12px;
    text-decoration: none;
    margin-bottom: 20px;
    padding: 7px 12px;
    border-radius: var(--radius-sm);
    background: var(--glass-bg-dark);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid var(--glass-border);
    transition: border-color .15s;
  }
  .gl-guide-back:hover { border-color: var(--glass-border-light); }
  .gl-guide-head {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 28px;
  }
  .gl-guide-icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: var(--glass-bg-light);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid var(--glass-border);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding: 8px;
  }
  .gl-guide-img { width: 100%; height: 100%; object-fit: contain; }
  .gl-guide-fa { font-size: 22px; color: var(--text-secondary); }
  .gl-guide-head h1 {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 600;
    margin: 0 0 4px;
  }
  .gl-guide-sub {
    color: var(--text-secondary);
    font-size: 13px;
    margin: 0;
    line-height: 1.5;
  }
  .gl-guide-article { margin: 0 0 28px; }
  .gl-guide-h3 {
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 600;
    color: var(--text);
    margin: 24px 0 10px;
  }
  .gl-guide-p {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.7;
    margin: 0 0 14px;
  }
  .gl-guide-footer {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--text-secondary);
    padding-top: 20px;
    border-top: 1px solid var(--glass-border);
  }
  .gl-guide-cta {
    color: var(--accent);
    font-weight: 600;
    text-decoration: none;
  }
  .gl-guide-cta:hover { text-decoration: underline; }
  @media (max-width: 720px) {
    .gl-guide-wrap { padding: 80px 14px 20px; }
    .gl-guide-box { padding: 24px 18px; }
    .gl-guide-head { flex-direction: column; align-items: flex-start; gap: 10px; }
  }
`;
