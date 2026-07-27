"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/TranslationsProvider";
import { ArrowLeft, CheckCircle } from "lucide-react";

const PLATFORM_META = {
  facebook: { code: "FB", color: "#3D7DF6", icon: "/icons/facebook.svg" },
  instagram: { code: "IG", color: "#E14A8E", icon: "/icons/instagram.svg" },
  tiktok: { code: "TT", color: "#FE4D6F", icon: "/icons/tiktok.svg" },
  threads: { code: "TH", color: "#EDEDED", icon: "/icons/threads.svg" },
  website: { code: "WEB", color: "#6C93A8", icon: "/icons/website.svg" },
};

export default function GuidePage() {
  const params = useParams();
  const platform = params.platform;
  const { t } = useTranslation();
  const meta = PLATFORM_META[platform];

  if (!meta) {
    return (
      <div className="guide-page">
        <div className="guide-card">
          <h1>Platform not found</h1>
          <Link href="/" className="guide-back"><ArrowLeft size={16} /> Back to Home</Link>
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
    <div className="guide-page">
      <div className="guide-card">
        <Link href="/#setup-guide" className="guide-back">
          <ArrowLeft size={16} /> {t("common.back")}
        </Link>
        <div className="guide-head">
          <div className="guide-icon" style={{ background: `${meta.color}1f` }}>
            <img src={meta.icon} alt={title} className="guide-icon-img" />
          </div>
          <div>
            <h1>{title}</h1>
            <p className="guide-sub">{desc}</p>
          </div>
        </div>
        <div className="guide-article">
          {paragraphs.map((p, i) =>
            p.startsWith("###") ? (
              <h3 key={i} className="guide-section-heading">{p.replace(/^###\s*/, "")}</h3>
            ) : (
              <p key={i} className="guide-paragraph">{p}</p>
            )
          )}
        </div>
        <div className="guide-footer">
          <CheckCircle size={16} style={{ color: "#4fd1c5" }} />
          <span>Ready to connect? <Link href="/dashboard" className="guide-cta">Go to Dashboard</Link></span>
        </div>
      </div>
      <style>{guideStyles}</style>
    </div>
  );
}

const guideStyles = `
  .guide-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 84px 24px 24px; background: #12151b; }
  .guide-card { background: #1a1e26; border: 1px solid #2a2f3a; border-radius: 14px; padding: 36px; width: 100%; max-width: 720px; }
  .guide-back { display: inline-flex; align-items: center; gap: 6px; color: #8b93a3; font-size: 12.5px; text-decoration: none; margin-bottom: 24px; padding: 6px 10px; border-radius: 8px; }
  .guide-back:hover { color: #e8eaef; background: #20242e; }
  .guide-head { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
  .guide-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; padding: 8px; }
  .guide-icon-img { width: 100%; height: 100%; object-fit: contain; }
  .guide-head h1 { font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 600; margin: 0 0 4px; }
  .guide-sub { color: #8b93a3; font-size: 13px; margin: 0; line-height: 1.5; }
  .guide-article { margin: 0 0 28px; }
  .guide-section-heading { font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 600; color: #e8eaef; margin: 24px 0 10px; }
  .guide-paragraph { font-size: 13.5px; color: #8b93a3; line-height: 1.7; margin: 0 0 14px; }
  .guide-footer { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #8b93a3; padding-top: 20px; border-top: 1px solid #2a2f3a; }
  .guide-cta { color: #4fd1c5; font-weight: 600; text-decoration: none; }
  .guide-cta:hover { text-decoration: underline; }
  @media (max-width: 720px) { .guide-page { padding: 80px 14px 20px; } .guide-card { padding: 24px 18px; } .guide-head { flex-direction: column; align-items: flex-start; gap: 10px; } }
`;
