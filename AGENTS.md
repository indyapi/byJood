# Social Poster — Agent Guide

## Two Workers, One Repo

| Worker | Name | Entry | Config | URL | Deploy command |
|---|---|---|---|---|---|
| Next.js (OpenNext) | `byjood-next` | `.open-next/worker.js` | `wrangler.jsonc` | `byjood-next.byjood.workers.dev` | `npm run deploy` |
| Social Poster (cron/queue) | `byjood` | `src/producer.js` | `wrangler.toml` | `byjood.byjood.workers.dev` | `npm run deploy:worker` |

## Commands (run from root)

```sh
npm run dev           # next dev
npm run build         # next build (standalone, for OpenNext pipeline)
npm run build:worker  # opennextjs-cloudflare build
npm run deploy        # build:worker + wrangler deploy (byjood-next)
npm run deploy:worker # wrangler deploy --config wrangler.toml (byjood)
npm run start         # next start
npm run lint          # next lint
```

## Path alias

`@/` maps to root (via `jsconfig.json`). Import like `@/components/Dashboard` or `@/lib/supabase-server`.

## Architecture non-obvious facts

- OpenNext (`@opennextjs/cloudflare`) bundles Next.js (pages + API routes) into a single Cloudflare Worker at `byjood-next.byjood.workers.dev`. Static assets are served via `ASSETS` binding.
- `wrangler.jsonc` controls the OpenNext Worker; `wrangler.toml` controls the social-poster Worker.
- Social-poster Worker (`byjood`) only handles cron/queue. Its `fetch()` redirects GET `/` and `/dashboard` to `PAGES_URL` (the OpenNext Worker).
- Workers use **no npm dependencies** — all HTTP via native `fetch`, ES modules only.
- `producer.js` is triple-purpose: `scheduled()` (cron), `fetch()` (manual trigger), `queue()` (consumer dispatcher).
- **Fan-out pattern**: 1 scheduled post fans out into N queue messages (1 per page). Each message is processed independently with its own timeout and retry counter.
- Queue config in `wrangler.toml`: `max_retries=3`, `dead_letter_queue=post-jobs-dlq`.
- `refresh-tokens.js` is a **separate Worker** (different `wrangler.toml`), not part of `social-poster`.
- OAuth API routes are **dynamic** (`ƒ`) — handled by OpenNext Worker, not static export.

## Supabase

Schema lives in `supabase/schema.sql` — run in Supabase SQL Editor. 5 tables: `pages`, `page_tokens`, `scheduled_posts`, `post_logs`, `oauth_states`. Workers bypass RLS via `service_role` key. Frontend uses anon key with RLS.

## Wrangler secrets

```sh
# For byjood (social-poster Worker — cron/queue)
wrangler secret put SUPABASE_SERVICE_ROLE_KEY --name byjood
wrangler secret put PAGES_URL --name byjood               # https://byjood-next.byjood.workers.dev
wrangler secret put FACEBOOK_APP_SECRET --name byjood
wrangler secret put TIKTOK_CLIENT_SECRET --name byjood
# plus FACEBOOK_APP_ID, THREADS_APP_ID/SECRET, TIKTOK_CLIENT_KEY

# For byjood-next (OpenNext Worker — frontend + API)
wrangler secret put SUPABASE_SERVICE_ROLE_KEY --name byjood-next
```

## Wrangler vars

`wrangler.toml` has `SUPABASE_URL` as a var — update before deploy.

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
