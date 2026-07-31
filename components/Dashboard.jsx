"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import LangSwitcher from "./LangSwitcher";
import { useTranslation } from "@/lib/TranslationsProvider";
import {
  Plus, X, Eye, EyeOff, Trash2, ChevronLeft, ChevronRight, Clock,
  CheckCircle2, XCircle, Link2, CalendarClock, ScrollText, Copy,
  Info, RefreshCw, Search, Image as ImageIcon, MoreHorizontal, User,
  Mail, Shield, Edit3, Camera, Check, LogOut, Menu, Folder, ThumbsUp, ExternalLink, MessageCircle, Share2,
} from "lucide-react";
import Breadcrumb from "./Breadcrumb";
import { createClientSupabase } from "@/lib/supabase-client";

/* ---------------------------------------------------------
   Platform config — single source of truth for color/labels
--------------------------------------------------------- */
function usePlatforms(t) {
  return {
    facebook:  { code: "FB",  name: t("dashboard.platforms.facebook"), color: "#3D7DF6" },
    instagram: { code: "IG",  name: t("dashboard.platforms.instagram"), color: "#E14A8E" },
    threads:   { code: "TH",  name: t("dashboard.platforms.threads"), color: "#EDEDED", dark: true },
    tiktok:    { code: "TT",  name: t("dashboard.platforms.tiktok"), color: "#FE4D6F" },
    youtube:   { code: "YT",  name: t("dashboard.platforms.youtube"), color: "#F0384A" },
    website:   { code: "WEB", name: t("dashboard.platforms.website"), color: "#6C93A8" },
  };
}

function useConnectionFields(t) {
  return [
    { key: "appId", label: t("dashboard.fields.appId"), placeholder: t("dashboard.fields.appIdPlaceholder") },
    { key: "pageId", label: t("dashboard.fields.pageId"), placeholder: t("dashboard.fields.pageIdPlaceholder") },
    { key: "appSecret", label: t("dashboard.fields.appSecret"), secret: true, placeholder: t("dashboard.fields.appSecretPlaceholder") },
    { key: "accessToken", label: t("dashboard.fields.accessToken"), secret: true, placeholder: t("dashboard.fields.accessTokenPlaceholder") },
  ];
}

/* ---------------------------------------------------------
   Small building blocks
--------------------------------------------------------- */
function PlatformChip({ platform, size = "md", PLATFORMS: pMap }) {
  const p = pMap[platform];
  if (!p) return null;
  return (
    <span className={`chip chip-${size}`} style={{ "--chip-color": p.color, "--chip-text": p.dark ? "#111318" : "#fff" }}>
      <span className="chip-code">{p.code}</span>
      {size !== "sm" && <span className="chip-name">{p.name}</span>}
    </span>
  );
}

function StatusPipeline({ status, t }) {
  const STATUS_META = {
    pending: { label: t("dashboard.status.pending"), step: 0 },
    queued: { label: t("dashboard.status.queued"), step: 1 },
    posted: { label: t("dashboard.status.posted"), step: 2 },
    failed: { label: t("dashboard.status.failed"), step: 2, failed: true },
  };
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <div className="pipeline" title={meta.label}>
      {[0, 1, 2].map((i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <span className={`pipe-seg ${i <= meta.step ? "filled" : ""} ${meta.failed && i === 2 ? "failed" : ""}`} />
          )}
          <span
            className={`pipe-node ${
              meta.failed && i === 2 ? "failed" : i < meta.step ? "done" : i === meta.step ? (meta.failed ? "failed" : "active") : ""
            }`}
          />
        </React.Fragment>
      ))}
      {meta.failed ? (
        <span className="pipe-label failed">{meta.label}</span>
      ) : (
        <span className="pipe-label">{meta.label}</span>
      )}
    </div>
  );
}

function MediaThumb({ src, size = 44, icon = "image" }) {
  if (!src) {
    return (
      <span className="thumb thumb-fallback" style={{ width: size, height: size }}>
        {icon === "folder" ? <Folder size={Math.round(size * 0.45)} /> : <ImageIcon size={Math.round(size * 0.45)} />}
      </span>
    );
  }
  return (
    <span className="thumb" style={{ width: size, height: size }}>
      <img src={src} alt="" className="thumb-img" loading="lazy" />
    </span>
  );
}

function StatusPill({ status, t }) {
  const map = {
    active: { label: t("dashboard.connectionStatus.active"), color: "var(--success)" },
    expiring_soon: { label: t("dashboard.connectionStatus.expiringSoon"), color: "var(--warning)" },
    expired: { label: t("dashboard.connectionStatus.expired"), color: "var(--danger)" },
    expiring: { label: t("dashboard.connectionStatus.expiringSoon"), color: "var(--warning)" },
    error: { label: t("dashboard.connectionStatus.expired"), color: "var(--danger)" },
  };
  const m = map[status] ?? map.active;
  return (
    <span className="pill" style={{ "--pill-color": m.color }}>
      <span className="pill-dot" />
      {m.label}
    </span>
  );
}

