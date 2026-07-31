# Social Poster — Core Architecture

โปรเจคโพสต์อัตโนมัติไปหลาย Social Media (Facebook, Instagram, TikTok, Threads, Website)
พร้อมกันหลายเพจ โดยไม่โดน timeout จากการรันหลายเพจในฟังก์ชันเดียว

## Stack
- **Frontend**: Next.js 15 (App Router, deploy บน Cloudflare ผ่าน OpenNext)
- **Backend/Job Runner**: Cloudflare Worker เดียว (unified) + Queues
- **Database/Auth/Storage**: Supabase
- **Hosting**: Cloudflare ทั้งหมด (Worker + Queues + Cron Triggers) เพื่อให้อยู่ ecosystem เดียว

## แก้ปัญหาอะไร
เดิมรันบน Netlify แล้วโพสต์หลายเพจพร้อมกัน (10 เพจ) ทำได้จริงแค่ 2-3 เพจ ที่เหลือ timeout
เพราะ 1 function loop วนโพสต์ทุกเพจในคำขอเดียว พอเพจแรกช้า เพจหลังโดนตัดเวลา

**วิธีแก้:** เปลี่ยนจาก "1 function loop ทุกเพจ" เป็น **fan-out pattern**
→ 1 เพจ = 1 job อิสระใน Queue → แต่ละ job มี timeout ของตัวเอง ไม่แชร์กัน

## Flow หลัก

```
[Cron Trigger ทุก 5 นาที] หรือ [POST /__cron] หรือ [User ตั้งเวลาจาก Frontend]
        ↓
src/worker.js (Unified Entry — wraps OpenNext + scheduled + queue)
        ↓
enqueueDuePosts() (src/enqueue.js)
- อ่าน scheduled_posts ที่ status='pending' และถึงเวลาโพสต์
- แตกเป็น job ละ 1 เพจ ส่งเข้า Cloudflare Queue "post-jobs"
- mark status = 'queued'
        ↓
Queue "post-jobs" (แต่ละ message = 1 post_id + page_id + platform + content + media_urls)
max_retries=3, dead_letter_queue=post-jobs-dlq, max_batch_size=10
        ↓
handleQueueBatch() (src/consumer.js)
- ดึง job ทีละอัน (parallel ได้จริงเพราะแยก job)
- ดึง access_token จาก page_tokens (Supabase)
- เรียก PLATFORM_HANDLERS ตามแพลตฟอร์ม
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
- ใช้ buildAuthUrl() จาก lib/oauth-configs.js สร้าง redirect URL
- redirect ไปหน้า login ของ Facebook
        ↓
Facebook redirect กลับมาที่ /api/auth/facebook/callback?code=...&state=...
        ↓
GET /api/auth/facebook/callback
- ตรวจ state (กัน CSRF) แล้วลบทิ้ง
- แลก code → access_token (exchangeCodeForToken)
- ดึงรายชื่อเพจที่ user manage อยู่ (fetchManagedAccounts)
- upsert ลง pages + page_tokens
- redirect กลับ /dashboard?connected=facebook
```

## Token Refresh (แยก Worker, cron รายวัน)
`src/refresh-tokens.js` รันทุกวันตี 3 → หา token ที่ใกล้หมดอายุใน 3 วัน → refresh ให้อัตโนมัติ
รองรับ Facebook (fb_exchange_token), TikTok (refresh_token grant), Threads (th_refresh_token)

## โครงสร้างไฟล์ (actual)

