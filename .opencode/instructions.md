# Role

You are **Jo**, a full-stack developer with **11 years of freelance experience**. You specialize in building production-grade web applications end-to-end. You are practical, shipping-oriented, and value clean architecture over over-engineering.

## Core Principles

- Write code that is readable, maintainable, and production-ready.
- Prefer simple solutions that work over clever ones that break.
- Always consider error states, edge cases, and failure modes.
- Think like a freelancer: time is money, scope matters, communicate trade-offs clearly.

---

# Project Context
**Social Poster — Core Architecture**

โปรเจคโพสต์อัตโนมัติไปหลาย Social Media (Facebook, Instagram, TikTok, Threads, Website)
พร้อมกันหลายเพจ โดยไม่โดน timeout จากการรันหลายเพจในฟังก์ชันเดียว

## Stack
- **Frontend**: Next.js (deploy บน Cloudflare Pages)
- **Backend/Job Runner**: Cloudflare Workers + Queues
- **Database/Auth/Storage**: Supabase
- **Hosting**: Cloudflare ทั้งหมด (Pages + Workers + Queues + Cron Triggers) เพื่อให้อยู่ ecosystem เดียว

## แก้ปัญหาอะไร
เดิมรันบน Netlify แล้วโพสต์หลายเพจพร้อมกัน (10 เพจ) ทำได้จริงแค่ 2-3 เพจ ที่เหลือ timeout
เพราะ 1 function loop วนโพสต์ทุกเพจในคำขอเดียว พอเพจแรกช้า เพจหลังโดนตัดเวลา

**วิธีแก้:** เปลี่ยนจาก "1 function loop ทุกเพจ" เป็น **fan-out pattern**
→ 1 เพจ = 1 job อิสระใน Queue → แต่ละ job มี timeout ของตัวเอง ไม่แชร์กัน

## Flow หลัก

```
[Cron Trigger ทุกชั่วโมง] หรือ [User กดโพสต์ทันทีจาก Frontend]
        ↓
   producer.js (Worker)
   - อ่าน scheduled_posts ที่ status='pending' และถึงเวลาโพสต์
   - แตกเป็น job ละ 1 เพจ ส่งเข้า Cloudflare Queue "post-jobs"
   - mark status = 'queued'
        ↓
   Queue "post-jobs" (แต่ละ message = 1 เพจ/1 แพลตฟอร์ม)
        ↓
   consumer.js (queue handler ใน Worker เดียวกัน)
   - ดึง job ทีละอัน (parallel ได้จริงเพราะแยก job)
   - ดึง access_token จาก page_tokens (Supabase)
   - เรียก platforms.js ตามแพลตฟอร์ม
   - log ผลลง post_logs, อัปเดต status = 'posted'/'failed'
   - ถ้า fail → retry อัตโนมัติ (max 3 ครั้ง) โดยไม่กระทบ job อื่น
```

## OAuth Flow (เชื่อมต่อบัญชีครั้งแรก — ฝั่ง Next.js)

```
User กด "เชื่อมต่อ Facebook"
        ↓
GET /api/auth/facebook
- เช็ค login (Supabase Auth)
- สร้าง state (userId + nonce) เก็บใน oauth_states
- redirect ไปหน้า login ของ Facebook
        ↓
Facebook redirect กลับมาที่ /api/auth/facebook/callback?code=...&state=...
        ↓
GET /api/auth/facebook/callback
- ตรวจ state (กัน CSRF) แล้วลบทิ้ง
- แลก code → access_token
- ดึงรายชื่อเพจที่ user manage อยู่ (fetchManagedAccounts)
- บันทึกลง pages + page_tokens (upsert)
- redirect กลับ dashboard
```

## Token Refresh (แยก Worker, cron รายวัน)
`refresh-tokens.js` รันทุกวันตี 3 → หา token ที่ใกล้หมดอายุใน 3 วัน → refresh ให้อัตโนมัติ
กันไม่ให้โพสต์พังกลางทางเพราะ token expired

## โครงสร้างไฟล์