/* ---------------------------------------------------------
   Pages (Connections) view
--------------------------------------------------------- */
function ConnectionsView({ pages, onAdd, onRemove, onUpdate, authed, t, PLATFORMS }) {
  const [revealed, setRevealed] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editPage, setEditPage] = useState(null);

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <span className="eyebrow">{t("dashboard.connections.eyebrow")}</span>
          <h1>{t("dashboard.connections.title")}</h1>
          <p className="sub">{t("dashboard.connections.subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)} disabled={!authed}>
          <Plus size={16} /> {t("dashboard.connections.addBtn")}
        </button>
      </div>

      <div className="notice">
        <Info size={15} />
        <span>{t("dashboard.connections.notice")}</span>
      </div>

      {pages.length === 0 ? (
        <div className="empty">
          <Link2 size={28} />
          <p>{t("dashboard.connections.empty")}</p>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)} disabled={!authed}><Plus size={16} /> {t("dashboard.connections.addBtn")}</button>
        </div>
      ) : (
        <div className="grid-cards">
          {pages.map((pg) => (
            <div className={`card${pg.status === "expired" ? " card-alert" : ""}`} key={pg.id}>
              <div className="card-top">
                <PlatformChip platform={pg.platform} PLATFORMS={PLATFORMS} />
                <StatusPill status={pg.status} t={t} />
              </div>
              <div className="card-title">{pg.label}</div>
              <div className="card-row">
                <span className="label-dim">{t("dashboard.connections.idLabel")}</span>
                <span className="mono">{pg.externalId}</span>
              </div>
              <div className="card-row">
                <span className="label-dim">{t("dashboard.connections.tokenLabel")}</span>
                <span className="mono">
                  {revealed[pg.id] ? pg.tokenPreview.replace(/•+/g, "••••1a9c92") : pg.tokenPreview}
                </span>
                <button
                  className="icon-btn"
                  onClick={() => setRevealed((r) => ({ ...r, [pg.id]: !r[pg.id] }))}
                  aria-label={t("dashboard.connections.revealAria")}
                >
                  {revealed[pg.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {pg.expiresAt && pg.status !== "active" && (
                <div className="card-row expires-row">
                  <span className="label-dim">{t("dashboard.connectionStatus.expiresLabel")}</span>
                  <span className="mono">{pg.expiresAt.slice(0, 10)}</span>
                </div>
              )}
              {pg.status === "expired" && (
                <div className="reconnect-row">
                  <button className="btn btn-danger" onClick={() => setEditPage(pg)} disabled={!authed}>
                    <RefreshCw size={14} /> {t("dashboard.connectionStatus.reconnectBtn")}
                  </button>
                </div>
              )}
              <div className="card-foot">
                <span className="label-dim">{t("dashboard.connections.addedPrefix")}{pg.addedAt}</span>
                <div className="card-foot-actions">
                  <button className="icon-btn" onClick={() => setEditPage(pg)} disabled={!authed} aria-label={t("dashboard.connections.editAria")}>
                    <Edit3 size={14} />
                  </button>
                  <button className="icon-btn danger" onClick={() => onRemove(pg.id)} disabled={!authed} aria-label={t("dashboard.connections.deleteAria")}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && <AddConnectionModal onClose={() => setModalOpen(false)} onAdd={onAdd} t={t} PLATFORMS={PLATFORMS} />}
      {editPage && <UpdateConnectionModal page={editPage} onClose={() => setEditPage(null)} onUpdate={onUpdate} t={t} />}
    </div>
  );
}

function AddConnectionModal({ onClose, onAdd, t, PLATFORMS }) {
  const [platform, setPlatform] = useState("facebook");
  const [label, setLabel] = useState("");
  const [values, setValues] = useState({});
  const [showSecret, setShowSecret] = useState({});

  const fields = useConnectionFields(t);

  function submit(e) {
    e.preventDefault();
    onAdd({
      platform,
      label: label || PLATFORMS[platform].name,
      appId: values.appId || "",
      pageId: values.pageId || "",
      appSecret: values.appSecret || "",
      accessToken: values.accessToken || "",
    });
    onClose();
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-head">
          <h2>{t("dashboard.connections.modalTitle")}</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={submit}>
          <div className="field-group">
            <label className="field-label">{t("dashboard.fields.platform")}</label>
            <div className="platform-picker">
              {Object.entries(PLATFORMS).map(([key, p]) => (
                <button
                  type="button"
                  key={key}
                  className={`platform-option ${platform === key ? "selected" : ""}`}
                  style={{ "--chip-color": p.color, "--chip-text": p.dark ? "#111318" : "#fff" }}
                  onClick={() => { setPlatform(key); setValues({}); }}
                >
                  <span className="chip-code">{p.code}</span>
                  <span className="platform-option-name">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">{t("dashboard.fields.displayName")}</label>
            <input className="input" placeholder={PLATFORMS[platform].name} value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>

          {fields.map((f) => (
            <div className="field-group" key={f.key}>
              <label className="field-label">{f.label}</label>
              <div className="input-with-icon">
                <input
                  className="input mono"
                  type={f.secret && !showSecret[f.key] ? "password" : "text"}
                  placeholder={f.placeholder}
                  value={values[f.key] || ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  required
                />
                {f.secret && (
                  <button type="button" className="icon-btn" onClick={() => setShowSecret((s) => ({ ...s, [f.key]: !s[f.key] }))}>
                    {showSecret[f.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="notice small">
            <Info size={13} />
            <span>{t("dashboard.connections.formNotice")}</span>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>{t("dashboard.connections.cancel")}</button>
            <button type="submit" className="btn btn-primary">{t("dashboard.connections.save")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Update Connection Modal
--------------------------------------------------------- */
function UpdateConnectionModal({ page, onClose, onUpdate, t }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(page.label || "");
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);

    const body = {};
    // Only send non-empty fields; empty/whitespace keeps old value on server
    if (displayName.trim()) body.display_name = displayName.trim();
    if (appId.trim()) body.app_id = appId.trim();
    if (appSecret.trim()) body.app_secret = appSecret.trim();
    if (accessToken.trim()) body.access_token = accessToken.trim();

    const res = await fetch(`/api/pages/${page.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 401) { router.replace("/sign-in"); setSaving(false); return; }
    if (res.ok) {
      const updated = await res.json();
      // Update the card in place (badge flips to green Active) before closing
      onUpdate(updated);
      setSuccess(true);
      setSaving(false);
      setTimeout(onClose, 1400);
      return;
    }
    setSaving(false);
  }

  const disabled = saving || success;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-head">
          <h2>{t("dashboard.connections.editTitle") || "Update Page"}</h2>
          <button className="icon-btn" onClick={onClose} disabled={success}><X size={18} /></button>
        </div>

        <form onSubmit={submit}>
          {success && (
            <div className="notice small success">
              <CheckCircle2 size={13} />
              <span>{t("dashboard.connections.tokenUpdated")}</span>
            </div>
          )}

          <div className="field-group">
            <label className="field-label">{t("dashboard.fields.displayName")}</label>
            <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={page.label} disabled={disabled} />
          </div>

          <div className="field-group">
            <label className="field-label">App ID</label>
            <input className="input mono" value={appId} onChange={(e) => setAppId(e.target.value)} placeholder="Leave empty to keep current" disabled={disabled} />
          </div>

          <div className="field-group">
            <label className="field-label">App Secret</label>
            <input className="input mono" type="password" value={appSecret} onChange={(e) => setAppSecret(e.target.value)} placeholder="Leave empty to keep current" disabled={disabled} />
          </div>

          <div className="field-group">
            <label className="field-label">Access Token</label>
            <input className="input mono" type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} placeholder="Leave empty to keep current" disabled={disabled} />
          </div>

          <div className="notice small">
            <Info size={13} />
            <span>Empty fields keep their current values.</span>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={disabled}>{t("dashboard.connections.cancel")}</button>
            <button type="submit" className="btn btn-primary" disabled={disabled}>
              {success ? <><Check size={16} /> {t("dashboard.connections.updated")}</> : saving ? t("common.loading") : t("common.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Schedule view
--------------------------------------------------------- */
function ScheduleView({ posts, pages, onAdd, onUpdate, onDelete, onRefresh, authed, t, PLATFORMS, locale }) {
  const router = useRouter();
  const [filterMonth, setFilterMonth] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [toast, setToast] = useState(null);
  const [viewPost, setViewPost] = useState(null);
  const [editPost, setEditPost] = useState(null);
  const [changeTimePost, setChangeTimePost] = useState(null);
  const [deletePost, setDeletePost] = useState(null);
  const [activeGroupMenu, setActiveGroupMenu] = useState(null);
  const [detailMenu, setDetailMenu] = useState(false);
  const [openedGroup, setOpenedGroup] = useState(null);
  const [groupPosts, setGroupPosts] = useState([]);
  const [editGroup, setEditGroup] = useState(null);
  const [changeGroupTime, setChangeGroupTime] = useState(null);
  const [deleteGroup, setDeleteGroup] = useState(null);
  const [groupRename, setGroupRename] = useState("");
  const [groupDeleteConfirm, setGroupDeleteConfirm] = useState("");
  const [groups, setGroups] = useState([]);

  useEffect(() => { fetchGroups(); }, []);

  async function fetchGroups() {
    const res = await fetch("/api/post-groups");
    if (res.status === 401) { router.replace("/sign-in"); return; }
    if (res.ok) {
      const data = await res.json();
      setGroups(data.map(groupFromDb));
    }
  }

  useEffect(() => {
    if (!onRefresh) return;
    const interval = setInterval(onRefresh, 15000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  useEffect(() => {
    function handleClick(e) {
      if (activeMenu && !e.target.closest(".post-actions") && !e.target.closest(".group-actions")) {
        setActiveMenu(null);
        setActiveSubmenu(null);
        setActiveGroupMenu(null);
      }
      if (detailMenu && !e.target.closest(".group-detail-actions")) {
        setDetailMenu(false);
        setActiveSubmenu(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [activeMenu, detailMenu]);

  // Dynamic badge filters: months (layer 1) and active days (layer 2) with post counts.
  const monthCounts = useMemo(() => {
    const m = {};
    groups.forEach((g) => {
      const key = g.date.slice(0, 7);
      m[key] = (m[key] || 0) + 1;
    });
    return m;
  }, [groups]);
  const months = useMemo(() => Object.keys(monthCounts).sort(), [monthCounts]);

  const dayCounts = useMemo(() => {
    const d = {};
    groups.forEach((g) => {
      if (filterMonth && g.date.slice(0, 7) !== filterMonth) return;
      d[g.date] = (d[g.date] || 0) + 1;
    });
    return d;
  }, [groups, filterMonth]);
  const activeDays = useMemo(() => Object.keys(dayCounts).sort(), [dayCounts]);

  // Effective date: null means "all days of the selected month / all posts".
  const effectiveDate = selectedDate && dayCounts[selectedDate] ? selectedDate : null;
  const displayGroups = groups
    .filter((g) => {
      if (effectiveDate && g.date !== effectiveDate) return false;
      if (!effectiveDate && filterMonth && g.date.slice(0, 7) !== filterMonth) return false;
      return true;
    })
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const monthLabel = (key) => {
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { month: "long" });
  };
  const dayTabLabel = (key) => {
    const [y, m, d] = key.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    const loc = locale === "th" ? "th-TH" : "en-US";
    const wd = dt.toLocaleDateString(loc, { weekday: "short" }).replace(".", "");
    const mn = dt.toLocaleDateString(loc, { month: "short" }).replace(".", "");
    return `${wd}. ${d} ${mn}.`;
  };

  async function handleDeleteConfirmed() {
    if (!deletePost) return;
    const res = await fetch(`/api/scheduled-posts/${deletePost.id}`, { method: "DELETE" });
    if (res.status === 401) { router.replace("/sign-in"); return; }
    if (res.ok || res.status === 204) {
      onDelete(deletePost.id);
      setGroupPosts((prev) => prev.filter((p) => p.id !== deletePost.id));
    }
    setDeletePost(null);
  }

  async function openGroupDetail(group) {
    setOpenedGroup(group);
    const res = await fetch(`/api/post-groups/${group.id}`);
    if (res.status === 401) { router.replace("/sign-in"); return; }
    if (res.ok) {
      const data = await res.json();
      setGroupPosts((data.posts || []).map(postFromDb));
    }
  }

  function closeGroupDetail() {
    setOpenedGroup(null);
    setGroupPosts([]);
  }

  async function handleRenameGroup() {
    if (!editGroup || !groupRename.trim()) return;
    const res = await fetch(`/api/post-groups/${editGroup.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: groupRename.trim() }),
    });
    if (res.status === 401) { router.replace("/sign-in"); return; }
    if (res.ok) {
      const updated = await res.json();
      setGroups((prev) => prev.map((g) => g.id === updated.id ? groupFromDb(updated) : g));
      if (openedGroup?.id === editGroup.id) setOpenedGroup((g) => ({ ...g, name: updated.name }));
    }
    setEditGroup(null);
    setGroupRename("");
  }

  async function handleChangeGroupTime() {
    if (!changeGroupTime) return;
    const { date, time } = changeGroupTime;
    const [y, m, d] = date.split("-");
    const [h, mi] = time.split(":");
    const scheduled_at = new Date(+y, +m - 1, +d, +h, +mi).toISOString();
    const res = await fetch(`/api/post-groups/${changeGroupTime.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduled_at }),
    });
    if (res.status === 401) { router.replace("/sign-in"); return; }
    if (res.ok) {
      const updated = await res.json();
      setGroups((prev) => prev.map((g) => g.id === updated.id ? groupFromDb(updated) : g));
      if (openedGroup?.id === changeGroupTime.id) {
        setOpenedGroup((g) => ({ ...g, ...groupFromDb(updated) }));
        setGroupPosts([]);
      }
    }
    setChangeGroupTime(null);
  }

  async function handleDeleteGroupConfirmed() {
    if (!deleteGroup || groupDeleteConfirm.toLowerCase().trim() !== "delete") return;
    const target = deleteGroup;
    const total = target.total || 0;
    setDeleteGroup(null);
    setGroupDeleteConfirm("");
    setToast({ kind: "info", message: t("dashboard.schedule.deletingInProgress"), progress: { current: 0, total } });

    let current = 0;
    const ticker = setInterval(() => {
      current = Math.min(current + 1, total);
      setToast((prev) =>
        prev?.kind === "info" ? { ...prev, progress: { current, total } } : prev
      );
    }, 180);

    try {
      const res = await fetch(`/api/post-groups/${target.id}`, { method: "DELETE" });
      clearInterval(ticker);
      if (res.status === 401) { router.replace("/sign-in"); return; }
      if (res.ok || res.status === 204) {
        setGroups((prev) => prev.filter((g) => g.id !== target.id));
        if (openedGroup?.id === target.id) closeGroupDetail();
        if (onRefresh) onRefresh();
        setToast({ kind: "success", message: t("dashboard.schedule.deleteGroupSuccess") });
      } else {
        setToast({ kind: "error", message: t("dashboard.schedule.deleteGroupError") });
      }
    } catch {
      clearInterval(ticker);
      setToast({ kind: "error", message: t("dashboard.schedule.deleteGroupError") });
    }
    setTimeout(() => setToast(null), 4000);
  }

  function getPostUrl(post) {
    if (post.permalink_url) return post.permalink_url;
    if (!post.external_post_id) return null;
    return `https://facebook.com/${post.external_post_id}`;
  }

  function isPublished(post) {
    return post.status === "posted" || post.status === "success";
  }

  function getShareText(post, page) {
    const pageName = post.pageName || page?.label || "";
    const url = getPostUrl(post) || "";
    return `${pageName}(จาก pages) เผยแพร่เนื้อหาใหม่แล้ว!\n\nรับชมเนื้อหาใหม่ของฉันที่นี่: ${url}\n\nขอบคุณค่ะ!`;
  }

  async function copyPostLink(post, page) {
    const text = getShareText(post, page);
    try {
      await navigator.clipboard.writeText(text);
      setToast({ kind: "success", message: t("dashboard.schedule.copied") });
      setTimeout(() => setToast(null), 2000);
    } catch {}
  }

  async function handleRetryPost(post) {
    try {
      const res = await fetch(`/api/scheduled-posts/${post.id}/retry`, { method: "POST" });
      if (res.status === 401) { router.replace("/sign-in"); return; }
      if (res.ok) {
        const updated = await res.json();
        setGroupPosts((prev) => prev.map((p) => (p.id === updated.id ? postFromDb(updated) : p)));
        setToast({ kind: "success", message: t("dashboard.schedule.retrySuccess") });
      } else {
        const body = await res.json().catch(() => ({}));
        setToast({ kind: "error", message: body.error || t("dashboard.schedule.retryError") });
      }
    } catch {
      setToast({ kind: "error", message: t("dashboard.schedule.retryError") });
    }
    setTimeout(() => setToast(null), 3000);
  }

  const SHARE_PLATFORMS = [
    { id: "facebook", label: "Facebook", color: "#1877F2" },
    { id: "line", label: "Line", color: "#06C755" },
    { id: "linkedin", label: "LinkedIn", color: "#0A66C2" },
    { id: "x", label: "X", color: "#000000" },
    { id: "messenger", label: "Messenger", color: "#0099FF" },
    { id: "instagram", label: "Instagram", color: "#E4405F" },
  ];

  function handleShare(post, page, platform) {
    const url = getPostUrl(post);
    if (!url) return;
    const text = encodeURIComponent(getShareText(post, page));
    const encodedUrl = encodeURIComponent(url);
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      line: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      x: `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`,
      messenger: `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=&redirect_uri=${encodedUrl}`,
      instagram: null,
    };
    const shareUrl = shareUrls[platform];
    if (shareUrl) window.open(shareUrl, "_blank", "noopener");
  }

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <span className="eyebrow">{t("dashboard.schedule.eyebrow")}</span>
          <h1>{t("dashboard.schedule.title")}</h1>
          <p className="sub">{t("dashboard.schedule.subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)} disabled={!authed}>
          <Plus size={16} /> {t("dashboard.schedule.addBtn")}
        </button>
      </div>

      <div className="schedule-filters">
        <div className="filter-row">
          <span className="filter-label">{t("dashboard.schedule.monthLabel")}</span>
          <div className="filter-pills">
            <button
              className={`filter-pill ${filterMonth === null ? "active" : ""}`}
              onClick={() => { setFilterMonth(null); setSelectedDate(null); }}
            >
              {t("dashboard.schedule.allMonths")}
            </button>
            {months.map((mk) => (
              <button
                key={mk}
                className={`filter-pill ${filterMonth === mk ? "active" : ""}`}
                onClick={() => { setFilterMonth(mk); setSelectedDate(null); }}
              >
                {monthLabel(mk)} <span className="pill-count">({monthCounts[mk]})</span>
              </button>
            ))}
          </div>
        </div>

        {activeDays.length > 0 && (
          <div className="filter-row">
            <span className="filter-label">{t("dashboard.schedule.weekdayLabel")}</span>
            <div className="filter-pills">
              {activeDays.map((dk) => (
                <button
                  key={dk}
                  className={`filter-pill ${selectedDate === dk ? "active" : ""}`}
                  onClick={() => { setSelectedDate(dk); setFilterMonth(dk.slice(0, 7)); }}
                >
                  {dayTabLabel(dk)} <span className="pill-count">({dayCounts[dk]})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {openedGroup ? (
        <>
          <div className="group-detail-head">
            <button className="link-btn" onClick={closeGroupDetail}>
              <ChevronLeft size={14} /> {t("dashboard.schedule.backToGroups")}
            </button>
            <div className="group-detail-title-row">
              <MediaThumb src={openedGroup.thumbnail} icon="folder" />
              <h2 className="group-detail-title">{openedGroup.name}</h2>
            </div>
            <div className="group-detail-meta">
              <Clock size={13} />
              <span>{openedGroup.date} {openedGroup.time}</span>
              <span className="group-detail-sep">·</span>
              <span>{openedGroup.total} {t("dashboard.schedule.pagesSuffix")}</span>
            </div>
            <div className="group-detail-actions">
              <button className="icon-btn" onClick={() => setDetailMenu(!detailMenu)}>
                <MoreHorizontal size={16} />
              </button>
              {detailMenu && (
                <div className="action-menu">
                  {(() => {
                    const postedPages = groupPosts.filter((x) => isPublished(x) && getPostUrl(x));
                    if (postedPages.length === 0) return null;
                    return (
                      <div className="menu-has-submenu"
                        onMouseEnter={() => setActiveSubmenu("group-view-fb")}
                        onMouseLeave={() => setActiveSubmenu(null)}
                      >
                        <button className="menu-item menu-trigger">
                          <ExternalLink size={14} />
                          <span>{t("dashboard.schedule.viewFacebookAction")}</span>
                          <ChevronRight size={12} className="sub-arrow" />
                        </button>
                        {activeSubmenu === "group-view-fb" && (
                          <div className="submenu">
                            {postedPages.map((x) => {
                              const xpage = pages.find((pg) => pg.id === x.pageId);
                              return (
                                <button
                                  key={x.id}
                                  onClick={() => { setDetailMenu(false); setActiveSubmenu(null); window.open(getPostUrl(x), "_blank", "noopener"); }}
                                >
                                  {xpage?.label || x.pageName}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
          {groupPosts.length === 0 ? (
            <div className="empty">
              <CalendarClock size={28} />
              <p>{t("dashboard.schedule.empty")}</p>
            </div>
          ) : (
            <div className="post-list">
              {groupPosts.map((p) => {
                const page = pages.find((pg) => pg.id === p.pageId);
                const isPosted = isPublished(p);
                return (
                  <div className={"post-row" + (activeMenu === p.id ? " menu-open" : "")} key={p.id}>
                    <div className="post-time"><Clock size={13} />{p.time}</div>
                    <MediaThumb src={p.media_urls?.[0]} size={40} />
                    <PlatformChip platform={p.platform} size="sm" PLATFORMS={PLATFORMS} />
                    <div className="post-body">
                      <div className="post-page">
                        {p.pageName || page?.label || t("dashboard.schedule.pageNotFound")}
                      </div>
                      <div className="post-content">{p.content}</div>
                    </div>
                    <StatusPipeline status={p.status} t={t} />
                    <div className="post-actions">
                      <button className="icon-btn" onClick={() => setActiveMenu(activeMenu === p.id ? null : p.id)}>
                        <MoreHorizontal size={14} />
                      </button>
                      {activeMenu === p.id && (
                        <div className="action-menu">
                          <div className="menu-item-group">
                            <button className="menu-item" onClick={() => { setActiveMenu(null); setViewPost(p); }}>
                              <Eye size={14} /> {t("dashboard.schedule.viewContentAction")}
                            </button>

                            {isPosted && getPostUrl(p) && (
                              <button
                                className="menu-item"
                                onClick={() => { setActiveMenu(null); window.open(getPostUrl(p), "_blank", "noopener"); }}
                              >
                                <ExternalLink size={14} /> {t("dashboard.schedule.viewFacebookAction")}
                              </button>
                            )}

                            {p.status === "failed" && (
                              <button className="menu-item" onClick={() => { setActiveMenu(null); handleRetryPost(p); }}>
                                <RefreshCw size={14} /> {t("dashboard.schedule.retryAction")}
                              </button>
                            )}

                            <button className="menu-item" onClick={() => { setActiveMenu(null); setEditPost(p); }} disabled={isPosted}>
                              <Edit3 size={14} /> {t("dashboard.schedule.editAction")}
                            </button>

                            <button className="menu-item" onClick={() => { setActiveMenu(null); setChangeTimePost(p); }} disabled={isPosted}>
                              <Clock size={14} /> {t("dashboard.schedule.changeTimeAction")}
                            </button>
                          </div>

                          <div className="menu-divider" />

                          <div className="menu-share">
                            <span className="menu-share-label">{t("dashboard.schedule.shareLabel")}</span>
                            <div className="share-icons">
                              {SHARE_PLATFORMS.map((sp) => (
                                <button
                                  key={sp.id}
                                  className="share-icon-btn"
                                  style={{ "--share-color": sp.color }}
                                  onClick={() => { setActiveMenu(null); handleShare(p, page, sp.id); }}
                                  disabled={!p.external_post_id}
                                  title={sp.label}
                                >
                                  {sp.id === "facebook" && (
                                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                  )}
                                  {sp.id === "line" && (
                                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.364 10.254a7.65 7.65 0 0 0-1.188-.419c-.38-.112-.78-.17-1.19-.17-.411 0-.81.058-1.19.17-.38.113-.74.268-1.074.465-.335.197-.633.428-.89.693-.258.265-.462.564-.606.895-.145.332-.22.69-.22 1.073 0 .382.075.74.22 1.073.144.331.348.637.607.902.257.265.555.496.89.693.334.197.693.352 1.073.465.38.112.78.17 1.19.17.412 0 .812-.058 1.192-.17.38-.113.74-.268 1.074-.465.335-.197.633-.428.89-.693.258-.265.462-.564.607-.895.144-.332.22-.69.22-1.073 0-.383-.076-.741-.22-1.073-.145-.331-.349-.637-.607-.902a4.595 4.595 0 0 0-.89-.693 4.21 4.21 0 0 0-.465-.243zm-6.473 3.582H11.01v-2.889a.515.515 0 0 0-.515-.515.515.515 0 0 0-.516.515v2.89H8.1a.515.515 0 0 0-.516.515c0 .284.232.515.516.515h4.79a.515.515 0 0 0 .516-.515.515.515 0 0 0-.516-.516zm2.507-2.576v-.313a.515.515 0 0 0-.515-.516.515.515 0 0 0-.516.515v5.076a.515.515 0 0 0 .516.515.515.515 0 0 0 .515-.515v-2.077h.72l1.112 1.876a.516.516 0 0 0 .44.257h.58a.518.518 0 0 0 .454-.758l-1.158-1.948c.5-.309.832-.845.832-1.46v-.315a1.73 1.73 0 0 0-1.728-1.727h-1.782zm5.608 5.473c-.23 0-.417.186-.417.416 0 .23.186.417.417.417h1.54c.23 0 .416-.186.416-.417a.416.416 0 0 0-.416-.416h-1.54zM24 11.975c0 5.955-5.546 10.784-12.384 10.784-1.19 0-2.342-.15-3.436-.43-1.065.718-2.523 1.263-4.087 1.263-.416 0-.825-.033-1.222-.092.877-.61 1.558-1.488 1.89-2.565C2.366 18.85 0 15.624 0 11.975 0 6.02 5.546 1.19 12.384 1.19 19.222 1.19 24 6.02 24 11.975zm-9.554-2.646a.515.515 0 0 0-.515-.516H9.33a.515.515 0 0 0-.516.515v5.07c0 .285.232.516.516.516h4.6a.515.515 0 0 0 .516-.515.515.515 0 0 0-.516-.516h-4.084v-1.538h3.353a.515.515 0 0 0 .515-.515.515.515 0 0 0-.515-.516h-3.353v-1.47h4.085a.515.515 0 0 0 .515-.515z"/></svg>
                                  )}
                                  {sp.id === "linkedin" && (
                                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                  )}
                                  {sp.id === "x" && (
                                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                  )}
                                  {sp.id === "messenger" && (
                                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111C24 4.975 18.627 0 12 0zm1.193 14.963l-3.056-3.259-5.963 3.259L10.732 8.2l3.131 3.259L19.752 8.2l-6.559 6.763z"/></svg>
                                  )}
                                  {sp.id === "instagram" && (
                                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                                  )}
                                </button>
                              ))}
                              <button
                                className="share-icon-btn copy-btn"
                                onClick={() => { copyPostLink(p, page); }}
                                disabled={!p.external_post_id}
                                title={t("dashboard.schedule.copyLink")}
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                          </div>

                          <div className="menu-divider" />

                          <button className="menu-item danger" onClick={() => { setActiveMenu(null); setDeletePost(p); }}>
                            <Trash2 size={14} /> {t("dashboard.schedule.deleteAction")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : displayGroups.length === 0 ? (
        <div className="empty">
          <CalendarClock size={28} />
          <p>{t("dashboard.schedule.empty")}</p>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)} disabled={!authed}><Plus size={16} /> {t("dashboard.schedule.addBtn")}</button>
        </div>
      ) : (
        <div className="group-grid">
          {displayGroups.map((g) => (
            <div className={"card group-card" + (activeGroupMenu === g.id ? " menu-open" : "")} key={g.id} onClick={() => openGroupDetail(g)}>
              {g.total === 0 ? (
                <div className="group-card-body">
                  <div className="group-card-head">
                    <MediaThumb src={g.thumbnail} />
                    <div className="group-card-title">
                      <div className="group-card-name">{g.name}</div>
                      <div className="group-card-row">{g.date} {g.time}</div>
                    </div>
                  </div>
                  <div className="group-card-status">
                    <span className="group-status-zero">{t("dashboard.schedule.noPostsInGroup")}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="group-card-body">
                    <div className="group-card-head">
                      <MediaThumb src={g.thumbnail} />
                      <div className="group-card-title">
                        <div className="group-card-name">{g.name}</div>
                        <div className="group-card-row">
                          <Clock size={12} />
                          <span>{g.date} {g.time}</span>
                          <span className="group-dot">·</span>
                          <span>{g.total} {t("dashboard.schedule.pagesSuffix")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="group-card-status">
                      {g.posted > 0 && <span className="status-dot-group success" />}
                      {g.posted > 0 && <span className="status-count success">{g.posted} {t("dashboard.status.posted")}</span>}
                      {g.pending > 0 && <span className="status-dot-group pending" />}
                      {g.pending > 0 && <span className="status-count pending">{g.pending} {t("dashboard.status.pending")}</span>}
                      {g.failed > 0 && <span className="status-dot-group failed" />}
                      {g.failed > 0 && <span className="status-count failed">{g.failed} {t("dashboard.status.failed")}</span>}
                    </div>
                  </div>
                  <div className="group-actions" onClick={(e) => { e.stopPropagation(); }}>
                    <button
                      className="icon-btn"
                      onClick={(e) => { e.stopPropagation(); setActiveGroupMenu(activeGroupMenu === g.id ? null : g.id); }}
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    {activeGroupMenu === g.id && (
                      <div className="action-menu">
                        <button className="menu-item" onClick={() => { setActiveGroupMenu(null); setEditGroup(g); setGroupRename(g.name); }}>
                          <Edit3 size={14} /> {t("dashboard.schedule.editGroupAction")}
                        </button>
                        <button className="menu-item" onClick={() => { setActiveGroupMenu(null); setChangeGroupTime({ id: g.id, date: g.date, time: g.time }); }}>
                          <Clock size={14} /> {t("dashboard.schedule.changeGroupTimeAction")}
                        </button>
                        <div className="menu-divider" />
                        <button className="menu-item danger" onClick={() => { setActiveGroupMenu(null); setDeleteGroup(g); setGroupDeleteConfirm(""); }}>
                          <Trash2 size={14} /> {t("dashboard.schedule.deleteGroupAction")}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <AddPostModal
          pages={pages}
          defaultDate={selectedDate || new Date().toISOString().slice(0, 10)}
          onClose={() => setModalOpen(false)}
          onAdd={(result) => {
            if (result.group && result.posts) {
              setGroups((prev) => [groupFromDb(result.group), ...prev]);
              onAdd(result.posts);
            } else {
              onAdd(result);
            }
          }}
          t={t}
          PLATFORMS={PLATFORMS}
        />
      )}

      {viewPost && (
        <ViewDetailModal
          post={viewPost}
          posts={groupPosts.length ? groupPosts : [viewPost]}
          pages={pages}
          onClose={() => setViewPost(null)}
          t={t}
          PLATFORMS={PLATFORMS}
        />
      )}

      {editPost && (
        <EditPostModal
          post={editPost}
          onClose={() => setEditPost(null)}
          onUpdate={(updated) => {
            onUpdate(updated);
            setGroupPosts((prev) => prev.map((p) => p.id === updated.id ? postFromDb(updated) : p));
            setEditPost(null);
          }}
          t={t}
        />
      )}

      {changeTimePost && (
        <ChangeTimeModal
          post={changeTimePost}
          onClose={() => setChangeTimePost(null)}
          onUpdate={(updated) => {
            onUpdate(updated);
            setGroupPosts((prev) => prev.map((p) => p.id === updated.id ? postFromDb(updated) : p));
            setChangeTimePost(null);
          }}
          t={t}
        />
      )}

      {deletePost && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-head">
              <h2>{t("dashboard.schedule.deleteTitle")}</h2>
              <button className="icon-btn" onClick={() => setDeletePost(null)}><X size={18} /></button>
            </div>
            <p className="delete-body">{t("dashboard.schedule.deleteConfirm")}</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeletePost(null)}>{t("dashboard.schedule.cancel")}</button>
              <button className="btn btn-danger" onClick={handleDeleteConfirmed}>{t("dashboard.schedule.deleteConfirmBtn")}</button>
            </div>
          </div>
        </div>
      )}

      {editGroup && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-head">
              <h2>{t("dashboard.schedule.editGroupTitle")}</h2>
              <button className="icon-btn" onClick={() => setEditGroup(null)}><X size={18} /></button>
            </div>
            <div className="field-group">
              <label className="field-label">{t("dashboard.schedule.groupNameLabel")}</label>
              <input className="input" autoFocus value={groupRename} onChange={(e) => setGroupRename(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleRenameGroup()} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setEditGroup(null)}>{t("dashboard.schedule.cancel")}</button>
              <button className="btn btn-primary" onClick={handleRenameGroup} disabled={!groupRename.trim()}>{t("common.save")}</button>
            </div>
          </div>
        </div>
      )}

      {changeGroupTime && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-head">
              <h2>{t("dashboard.schedule.changeGroupTimeTitle")}</h2>
              <button className="icon-btn" onClick={() => setChangeGroupTime(null)}><X size={18} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleChangeGroupTime(); }}>
              <div className="field-row">
                <div className="field-group">
                  <label className="field-label">{t("dashboard.fields.date")}</label>
                  <input className="input" type="date" value={changeGroupTime.date} onChange={(e) => setChangeGroupTime((prev) => ({ ...prev, date: e.target.value }))} required />
                </div>
                <div className="field-group">
                  <label className="field-label">{t("dashboard.fields.time")}</label>
                  <input className="input" type="time" value={changeGroupTime.time} onChange={(e) => setChangeGroupTime((prev) => ({ ...prev, time: e.target.value }))} required />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setChangeGroupTime(null)}>{t("dashboard.schedule.cancel")}</button>
                <button type="submit" className="btn btn-primary">{t("common.save")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteGroup && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-head">
              <h2>{t("dashboard.schedule.deleteGroupTitle")}</h2>
              <button className="icon-btn" onClick={() => setDeleteGroup(null)}><X size={18} /></button>
            </div>
            <p className="delete-body">{t("dashboard.schedule.deleteGroupConfirm")}</p>
            <div className="field-group">
              <label className="field-label">{t("dashboard.schedule.typeDeleteToConfirm")}</label>
              <input className="input" autoFocus value={groupDeleteConfirm} onChange={(e) => setGroupDeleteConfirm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleDeleteGroupConfirmed()} placeholder="delete" />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteGroup(null)}>{t("dashboard.schedule.cancel")}</button>
              <button className="btn btn-danger" onClick={handleDeleteGroupConfirmed} disabled={groupDeleteConfirm.toLowerCase().trim() !== "delete"}>{t("dashboard.schedule.deleteGroupBtn")}</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.kind ? `toast-${toast.kind}` : ""}`}>
          {toast.progress
            ? `${toast.message} (${toast.progress.current}/${toast.progress.total})`
            : toast.message}
        </div>
      )}
    </div>
  );
}

const MAX_PAGES_PER_POST = 10;

function AddPostModal({ pages, defaultDate, onClose, onAdd, t, PLATFORMS }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState([]);
  const [content, setContent] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("09:00");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState("");

  const atMax = selectedIds.length >= MAX_PAGES_PER_POST;

  function toggle(id) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_PAGES_PER_POST) return prev;
      return [...prev, id];
    });
  }

  function selectAll() {
    setSelectedIds(pages.slice(0, MAX_PAGES_PER_POST).map((p) => p.id));
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFileError(t("dashboard.fields.fileTooLarge"));
      setSelectedFile(null);
      setPreviewUrl("");
      e.target.value = "";
      return;
    }
    setFileError("");
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function removeFile() {
    setSelectedFile(null);
    setPreviewUrl("");
    setFileError("");
  }

  async function submit(e) {
    e.preventDefault();
    if (selectedIds.length === 0) return;

    let mediaUrls = [];
    if (selectedFile) {
      setUploading(true);
      setFileError("");
      const supabase = createClientSupabase();
      const timestamp = Date.now();
      const ext = selectedFile.name.split(".").pop();
      const safeName = `${timestamp}.${ext}`;
      const filePath = `posts/${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(filePath, selectedFile);
      if (uploadError) {
        console.error("Upload error:", uploadError);
        setFileError(`อัปโหลดไม่สำเร็จ: ${uploadError.message || uploadError.error || JSON.stringify(uploadError)}`);
        setUploading(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage
        .from("post-images")
        .getPublicUrl(filePath);
      mediaUrls = [publicUrl];

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (userId) {
        await supabase.from("media").insert({
          user_id: userId,
          filename: selectedFile.name,
          mime_type: selectedFile.type,
          size_bytes: selectedFile.size,
          storage_path: filePath,
          public_url: publicUrl,
        });
      }
    }

    const [y, m, d] = date.split("-");
    const [h, mi] = time.split(":");
    const scheduled_at = new Date(+y, +m - 1, +d, +h, +mi).toISOString();
    const res = await fetch("/api/scheduled-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page_ids: selectedIds, content, scheduled_at, media_urls: mediaUrls }),
    });
    if (res.status === 401) { router.replace("/sign-in"); return; }
    if (res.ok) {
      const result = await res.json();
      onAdd(result);
    }
    onClose();
  }

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <div className="modal-head">
          <h2>{t("dashboard.schedule.modalTitle")}</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="field-group">
            <div className="field-label-row">
              <label className="field-label">{t("dashboard.fields.maxPages", { max: MAX_PAGES_PER_POST })}</label>
              <button type="button" className="link-btn" onClick={selectAll}>{t("dashboard.fields.selectAll")}</button>
            </div>
            <div className="page-picker">
              {pages.map((p) => {
                const checked = selectedIds.includes(p.id);
                const disabled = !checked && atMax;
                return (
                  <label key={p.id} className={`page-option ${checked ? "selected" : ""} ${disabled ? "disabled" : ""}`}>
                    <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggle(p.id)} />
                    <PlatformChip platform={p.platform} size="sm" PLATFORMS={PLATFORMS} />
                    <span className="page-option-name">{p.label}</span>
                  </label>
                );
              })}
            </div>
            <div className={`select-count ${atMax ? "at-max" : ""}`}>{t("dashboard.fields.selectedCount", { count: selectedIds.length, max: MAX_PAGES_PER_POST })}</div>
          </div>

          <div className="field-group">
            <label className="field-label">{t("dashboard.fields.content")}</label>
            <textarea className="input textarea" rows={8} placeholder={t("dashboard.fields.contentPlaceholder")} value={content} onChange={(e) => setContent(e.target.value)} required />
          </div>
          <div className="field-group">
            <label className="field-label">{t("dashboard.fields.image")}</label>
            <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFileSelect} className="input file-input" />
            {fileError && <div className="file-error">{fileError}</div>}
            {previewUrl && (
              <div className="preview-wrap">
                <img src={previewUrl} alt="preview" className="preview-img" />
                <button type="button" className="remove-btn" onClick={removeFile}>
                  <X size={12} /> {t("dashboard.fields.removeImage")}
                </button>
              </div>
            )}
          </div>
          <div className="field-row">
            <div className="field-group">
              <label className="field-label">{t("dashboard.fields.date")}</label>
              <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="field-group">
              <label className="field-label">{t("dashboard.fields.time")}</label>
              <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>

          <div className="notice small">
            <Info size={13} />
            <span>{t("dashboard.schedule.formNotice")}</span>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>{t("dashboard.schedule.cancel")}</button>
            <button type="submit" className="btn btn-primary" disabled={selectedIds.length === 0 || uploading}>
              {uploading ? t("common.loading") : t("dashboard.schedule.save")}{selectedIds.length > 1 && !uploading ? ` (${selectedIds.length} ${t("dashboard.schedule.batchSuffix")})` : ""}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   View Detail Modal (Facebook-style post)
--------------------------------------------------------- */
function ViewDetailModal({ post, posts, pages, onClose, t, PLATFORMS }) {
  const [engagements, setEngagements] = useState({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const list = posts && posts.length ? posts : [post];

  useEffect(() => {
    if (!list.length) return;
    let active = true;
    setLoading(true);
    setEngagements({});
    const map = {};
    Promise.all(
      list.map((p) =>
        fetch(`/api/scheduled-posts/${p.id}/engagement`)
          .then((res) => res.json())
          .then((data) => { map[p.id] = data; })
          .catch(() => {})
      )
    ).then(() => {
      if (active) { setEngagements(map); setLoading(false); }
    });
    return () => { active = false; };
  }, [post?.id]);

  if (!post) return null;

  const fmt = (n) => {
    if (n === null || n === undefined) return "0";
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return String(n);
  };

  const content = post.content || "";
  const needsToggle = content.length > 200;
  const shownContent = expanded || !needsToggle ? content : content.slice(0, 200) + "…";

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg fb-modal">
        <div className="modal-head">
          <h2>{t("dashboard.schedule.viewTitle")}</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="fb-post">
          <div className="fb-body">
            <p className="fb-text">{shownContent}</p>
            {needsToggle && (
              <button className="fb-toggle" onClick={() => setExpanded(!expanded)}>
                {expanded ? t("dashboard.schedule.showLess") : t("dashboard.schedule.readMore")}
              </button>
            )}
            {post.media_urls?.length > 0 && (
              <div className="fb-media">
                {post.media_urls.map((url, i) => (
                  <img key={i} src={url} alt="" className="fb-img" />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="fb-pages">
          <div className="fb-pages-title">{t("dashboard.schedule.targetPages")}</div>
          {list.map((p) => {
            const page = pages.find((pg) => pg.id === p.pageId);
            const engagement = engagements[p.id] || null;
            const pageName = page?.label || p.pageName || t("dashboard.schedule.pageNotFound");
            const picture = engagement?.page_picture || null;
            const isPosted = p.status === "posted" || p.status === "success";
            const permalink = engagement?.permalink_url || (p.external_post_id ? `https://facebook.com/${p.external_post_id}` : null);
            const likes = engagement?.reactions ?? 0;
            const comments = engagement?.comments ?? 0;
            const shares = engagement?.shares ?? 0;

            return (
              <div className="fb-page-row" key={p.id}>
                <div className="fb-avatar fb-avatar-sm">
                  {picture ? (
                    <img src={picture} alt="" className="fb-avatar-img" />
                  ) : (
                    <PlatformChip platform={p.platform} PLATFORMS={PLATFORMS} />
                  )}
                </div>
                <div className="fb-meta">
                  <div className="fb-page-name">{pageName}</div>
                  <div className="fb-page-status">
                    <StatusPipeline status={p.status} t={t} />
                  </div>
                  {p.status === "failed" && p.error_message && (
                    <div className="fb-error">
                      <XCircle size={12} /> {p.error_message}
                    </div>
                  )}
                </div>
                <div className="fb-row-eng">
                  {loading ? (
                    <div className="fb-eng-skel">
                      <span className="skel-bar" />
                      <span className="skel-bar" />
                      <span className="skel-bar" />
                    </div>
                  ) : (
                    <>
                      <span className="fb-eng-item">
                        <span className="fb-eng-icon fb-eng-like">
                          <ThumbsUp size={13} fill="currentColor" />
                        </span>
                        {fmt(likes)}
                      </span>
                      <span className="fb-eng-item">
                        <span className="fb-eng-icon fb-eng-comment">
                          <MessageCircle size={13} />
                        </span>
                        {fmt(comments)}
                      </span>
                      <span className="fb-eng-item">
                        <span className="fb-eng-icon fb-eng-share">
                          <Share2 size={13} />
                        </span>
                        {fmt(shares)}
                      </span>
                    </>
                  )}
                </div>
                {isPosted && permalink && (
                  <a className="fb-view-btn" href={permalink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={13} /> {t("dashboard.schedule.viewPostAction")}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Edit Post Modal
--------------------------------------------------------- */
function EditPostModal({ post, onClose, onUpdate, t }) {
  const router = useRouter();
  const [content, setContent] = useState(post.content || "");

  async function submit(e) {
    e.preventDefault();
    const res = await fetch(`/api/scheduled-posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.status === 401) { router.replace("/sign-in"); return; }
    if (res.ok) {
      const updated = await res.json();
      onUpdate(updated);
    }
    onClose();
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-head">
          <h2>{t("dashboard.schedule.editTitle")}</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="field-group">
            <label className="field-label">{t("dashboard.fields.content")}</label>
            <textarea className="input textarea" rows={6} value={content} onChange={(e) => setContent(e.target.value)} required />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>{t("dashboard.schedule.cancel")}</button>
            <button type="submit" className="btn btn-primary">{t("dashboard.schedule.save")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Change Schedule Time Modal
--------------------------------------------------------- */
function ChangeTimeModal({ post, onClose, onUpdate, t }) {
  const router = useRouter();
  const [date, setDate] = useState(post.date || "");
  const [time, setTime] = useState(post.time || "09:00");

  async function submit(e) {
    e.preventDefault();
    const [y, m, d] = date.split("-");
    const [h, mi] = time.split(":");
    const scheduled_at = new Date(+y, +m - 1, +d, +h, +mi).toISOString();
    const res = await fetch(`/api/scheduled-posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduled_at }),
    });
    if (res.status === 401) { router.replace("/sign-in"); return; }
    if (res.ok) {
      const updated = await res.json();
      onUpdate(updated);
    }
    onClose();
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-head">
          <h2>{t("dashboard.schedule.changeTimeTitle")}</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="field-row">
            <div className="field-group">
              <label className="field-label">{t("dashboard.fields.date")}</label>
              <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="field-group">
              <label className="field-label">{t("dashboard.fields.time")}</label>
              <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>{t("dashboard.schedule.cancel")}</button>
            <button type="submit" className="btn btn-primary">{t("dashboard.schedule.save")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Logs view
--------------------------------------------------------- */
function LogsView({ logs, t, PLATFORMS }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const resetInfo = useMemo(() => {
    return { daysLeft: 7 };
  }, []);

  const filtered = logs.filter((l) => {
    if (filter === "success" && !l.success) return false;
    if (filter === "failed" && l.success) return false;
    if (query && !`${l.pageLabel} ${l.message}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const successCount = logs.filter((l) => l.success).length;
  const rate = logs.length ? Math.round((successCount / logs.length) * 100) : 0;

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <span className="eyebrow">{t("dashboard.logs.eyebrow")}</span>
          <h1>{t("dashboard.logs.title")}</h1>
          <p className="sub">{t("dashboard.logs.subtitle")}</p>
        </div>
        <div className="reset-badge">
          <RefreshCw size={13} />
          {t("dashboard.logs.resetPrefix")}{resetInfo.daysLeft}{t("dashboard.logs.resetSuffix")}
        </div>
      </div>

      <div className="stat-row">
        <div className="stat"><span className="stat-num">{logs.length}</span><span className="stat-label">{t("dashboard.logs.statTotal")}</span></div>
        <div className="stat"><span className="stat-num" style={{ color: "var(--success)" }}>{rate}%</span><span className="stat-label">{t("dashboard.logs.statSuccess")}</span></div>
        <div className="stat"><span className="stat-num" style={{ color: "var(--danger)" }}>{logs.length - successCount}</span><span className="stat-label">{t("dashboard.logs.statFailed")}</span></div>
      </div>

      <div className="log-toolbar">
        <div className="chip-filter">
          {[["all", t("dashboard.logs.filterAll")], ["success", t("dashboard.logs.filterSuccess")], ["failed", t("dashboard.logs.filterFailed")]].map(([k, label]) => (
            <button key={k} className={`filter-btn ${filter === k ? "active" : ""}`} onClick={() => setFilter(k)}>{label}</button>
          ))}
        </div>
        <div className="search-box">
          <Search size={14} />
          <input placeholder={t("dashboard.logs.searchPlaceholder")} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div className="table-wrap">
        <table className="log-table">
          <thead>
            <tr>
              <th>{t("dashboard.logs.colStatus")}</th>
              <th>{t("dashboard.logs.colPlatform")}</th>
              <th>{t("dashboard.logs.colPage")}</th>
              <th>{t("dashboard.logs.colMessage")}</th>
              <th>{t("dashboard.logs.colExternalId")}</th>
              <th>{t("dashboard.logs.colTime")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id}>
                <td>
                  {l.success ? (
                    <span className="result-ok"><CheckCircle2 size={14} /> {t("dashboard.logs.resultSuccess")}</span>
                  ) : (
                    <span className="result-fail"><XCircle size={14} /> {t("dashboard.logs.resultFailed")}</span>
                  )}
                </td>
                <td><PlatformChip platform={l.platform} size="sm" PLATFORMS={PLATFORMS} /></td>
                <td>{l.pageLabel}</td>
                <td className="msg-cell">{l.message}</td>
                <td className="mono dim">{l.externalId}</td>
                <td className="mono dim">{l.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty small">
            <ScrollText size={22} />
            <p>{t("dashboard.logs.empty")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Profile Modal
--------------------------------------------------------- */
const PROVIDER_LABELS = {
  google: "Google", facebook: "Facebook", github: "GitHub",
  twitter: "Twitter", apple: "Apple", email: "Email",
};
const PROVIDER_ICONS = {
  google: "G", facebook: "F", github: "Gh", email: "E",
};

function ProfileModal({ onClose, t }) {
  const router = useRouter();
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
    (async () => {
      const supabase = createClientSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      const fallback = {
        id: session?.user?.id,
        email: session?.user?.email,
        auth_provider: session?.user?.app_metadata?.provider || null,
        display_name: session?.user?.user_metadata?.display_name || null,
        username: session?.user?.user_metadata?.username || null,
        avatar_url: session?.user?.user_metadata?.avatar_url || null,
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
    })();
  }, []);

  async function handleSignOut() {
    const supabase = createClientSupabase();
    await supabase.auth.signOut();
    router.replace("/");
  }

  function startEditing() {
    setEditDisplayName(profile.display_name || "");
    setEditUsername(profile.username || "");
    setAvatarFile(null); setAvatarPreview(null); setSaveError("");
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false); setAvatarFile(null); setAvatarPreview(null); setSaveError("");
  }

  function handleAvatarSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setSaveError(t("profile.avatarTooLarge")); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true); setSaveError("");

    let avatarUrl = profile.avatar_url;
    if (avatarFile) {
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: editDisplayName.trim() || null,
        username: editUsername.trim() || null,
        avatar_url: avatarUrl,
      }),
    });
    if (!res.ok) { const err = await res.json(); setSaveError(err.error || t("profile.saveFailed")); setSaving(false); return; }
    const updated = await res.json();
    setProfile(updated);
    setEditing(false); setSaving(false);
  }

  if (loading) {
    return (
      <div className="modal-overlay"><div className="modal"><p style={{ color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>{t("common.loading")}</p></div></div>
    );
  }

  if (!profile) return null;

  const providerLabel = PROVIDER_LABELS[profile.auth_provider] || profile.auth_provider || "Email";
  const providerIcon = PROVIDER_ICONS[profile.auth_provider] || "E";

  return (
    <div className="modal-overlay">
      <div className="modal modal-profile">
        <div className="modal-head">
          <h2>{t("nav.profile")}</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="pfp-avatar-wrap">
          {editing ? (
            <label className="pfp-avatar-upload">
              {avatarPreview ? <img src={avatarPreview} alt="" className="avatar" />
              : profile.avatar_url ? <img src={profile.avatar_url} alt="" className="avatar" />
              : <div className="avatar-fallback"><User size={28} /></div>}
              <div className="pfp-avatar-overlay"><Camera size={16} /></div>
              <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleAvatarSelect} hidden />
            </label>
          ) : (
            profile.avatar_url ? <img src={profile.avatar_url} alt="" className="avatar" />
            : <div className="avatar-fallback"><User size={28} /></div>
          )}
        </div>

        {editing ? (
          <form onSubmit={saveProfile} className="pfp-form">
            <div className="field-group">
              <label className="field-label">{t("profile.displayName")}</label>
              <input className="input" value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} placeholder={t("profile.displayNamePlaceholder")} />
            </div>
            <div className="field-group">
              <label className="field-label">{t("profile.username")}</label>
              <input className="input mono" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} placeholder={t("profile.usernamePlaceholder")} />
            </div>
            {saveError && <p className="pfp-error">{saveError}</p>}
            <div className="pfp-edit-actions">
              <button type="button" className="btn btn-ghost" onClick={cancelEditing} disabled={saving}>{t("common.cancel")}</button>
              <button type="submit" className="btn btn-primary" disabled={saving}><Check size={14} /> {saving ? t("common.loading") : t("common.save")}</button>
            </div>
          </form>
        ) : (
          <div className="pfp-view">
            <h3 className="pfp-name">{profile.display_name || profile.username || t("profile.noName")}</h3>
            {profile.username && profile.display_name && <p className="pfp-username">@{profile.username}</p>}
            <div className="pfp-info">
              <div className="pfp-row"><Mail size={14} /><span>{t("profile.email")}</span><span className="pfp-val">{profile.email}</span></div>
              <div className="pfp-row"><Shield size={14} /><span>{t("profile.loginMethod")}</span><span className="pfp-val"><span className="provider-badge"><span className="provider-icon">{providerIcon}</span>{providerLabel}</span></span></div>
            </div>
            <div className="pfp-actions">
              <button className="btn btn-ghost" onClick={startEditing}><Edit3 size={14} /> {t("profile.edit")}</button>
              <button className="btn btn-danger pfp-signout" onClick={handleSignOut}><LogOut size={14} /> {t("nav.signOut")}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   DB shape helpers
--------------------------------------------------------- */
function pageFromDb(p) {
  const token = p.page_tokens?.[0];
  return {
    id: p.id,
    platform: p.platform,
    label: p.display_name,
    externalId: p.external_page_id,
    appId: token?.app_id || "",
    status: p.status || "active",
    expiresAt: p.expires_at || null,
    addedAt: p.created_at?.slice(0, 10),
    tokenPreview: token?.access_token ? token.access_token.slice(0, 6) + "••••••••" + token.access_token.slice(-4) : "—",
  };
}

function postFromDb(p) {
  const d = p.scheduled_at ? new Date(p.scheduled_at) : null;
  return {
    id: p.id,
    pageId: p.page_id,
    pageName: p.page?.display_name || "",
    platform: p.platform,
    content: p.content,
    media_urls: p.media_urls || [],
    external_post_id: p.external_post_id || "",
    permalink_url: p.permalink_url || "",
    groupId: p.group_id || null,
    date: d ? d.toLocaleDateString("sv-SE") : "",
    time: d ? d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false }) : "",
    status: p.status,
    error_message: p.error_message || "",
    failed_at: p.failed_at || null,
  };
}

function groupFromDb(g) {
  const d = g.scheduled_at ? new Date(g.scheduled_at) : null;
  return {
    id: g.id,
    name: g.name,
    total: g.total || 0,
    posted: g.posted || 0,
    failed: g.failed || 0,
    pending: g.pending || 0,
    thumbnail: g.thumbnail || null,
    date: d ? d.toLocaleDateString("sv-SE") : "",
    time: d ? d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false }) : "",
  };
}

function logFromDb(l) {
  const d = l.created_at ? new Date(l.created_at) : null;
  return {
    id: l.id,
    pageLabel: l.page?.display_name || l.page_id,
    platform: l.platform,
    success: l.success,
    message: l.error_message || (l.success ? "โพสต์สำเร็จ" : "ล้มเหลว"),
    externalId: l.external_post_id || "—",
    time: d ? d.toLocaleString("th-TH", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }) : "",
  };
}

/* ---------------------------------------------------------
   App shell
--------------------------------------------------------- */
export default function Dashboard({ initialPages = [], initialPosts = [], initialLogs = [] }) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const PLATFORMS = usePlatforms(t);
  const [authed, setAuthed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState(null);

  useEffect(() => {
    import("@/lib/supabase-client").then(({ createClientSupabase }) => {
      createClientSupabase().auth.getSession().then(({ data: { session } }) => {
        setAuthed(!!session);
        if (!session) router.replace("/sign-in");
        if (session?.user?.user_metadata?.avatar_url) {
          setProfileAvatar(session.user.user_metadata.avatar_url);
        }
      });
    });
    fetch("/api/profile").then((r) => r.ok && r.json()).then((data) => {
      if (data?.avatar_url) setProfileAvatar(data.avatar_url);
    }).catch(() => {});
  }, [router]);

  async function authedFetch(url, options) {
    const res = await fetch(url, options);
    if (res.status === 401) router.replace("/sign-in");
    return res;
  }

  const [tab, setTab] = useState("connections");
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [pages, setPages] = useState(initialPages.map(pageFromDb));
  const [posts, setPosts] = useState(initialPosts.map(postFromDb));
  const [logs, setLogs] = useState(initialLogs.map(logFromDb));

  const refreshPages = useCallback(async () => {
    const res = await authedFetch("/api/pages");
    if (res?.ok) {
      const data = await res.json();
      setPages(data.map(pageFromDb));
    }
  }, []);

  const refreshPosts = useCallback(async () => {
    const res = await authedFetch("/api/scheduled-posts");
    if (res?.ok) {
      const data = await res.json();
      setPosts(data.map(postFromDb));
    }
  }, []);

  const refreshLogs = useCallback(async () => {
    const res = await authedFetch("/api/logs");
    if (res?.ok) {
      const data = await res.json();
      setLogs(data.map(logFromDb));
    }
  }, []);

  const handleAddPage = useCallback(async (raw) => {
    const res = await authedFetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: raw.platform,
        display_name: raw.label,
        external_page_id: raw.pageId,
        fields: {
          app_id: raw.appId,
          app_secret: raw.appSecret,
          access_token: raw.accessToken,
        },
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setPages((prev) => [pageFromDb(created), ...prev]);
    }
  }, []);

  const handleRemovePage = useCallback(async (id) => {
    const res = await authedFetch(`/api/pages/${id}`, { method: "DELETE" });
    if (res?.ok || res?.status === 204) {
      setPages((prev) => prev.filter((p) => p.id !== id));
    }
  }, []);

  const handleUpdatePage = useCallback((updated) => {
    setPages((prev) => prev.map((p) => p.id === updated.id ? pageFromDb(updated) : p));
  }, []);

  useEffect(() => {
    refreshPages();
    refreshPosts();
    refreshLogs();
  }, [refreshPages, refreshPosts, refreshLogs]);

  const nav = [
    { key: "connections", label: "จัดการเพจ", icon: Link2 },
    { key: "schedule", label: "ตั้งเวลาโพสต์", icon: CalendarClock },
    { key: "logs", label: "Logs", icon: ScrollText },
  ];

  return (
    <div className="shell">
      <style>{`
        :root {
          --bg: transparent;
          --panel: var(--glass-bg);
          --panel-alt: var(--glass-bg-dark);
          --border: var(--glass-border);
          --text: var(--text);
          --text-muted: var(--text-secondary);
          --text-dim: #38333F;
          --accent: var(--accent);
          --accent-soft: var(--accent-dim);
          --warning-soft: rgba(242,184,75,.18);
          --danger-soft: rgba(242,121,92,.15);
          --overlay: var(--modal-overlay);
          --radius: var(--radius-sm);
        }
        * { box-sizing: border-box; }
        .shell {
          display: flex;
          height: 100dvh;
          background: var(--glass-bg-dark);
          backdrop-filter: blur(var(--glass-blur));
          -webkit-backdrop-filter: blur(var(--glass-blur));
          color: var(--text);
          font-family: var(--font);
          overflow: hidden;
        }
        .mono { font-family: var(--font-mono); }
        .dim { color: var(--text-dim); }

        .sidebar {
          width: 216px;
          flex-shrink: 0;
          background: var(--glass-bg);
          backdrop-filter: blur(var(--glass-blur));
          -webkit-backdrop-filter: blur(var(--glass-blur));
          border-right: 1px solid var(--glass-border);
          display: flex;
          flex-direction: column;
          padding: 20px 10px;
        }
        .brand { font-family: var(--font-display); font-weight: 700; font-size: 16px; letter-spacing: .02em; padding: 0 12px 2px; color: var(--text-heading); }
        .brand-sub {
          font-family: var(--font-mono); font-size: 10px; letter-spacing: .14em;
          color: var(--text-dim); padding: 0 12px 22px; text-transform: uppercase;
        }
        .sidebar-home {
          display: block; width: 100%; text-align: left;
          background: none; border: none; cursor: pointer; padding: 0;
          border-radius: var(--radius-sm);
          transition: background .15s;
        }
        .sidebar-home:hover { background: var(--glass-bg-dark); }
        .sidebar-home:hover .brand-sub { color: var(--text-muted); }
        .nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: var(--radius-sm);
          color: var(--text-muted); font-size: 13px; font-weight: 500;
          cursor: pointer; background: none; border: none; text-align: left;
          width: 100%; margin-bottom: 2px; transition: all .12s;
        }
        .nav-item:hover { background: var(--glass-bg-dark); color: var(--text); }
        .nav-item.active { background: var(--accent-soft); color: var(--accent); border: 1px solid var(--glass-border-accent); }
        .nav-item svg { opacity: .85; }
        .nav-item.active svg { opacity: 1; }
        .sidebar-foot {
          margin-top: auto; padding: 10px 12px; font-size: 11px;
          color: var(--text-dim); display: flex; align-items: center; gap: 6px;
          font-family: var(--font-mono);
        }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--success); }
        .sidebar-lang { padding: 4px 12px 12px; display: flex; }
        .sidebar-lang .lang-switcher { border-left: none; padding-left: 0; margin-left: 0; }
        .profile-btn { margin-top: 6px; border-top: 1px solid var(--border); padding-top: 10px !important; }
        .sidebar-avatar { width: 18px; height: 18px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 1px solid var(--glass-border); }

        .main-top { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
        .main-menu-btn {
          display: none;
          background: var(--glass-bg);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          cursor: pointer;
          padding: 8px;
          transition: border-color .15s;
        }
        .main-menu-btn:hover { border-color: var(--glass-border-light); }
        .main-top .gl-breadcrumb { margin-bottom: 0; flex: 1; }

        .dash-mob-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: var(--modal-overlay);
          z-index: 200;
          backdrop-filter: blur(2px);
        }
        .dash-mob-sidebar {
          width: 240px;
          height: 100%;
          background: var(--glass-bg-dark);
          backdrop-filter: blur(var(--glass-blur-lg));
          -webkit-backdrop-filter: blur(var(--glass-blur-lg));
          border-right: 1px solid var(--glass-border);
          display: flex;
          flex-direction: column;
          padding: 20px 10px;
        }
        .dash-mob-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .dash-mob-head .sidebar-home {
          display: block; width: auto; text-align: left;
          background: none; border: none; cursor: pointer; padding: 0;
          border-radius: var(--radius-sm);
        }
        .dash-mob-head .brand { font-family: var(--font-display); font-weight: 700; font-size: 16px; letter-spacing: .02em; padding: 0 12px 2px; color: var(--text-heading); }
        .dash-mob-head .brand-sub { font-family: var(--font-mono); font-size: 10px; letter-spacing: .14em; color: var(--text-dim); padding: 0 12px 8px; text-transform: uppercase; }

        .main { flex: 1; overflow-y: auto; padding: 24px 28px; }

        .stats-bar { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
        .stat-card {
          background: var(--glass-bg);
          backdrop-filter: blur(var(--glass-blur));
          -webkit-backdrop-filter: blur(var(--glass-blur));
          border: 1px solid var(--glass-border);
          border-radius: var(--radius);
          padding: 14px 18px; display: flex; align-items: center; gap: 14px; flex: 1; min-width: 140px;
        }
        .stat-card-icon {
          width: 36px; height: 36px; border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          opacity: .9;
        }
        .stat-card-info { display: flex; flex-direction: column; gap: 2px; }
        .stat-card-number { font-family: var(--font-display); font-size: 20px; font-weight: 700; line-height: 1; }
        .stat-card-label { font-size: 11.5px; color: var(--text-dim); text-transform: uppercase; letter-spacing: .05em; }
        .view-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 18px; gap: 12px; flex-wrap: wrap; }
        .eyebrow { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .16em; color: var(--accent); text-transform: uppercase; }
        h1 { font-family: var(--font-display); font-size: 22px; margin: 4px 0 6px; font-weight: 600; color: var(--text); }
        .sub { color: var(--text-muted); font-size: 13px; max-width: 480px; line-height: 1.5; }

        .btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 16px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600;
          cursor: pointer; border: none; font-family: var(--font); transition: opacity .15s;
        }
        .btn-primary { background: var(--accent); color: #fff; border: 1px solid var(--glass-border-accent); }
        .btn-primary:hover { background: var(--accent-hover); }
        .btn-ghost { background: var(--glass-bg); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); color: var(--text-muted); border: 1px solid var(--glass-border); }
        .btn-ghost:hover { color: var(--text); border-color: var(--glass-border-light); }
        .btn-danger { background: var(--danger); color: #fff; }
        .btn-danger:hover { opacity: .9; }
        .btn-primary:disabled, .btn-danger:disabled { opacity: .35; cursor: not-allowed; }

        .notice {
          display: flex; align-items: flex-start; gap: 8px;
          background: var(--glass-bg-dark);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--glass-border);
          border-left: 2px solid var(--accent);
          padding: 10px 12px; border-radius: var(--radius-sm);
          font-size: 12.5px; color: var(--text-muted);
          margin-bottom: 20px; line-height: 1.5;
        }
        .notice.small { font-size: 11.5px; margin-bottom: 14px; }
        .notice.success { border-left-color: var(--success); color: var(--success); }

        .grid-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 14px; }
        .card {
          background: var(--glass-bg);
          backdrop-filter: blur(var(--glass-blur));
          -webkit-backdrop-filter: blur(var(--glass-blur));
          border: 1px solid var(--glass-border);
          border-radius: var(--radius);
          padding: 16px; transition: border-color .15s;
        }
        .card:hover { border-color: var(--glass-border-accent); }
        .card-alert { border-color: var(--danger); }
        .card-alert:hover { border-color: var(--danger); }
        .expires-row { color: var(--warning); }
        .reconnect-row { display: flex; gap: 8px; margin-top: 10px; }
        .reconnect-row .btn { width: 100%; justify-content: center; font-size: 12px; padding: 8px 12px; }
        .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .card-title { font-weight: 600; font-size: 14.5px; margin-bottom: 10px; }
        .card-row { display: flex; align-items: center; gap: 8px; font-size: 12px; margin-bottom: 6px; color: var(--text); }
        .label-dim { color: var(--text-dim); min-width: 34px; font-size: 11px; }
        .card-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border); font-size: 11px; color: var(--text-dim); }
        .card-foot-actions { display: flex; align-items: center; gap: 2px; }

        .chip { display: inline-flex; align-items: center; gap: 6px; }
        .chip-code {
          background: var(--chip-color); color: var(--chip-text);
          font-family: var(--font-mono); font-size: 10px; font-weight: 700;
          padding: 3px 6px; border-radius: 4px; letter-spacing: .03em;
        }
        .chip-name { font-size: 12.5px; color: var(--text-muted); }
        .chip-sm .chip-name { display: none; }

        .pill { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: var(--pill-color); font-weight: 500; }
        .pill-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--pill-color); }

        .icon-btn { background: none; border: none; color: var(--text-dim); cursor: pointer; padding: 4px; border-radius: 6px; display: inline-flex; transition: all .12s; }
        .icon-btn:hover { background: var(--glass-bg-dark); color: var(--text); }
        .icon-btn.danger:hover { color: var(--danger); }
        .icon-btn:disabled { opacity: .3; cursor: not-allowed; }
        .icon-btn:disabled:hover { background: none; color: var(--text-dim); }

        .empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 12px; padding: 50px 20px; color: var(--text-dim);
          border: 1px dashed var(--glass-border); border-radius: var(--radius); text-align: center; font-size: 13px;
        }
        .empty.small { padding: 26px; }

        .schedule-filters { display: flex; flex-direction: column; gap: 10px; margin-bottom: 22px; }
        .filter-row { display: flex; align-items: flex-start; gap: 10px; flex-wrap: wrap; }
        .filter-label { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--text-dim); font-weight: 600; padding-top: 8px; min-width: 40px; }
        .filter-pills { display: flex; flex-wrap: wrap; gap: 6px; flex: 1; }
        .filter-pill {
          display: inline-flex; align-items: center; gap: 5px;
          background: var(--glass-bg);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--glass-border);
          border-radius: 999px;
          padding: 7px 14px; cursor: pointer; color: var(--text-muted); flex-shrink: 0;
          transition: border-color .12s, color .12s, background .12s;
        }
        .filter-pill:hover { border-color: var(--glass-border-light); }
        .filter-pill.active { color: var(--accent); border-color: var(--glass-border-accent); background: var(--accent-soft); }
        .filter-pill .pill-count { font-weight: 700; white-space: nowrap; }

        .group-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
        .group-card { cursor: pointer; position: relative; transition: border-color .12s, transform .12s; }
        .group-card:hover { border-color: var(--glass-border-accent); transform: translateY(-1px); }
        .group-card.menu-open { z-index: 10; }
        .thumb { display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: var(--glass-bg-dark); border: 1px solid var(--glass-border); }
        .thumb-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .thumb-fallback { color: var(--text-dim); }
        .group-card-body { display: flex; flex-direction: column; gap: 8px; }
        .group-card-head { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .group-card-title { flex: 1; min-width: 0; }
        .group-card-name { font-weight: 600; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text); }
        .group-card-row { display: flex; align-items: center; gap: 5px; font-size: 12.5px; color: var(--text-muted); }
        .group-dot { color: var(--text-dim); }
        .group-card-status { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 11.5px; margin-top: 4px; }
        .status-dot-group { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
        .status-dot-group.success { background: var(--success); }
        .status-dot-group.pending { background: var(--warning); }
        .status-dot-group.failed { background: var(--danger); }
        .status-count { font-weight: 500; }
        .status-count.success { color: var(--success); }
        .status-count.pending { color: var(--warning); }
        .status-count.failed { color: var(--danger); }
        .group-status-zero { color: var(--text-dim); font-size: 11.5px; }
        .group-actions { position: absolute; top: 12px; right: 10px; }
        .group-actions .action-menu { right: 0; left: auto; }
        .group-detail-head { position: relative; margin-bottom: 18px; }
        .group-detail-head .link-btn { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; margin-bottom: 8px; }
        .group-detail-title { font-family: var(--font-display); font-size: 18px; font-weight: 600; margin: 0 0 4px; }
        .group-detail-title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
        .group-detail-title-row .group-detail-title { margin: 0; }
        .group-detail-meta { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--text-muted); }
        .group-detail-sep { color: var(--text-dim); }
        .group-detail-actions { position: absolute; top: 0; right: 0; }
        .group-detail-actions .action-menu { right: 0; left: auto; }

        .post-list { display: flex; flex-direction: column; gap: 8px; }
        .post-row {
          display: flex; align-items: center; gap: 14px;
          background: var(--glass-bg);
          backdrop-filter: blur(var(--glass-blur));
          -webkit-backdrop-filter: blur(var(--glass-blur));
          border: 1px solid var(--glass-border);
          border-radius: 10px; padding: 12px 14px; position: relative; z-index: 1;
          transition: border-color .12s;
        }
        .post-row:hover { border-color: var(--glass-border-accent); }
        .post-row.menu-open { z-index: 10; }
        .post-time {
          display: flex; align-items: center; gap: 5px; font-family: var(--font-mono);
          font-size: 12px; color: var(--text-muted); width: 62px; flex-shrink: 0;
        }
        .post-body { flex: 1; min-width: 0; }
        .post-page { font-size: 12px; color: var(--text-muted); margin-bottom: 3px; }
        .post-content { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .post-actions { position: relative; flex-shrink: 0; }

        .action-menu {
          position: absolute; right: 0; top: calc(100% + 6px);
          background: var(--glass-bg-dark);
          backdrop-filter: blur(var(--glass-blur-lg));
          -webkit-backdrop-filter: blur(var(--glass-blur-lg));
          border: 1px solid var(--glass-border);
          border-radius: 10px; padding: 4px; z-index: 50;
          min-width: 210px;
        }
        .menu-item-group { display: flex; flex-direction: column; }
        .menu-item {
          display: flex; align-items: center; gap: 8px; width: 100%;
          background: none; border: none; color: var(--text);
          font-size: 12.5px; padding: 9px 12px; border-radius: 6px; cursor: pointer;
        }
        .menu-item:hover { background: var(--glass-bg); }
        .menu-item.danger { color: var(--danger); }
        .menu-item:disabled { opacity: .35; cursor: not-allowed; }

        .menu-has-submenu { position: relative; }
        .menu-trigger { display: flex; align-items: center; gap: 8px; width: 100%; }
        .sub-arrow { margin-left: auto; opacity: .5; }
        .submenu {
          position: absolute; right: 100%; top: 0; z-index: 60; margin-right: 8px;
          background: var(--glass-bg-dark);
          backdrop-filter: blur(var(--glass-blur-lg));
          -webkit-backdrop-filter: blur(var(--glass-blur-lg));
          border: 1px solid var(--glass-border);
          border-radius: 10px; padding: 4px; min-width: 140px;
          white-space: nowrap;
        }
        .submenu button {
          display: block; width: 100%; text-align: left; background: none; border: none;
          color: var(--text); font-size: 12px; padding: 8px 12px; border-radius: 6px; cursor: pointer;
        }
        .submenu button:hover { background: var(--glass-bg); }
        .submenu button:disabled { opacity: .35; cursor: not-allowed; }

        .menu-divider { height: 1px; background: var(--border); margin: 4px 0; }

        .menu-share { padding: 8px 12px; }
        .menu-share-label { font-size: 11px; color: var(--text-dim); display: block; margin-bottom: 6px; }

        .share-icons { display: flex; gap: 3px; flex-wrap: wrap; }
        .share-icon-btn {
          display: flex; align-items: center; justify-content: center;
          width: 26px; height: 26px; border-radius: 6px; border: none;
          background: var(--glass-bg); cursor: pointer; transition: background .12s, color .12s;
          color: var(--text-muted);
        }
        .share-icon-btn:hover { background: var(--glass-bg-light); color: var(--share-color, var(--text)); }
        .share-icon-btn:disabled { opacity: .25; cursor: not-allowed; }
        .share-icon-btn svg { width: 13px; height: 13px; }
        .share-icon-btn.copy-btn:hover { color: var(--accent); }

        .toast {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 999;
          background: var(--accent); color: #fff; padding: 10px 20px;
          border-radius: 8px; font-size: 13px; pointer-events: none;
          animation: toast-in .2s ease;
          max-width: 90vw; text-align: center; white-space: normal;
        }
        .toast-success { background: #16a34a; }
        .toast-error { background: var(--danger); }
        .toast-info { background: var(--accent); }
        @keyframes toast-in { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; } }

        .fb-modal { max-width: 768px; width: 100%; max-height: 85vh; overflow-y: auto; }
        .fb-post {
          display: flex; flex-direction: column; gap: 14px;
          border: 1px solid var(--glass-border); border-radius: var(--radius); overflow: hidden;
          background: var(--glass-bg-dark); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        }
        .fb-pages { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
        .fb-pages-title {
          font-size: 12px; font-weight: 600; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: .05em;
        }
        .fb-page-row {
          display: flex; align-items: center; gap: 12px;
          background: var(--glass-bg);
          backdrop-filter: blur(var(--glass-blur));
          -webkit-backdrop-filter: blur(var(--glass-blur));
          border: 1px solid var(--glass-border);
          border-radius: 10px; padding: 10px 12px;
        }
        .fb-avatar-sm { width: 36px; height: 36px; }
        .fb-row-eng { display: flex; align-items: center; gap: 12px; margin-left: auto; flex-shrink: 0; }
        .fb-eng-skel { display: flex; align-items: center; gap: 8px; }
        .skel-bar {
          width: 34px; height: 12px; border-radius: 6px;
          background: var(--glass-bg-dark);
          animation: skel-pulse 1.2s ease-in-out infinite;
        }
        @keyframes skel-pulse { 0%, 100% { opacity: .35; } 50% { opacity: .85; } }
        .fb-avatar {
          width: 44px; height: 44px; border-radius: 50%; overflow: hidden; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: var(--glass-bg); border: 1px solid var(--glass-border);
        }
        .fb-avatar .chip { border-radius: 50%; }
        .fb-avatar .chip .chip-name { display: none; }
        .fb-avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .fb-meta { flex: 1; min-width: 0; }
        .fb-page-name { font-weight: 600; font-size: 13.5px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .fb-error { display: flex; align-items: flex-start; gap: 5px; margin-top: 4px; font-size: 12px; line-height: 1.4; color: var(--danger); word-break: break-word; }
        .fb-body { padding: 6px 18px 0; }
        .fb-text { font-size: 14px; line-height: 1.6; color: var(--text); white-space: pre-wrap; word-break: break-word; margin: 0 0 14px; }
        .fb-media { display: flex; flex-direction: column; gap: 8px; }
        .fb-img { width: 100%; max-height: 460px; object-fit: cover; border-radius: var(--radius-sm); display: block; }
        .fb-eng-item { display: inline-flex; align-items: center; gap: 6px; }
        .fb-eng-icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 20px; height: 20px; border-radius: 50%; color: #fff;
        }
        .fb-eng-like { background: var(--accent); }
        .fb-eng-comment { background: #16a34a; }
        .fb-eng-share { background: #7c3aed; }
        .fb-view-btn {
          display: inline-flex; align-items: center; gap: 5px;
          background: var(--accent); color: #fff; border: none; cursor: pointer;
          font-size: 12px; font-weight: 600; padding: 7px 12px; border-radius: 18px;
          transition: filter .15s; flex-shrink: 0;
        }
        .fb-view-btn:hover { filter: brightness(1.1); }
        .fb-toggle {
          display: inline-block; background: none; border: none; cursor: pointer;
          color: var(--accent); font-size: 12.5px; font-weight: 600; padding: 0;
          margin: -6px 0 12px;
        }
        .fb-toggle:hover { text-decoration: underline; }

        .modal-lg { max-width: 896px; width: 100%; }
        .modal-sm { max-width: 360px; width: 100%; }
        .delete-body { font-size: 13px; color: var(--text-muted); line-height: 1.5; margin: 0 0 4px; }

        .pipeline { display: flex; align-items: center; gap: 0; flex-shrink: 0; }
        .pipe-node { width: 8px; height: 8px; border-radius: 50%; background: var(--border); border: 1px solid var(--text-dim); transition: all .2s; }
        .pipe-node.done { background: var(--accent); border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-soft); }
        .pipe-node.active { background: var(--warning); border-color: var(--warning); box-shadow: 0 0 0 3px var(--warning-soft); }
        .pipe-node.failed { background: var(--danger); border-color: var(--danger); box-shadow: 0 0 0 2px var(--danger-soft); }
        .pipe-seg { width: 16px; height: 2px; background: var(--border); border-radius: 1px; }
        .pipe-seg.filled { background: var(--accent); }
        .pipe-seg.failed { background: var(--danger); }
        .pipe-label { font-size: 11px; color: var(--text-dim); margin-left: 10px; font-family: var(--font-mono); width: 60px; }
        .pipe-label.failed { color: var(--danger); font-weight: 700; background: var(--danger-soft); border: 1px solid var(--danger); border-radius: 999px; padding: 1px 8px; width: auto; }

        .reset-badge { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--text-muted); background: var(--glass-bg-dark); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid var(--glass-border); padding: 7px 14px; border-radius: 20px; }
        .stat-row { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .stat {
          background: var(--glass-bg);
          backdrop-filter: blur(var(--glass-blur));
          -webkit-backdrop-filter: blur(var(--glass-blur));
          border: 1px solid var(--glass-border);
          border-radius: var(--radius);
          padding: 14px 20px; display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 120px;
        }
        .stat-num { font-family: var(--font-display); font-size: 22px; font-weight: 700; }
        .stat-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: .05em; }

        .log-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; gap: 10px; flex-wrap: wrap; }
        .chip-filter { display: flex; gap: 6px; }
        .filter-btn {
          background: var(--glass-bg-dark);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--glass-border);
          color: var(--text-muted);
          font-size: 12px; padding: 6px 14px; border-radius: 20px; cursor: pointer; transition: border-color .12s;
        }
        .filter-btn:hover { border-color: var(--glass-border-light); }
        .filter-btn.active { color: var(--accent); border-color: var(--glass-border-accent); background: var(--accent-soft); }
        .search-box {
          display: flex; align-items: center; gap: 6px;
          background: var(--glass-bg-dark);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sm); padding: 6px 10px; color: var(--text-dim);
          transition: border-color .15s;
        }
        .search-box input { background: none; border: none; outline: none; color: var(--text); font-size: 12.5px; width: 180px; font-family: var(--font); }
        .search-box:focus-within { border-color: var(--accent); }

        .table-wrap { border: 1px solid var(--glass-border-accent); border-radius: var(--radius); overflow: hidden; }
        .log-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
        .log-table th {
          text-align: left; background: var(--accent); color: #fff;
          font-weight: 600; font-size: 11px; padding: 10px 16px; text-transform: uppercase; letter-spacing: .04em;
        }
        .log-table td { padding: 10px 16px; border-top: 1px solid var(--glass-border); vertical-align: middle; }
        .log-table tbody tr { transition: background .1s; }
        .log-table tbody tr:nth-child(even) td { background: var(--panel-alt); }
        .log-table tbody tr:hover td { background: var(--accent-soft); }
        .msg-cell { color: var(--text-muted); max-width: 260px; }
        .result-ok { display: inline-flex; align-items: center; gap: 5px; color: var(--success); font-weight: 500; }
        .result-fail { display: inline-flex; align-items: center; gap: 5px; color: var(--danger); font-weight: 500; }

        .modal-overlay { position: fixed; inset: 0; background: var(--modal-overlay); display: flex; align-items: flex-start; justify-content: center; z-index: 50; padding: 40px 20px; overflow-y: auto; backdrop-filter: blur(2px); }
        .modal {
          background: var(--glass-bg);
          backdrop-filter: blur(var(--glass-blur-lg));
          -webkit-backdrop-filter: blur(var(--glass-blur-lg));
          border: 1px solid var(--glass-border);
          border-radius: var(--radius);
          width: 100%; max-width: 440px; padding: 22px; box-sizing: border-box;
        }
        .modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
        .modal-head h2 { font-family: var(--font-display); font-size: 17px; font-weight: 600; }
        .field-group { margin-bottom: 14px; }
        .field-row { display: flex; gap: 10px; }
        .field-row .field-group { flex: 1; }
        .field-label { display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 6px; font-weight: 500; }
        .input {
          width: 100%;
          background: var(--glass-bg-dark);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sm);
          padding: 9px 11px; color: var(--text); font-size: 13px; font-family: var(--font); outline: none;
          transition: border-color .12s;
        }
        .input:focus { border-color: var(--accent); }
        .input::placeholder { color: var(--text-dim); }
        .textarea { resize: vertical; font-family: var(--font); min-height: 200px; }
        .input-with-icon { display: flex; align-items: center; gap: 6px; background: var(--glass-bg-dark); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); padding: 0 8px 0 0; }
        .input-with-icon .input { border: none; background: none; padding-left: 0; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }

        .field-label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .field-label-row .field-label { margin-bottom: 0; }
        .link-btn { background: none; border: none; color: var(--accent); font-size: 11.5px; cursor: pointer; padding: 0; }
        .link-btn:hover { text-decoration: underline; }

        .page-picker { display: grid; grid-template-columns: 1fr; gap: 6px; max-height: 220px; overflow-y: auto; }
        .modal-lg .page-picker { grid-template-columns: repeat(2, 1fr); }
        .page-option {
          display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: var(--radius-sm);
          background: var(--glass-bg);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--glass-border);
          cursor: pointer; font-size: 12.5px; color: var(--text-muted);
          transition: border-color .12s;
        }
        .page-option input { accent-color: var(--accent); }
        .page-option.selected { color: var(--text); border-color: var(--glass-border-accent); background: var(--accent-soft); }
        .page-option.disabled { opacity: .4; cursor: not-allowed; }
        .page-option-name { flex: 1; }
        .select-count { font-size: 11px; color: var(--text-dim); margin-top: 6px; text-align: right; }
        .select-count.at-max { color: var(--warning); }

        .batch-tag {
          display: inline-block; margin-left: 8px; font-family: var(--font-mono); font-size: 10px;
          color: var(--accent); background: var(--accent-soft); padding: 1px 6px; border-radius: 10px;
        }

        .file-input { cursor: pointer; }
        .file-error { color: var(--danger); font-size: 12px; margin-top: 4px; font-weight: 600; }
        .preview-wrap { margin-top: 8px; position: relative; display: inline-block; width: 100%; }
        .preview-img { max-width: 100%; max-height: 260px; border-radius: var(--radius-sm); width: 100%; object-fit: cover; }
        .remove-btn { position: absolute; top: 6px; right: 6px; background: var(--glass-bg-dark); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid var(--glass-border); color: var(--text); border-radius: var(--radius-sm); padding: 4px 8px; cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 4px; transition: border-color .15s; }
        .remove-btn:hover { border-color: var(--glass-border-light); }

        .platform-picker { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .platform-option {
          display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-radius: var(--radius-sm);
          background: var(--glass-bg);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--glass-border);
          cursor: pointer; color: var(--text-muted); font-size: 12.5px;
          transition: border-color .12s;
        }
        .platform-option.selected { color: var(--text); border-color: var(--glass-border-accent); background: var(--accent-soft); }
        @media (max-width: 720px) {
          .shell { flex-direction: column; border-radius: 10px; }
          .sidebar { display: none; }
          .main-menu-btn { display: flex; }
          .dash-mob-overlay { display: block; }
          .main { padding: 12px; padding-bottom: 80px; }
          .stats-bar { gap: 8px; }
          .stat-card { padding: 12px 14px; min-width: 100px; }
          .stat-card-number { font-size: 17px; }
          .modal-overlay { padding: 20px 12px; }
          .modal { padding: 16px; }
          .modal-lg, .fb-modal, .modal-sm { max-width: 100%; width: 100%; margin: 0; }
          .grid-cards { grid-template-columns: 1fr; }
          .post-row { flex-wrap: wrap; gap: 8px; }
          .post-time { width: auto; }
          .stat-row { gap: 8px; }
          .stat { padding: 12px 14px; min-width: 80px; }
          .page-picker { grid-template-columns: 1fr; max-height: 200px; }
          .field-row { flex-wrap: wrap; }
          .fb-img { max-height: 300px; }
          .fb-view-btn { margin-left: auto; }
          .fb-page-row { flex-wrap: wrap; gap: 8px; }
          .fb-row-eng { margin-left: 0; }
        }

        /* ── Profile Modal ── */
        .modal-profile { max-width: 400px; }
        .pfp-avatar-wrap { display: flex; justify-content: center; margin: 6px 0 14px; }
        .pfp-avatar-wrap .avatar,
        .avatar-fallback {
          width: 72px; height: 72px; border-radius: 50%; object-fit: cover;
          border: 2px solid var(--glass-border);
        }
        .avatar-fallback {
          background: var(--panel); display: flex; align-items: center; justify-content: center;
          color: var(--text-dim);
          border: 1px solid var(--glass-border);
        }
        .pfp-avatar-upload { position: relative; cursor: pointer; }
        .pfp-avatar-overlay {
          position: absolute; inset: 0; border-radius: 50%;
          background: var(--overlay); display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity .15s; color: #fff;
        }
        .pfp-avatar-upload:hover .pfp-avatar-overlay { opacity: 1; }
        .pfp-view { text-align: center; }
        .pfp-name { font-family: var(--font-display); font-size: 17px; font-weight: 600; margin: 0 0 2px; }
        .pfp-username { color: var(--text-dim); font-size: 12.5px; margin: 0 0 14px; }
        .pfp-info { text-align: left; margin: 0 0 18px; }
        .pfp-row {
          display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--text-dim);
          padding: 10px 12px; border-radius: var(--radius-sm);
          background: var(--glass-bg-dark);
          border: 1px solid var(--glass-border);
          margin-bottom: 6px;
        }
        .pfp-row svg { flex-shrink: 0; }
        .pfp-val { margin-left: auto; color: var(--text); font-weight: 500; }
        .provider-badge {
          display: inline-flex; align-items: center; gap: 5px; background: var(--glass-bg-dark);
          border: 1px solid var(--glass-border); border-radius: 6px; padding: 2px 8px 2px 4px; font-size: 12px;
        }
        .provider-icon {
          width: 18px; height: 18px; border-radius: 4px; background: var(--accent-soft);
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; color: var(--accent);
        }
        .pfp-actions { display: flex; gap: 8px; justify-content: center; }
        .pfp-signout { background: var(--glass-bg-dark); border: 1px solid var(--glass-border); color: var(--danger); }
        .pfp-signout:hover { border-color: var(--danger); }
        .pfp-form { text-align: left; }
        .pfp-form .mono { font-family: var(--font-mono); }
        .pfp-error { color: var(--danger); font-size: 12px; margin: 0 0 10px; text-align: center; }
        .pfp-edit-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 18px; }
      `}</style>

      <aside className="sidebar">
        <button className="sidebar-home" onClick={() => router.push("/")}>
          <div className="brand">byJood</div>
          <div className="brand-sub">← {t("nav.home")}</div>
        </button>
        {nav.map((n) => (
          <button key={n.key} className={`nav-item ${tab === n.key ? "active" : ""}`} onClick={() => setTab(n.key)}>
            <n.icon size={16} /> {n.label}
          </button>
        ))}
        <button className="nav-item profile-btn" onClick={() => setProfileOpen(true)}>
          {profileAvatar ? (
            <img src={profileAvatar} alt="" className="sidebar-avatar" />
          ) : (
            <User size={16} />
          )}
          {t("nav.profile")}
        </button>
        <div className="sidebar-foot"><span className="status-dot" /> Database • Connected</div>
        <div className="sidebar-lang"><LangSwitcher /></div>
      </aside>

      <main className="main">
        <div className="main-top">
          <button className="main-menu-btn" onClick={() => setMobileSidebar(true)} aria-label="Open menu">
            <Menu size={18} />
          </button>
          <Breadcrumb paths={[{ label: t("nav.controlRoom"), href: "/dashboard" }]} />
        </div>
        <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
              <Link2 size={16} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-number">{pages.length}</span>
              <span className="stat-card-label">{t("dashboard.connections.title")}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
              <CalendarClock size={16} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-number">{posts.length}</span>
              <span className="stat-card-label">{t("dashboard.schedule.title")}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: "var(--accent-soft)", color: "var(--warning)" }}>
              <Clock size={16} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-number">{posts.filter((p) => p.status === "pending").length}</span>
              <span className="stat-card-label">{t("dashboard.status.pending")}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: "var(--accent-soft)", color: "var(--success)" }}>
              <CheckCircle2 size={16} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-number">{logs.length ? Math.round((logs.filter((l) => l.success).length / logs.length) * 100) : 0}%</span>
              <span className="stat-card-label">{t("dashboard.logs.statSuccess")}</span>
            </div>
          </div>
        </div>

        {tab === "connections" && (
          <ConnectionsView
            pages={pages}
            onAdd={handleAddPage}
            onRemove={handleRemovePage}
            onUpdate={handleUpdatePage}
            authed={authed}
            t={t}
            PLATFORMS={PLATFORMS}
          />
        )}
        {tab === "schedule" && (
          <ScheduleView
            posts={posts}
            pages={pages}
            onAdd={(newPosts) => setPosts((prev) => [...newPosts.map(postFromDb), ...prev])}
            onUpdate={(updated) => setPosts((prev) => prev.map((p) => p.id === updated.id ? postFromDb(updated) : p))}
            onDelete={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
            onRefresh={refreshPosts}
            authed={authed}
            t={t}
            PLATFORMS={PLATFORMS}
            locale={locale}
          />
        )}
        {tab === "logs" && <LogsView logs={logs} t={t} PLATFORMS={PLATFORMS} />}
      </main>

      {mobileSidebar && (
        <div className="dash-mob-overlay" onClick={() => setMobileSidebar(false)}>
          <aside className="dash-mob-sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="dash-mob-head">
              <button className="sidebar-home" onClick={() => { router.push("/"); setMobileSidebar(false); }}>
                <div className="brand">byJood</div>
                <div className="brand-sub">← {t("nav.home")}</div>
              </button>
              <button className="icon-btn" onClick={() => setMobileSidebar(false)}><X size={18} /></button>
            </div>
            {nav.map((n) => (
              <button
                key={n.key}
                className={`nav-item ${tab === n.key ? "active" : ""}`}
                onClick={() => { setTab(n.key); setMobileSidebar(false); }}
              >
                <n.icon size={16} /> {n.label}
              </button>
            ))}
            <button className="nav-item profile-btn" onClick={() => { setProfileOpen(true); setMobileSidebar(false); }}>
              {profileAvatar ? (
                <img src={profileAvatar} alt="" className="sidebar-avatar" />
              ) : (
                <User size={16} />
              )}
              {t("nav.profile")}
            </button>
            <div className="sidebar-foot"><span className="status-dot" /> Database • Connected</div>
            <div className="sidebar-lang"><LangSwitcher /></div>
          </aside>
        </div>
      )}

      {profileOpen && (
        <ProfileModal
          onClose={() => setProfileOpen(false)}
          t={t}
        />
      )}
    </div>
  );
}
