"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/TranslationsProvider";
import { User, Mail, Shield, ArrowLeft, LogOut } from "lucide-react";

const PROVIDER_LABELS = {
  google: "Google",
  facebook: "Facebook",
  github: "GitHub",
  twitter: "Twitter",
  apple: "Apple",
  email: "Email",
};

const PROVIDER_ICONS = {
  google: "G",
  facebook: "F",
  github: "Gh",
  email: "E",
};

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import("@/lib/supabase-client").then(async ({ createClientSupabase }) => {
      const supabase = createClientSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/sign-in");
        return;
      }
      const res = await fetch("/api/profile");
      if (res.ok) {
        setProfile(await res.json());
      }
      setLoading(false);
    });
  }, [router]);

  async function handleSignOut() {
    const { createClientSupabase } = await import("@/lib/supabase-client");
    const supabase = createClientSupabase();
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading">{t("common.loading")}</div>
        <style>{profileStyles}</style>
      </div>
    );
  }

  if (!profile) return null;

  const providerLabel = PROVIDER_LABELS[profile.auth_provider] || profile.auth_provider || "Email";
  const providerIcon = PROVIDER_ICONS[profile.auth_provider] || "E";

  return (
    <div className="profile-page">
      <div className="profile-card">
        <button className="back-btn" onClick={() => router.back()}>
          <ArrowLeft size={16} /> {t("common.back")}
        </button>

        <div className="avatar-wrap">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="avatar" />
          ) : (
            <div className="avatar-fallback">
              <User size={32} />
            </div>
          )}
        </div>

        <h1 className="display-name">{profile.display_name || profile.username || t("profile.noName")}</h1>

        {profile.username && profile.display_name && (
          <p className="username">@{profile.username}</p>
        )}

        <div className="info-list">
          <div className="info-row">
            <Mail size={16} />
            <span className="info-label">{t("profile.email")}</span>
            <span className="info-value">{profile.email}</span>
          </div>
          <div className="info-row">
            <Shield size={16} />
            <span className="info-label">{t("profile.loginMethod")}</span>
            <span className="info-value provider-badge">
              <span className="provider-icon">{providerIcon}</span>
              {providerLabel}
            </span>
          </div>
        </div>

        <button className="sign-out-btn" onClick={handleSignOut}>
          <LogOut size={16} /> {t("nav.signOut")}
        </button>
      </div>

      <style>{profileStyles}</style>
    </div>
  );
}

const profileStyles = `
  .profile-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: #12151b;
  }
  .loading {
    color: #5c6270;
    font-size: 14px;
  }
  .profile-card {
    background: #1a1e26;
    border: 1px solid #2a2f3a;
    border-radius: 14px;
    padding: 40px;
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
  }
  .back-btn {
    position: absolute;
    top: 16px;
    left: 16px;
    background: none;
    border: none;
    color: #8b93a3;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12.5px;
    padding: 6px 10px;
    border-radius: 8px;
  }
  .back-btn:hover {
    color: #e8eaef;
    background: #20242e;
  }
  .avatar-wrap {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    margin-bottom: 16px;
    border: 2px solid #2a2f3a;
  }
  .avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .avatar-fallback {
    width: 100%;
    height: 100%;
    background: #20242e;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #5c6270;
  }
  .display-name {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 22px;
    font-weight: 600;
    color: #e8eaef;
    margin: 0 0 4px;
  }
  .username {
    color: #5c6270;
    font-size: 13px;
    margin: 0 0 24px;
    font-family: 'IBM Plex Mono', monospace;
  }
  .info-list {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 28px;
  }
  .info-row {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #20242e;
    border: 1px solid #2a2f3a;
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 13px;
    color: #8b93a3;
  }
  .info-row svg {
    flex-shrink: 0;
    color: #5c6270;
  }
  .info-label {
    color: #5c6270;
    min-width: 70px;
    text-align: left;
    font-size: 12px;
  }
  .info-value {
    color: #e8eaef;
    margin-left: auto;
    text-align: right;
    word-break: break-all;
  }
  .provider-badge {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .provider-icon {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    background: #2a2f3a;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 600;
    font-family: 'IBM Plex Mono', monospace;
    color: #e8eaef;
  }
  .sign-out-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px;
    border-radius: 8px;
    background: none;
    border: 1px solid #2a2f3a;
    color: #f2795c;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: background 0.15s;
  }
  .sign-out-btn:hover {
    background: rgba(242,121,92,0.1);
  }
`;
