"use client";

import React, { useState, useMemo } from "react";
import {
  Plus, X, Eye, EyeOff, Trash2, ChevronLeft, ChevronRight, Clock,
  CheckCircle2, XCircle, Link2, CalendarClock, ScrollText, Copy,
  Info, RefreshCw, Search,
} from "lucide-react";

/* ---------------------------------------------------------
   Platform config — single source of truth for color/labels
--------------------------------------------------------- */
const PLATFORMS = {
  facebook:  { code: "FB",  name: "Facebook Page", color: "#3D7DF6" },
  instagram: { code: "IG",  name: "Instagram",      color: "#E14A8E" },
  threads:   { code: "TH",  name: "Threads",        color: "#EDEDED", dark: true },
  tiktok:    { code: "TT",  name: "TikTok",         color: "#FE4D6F" },
  youtube:   { code: "YT",  name: "YouTube",        color: "#F0384A" },
  website:   { code: "WEB", name: "Website",        color: "#6C93A8" },
};

const CONNECTION_FIELDS = {
  facebook:  [{ key: "pageId", label: "Page ID", placeholder: "1029384756512" },
              { key: "token", label: "Page access token", secret: true, placeholder: "EAAGx..." }],
  instagram: [{ key: "accountId", label: "IG business account ID", placeholder: "1784509213..." },
              { key: "token", label: "Access token", secret: true, placeholder: "IGQVJ..." }],
  threads:   [{ key: "accountId", label: "Threads user ID", placeholder: "7891023..." },
              { key: "token", label: "Access token", secret: true, placeholder: "THQVJ..." }],
  tiktok:    [{ key: "openId", label: "Open ID", placeholder: "-aBcDeFg..." },
              { key: "token", label: "Access token", secret: true, placeholder: "act.xxxxx" }],
  youtube:   [{ key: "channelId", label: "Channel ID", placeholder: "UCxxxxxxxxxxxxxxxx" },
              { key: "token", label: "API key / OAuth token", secret: true, placeholder: "AIzaSy..." }],
  website:   [{ key: "webhookUrl", label: "Webhook URL", placeholder: "https://yoursite.com/api/webhook" },
              { key: "token", label: "API key", secret: true, placeholder: "sk_live_..." }],
};

/* ---------------------------------------------------------
   Mock data — stand-in for what Supabase would return
--------------------------------------------------------- */
const today = new Date("2026-07-24T09:00:00");
const dayKey = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };

const initialPages = [
  { id: "p1", platform: "facebook", label: "ร้านกาแฟดอยสุเทพ", externalId: "1029384756512", status: "active", addedAt: "2026-07-10", tokenPreview: "EAAG••••••••3F9x" },
  { id: "p2", platform: "instagram", label: "@doisuthep.coffee", externalId: "17845092130044", status: "active", addedAt: "2026-07-10", tokenPreview: "IGQV••••••••7k2M" },
  { id: "p3", platform: "tiktok", label: "doisuthep.official", externalId: "-aBcDeFg91011", status: "expiring", addedAt: "2026-06-02", tokenPreview: "act.••••••••x02q" },
  { id: "p4", platform: "threads", label: "@doisuthep.coffee", externalId: "78910233344", status: "active", addedAt: "2026-07-15", tokenPreview: "THQV••••••••b71z" },
  { id: "p5", platform: "website", label: "เว็บไซต์หลัก", externalId: "webhook", status: "error", addedAt: "2026-05-28", tokenPreview: "sk_live_••••••9adf" },
];

