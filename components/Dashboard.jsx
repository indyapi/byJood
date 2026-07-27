"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import LangSwitcher from "./LangSwitcher";
import { useTranslation } from "@/lib/TranslationsProvider";
import {
  Plus, X, Eye, EyeOff, Trash2, ChevronLeft, ChevronRight, Clock,
  CheckCircle2, XCircle, Link2, CalendarClock, ScrollText, Copy,
  Info, RefreshCw, Search, Image as ImageIcon, MoreHorizontal, User,
} from "lucide-react";
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

const today = new Date();
const dayKey = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };

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
      <span className="pipe-label">{meta.label}</span>
    </div>
  );
}

function StatusPill({ status, t }) {
  const map = {
    active: { label: t("dashboard.connectionStatus.active"), color: "var(--success)" },
    expiring: { label: t("dashboard.connectionStatus.expiring"), color: "var(--warning)" },
    error: { label: t("dashboard.connectionStatus.error"), color: "var(--danger)" },
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
function ConnectionsView({ pages, onAdd, onRemove, authed, t, PLATFORMS }) {
  const [revealed, setRevealed] = useState({});
  const [modalOpen, setModalOpen] = useState(false);

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
            <div className="card" key={pg.id}>
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
              <div className="card-foot">
                <span className="label-dim">{t("dashboard.connections.addedPrefix")}{pg.addedAt}</span>
                <button className="icon-btn danger" onClick={() => onRemove(pg.id)} disabled={!authed} aria-label={t("dashboard.connections.deleteAria")}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && <AddConnectionModal onClose={() => setModalOpen(false)} onAdd={onAdd} t={t} PLATFORMS={PLATFORMS} />}
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
   Schedule view
--------------------------------------------------------- */
function ScheduleView({ posts, pages, onAdd, onUpdate, onDelete, onRefresh, authed, t, PLATFORMS, locale }) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(dayKey(today));
  const [weekStart, setWeekStart] = useState(addDays(today, -1));
  const [modalOpen, setModalOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [viewPost, setViewPost] = useState(null);
  const [editPost, setEditPost] = useState(null);
  const [changeTimePost, setChangeTimePost] = useState(null);
  const [deletePost, setDeletePost] = useState(null);

  useEffect(() => {
    if (!onRefresh) return;
    const interval = setInterval(onRefresh, 15000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  useEffect(() => {
    function handleClick(e) {
      if (activeMenu && !e.target.closest(".post-actions")) {
        setActiveMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [activeMenu]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const countFor = (d) => posts.filter((p) => p.date === dayKey(d)).length;
  const dayPosts = posts.filter((p) => p.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));

  const dayLabel = (d) =>
    d.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { weekday: "short" }).replace(".", "");

  async function handleDeleteConfirmed() {
    if (!deletePost) return;
    const res = await fetch(`/api/scheduled-posts/${deletePost.id}`, { method: "DELETE" });
    if (res.status === 401) { router.replace("/sign-in"); return; }
    if (res.ok || res.status === 204) {
      onDelete(deletePost.id);
    }
    setDeletePost(null);
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

      <div className="week-strip">
        <button className="icon-btn" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft size={16} /></button>
        {days.map((d) => {
          const key = dayKey(d);
          const active = key === selectedDate;
          const isToday = key === dayKey(today);
          return (
            <button key={key} className={`day-pill ${active ? "active" : ""}`} onClick={() => setSelectedDate(key)}>
              <span className="day-name">{dayLabel(d)}</span>
              <span className="day-num">{d.getDate()}{isToday && <span className="today-dot" />}</span>
              {countFor(d) > 0 && <span className="day-count">{countFor(d)}</span>}
            </button>
          );
        })}
        <button className="icon-btn" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight size={16} /></button>
      </div>

      {dayPosts.length === 0 ? (
        <div className="empty">
          <CalendarClock size={28} />
          <p>{t("dashboard.schedule.empty")}</p>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)} disabled={!authed}><Plus size={16} /> {t("dashboard.schedule.addBtn")}</button>
        </div>
      ) : (
        <div className="post-list">
          {dayPosts.map((p) => {
            const page = pages.find((pg) => pg.id === p.pageId);
            const isPosted = p.status === "posted";
            return (
              <div className="post-row" key={p.id}>
                <div className="post-time"><Clock size={13} />{p.time}</div>
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
                      <button onClick={() => { setActiveMenu(null); setViewPost(p); }}>
                        {t("dashboard.schedule.viewAction")}
                      </button>
                      <button onClick={() => { setActiveMenu(null); setEditPost(p); }} disabled={isPosted}>
                        {t("dashboard.schedule.editAction")}
                      </button>
                      <button onClick={() => { setActiveMenu(null); setChangeTimePost(p); }} disabled={isPosted}>
                        {t("dashboard.schedule.changeTimeAction")}
                      </button>
                      <button className="danger" onClick={() => { setActiveMenu(null); setDeletePost(p); }}>
                        {t("dashboard.schedule.deleteAction")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <AddPostModal
          pages={pages}
          defaultDate={selectedDate}
          onClose={() => setModalOpen(false)}
          onAdd={onAdd}
          t={t}
          PLATFORMS={PLATFORMS}
        />
      )}

      {viewPost && (
        <ViewDetailModal
          post={viewPost}
          page={pages.find((pg) => pg.id === viewPost.pageId)}
          onClose={() => setViewPost(null)}
          t={t}
          PLATFORMS={PLATFORMS}
        />
      )}

      {editPost && (
        <EditPostModal
          post={editPost}
          onClose={() => setEditPost(null)}
          onUpdate={(updated) => { onUpdate(updated); setEditPost(null); }}
          t={t}
        />
      )}

      {changeTimePost && (
        <ChangeTimeModal
          post={changeTimePost}
          onClose={() => setChangeTimePost(null)}
          onUpdate={(updated) => { onUpdate(updated); setChangeTimePost(null); }}
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
    const created = [];
    for (const pageId of selectedIds) {
      const page = pages.find((p) => p.id === pageId);
      const res = await fetch("/api/scheduled-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_id: pageId, platform: page.platform, content, scheduled_at, media_urls: mediaUrls }),
      });
      if (res.status === 401) { router.replace("/sign-in"); return; }
      if (res.ok) {
        const saved = await res.json();
        created.push(saved);
      }
    }
    if (created.length > 0) onAdd(created);
    onClose();
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
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
            <textarea className="input textarea" rows={4} placeholder={t("dashboard.fields.contentPlaceholder")} value={content} onChange={(e) => setContent(e.target.value)} required />
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
   View Detail Modal
--------------------------------------------------------- */
function ViewDetailModal({ post, page, onClose, t, PLATFORMS }) {
  if (!post) return null;
  return (
    <div className="modal-overlay">
      <div className="modal modal-detail">
        <div className="modal-head">
          <h2>{t("dashboard.schedule.viewTitle")}</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        {post.media_urls?.length > 0 && (
          <div className="detail-media">
            {post.media_urls.map((url, i) => (
              <img key={i} src={url} alt="" className="detail-img" />
            ))}
          </div>
        )}
        <div className="detail-row">
          <span className="detail-label">{t("dashboard.fields.platform")}</span>
          <PlatformChip platform={post.platform} PLATFORMS={PLATFORMS} />
        </div>
        <div className="detail-row">
          <span className="detail-label">{t("dashboard.fields.displayName")}</span>
          <span>{page?.label || post.pageName}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">{t("dashboard.fields.date")}</span>
          <span>{post.date} {post.time}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">{t("dashboard.fields.content")}</span>
          <span className="detail-content">{post.content}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">{t("dashboard.logs.colStatus")}</span>
          <StatusPipeline status={post.status} t={t} />
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
    status: "active",
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
    date: d ? d.toLocaleDateString("sv-SE") : "",
    time: d ? d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false }) : "",
    status: p.status,
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

  useEffect(() => {
    import("@/lib/supabase-client").then(({ createClientSupabase }) => {
      createClientSupabase().auth.getSession().then(({ data: { session } }) => {
        setAuthed(!!session);
        if (!session) router.replace("/sign-in");
      });
    });
  }, [router]);

  async function authedFetch(url, options) {
    const res = await fetch(url, options);
    if (res.status === 401) router.replace("/sign-in");
    return res;
  }

  const [tab, setTab] = useState("connections");
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
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

        :root {
          --bg: #12151b;
          --panel: #1a1e26;
          --panel-alt: #20242e;
          --border: #2a2f3a;
          --text: #e8eaef;
          --text-muted: #8b93a3;
          --text-dim: #5c6270;
          --accent: #4fd1c5;
          --accent-soft: rgba(79, 209, 197, 0.13);
          --success: #5fd068;
          --warning: #f2b84b;
          --danger: #f2795c;
          --radius: 10px;
        }
        * { box-sizing: border-box; }
        .shell {
          display: flex;
          min-height: 640px;
          background: var(--bg);
          color: var(--text);
          font-family: 'Inter', sans-serif;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid var(--border);
        }
        .mono { font-family: 'IBM Plex Mono', monospace; }
        .dim { color: var(--text-dim); }

        /* Sidebar */
        .sidebar {
          width: 216px;
          flex-shrink: 0;
          background: #14171d;
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 20px 14px;
        }
        .brand {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.02em;
          padding: 0 10px 4px;
        }
        .brand-sub {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
          color: var(--text-dim);
          padding: 0 10px 20px;
          text-transform: uppercase;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          color: var(--text-muted);
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          background: none;
          border: none;
          text-align: left;
          width: 100%;
          margin-bottom: 2px;
        }
        .nav-item:hover { background: var(--panel-alt); color: var(--text); }
        .nav-item.active { background: var(--accent-soft); color: var(--accent); }
        .sidebar-foot {
          margin-top: auto;
          padding: 10px;
          font-size: 11px;
          color: var(--text-dim);
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'IBM Plex Mono', monospace;
        }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--success); }
        .sidebar-lang { padding: 4px 10px 12px; display: flex; }
        .sidebar-lang .lang-switcher { border-left: none; padding-left: 0; margin-left: 0; }

        /* Main */
        .main { flex: 1; overflow-y: auto; padding: 28px 32px; }
        .view-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 18px; gap: 12px; flex-wrap: wrap; }
        .eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: 0.16em; color: var(--accent); text-transform: uppercase; }
        h1 { font-family: 'Space Grotesk', sans-serif; font-size: 24px; margin: 4px 0 6px; font-weight: 600; }
        .sub { color: var(--text-muted); font-size: 13px; max-width: 480px; line-height: 1.5; }

        .btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 14px; border-radius: 8px; font-size: 13px; font-weight: 600;
          cursor: pointer; border: 1px solid transparent; font-family: 'Inter', sans-serif;
        }
        .btn-primary { background: var(--accent); color: #0c1210; }
        .btn-primary:hover { filter: brightness(1.08); }
        .btn-ghost { background: transparent; color: var(--text-muted); border-color: var(--border); }
        .btn-ghost:hover { color: var(--text); border-color: var(--text-dim); }

        .notice {
          display: flex; align-items: flex-start; gap: 8px;
          background: var(--panel); border: 1px solid var(--border);
          border-left: 2px solid var(--accent);
          padding: 10px 12px; border-radius: 8px; font-size: 12.5px; color: var(--text-muted);
          margin-bottom: 20px; line-height: 1.5;
        }
        .notice.small { font-size: 11.5px; margin-bottom: 14px; }

        .grid-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
        .card { background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; }
        .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .card-title { font-weight: 600; font-size: 14.5px; margin-bottom: 10px; }
        .card-row { display: flex; align-items: center; gap: 8px; font-size: 12px; margin-bottom: 6px; color: var(--text); }
        .label-dim { color: var(--text-dim); min-width: 34px; font-size: 11px; }
        .card-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border); font-size: 11px; color: var(--text-dim); }

        .chip { display: inline-flex; align-items: center; gap: 6px; }
        .chip-code {
          background: var(--chip-color); color: var(--chip-text);
          font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600;
          padding: 3px 6px; border-radius: 4px; letter-spacing: 0.03em;
        }
        .chip-name { font-size: 12.5px; color: var(--text-muted); }
        .chip-sm .chip-name { display: none; }

        .pill { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: var(--pill-color); font-weight: 500; }
        .pill-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--pill-color); }

        .icon-btn { background: none; border: none; color: var(--text-dim); cursor: pointer; padding: 4px; border-radius: 6px; display: inline-flex; }
        .icon-btn:hover { background: var(--panel-alt); color: var(--text); }
        .icon-btn.danger:hover { color: var(--danger); }

        .empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 12px; padding: 50px 20px; color: var(--text-dim);
          border: 1px dashed var(--border); border-radius: var(--radius); text-align: center; font-size: 13px;
        }
        .empty.small { padding: 26px; }

        /* Week strip */
        .week-strip { display: flex; align-items: center; gap: 6px; margin-bottom: 18px; overflow-x: auto; padding-bottom: 4px; }
        .day-pill {
          position: relative; display: flex; flex-direction: column; align-items: center; gap: 2px;
          background: var(--panel); border: 1px solid var(--border); border-radius: 10px;
          padding: 8px 14px; cursor: pointer; min-width: 52px; color: var(--text-muted);
        }
        .day-pill.active { background: var(--accent-soft); border-color: var(--accent); color: var(--accent); }
        .day-name { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
        .day-num { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 15px; display: flex; align-items: center; gap: 3px; }
        .today-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--accent); }
        .day-count { position: absolute; top: -6px; right: -6px; background: var(--accent); color: #0c1210; font-size: 9px; font-weight: 700; border-radius: 20px; padding: 1px 5px; }

        .post-list { display: flex; flex-direction: column; gap: 8px; }
        .post-row { display: flex; align-items: center; gap: 14px; background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; position: relative; }
        .post-time { display: flex; align-items: center; gap: 5px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--text-muted); width: 62px; flex-shrink: 0; }
        .post-body { flex: 1; min-width: 0; }
        .post-actions { position: relative; flex-shrink: 0; }
        .action-menu { position: absolute; right: 0; top: calc(100% + 4px); background: var(--panel-alt); border: 1px solid var(--border); border-radius: 8px; padding: 4px; z-index: 30; min-width: 160px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
        .action-menu button { display: block; width: 100%; text-align: left; background: none; border: none; color: var(--text); font-size: 12.5px; padding: 8px 12px; border-radius: 6px; cursor: pointer; }
        .action-menu button:hover { background: var(--panel); }
        .action-menu button.danger { color: var(--danger); }
        .action-menu button.danger:hover { background: rgba(242,121,92,0.12); }
        .action-menu button:disabled { opacity: 0.35; cursor: not-allowed; }
        .action-menu button:disabled:hover { background: none; }

        .modal-detail { max-width: 500px; }
        .detail-media { margin-bottom: 14px; }
        .detail-img { width: 100%; max-height: 260px; object-fit: contain; border-radius: 8px; border: 1px solid var(--border); background: #000; }
        .detail-row { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; font-size: 13px; }
        .detail-label { color: var(--text-dim); min-width: 80px; flex-shrink: 0; font-size: 12px; }
        .detail-content { white-space: pre-wrap; word-break: break-word; color: var(--text-muted); line-height: 1.5; }

        .modal-sm { max-width: 360px; }
        .delete-body { font-size: 13px; color: var(--text-muted); line-height: 1.5; margin: 0 0 4px; }
        .btn-danger { background: var(--danger); color: #fff; }
        .btn-danger:hover { filter: brightness(1.1); }
        .post-page { font-size: 12px; color: var(--text-muted); margin-bottom: 2px; }
        .post-content { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        /* Pipeline signature element */
        .pipeline { display: flex; align-items: center; gap: 0; flex-shrink: 0; }
        .pipe-node { width: 7px; height: 7px; border-radius: 50%; background: var(--border); border: 1px solid var(--text-dim); }
        .pipe-node.done { background: var(--accent); border-color: var(--accent); }
        .pipe-node.active { background: var(--warning); border-color: var(--warning); box-shadow: 0 0 0 3px rgba(242,184,75,0.18); }
        .pipe-node.failed { background: var(--danger); border-color: var(--danger); }
        .pipe-seg { width: 14px; height: 1px; background: var(--border); }
        .pipe-seg.filled { background: var(--accent); }
        .pipe-seg.failed { background: var(--danger); }
        .pipe-label { font-size: 10.5px; color: var(--text-dim); margin-left: 8px; font-family: 'IBM Plex Mono', monospace; width: 60px; }

        /* Logs */
        .reset-badge { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--text-muted); background: var(--panel); border: 1px solid var(--border); padding: 7px 12px; border-radius: 20px; }
        .stat-row { display: flex; gap: 10px; margin-bottom: 18px; }
        .stat { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 12px 18px; display: flex; flex-direction: column; gap: 4px; }
        .stat-num { font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: 600; }
        .stat-label { font-size: 11px; color: var(--text-dim); }

        .log-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 10px; flex-wrap: wrap; }
        .chip-filter { display: flex; gap: 6px; }
        .filter-btn { background: var(--panel); border: 1px solid var(--border); color: var(--text-muted); font-size: 12px; padding: 6px 12px; border-radius: 20px; cursor: pointer; }
        .filter-btn.active { background: var(--accent-soft); border-color: var(--accent); color: var(--accent); }
        .search-box { display: flex; align-items: center; gap: 6px; background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 6px 10px; color: var(--text-dim); }
        .search-box input { background: none; border: none; outline: none; color: var(--text); font-size: 12.5px; width: 180px; }

        .table-wrap { border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
        .log-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
        .log-table th { text-align: left; background: var(--panel-alt); color: var(--text-dim); font-weight: 500; font-size: 11px; padding: 10px 14px; text-transform: uppercase; letter-spacing: 0.04em; }
        .log-table td { padding: 10px 14px; border-top: 1px solid var(--border); vertical-align: middle; }
        .log-table tr:hover td { background: var(--panel-alt); }
        .msg-cell { color: var(--text-muted); max-width: 260px; }
        .result-ok { display: inline-flex; align-items: center; gap: 5px; color: var(--success); }
        .result-fail { display: inline-flex; align-items: center; gap: 5px; color: var(--danger); }

        /* Modal */
        .modal-overlay { position: fixed; inset: 0; background: rgba(8,10,14,0.6); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 20px; }
        .modal { background: var(--panel); border: 1px solid var(--border); border-radius: 14px; width: 100%; max-width: 440px; padding: 20px; max-height: 88vh; overflow-y: auto; }
        .modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .modal-head h2 { font-family: 'Space Grotesk', sans-serif; font-size: 17px; font-weight: 600; }
        .field-group { margin-bottom: 14px; }
        .field-row { display: flex; gap: 10px; }
        .field-row .field-group { flex: 1; }
        .field-label { display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }
        .input {
          width: 100%; background: var(--panel-alt); border: 1px solid var(--border); border-radius: 8px;
          padding: 9px 11px; color: var(--text); font-size: 13px; font-family: 'Inter', sans-serif; outline: none;
        }
        .input:focus { border-color: var(--accent); }
        .textarea { resize: vertical; font-family: 'Inter', sans-serif; }
        .input-with-icon { display: flex; align-items: center; gap: 6px; background: var(--panel-alt); border: 1px solid var(--border); border-radius: 8px; padding: 0 8px 0 0; }
        .input-with-icon .input { border: none; background: none; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 18px; }

        .field-label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .field-label-row .field-label { margin-bottom: 0; }
        .link-btn { background: none; border: none; color: var(--accent); font-size: 11.5px; cursor: pointer; padding: 0; }
        .link-btn:hover { text-decoration: underline; }

        .page-picker { display: flex; flex-direction: column; gap: 6px; max-height: 220px; overflow-y: auto; }
        .page-option {
          display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 8px;
          background: var(--panel-alt); border: 1px solid var(--border); cursor: pointer; font-size: 12.5px; color: var(--text-muted);
        }
        .page-option input { accent-color: var(--accent); }
        .page-option.selected { border-color: var(--accent); background: var(--accent-soft); color: var(--text); }
        .page-option.disabled { opacity: 0.4; cursor: not-allowed; }
        .page-option-name { flex: 1; }
        .select-count { font-size: 11px; color: var(--text-dim); margin-top: 6px; text-align: right; }
        .select-count.at-max { color: var(--warning); }

        .batch-tag {
          display: inline-block; margin-left: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 10px;
          color: var(--accent); background: var(--accent-soft); padding: 1px 6px; border-radius: 10px;
        }

        .file-input { cursor: pointer; }
        .file-error { color: #ff2222; font-size: 12px; margin-top: 4px; font-weight: 600; }
        .preview-wrap { margin-top: 8px; position: relative; display: inline-block; }
        .preview-img { max-width: 100%; max-height: 180px; border-radius: 8px; border: 1px solid var(--border); object-fit: contain; background: #000; }
        .remove-btn { position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.75); border: none; color: #fff; border-radius: 6px; padding: 4px 8px; cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 4px; transition: background 0.15s; }
        .remove-btn:hover { background: rgba(255,0,0,0.8); }

        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .icon-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .icon-btn:disabled:hover { background: none; color: var(--text-dim); }

        .platform-picker { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .platform-option {
          display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-radius: 8px;
          background: var(--panel-alt); border: 1px solid var(--border); cursor: pointer; color: var(--text-muted); font-size: 12.5px;
        }
        .platform-option.selected { border-color: var(--chip-color); background: color-mix(in srgb, var(--chip-color) 14%, transparent); color: var(--text); }
        .platform-option-name { font-weight: 500; }

        @media (max-width: 720px) {
          .shell { flex-direction: column; }
          .sidebar { width: 100%; flex-direction: row; align-items: center; padding: 12px 14px; overflow-x: auto; }
          .brand, .brand-sub, .sidebar-foot, .sidebar-lang { display: none; }
          .nav-item { width: auto; white-space: nowrap; }
          .main { padding: 20px; }
        }
      `}</style>

      <aside className="sidebar">
        <div className="brand">byJood</div>
        <div className="brand-sub">Social Poster / Control Room</div>
        {nav.map((n) => (
          <button key={n.key} className={`nav-item ${tab === n.key ? "active" : ""}`} onClick={() => setTab(n.key)}>
            <n.icon size={16} /> {n.label}
          </button>
        ))}
        <button className="nav-item profile-btn" onClick={() => router.push("/profile")}>
          <User size={16} /> {t("nav.profile")}
        </button>
        <div className="sidebar-foot"><span className="status-dot" /> Supabase • Connected</div>
        <div className="sidebar-lang"><LangSwitcher /></div>
      </aside>

      <main className="main">
        {tab === "connections" && (
          <ConnectionsView
            pages={pages}
            onAdd={handleAddPage}
            onRemove={handleRemovePage}
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
    </div>
  );
}
