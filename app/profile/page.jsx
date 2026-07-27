"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/TranslationsProvider";
import { User, Mail, Shield, ArrowLeft, LogOut, Edit3, Check, X as XIcon, Camera } from "lucide-react";

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
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    import("@/lib/supabase-client").then(async ({ createClientSupabase }) => {
      const supabase = createClientSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/sign-in");
        return;
      }
      const fallback = {
        id: session.user.id,
        email: session.user.email,
        auth_provider: session.user.app_metadata?.provider || null,
        display_name: session.user.user_metadata?.display_name || null,
        username: session.user.user_metadata?.username || null,
        avatar_url: session.user.user_metadata?.avatar_url || null,
      };
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setEditDisplayName(data.display_name || "");
        setEditUsername(data.username || "");
      } else {
        setProfile(fallback);
        setEditDisplayName(fallback.display_name || "");
        setEditUsername(fallback.username || "");
      }
      setLoading(false);
    });
  }, [router]);

  function startEditing() {
    setEditDisplayName(profile.display_name || "");
    setEditUsername(profile.username || "");
    setAvatarFile(null);
    setAvatarPreview(null);
    setSaveError("");
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    setSaveError("");
  }

  function handleAvatarSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setSaveError(t("profile.avatarTooLarge"));
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");

    let avatarUrl = profile.avatar_url;

    if (avatarFile) {
      const { createClientSupabase } = await import("@/lib/supabase-client");
      const supabase = createClientSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) { setSaveError("Not authenticated"); setSaving(false); return; }

      const ext = avatarFile.name.split(".").pop();
      const filePath = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) {
        setSaveError(t("profile.uploadFailed"));
        setSaving(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      avatarUrl = publicUrl;
    }

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: editDisplayName.trim() || null,
        username: editUsername.trim() || null,
        avatar_url: avatarUrl,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      setSaveError(err.error || t("profile.saveFailed"));
      setSaving(false);
      return;
    }

    const updated = await res.json();
    setProfile(updated);
    setEditing(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    setSaving(false);
  }

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

        {!editing && (
          <button className="edit-btn" onClick={startEditing}>
            <Edit3 size={14} /> {t("profile.edit")}
          </button>
        )}

        <div className="avatar-wrap">
          {editing ? (
            <label className="avatar-upload">
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="avatar" />
              ) : profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="avatar" />
              ) : (
                <div className="avatar-fallback"><User size={32} /></div>
              )}
              <div className="avatar-overlay"><Camera size={18} /></div>
              <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleAvatarSelect} hidden />
            </label>
          ) : (
            <>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="avatar" />
              ) : (
                <div className="avatar-fallback"><User size={32} /></div>
              )}
            </>
          )}
        </div>

        {editing ? (
          <form onSubmit={saveProfile} className="edit-form">
            <div className="field-group">
              <label className="field-label">{t("profile.displayName")}</label>
              <input className="input" value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} placeholder={t("profile.displayNamePlaceholder")} />
            </div>
            <div className="field-group">
              <label className="field-label">{t("profile.username")}</label>
              <input className="input mono" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} placeholder={t("profile.usernamePlaceholder")} />
            </div>
            {saveError && <p className="form-error">{saveError}</p>}
            <div className="edit-actions">
              <button type="button" className="btn btn-ghost" onClick={cancelEditing}><XIcon size={14} /> {t("common.cancel")}</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Check size={14} /> {saving ? t("common.loading") : t("common.save")}
              </button>
            </div>
          </form>
        ) : (
          <>
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
          </>
        )}
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
    padding: 84px 24px 24px;
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
  .edit-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    background: none;
    border: none;
    color: #4fd1c5;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12.5px;
    padding: 6px 10px;
    border-radius: 8px;
  }
  .edit-btn:hover {
    background: rgba(79, 209, 197, 0.1);
  }
  .avatar-wrap {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    margin-bottom: 16px;
    border: 2px solid #2a2f3a;
    position: relative;
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
  .avatar-upload {
    display: block;
    width: 100%;
    height: 100%;
    cursor: pointer;
    position: relative;
  }
  .avatar-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .avatar-upload:hover .avatar-overlay {
    opacity: 1;
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
  .edit-form {
    width: 100%;
    text-align: left;
  }
  .field-group {
    margin-bottom: 14px;
  }
  .field-label {
    display: block;
    font-size: 12px;
    color: #8b93a3;
    margin-bottom: 6px;
  }
  .input {
    width: 100%;
    background: #20242e;
    border: 1px solid #2a2f3a;
    border-radius: 8px;
    padding: 9px 11px;
    color: #e8eaef;
    font-size: 13px;
    font-family: 'Inter', sans-serif;
    outline: none;
    box-sizing: border-box;
  }
  .input:focus {
    border-color: #4fd1c5;
  }
  .input.mono {
    font-family: 'IBM Plex Mono', monospace;
  }
  .form-error {
    color: #ff2222;
    font-size: 12px;
    margin: 0 0 10px;
    font-weight: 600;
  }
  .edit-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 18px;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    font-family: 'Inter', sans-serif;
  }
  .btn-primary {
    background: #4fd1c5;
    color: #0c1210;
  }
  .btn-primary:hover {
    filter: brightness(1.08);
  }
  .btn-primary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .btn-ghost {
    background: transparent;
    color: #8b93a3;
    border-color: #2a2f3a;
  }
  .btn-ghost:hover {
    color: #e8eaef;
    border-color: #5c6270;
  }
`;