const initialPosts = [
  { id: "s1", pageId: "p1", platform: "facebook", content: "โปรโมชั่นเช้าวันศุกร์ ลาเต้ลดครึ่งราคาแก้วที่สอง ☕", date: dayKey(today), time: "08:00", status: "posted" },
  { id: "s2", pageId: "p2", platform: "instagram", content: "รูปบรรยากาศร้านยามเช้า แสงแรกของวัน", date: dayKey(today), time: "09:30", status: "posted" },
  { id: "s3", pageId: "p3", platform: "tiktok", content: "คลิปชงกาแฟดริปสไตล์ล้านนา", date: dayKey(today), time: "12:00", status: "queued" },
  { id: "s4", pageId: "p1", platform: "facebook", content: "แจ้งปิดร้านเร็วขึ้น 1 ชม. วันเสาร์นี้", date: dayKey(addDays(today, 1)), time: "10:00", status: "pending" },
  { id: "s5", pageId: "p4", platform: "threads", content: "ขอบคุณลูกค้าทุกท่านสำหรับ 3 ปีที่ผ่านมา 🎉", date: dayKey(addDays(today, 1)), time: "18:00", status: "pending" },
  { id: "s6", pageId: "p5", platform: "website", content: "อัปเดตเมนูฤดูฝน พร้อมราคาใหม่", date: dayKey(addDays(today, 2)), time: "07:00", status: "pending" },
  { id: "s7", pageId: "p2", platform: "instagram", content: "รีวิวจากลูกค้า 5 ดาว", date: dayKey(addDays(today, -1)), time: "15:00", status: "failed" },
];

const initialLogs = [
  { id: "l1", pageLabel: "ร้านกาแฟดอยสุเทพ", platform: "facebook", success: true, message: "โพสต์สำเร็จ", externalId: "1029_998877", time: "2026-07-24 08:00:14" },
  { id: "l2", pageLabel: "@doisuthep.coffee", platform: "instagram", success: true, message: "โพสต์สำเร็จ", externalId: "IG_44210091", time: "2026-07-24 09:30:22" },
  { id: "l3", pageLabel: "doisuthep.official", platform: "tiktok", success: false, message: "Token ใกล้หมดอายุ กรุณา refresh", externalId: "—", time: "2026-07-24 12:00:05" },
  { id: "l4", pageLabel: "@doisuthep.coffee", platform: "instagram", success: false, message: "รีวิวจากลูกค้า 5 ดาว ต้องมีรูปอย่างน้อย 1 ไฟล์", externalId: "—", time: "2026-07-23 15:00:09" },
  { id: "l5", pageLabel: "เว็บไซต์หลัก", platform: "website", success: false, message: "Webhook ตอบกลับ 503", externalId: "—", time: "2026-07-22 07:00:44" },
  { id: "l6", pageLabel: "ร้านกาแฟดอยสุเทพ", platform: "facebook", success: true, message: "โพสต์สำเร็จ", externalId: "1029_998801", time: "2026-07-21 08:00:11" },
];

/* ---------------------------------------------------------
   Small building blocks
--------------------------------------------------------- */
function PlatformChip({ platform, size = "md" }) {
  const p = PLATFORMS[platform];
  return (
    <span className={`chip chip-${size}`} style={{ "--chip-color": p.color, "--chip-text": p.dark ? "#111318" : "#fff" }}>
      <span className="chip-code">{p.code}</span>
      {size !== "sm" && <span className="chip-name">{p.name}</span>}
    </span>
  );
}

const STATUS_META = {
  pending: { label: "รอคิว", step: 0 },
  queued: { label: "อยู่ในคิว", step: 1 },
  posted: { label: "โพสต์แล้ว", step: 2 },
  failed: { label: "ล้มเหลว", step: 2, failed: true },
};