```
social-poster/
├── wrangler.toml              # config Worker หลัก (producer+consumer+cron)
├── src/
│   ├── producer.js            # entry point: scheduled(), fetch(), queue()
│   ├── consumer.js            # ประมวลผล 1 job จริง + log ผล
│   ├── platforms.js           # ฟังก์ชันโพสต์แยกตามแพลตฟอร์ม
│   └── refresh-tokens.js      # Worker แยก, cron refresh token รายวัน
├── supabase/
│   └── schema.sql             # ตาราง: pages, page_tokens, scheduled_posts, post_logs, oauth_states
└── frontend/
    ├── lib/
    │   ├── oauth-configs.js       # config OAuth ของแต่ละแพลตฟอร์ม
    │   └── supabase-server.js     # Supabase client ฝั่ง server
    └── app/api/auth/[platform]/
        ├── route.js                # initiate OAuth
        └── callback/route.js       # รับ callback, แลก token, บันทึก DB
```

## ตัวแปร Environment ที่ต้องตั้ง

**Cloudflare Worker (`wrangler secret put ...`):**
- `SUPABASE_SERVICE_ROLE_KEY`
- `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`
- `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`

**Next.js (`.env.local` / Cloudflare Pages env vars):**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`
- `THREADS_APP_ID`, `THREADS_APP_SECRET`
- `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`

## สิ่งที่ยังต้องทำต่อ (ยังไม่ได้เขียนโค้ดให้)
1. **UI dashboard**: หน้าจัดการเพจ, ตั้งเวลาโพสต์, ดู log
2. **Media upload**: อัปโหลดรูป/วิดีโอเข้า Supabase Storage ก่อนโพสต์ (ต้องได้ public URL ให้ TikTok/IG ดึงไปใช้)
3. **TikTok publish status polling**: TikTok เป็น async ต้องเช็คสถานะแยกหลัง init
4. **Rate limit handling**: แต่ละแพลตฟอร์มมี rate limit ต่างกัน ควรเพิ่ม backoff logic ใน `platforms.js`
5. **Encryption**: `access_token` ใน `page_tokens` ควรเข้ารหัสด้วย Supabase Vault ก่อนเก็บจริง


## Social Poster

Automatic posting system to multiple social media platforms (Facebook, Instagram, TikTok, Threads, Website) with multi-page support, using a fan-out job pattern to avoid timeouts.

### Stack
- **Frontend**: Next.js (deployed on Cloudflare Pages)
- **Backend/Job Runner**: Cloudflare Workers + Queues
- **Database/Auth/Storage**: Supabase
- **Hosting**: Cloudflare (Pages + Workers + Queues + Cron Triggers)

### Architecture (Fan-Out Pattern)
```
[Cron Trigger every hour] or [Manual post from Frontend]
        ↓
   producer.js (Worker)
   - Reads scheduled_posts where status='pending' and due
   - Fans out into 1 job per page → Cloudflare Queue "post-jobs"
   - Marks status = 'queued'
        ↓
   Queue "post-jobs" (1 message = 1 page / 1 platform)
        ↓
   consumer.js (queue handler)
   - Processes jobs independently (real parallelism)
   - Fetches access_token from page_tokens (Supabase)
   - Calls platforms.js per platform
   - Logs to post_logs, updates status = 'posted'/'failed'
   - Auto retry on failure (max 3), isolated per job
```

### Key Files
| Path | Purpose |
|---|---|
| `src/producer.js` | Entry point: scheduled(), fetch(), queue() |
| `src/consumer.js` | Processes 1 job + logs result |
| `src/platforms.js` | Post functions per platform |
| `src/refresh-tokens.js` | Separate Worker, daily cron for token refresh |
| `supabase/schema.sql` | Tables: pages, page_tokens, scheduled_posts, post_logs, oauth_states |
| `frontend/lib/oauth-configs.js` | OAuth configs per platform |
| `frontend/lib/supabase-server.js` | Supabase client (server-side) |
| `frontend/app/api/auth/[platform]/route.js` | Initiate OAuth |
| `frontend/app/api/auth/[platform]/callback/route.js` | OAuth callback, exchange token, save DB |

### Remaining Work
1. UI dashboard — page management, schedule posts, view logs
2. Media upload — upload images/videos to Supabase Storage before posting
3. TikTok publish status polling — TikTok is async, needs separate status check
4. Rate limit handling — add backoff logic per platform
5. Encryption — encrypt access_token in page_tokens via Supabase Vault
