# Social Poster — Agent Guide

## Two deployable packages in one repo

| Directory | Type | Entry | Deploy command |
|---|---|---|---|
| `src/` | Cloudflare Worker (ESM, no npm deps) | `producer.js` | `wrangler deploy` at root |
| `frontend/` | Next.js 15 App Router | `frontend/package.json` | `npm run build` in `frontend/` then deploy to Cloudflare Pages |

## Commands (run from `frontend/`)

```sh
npm run dev      # next dev
npm run build    # next build
npm run start    # next start
npm run lint     # next lint
```

Root has no `package.json`. All npm commands run in `frontend/`.

## Path alias

`@/` maps to `frontend/` (via `jsconfig.json`). Import like `@/components/Dashboard` or `@/lib/supabase-server`.

## Architecture non-obvious facts

- Workers use **no npm dependencies** — all HTTP via native `fetch`, ES modules only.
- `producer.js` is triple-purpose: `scheduled()` (cron), `fetch()` (manual trigger), `queue()` (consumer dispatcher).
- **Fan-out pattern**: 1 scheduled post fans out into N queue messages (1 per page). Each message is processed independently with its own timeout and retry counter.
- Queue config in `wrangler.toml`: `max_retries=3`, `dead_letter_queue=post-jobs-dlq`.
- `refresh-tokens.js` is a **separate Worker** (different `wrangler.toml`), not part of `social-poster`.
- OAuth API routes are **dynamic** (`ƒ`), not statically exported — uses `next.config.js` without `output: "export"`.

## Supabase

Schema lives in `supabase/schema.sql` — run in Supabase SQL Editor. 5 tables: `pages`, `page_tokens`, `scheduled_posts`, `post_logs`, `oauth_states`. Workers bypass RLS via `service_role` key. Frontend uses anon key with RLS.

## Wrangler secrets (set before deploy)

```sh
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put FACEBOOK_APP_SECRET
wrangler secret put TIKTOK_CLIENT_SECRET
# plus FACEBOOK_APP_ID, THREADS_APP_ID/SECRET, TIKTOK_CLIENT_KEY
```

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
