"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/TranslationsProvider";
import { createClientSupabase } from "@/lib/supabase-client";
import Breadcrumb from "@/components/Breadcrumb";

export default function SignInPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleEmailSignIn(e) {
    e.preventDefault();
    setLoading(true); setError("");
    const supabase = createClientSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata?.display_name || user?.user_metadata?.username) {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: user.user_metadata.display_name,
          username: user.user_metadata.username,
        }),
      });
    }
    window.location.href = "/dashboard";
  }

  async function handleGoogleSignIn() {
    setLoading(true); setError("");
    const supabase = createClientSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); setLoading(false); }
  }

  return (
    <main className="gl-auth-page">
      <div className="gl-auth">
        <Breadcrumb paths={[{ label: t("nav.signIn"), href: "/sign-in" }]} />
        <span className="gl-badge-sm">SIGN IN</span>
        <h1 className="gl-auth-title">{t("auth.signInTitle")}</h1>
        <p className="gl-auth-sub">{t("auth.signInSub")} <Link href="/sign-up" className="gl-auth-link">{t("auth.signInSubLink")}</Link></p>
        <button className="gl-social" onClick={handleGoogleSignIn} disabled={loading}>
          <GoogleIcon /> {t("auth.googleSignIn")}
        </button>
        <div className="gl-divider"><span>{t("auth.or")}</span></div>
        <form className="gl-form" onSubmit={handleEmailSignIn}>
          <div className="gl-fld">
            <label className="gl-fld-lbl">{t("auth.email")}</label>
            <input className="gl-inp" type="email" placeholder={t("auth.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="gl-fld">
            <label className="gl-fld-lbl">{t("auth.password")}</label>
            <input className="gl-inp" type="password" placeholder={t("auth.passwordPlaceholder")} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <span className="gl-err">{error}</span>}
          <button type="submit" className="gl-submit" disabled={loading}>{loading ? t("auth.signInLoading") : t("auth.signInBtn")}</button>
        </form>
        <Link href="/" className="gl-back-link">&larr; {t("common.back")}</Link>
      </div>
      <style>{`
        .gl-auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 84px 24px 24px;
        }
        .gl-auth {
          width: 100%; max-width: 380px;
          background: var(--glass-bg);
          backdrop-filter: blur(var(--glass-blur-lg));
          -webkit-backdrop-filter: blur(var(--glass-blur-lg));
          border: 1px solid var(--glass-border);
          border-radius: var(--radius);
          padding: 32px;
        }
        .gl-badge-sm {
          font-family: var(--font-mono);
          font-size: 9.5px; letter-spacing: .14em; color: var(--accent);
        }
        .gl-auth-title {
          font-family: var(--font-display);
          font-size: 24px; font-weight: 600;
          margin: 6px 0 4px;
        }
        .gl-auth-sub {
          font-size: 12.5px; color: var(--text-secondary);
          margin-bottom: 20px;
        }
        .gl-auth-link { color: var(--accent); text-decoration: none; font-weight: 500; }
        .gl-auth-link:hover { text-decoration: underline; }
        .gl-err { font-size: 11.5px; color: var(--danger); }
        .gl-social {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          padding: 10px;
          border-radius: var(--radius-sm);
          background: var(--glass-bg-dark);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--glass-border);
          color: var(--text);
          font-size: 13px; font-weight: 500;
          cursor: pointer;
          font-family: var(--font);
          transition: border-color .15s;
        }
        .gl-social:hover { border-color: var(--glass-border-light); }
        .gl-social:disabled { opacity: .5; cursor: not-allowed; }
        .gl-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 16px 0;
          color: var(--text-muted); font-size: 11px;
        }
        .gl-divider::before, .gl-divider::after {
          content: ""; flex: 1;
          height: 1px;
          background: var(--glass-border);
        }
        .gl-form { display: flex; flex-direction: column; gap: 14px; }
        .gl-fld { display: flex; flex-direction: column; gap: 5px; }
        .gl-fld-lbl { font-size: 11.5px; color: var(--text-secondary); }
        .gl-inp {
          width: 100%;
          background: var(--glass-bg-dark);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          color: var(--text);
          font-size: 13px;
          font-family: var(--font);
          outline: none;
          transition: border-color .15s;
        }
        .gl-inp:focus { border-color: var(--accent); }
        .gl-submit {
          width: 100%;
          padding: 11px;
          border-radius: var(--radius-sm);
          background: var(--accent);
          color: #fff;
          font-size: 13.5px; font-weight: 600;
          border: none;
          cursor: pointer;
          font-family: var(--font);
          border: 1px solid var(--glass-border-accent);
          transition: opacity .15s;
        }
        .gl-submit:hover { background: var(--accent-hover); }
        .gl-submit:disabled { opacity: .5; cursor: not-allowed; }
        .gl-back-link {
          display: block; text-align: center;
          margin-top: 18px;
          color: var(--text-muted);
          text-decoration: none;
          font-size: 12px;
        }
        .gl-back-link:hover { color: var(--text-secondary); }
        @media (max-width: 720px) {
          .gl-auth-page { padding: 80px 14px 20px; }
        }
      `}</style>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