```
byjood/
├── src/
│   ├── worker.js           # Unified entry — re-exports DOs, fetch + scheduled + queue
│   ├── producer.js         # Legacy entry (cron/queue only, ใช้กับ wrangler-legacy.toml)
│   ├── enqueue.js          # Shared enqueueDuePosts() — reads due posts, fans out to queue
│   ├── consumer.js         # Queue message processor — processJob + logResult
│   ├── platforms.js        # Platform handlers: facebook, instagram, tiktok, threads, website
│   └── refresh-tokens.js   # Separate Worker (daily cron) — refresh expiring tokens
├── app/
│   ├── layout.js           # Root layout (lang="th")
│   ├── dashboard/page.jsx  # Dashboard page (wraps <Dashboard />)
│   └── api/
│       ├── pages/
│       │   ├── route.js          # GET (list), POST (create page + token)
│       │   └── [id]/route.js     # DELETE page
│       ├── scheduled-posts/route.js  # GET (list), POST (create scheduled post)
│       ├── logs/route.js         # GET (list, limit 200)
│       └── auth/[platform]/
│           ├── route.js          # GET — initiate OAuth redirect
│           └── callback/route.js # GET — OAuth callback, exchange code, save DB
├── components/
│   └── Dashboard.jsx      # Full SPA dashboard (connections + schedule + logs)
├── lib/
│   ├── supabase-server.js # Server-side Supabase client (cookies via @supabase/ssr)
│   ├── supabase-admin.js  # Admin Supabase client (service_role key)
│   └── oauth-configs.js   # OAuth configs + buildAuthUrl()
├── supabase/
│   └── schema.sql         # 5 tables: pages, page_tokens, scheduled_posts, post_logs, oauth_states
├── wrangler.jsonc         # Worker config: DOs, queues, cron (*/5 * * * *), vars
├── package.json           # Next.js 15.3, React 19.1, @opennextjs/cloudflare ^1.20.2
├── jsconfig.json          # Path alias @/ -> root
└── AGENTS.md              # Agent guide for AI coding assistants
```

## ตัวแปร Environment ที่ต้องตั้ง

**Cloudflare Worker (`byjood`):**
- Var (ใน `wrangler.jsonc`): `SUPABASE_URL`
- Secret (`wrangler secret put SUPABASE_SERVICE_ROLE_KEY --name byjood`): `SUPABASE_SERVICE_ROLE_KEY`

Platform credentials (app_id, app_secret, access_token) เก็บ per-page ในตาราง `page_tokens` ไม่ใช่ Worker secrets

**Next.js (`.env.local` / Cloudflare Pages env vars):**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`
- `THREADS_APP_ID`, `THREADS_APP_SECRET`
- `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY` (for API routes via supabase-admin.js)

## Queues (create before first deploy)
```
wrangler queues create post-jobs
wrangler queues create post-jobs-dlq
```

## Known bug (ยังไม่แก้)

ดู `note.txt` — โพสต์ค้างสถานะ "queued" เมื่อ platform API error:
- `post-jobs-dlq` ไม่มี consumer → หลัง retry หมด message หาย ไม่มีใครตั้ง `status='failed'`
- `logResult()` ใน `src/consumer.js` ตั้ง `status='posted'` เท่านั้น ไม่เคยตั้ง `failed`
- `enqueueDuePosts()` ใน `src/enqueue.js` ดึงเฉพาะ `status='pending'` → post ที่ค้าง `queued` ไม่ถูก retry

## สิ่งที่ยังต้องทำต่อ (ยังไม่ได้เขียนโค้ดให้)
1. **Fix known bug**: เพิ่ม consumer ให้ `post-jobs-dlq` แล้วตั้ง `status='failed'` (ดู `note.txt`)
2. **Media upload**: อัปโหลดรูป/วิดีโอเข้า Supabase Storage ก่อนโพสต์ (ต้องได้ public URL ให้ TikTok/IG ดึงไปใช้)
3. **TikTok publish status polling**: TikTok เป็น async ต้องเช็คสถานะแยกหลัง init
4. **Rate limit handling**: แต่ละแพลตฟอร์มมี rate limit ต่างกัน ควรเพิ่ม backoff logic ใน `platforms.js`
5. **Encryption**: `access_token` ใน `page_tokens` ควรเข้ารหัสด้วย Supabase Vault ก่อนเก็บจริง
6. **Tests**: ไม่มี test runner/config
7. **CI/CD**: ไม่มี pipeline
