# Social Poster — Agent Guide

## One Worker, Everything In It

| Worker | Name | Entry | Config | URL | Deploy command |
|---|---|---|---|---|---|
| Unified (Next.js + cron/queue) | `byjood` | `src/worker.js` | `wrangler.jsonc` | `byjood.byjood.workers.dev` | `npm run deploy` |

`src/worker.js` wraps the OpenNext-generated `.open-next/worker.js` (handles all Next.js HTTP) and adds `scheduled()` (cron) + `queue()` handlers from the social-poster logic.

## Commands (run from root)

```sh
npm run dev           # next dev
npm run build         # next build (standalone, for OpenNext pipeline)
npm run build:worker  # opennextjs-cloudflare build
npm run deploy        # build:worker + wrangler deploy (byjood)
npm run start         # next start
npm run lint          # next lint
```

## Path alias

`@/` maps to root (via `jsconfig.json`). Import like `@/components/Dashboard` or `@/lib/supabase-server`.

## Architecture non-obvious facts

- OpenNext (`@opennextjs/cloudflare`) bundles Next.js (pages + API routes) into `.open-next/worker.js`. Static assets are served via `ASSETS` binding.
- `src/worker.js` is the unified entry point. It re-exports OpenNext's Durable Objects, delegates `fetch()` to OpenNext (except `POST /__cron` which triggers enqueue), and adds `scheduled()` (cron) + `queue()` (consumer).
- `src/enqueue.js` contains the shared `enqueueDuePosts` function (fetches due posts from Supabase, fans out to queue).
- `src/producer.js` is kept as an alternative entry point (used by `wrangler-legacy.toml` if needed).
- **Fan-out pattern**: 1 scheduled post fans out into N queue messages (1 per page). Each message is processed independently with its own timeout and retry counter.
- Queue config in `wrangler.jsonc`: `max_retries=3`, `dead_letter_queue=post-jobs-dlq`.
- OAuth API routes are **dynamic** (`ƒ`) — handled by OpenNext Worker, not static export.

## Source files

| File | Purpose |
|---|---|
| `src/worker.js` | **Unified entry point** — re-exports OpenNext DOs, forwards fetch, adds scheduled + queue |
| `src/producer.js` | Legacy entry point (cron/queue only, standalone) |
| `src/enqueue.js` | Shared `enqueueDuePosts()` used by both entry points |
| `src/consumer.js` | Queue message processor |
| `src/platforms.js` | Platform-specific post handlers (Facebook, TikTok, etc.) |

## Supabase

Schema lives in `supabase/schema.sql` — run in Supabase SQL Editor. 5 tables: `pages`, `page_tokens`, `scheduled_posts`, `post_logs`, `oauth_states`. Workers bypass RLS via `service_role` key. Frontend uses anon key with RLS.

## Wrangler secrets (set before deploy)

```sh
# All secrets go to the single byjood Worker
wrangler secret put SUPABASE_SERVICE_ROLE_KEY --name byjood
wrangler secret put FACEBOOK_APP_SECRET --name byjood
wrangler secret put TIKTOK_CLIENT_SECRET --name byjood
# plus FACEBOOK_APP_ID, THREADS_APP_ID/SECRET, TIKTOK_CLIENT_KEY
```

## Wrangler vars

`wrangler.jsonc` has `SUPABASE_URL` as a var — update to real Supabase URL before deploy.

## Queues (create before first deploy)

```sh
wrangler queues create post-jobs
wrangler queues create post-jobs-dlq
```

## What does not exist yet

- No tests (no test runner configured)
- No lint config (uses `next lint` defaults)
- No CI/CD
- No TypeScript (plain JS across both packages)
- Token encryption not implemented (see README remaining work)