function StatusPipeline({ status }) {
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

function StatusPill({ status }) {
  const map = {
    active: { label: "ใช้งานได้", color: "var(--success)" },
    expiring: { label: "ใกล้หมดอายุ", color: "var(--warning)" },
    error: { label: "มีปัญหา", color: "var(--danger)" },
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
function ConnectionsView({ pages, onAdd, onRemove }) {
  const [revealed, setRevealed] = useState({});
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <span className="eyebrow">CONNECTIONS</span>
          <h1>จัดการเพจ</h1>
          <p className="sub">เพิ่ม Access Token หรือ API Key ของแต่ละแพลตฟอร์ม เพื่อให้ระบบใช้โพสต์แทนคุณ</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> เพิ่มการเชื่อมต่อ
        </button>
      </div>

      <div className="notice">
        <Info size={15} />
        <span>Token ถูกส่งตรงไปยัง backend และเก็บเป็น secret ใน Supabase เท่านั้น — หน้านี้จะไม่แสดง token เต็มซ้ำอีกหลังบันทึก</span>
      </div>

      {pages.length === 0 ? (
        <div className="empty">
          <Link2 size={28} />
          <p>ยังไม่มีการเชื่อมต่อ เพิ่มเพจหรือ API key แรกของคุณเพื่อเริ่มโพสต์</p>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} /> เพิ่มการเชื่อมต่อ</button>
        </div>
      ) : (
        <div className="grid-cards">
          {pages.map((pg) => (
            <div className="card" key={pg.id}>
              <div className="card-top">
                <PlatformChip platform={pg.platform} />
                <StatusPill status={pg.status} />
              </div>
              <div className="card-title">{pg.label}</div>
              <div className="card-row">
                <span className="label-dim">ID</span>
                <span className="mono">{pg.externalId}</span>
              </div>
              <div className="card-row">
                <span className="label-dim">Token</span>
                <span className="mono">
                  {revealed[pg.id] ? pg.tokenPreview.replace(/•+/g, "••••1a9c92") : pg.tokenPreview}
                </span>
                <button
                  className="icon-btn"
                  onClick={() => setRevealed((r) => ({ ...r, [pg.id]: !r[pg.id] }))}
                  aria-label="แสดง/ซ่อน token"
                >
                  {revealed[pg.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <div className="card-foot">
                <span className="label-dim">เพิ่มเมื่อ {pg.addedAt}</span>
                <button className="icon-btn danger" onClick={() => onRemove(pg.id)} aria-label="ลบการเชื่อมต่อ">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && <AddConnectionModal onClose={() => setModalOpen(false)} onAdd={onAdd} />}
    </div>
  );
}

function AddConnectionModal({ onClose, onAdd }) {
  const [platform, setPlatform] = useState("facebook");
  const [label, setLabel] = useState("");
  const [values, setValues] = useState({});
  const [showSecret, setShowSecret] = useState({});

  const fields = CONNECTION_FIELDS[platform];

  function submit(e) {
    e.preventDefault();
    onAdd({
      id: `p${Date.now()}`,
      platform,
      label: label || PLATFORMS[platform].name,
      externalId: values[fields[0].key] || "—",
      status: "active",
      addedAt: dayKey(today),
      tokenPreview: "••••••••••••saved",
    });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>เพิ่มการเชื่อมต่อ</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={submit}>
          <div className="field-group">
            <label className="field-label">แพลตฟอร์ม</label>
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
            <label className="field-label">ชื่อที่แสดง</label>
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
            <span>ค่าที่กรอกจะถูกส่งไปเก็บเป็น secret บน Supabase ผ่าน backend เท่านั้น ไม่มีการเก็บไว้ฝั่ง frontend</span>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary">บันทึกการเชื่อมต่อ</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Schedule view
--------------------------------------------------------- */
function ScheduleView({ posts, pages, onAdd }) {
  const [selectedDate, setSelectedDate] = useState(dayKey(today));
  const [weekStart, setWeekStart] = useState(addDays(today, -1));
  const [modalOpen, setModalOpen] = useState(false);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const countFor = (d) => posts.filter((p) => p.date === dayKey(d)).length;
  const dayPosts = posts.filter((p) => p.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));

  const dayLabel = (d) =>
    d.toLocaleDateString("th-TH", { weekday: "short" }).replace(".", "");

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <span className="eyebrow">SCHEDULE</span>
          <h1>ตั้งเวลาโพสต์</h1>
          <p className="sub">จัดคิวโพสต์ล่วงหน้าในแต่ละเพจ ระบบจะแตกงานส่งเข้าคิวอัตโนมัติเมื่อถึงเวลา</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> ตั้งโพสต์ใหม่
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
          <p>ยังไม่มีโพสต์ที่ตั้งเวลาไว้ในวันนี้</p>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} /> ตั้งโพสต์ใหม่</button>
        </div>
      ) : (
        <div className="post-list">
          {dayPosts.map((p) => {
            const page = pages.find((pg) => pg.id === p.pageId);
            return (
              <div className="post-row" key={p.id}>
                <div className="post-time"><Clock size={13} />{p.time}</div>
                <PlatformChip platform={p.platform} size="sm" />
                <div className="post-body">
                  <div className="post-page">
                    {page?.label ?? "ไม่พบเพจ"}
                    {p.batchTotal > 1 && <span className="batch-tag">ชุดเดียวกัน {p.batchTotal} เพจ</span>}
                  </div>
                  <div className="post-content">{p.content}</div>
                </div>
                <StatusPipeline status={p.status} />
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
        />
      )}
    </div>
  );
}

const MAX_PAGES_PER_POST = 10;

function AddPostModal({ pages, defaultDate, onClose, onAdd }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [content, setContent] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("09:00");

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

  function submit(e) {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    const batchId = `b${Date.now()}`;
    const newPosts = selectedIds.map((pageId, i) => {
      const page = pages.find((p) => p.id === pageId);
      return {
        id: `s${Date.now()}_${i}`,
        pageId,
        platform: page.platform,
        content,
        date,
        time,
        status: "pending",
        batchId,
        batchTotal: selectedIds.length,
      };
    });
    onAdd(newPosts);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>ตั้งโพสต์ใหม่</h2>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="field-group">
            <div className="field-label-row">
              <label className="field-label">เลือกเพจ (ได้พร้อมกันสูงสุด {MAX_PAGES_PER_POST})</label>
              <button type="button" className="link-btn" onClick={selectAll}>เลือกทั้งหมด</button>
            </div>
            <div className="page-picker">
              {pages.map((p) => {
                const checked = selectedIds.includes(p.id);
                const disabled = !checked && atMax;
                return (
                  <label key={p.id} className={`page-option ${checked ? "selected" : ""} ${disabled ? "disabled" : ""}`}>
                    <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggle(p.id)} />
                    <PlatformChip platform={p.platform} size="sm" />
                    <span className="page-option-name">{p.label}</span>
                  </label>
                );
              })}
            </div>
            <div className={`select-count ${atMax ? "at-max" : ""}`}>{selectedIds.length} / {MAX_PAGES_PER_POST} เพจที่เลือก</div>
          </div>

          <div className="field-group">
            <label className="field-label">เนื้อหา</label>
            <textarea className="input textarea" rows={4} placeholder="ข้อความที่จะโพสต์..." value={content} onChange={(e) => setContent(e.target.value)} required />
          </div>
          <div className="field-row">
            <div className="field-group">
              <label className="field-label">วันที่</label>
              <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="field-group">
              <label className="field-label">เวลา</label>
              <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>

          <div className="notice small">
            <Info size={13} />
            <span>แต่ละเพจจะถูกแตกเป็นงานแยกกันในคิวเมื่อถึงเวลา ถ้าเพจใดโพสต์ล้มเหลว จะไม่กระทบเพจอื่นในชุดนี้</span>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary" disabled={selectedIds.length === 0}>
              บันทึกกำหนดการ {selectedIds.length > 1 ? `(${selectedIds.length} เพจ)` : ""}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Logs view
--------------------------------------------------------- */
function LogsView({ logs }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const resetInfo = useMemo(() => {
    const lastReset = new Date("2026-07-21T00:00:00");
    const daysSince = Math.floor((today - lastReset) / 86400000);
    const daysLeft = 7 - (daysSince % 7);
    return { daysLeft };
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
          <span className="eyebrow">LOGS</span>
          <h1>ประวัติการโพสต์</h1>
          <p className="sub">เก็บชั่วคราว 7 วัน แล้วล้างอัตโนมัติ เพื่อไม่ให้ตารางบวมเกินไป</p>
        </div>
        <div className="reset-badge">
          <RefreshCw size={13} />
          ล้างข้อมูลอีก {resetInfo.daysLeft} วัน
        </div>
      </div>

      <div className="stat-row">
        <div className="stat"><span className="stat-num">{logs.length}</span><span className="stat-label">รายการ (7 วันล่าสุด)</span></div>
        <div className="stat"><span className="stat-num" style={{ color: "var(--success)" }}>{rate}%</span><span className="stat-label">สำเร็จ</span></div>
        <div className="stat"><span className="stat-num" style={{ color: "var(--danger)" }}>{logs.length - successCount}</span><span className="stat-label">ล้มเหลว</span></div>
      </div>

      <div className="log-toolbar">
        <div className="chip-filter">
          {[["all", "ทั้งหมด"], ["success", "สำเร็จ"], ["failed", "ล้มเหลว"]].map(([k, label]) => (
            <button key={k} className={`filter-btn ${filter === k ? "active" : ""}`} onClick={() => setFilter(k)}>{label}</button>
          ))}
        </div>
        <div className="search-box">
          <Search size={14} />
          <input placeholder="ค้นหาเพจ หรือข้อความ..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div className="table-wrap">
        <table className="log-table">
          <thead>
            <tr>
              <th>สถานะ</th>
              <th>แพลตฟอร์ม</th>
              <th>เพจ</th>
              <th>ข้อความ</th>
              <th>External ID</th>
              <th>เวลา</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id}>
                <td>
                  {l.success ? (
                    <span className="result-ok"><CheckCircle2 size={14} /> สำเร็จ</span>
                  ) : (
                    <span className="result-fail"><XCircle size={14} /> ล้มเหลว</span>
                  )}
                </td>
                <td><PlatformChip platform={l.platform} size="sm" /></td>
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
            <p>ไม่พบรายการที่ตรงกับตัวกรอง</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   App shell
--------------------------------------------------------- */
export default function Dashboard() {
  const [tab, setTab] = useState("connections");
  const [pages, setPages] = useState(initialPages);
  const [posts, setPosts] = useState(initialPosts);
  const [logs] = useState(initialLogs);

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
        .post-row { display: flex; align-items: center; gap: 14px; background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; }
        .post-time { display: flex; align-items: center; gap: 5px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--text-muted); width: 62px; flex-shrink: 0; }
        .post-body { flex: 1; min-width: 0; }
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

        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

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
          .brand, .brand-sub, .sidebar-foot { display: none; }
          .nav-item { width: auto; white-space: nowrap; }
          .main { padding: 20px; }
        }
      `}</style>

      <aside className="sidebar">
        <div className="brand">Social Poster</div>
        <div className="brand-sub">Control Room</div>
        {nav.map((n) => (
          <button key={n.key} className={`nav-item ${tab === n.key ? "active" : ""}`} onClick={() => setTab(n.key)}>
            <n.icon size={16} /> {n.label}
          </button>
        ))}
        <div className="sidebar-foot"><span className="status-dot" /> Supabase • Connected</div>
      </aside>

      <main className="main">
        {tab === "connections" && (
          <ConnectionsView
            pages={pages}
            onAdd={(p) => setPages((prev) => [p, ...prev])}
            onRemove={(id) => setPages((prev) => prev.filter((p) => p.id !== id))}
          />
        )}
        {tab === "schedule" && (
          <ScheduleView posts={posts} pages={pages} onAdd={(newPosts) => setPosts((prev) => [...newPosts, ...prev])} />
        )}
        {tab === "logs" && <LogsView logs={logs} />}
      </main>
    </div>
  );
}
