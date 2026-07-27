"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/TranslationsProvider";
import { User, Mail, Shield, ArrowLeft, LogOut, Edit3, Check, X as XIcon, Camera } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";

const PROVIDER_LABELS = {
  google: "Google", facebook: "Facebook", github: "GitHub",
  twitter: "Twitter", apple: "Apple", email: "Email",
};
const PROVIDER_ICONS = {
  google: "G", facebook: "F", github: "Gh", email: "E",
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
      if (!session) { router.replace("/sign-in"); return; }
      const fallback = { id: session.user.id, email: session.user.email, auth_provider: session.user.app_metadata?.provider || null, display_name: session.user.user_metadata?.display_name || null, username: session.user.user_metadata?.username || null, avatar_url: session.user.user_metadata?.avatar_url || null };
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
    setAvatarFile(null); setAvatarPreview(null); setSaveError("");
    setEditing(true);
  }
  function cancelEditing() { setEditing(false); setAvatarFile(null); setAvatarPreview(null); setSaveError(""); }
  function handleAvatarSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setSaveError(t("profile.avatarTooLarge")); return; }
    setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file));
  }

  async function saveProfile(e) {
    e.preventDefault(); setSaving(true); setSaveError("");
    let avatarUrl = profile.avatar_url;
    if (avatarFile) {
      const { createClientSupabase } = await import("@/lib/supabase-client");
      const supabase = createClientSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) { setSaveError("Not authenticated"); setSaving(false); return; }
      const ext = avatarFile.name.split(".").pop();
      const filePath = `${userId}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, avatarFile, { upsert: true });
      if (uploadError) { setSaveError(t("profile.uploadFailed")); setSaving(false); return; }
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      avatarUrl = publicUrl;
    }
    const res = await fetch("/api/profile", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: editDisplayName.trim() || null, username: editUsername.trim() || null, avatar_url: avatarUrl }),
    });
    if (!res.ok) { const err = await res.json(); setSaveError(err.error || t("profile.saveFailed")); setSaving(false); return; }
    const updated = await res.json();
    setProfile(updated); setEditing(false); setSaving(false);
  }

  async function handleSignOut() {
    const { createClientSupabase } = await import("@/lib/supabase-client");
    const supabase = createClientSupabase();
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (loading) return <div className="gl-prof-page"><div className="gl-prof-load">{t("common.loading")}</div><style>{profStyles}</style></div>;
  if (!profile) return null;

  const providerLabel = PROVIDER_LABELS[profile.auth_provider] || profile.auth_provider || "Email";
  const providerIcon = PROVIDER_ICONS[profile.auth_provider] || "E";

  return (
    <div className="gl-prof-page">
      <div className="gl-prof-card">
        <Breadcrumb paths={[{ label: t("nav.profile"), href: "/profile" }]} />
        <button className="gl-prof-back" onClick={() => router.back()}>
          <ArrowLeft size={15} /> {t("common.back")}
        </button>
        {!editing && (
          <button className="gl-prof-edit" onClick={startEditing}>
            <Edit3 size={13} /> {t("profile.edit")}
          </button>
        )}
        <div className="gl-prof-avatar">
          {editing ? (
            <label className="gl-prof-upload">
              {avatarPreview ? <img src={avatarPreview} alt="" className="gl-av" />
              : profile.avatar_url ? <img src={profile.avatar_url} alt="" className="gl-av" />
              : <div className="gl-av-fb"><User size={28} /></div>}
              <div className="gl-av-overlay"><Camera size={16} /></div>
              <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleAvatarSelect} hidden />
            </label>
          ) : (
            profile.avatar_url ? <img src={profile.avatar_url} alt="" className="gl-av" />
            : <div className="gl-av-fb"><User size={28} /></div>
          )}
        </div>
        {editing ? (
          <form onSubmit={saveProfile} className="gl-prof-form">
            <div className="gl-pfld">
              <label className="gl-pfld-lbl">{t("profile.displayName")}</label>
              <input className="gl-pinp" value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} placeholder={t("profile.displayNamePlaceholder")} />
            </div>
            <div className="gl-pfld">
              <label className="gl-pfld-lbl">{t("profile.username")}</label>
              <input className="gl-pinp gl-pmono" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} placeholder={t("profile.usernamePlaceholder")} />
            </div>
            {saveError && <p className="gl-pferr">{saveError}</p>}
            <div className="gl-pf-acts">
              <button type="button" className="gl-pbtn gl-pbtn-g" onClick={cancelEditing}><XIcon size={13} /> {t("common.cancel")}</button>
              <button type="submit" className="gl-pbtn gl-pbtn-p" disabled={saving}><Check size={13} /> {saving ? t("common.loading") : t("common.save")}</button>
            </div>
          </form>
        ) : (
          <>
            <h1 className="gl-prof-name">{profile.display_name || profile.username || t("profile.noName")}</h1>
            {profile.username && profile.display_name && <p className="gl-prof-uname">@{profile.username}</p>}
            <div className="gl-prof-info">
              <div className="gl-prof-row"><Mail size={14} /><span className="gl-prlbl">{t("profile.email")}</span><span className="gl-prval">{profile.email}</span></div>
              <div className="gl-prof-row"><Shield size={14} /><span className="gl-prlbl">{t("profile.loginMethod")}</span><span className="gl-prval"><span className="gl-prvdr"><span className="gl-prvdr-icon">{providerIcon}</span>{providerLabel}</span></span></div>
            </div>
            <button className="gl-prof-signout" onClick={handleSignOut}><LogOut size={14} /> {t("nav.signOut")}</button>
          </>
        )}
      </div>
      <style>{profStyles}</style>
    </div>
  );
}

const profStyles = `
  .gl-prof-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 84px 24px 24px;
  }
  .gl-prof-load { color: var(--text-muted); font-size: 13px; }
  .gl-prof-card {
    position: relative;
    width: 100%; max-width: 400px;
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur-lg));
    -webkit-backdrop-filter: blur(var(--glass-blur-lg));
    border: 1px solid var(--glass-border);
    border-radius: var(--radius);
    padding: 40px;
    display: flex; flex-direction: column; align-items: center; text-align: center;
  }
  .gl-prof-back {
    position: absolute; top: 16px; left: 16px;
    background: var(--glass-bg-dark);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid var(--glass-border);
    color: var(--text-secondary);
    cursor: pointer;
    display: flex; align-items: center; gap: 4px;
    font-size: 12px; padding: 7px 10px;
    border-radius: var(--radius-sm);
    font-family: var(--font);
    transition: border-color .15s;
  }
  .gl-prof-back:hover { border-color: var(--glass-border-light); }
  .gl-prof-edit {
    position: absolute; top: 16px; right: 16px;
    background: var(--accent-dim);
    border: 1px solid var(--glass-border-accent);
    color: var(--accent); cursor: pointer;
    display: flex; align-items: center; gap: 4px;
    font-size: 12px; padding: 7px 10px;
    border-radius: var(--radius-sm);
    font-family: var(--font);
  }
  .gl-prof-edit:hover { background: var(--accent-dim); }
  .gl-prof-avatar {
    width: 80px; height: 80px;
    border-radius: 50%;
    overflow: hidden;
    margin-bottom: 16px;
    border: 2px solid var(--glass-border);
  }
  .gl-av { width: 100%; height: 100%; object-fit: cover; }
  .gl-av-fb {
    width: 100%; height: 100%;
    background: var(--glass-bg-dark);
    display: flex; align-items: center; justify-content: center;
    color: var(--text-muted);
  }
  .gl-prof-upload { display: block; width: 100%; height: 100%; cursor: pointer; position: relative; }
  .gl-av-overlay {
    position: absolute; inset: 0; border-radius: 50%;
    background: var(--overlay);
    display: flex; align-items: center; justify-content: center;
    color: #fff; opacity: 0; transition: opacity .2s;
  }
  .gl-prof-upload:hover .gl-av-overlay { opacity: 1; }
  .gl-prof-name { font-family: var(--font-display); font-size: 22px; font-weight: 600; margin: 0 0 4px; }
  .gl-prof-uname { color: var(--text-muted); font-size: 12.5px; margin: 0 0 22px; font-family: var(--font-mono); }
  .gl-prof-info { width: 100%; display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
  .gl-prof-row {
    display: flex; align-items: center; gap: 10px;
    background: var(--glass-bg-dark);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-sm);
    padding: 12px 14px;
    font-size: 12.5px;
    color: var(--text-secondary);
  }
  .gl-prof-row svg { flex-shrink: 0; color: var(--text-muted); }
  .gl-prlbl { color: var(--text-muted); min-width: 70px; text-align: left; font-size: 11.5px; }
  .gl-prval { color: var(--text); margin-left: auto; text-align: right; word-break: break-all; }
  .gl-prvdr { display: flex; align-items: center; gap: 6px; }
  .gl-prvdr-icon {
    width: 20px; height: 20px; border-radius: 6px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 600; font-family: var(--font-mono);
    color: var(--text);
  }
  .gl-prof-signout {
    width: 100%;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 10px;
    border-radius: var(--radius-sm);
    background: var(--glass-bg-dark);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid var(--glass-border);
    color: var(--bokeh-3);
    font-size: 12.5px; font-weight: 500;
    cursor: pointer;
    font-family: var(--font);
    transition: border-color .15s;
  }
  .gl-prof-signout:hover { border-color: var(--bokeh-3); }
  .gl-prof-form { width: 100%; text-align: left; }
  .gl-pfld { margin-bottom: 14px; display: flex; flex-direction: column; gap: 5px; }
  .gl-pfld-lbl { font-size: 11.5px; color: var(--text-secondary); }
  .gl-pinp {
    width: 100%;
    background: var(--glass-bg-dark);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-sm);
    padding: 9px 11px;
    color: var(--text);
    font-size: 12.5px;
    font-family: var(--font);
    outline: none;
    transition: border-color .15s;
  }
  .gl-pinp:focus { border-color: var(--accent); }
  .gl-pmono { font-family: var(--font-mono); }
  .gl-pferr { color: var(--bokeh-3); font-size: 11.5px; margin: 0 0 10px; font-weight: 600; }
  .gl-pf-acts { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
  .gl-pbtn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 14px;
    border-radius: var(--radius-sm);
    font-size: 12px; font-weight: 600;
    cursor: pointer; border: none;
    font-family: var(--font);
  }
  .gl-pbtn-p {
    background: var(--accent); color: #fff;
    border: 1px solid var(--glass-border-accent);
    transition: opacity .15s;
  }
  .gl-pbtn-p:hover { opacity: .9; }
  .gl-pbtn-p:disabled { opacity: .4; cursor: not-allowed; }
  .gl-pbtn-g {
    background: var(--glass-bg-dark);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid var(--glass-border);
    color: var(--text-secondary);
    transition: border-color .15s;
  }
  .gl-pbtn-g:hover { border-color: var(--glass-border-light); }
  @media (max-width: 720px) {
    .gl-prof-page { padding: 80px 14px 20px; }
    .gl-prof-card { padding: 24px 16px; }
    .gl-prof-back { top: 10px; left: 10px; font-size: 11px; padding: 5px 8px; }
    .gl-prof-edit { top: 10px; right: 10px; font-size: 11px; padding: 5px 8px; }
    .gl-prof-name { font-size: 18px; }
    .gl-prof-row { padding: 10px 12px; font-size: 11.5px; }
    .gl-prlbl { min-width: 52px; font-size: 11px; }
    .gl-prof-signout { font-size: 11.5px; padding: 8px; }
  }
`;
