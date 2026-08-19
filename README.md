# TALLY: Vercel Brain Supabase Template Demo

A Demo personal-finance app/ (Next.js, Clerk, Supabase) with a Telos Brain schema in `brain/`. After sign-in you get **Dashboard**, **Chat**, **Transactions**, **Budgets**, and **Insights**. Clone this repo, run everything locally, then deploy the same app and brain schema to stage/prod.

| Environment | App | Brain |
|---|---|---|
| **Dev (local)** | `npm run dev` + local Supabase (Clerk optional) | Docker on your machine (`brain start`) |
| **Stage / prod** | Your host (e.g. Vercel) + hosted Supabase | [Telos Hosted](https://go.telosbrain.com) ($10 free credit) |

Local Brain is self-hosted Docker and does not use Clerk. The host app can run locally without Clerk: `next dev` with placeholder Clerk keys signs you in as `local@localhost` in a seeded **Local** organisation. Clerk is required on Vercel / production.

After setup you can open **Chat** and paste a bank statement (`samples/bank-statement.txt`).

## Prerequisites

- Node.js 25+ (see `.nvmrc`)
- Docker Desktop (or Engine + Compose on Linux)
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) (`brew install supabase/tap/supabase`)
- A [Clerk](https://clerk.com) account (optional locally; required for stage/prod)
- An [Anthropic](https://console.anthropic.com) API key
- A [Voyage](https://dash.voyageai.com) API key (embeddings; this brain defaults to `voyage-3-lite`)

## 1. Clone and install

```bash
git clone <repository-url>
cd <your-repository-folder>
npm install
```

`npm install` runs the `prepare` script: `supabase start`, writes local Supabase keys into `.env`, installs `@telos.ready/brain@latest` globally, generates a shared tool API key (`TOOL_API_KEY` / `MY_APP_API_KEY`), runs `brain start`, and copies the announced Brain execution key into `.env` and `brain/.env.local` as `BRAIN_API_KEY`. Docker Desktop and the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) must already be available.

You can run the same flow later with `npm run prepare`. Skip it with `TEL_SKIP_PREPARE=1` (CI skips automatically).

Then fill `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY`, and any remaining `MY_APP_*` values in `brain/.env.local`. Do not commit `.env` files.

Optional app vars (already defaulted in code):

| Variable | Default | Used for |
|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | `TALLY` | Invite emails and display name |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Invite links. Set this to your public URL on stage/prod. |

Postmark (`POSTMARK_SERVER_TOKEN`, `FROM_EMAIL`) is only required when inviting teammates, not for first chat.

## 2. Clerk (optional locally)

Local `npm run dev` works without Clerk keys. Leave the placeholder values in `.env`. The app skips Clerk and seeds `local@localhost` plus a **Local** organisation on first request.

Add real Clerk keys (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` starting with `pk_`) when you want the production sign-in path locally. Clerk is required on Vercel / production (`NODE_ENV=production` or `VERCEL` set) — the bypass never runs there.

1. Create an application at [dashboard.clerk.com](https://dashboard.clerk.com).
2. Copy the **Publishable** and **Secret** keys into `.env`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
3. Open [Clerk’s Connect with Supabase](https://dashboard.clerk.com/setup/supabase), select the app, and **Activate Supabase integration**.
4. Copy the Clerk domain (e.g. `your-app.clerk.accounts.dev`).
5. Put that domain in `supabase/config.toml`:

```toml
[auth.third_party.clerk]
enabled = true
domain = "your-app.clerk.accounts.dev"
```

For hosted Supabase (stage/prod), also add Clerk as a third-party provider in the [Supabase Dashboard](https://supabase.com/dashboard) under **Authentication → Third-Party Auth**.

## 3. Local database

1. Open Docker Desktop.
2. `npm install` / `npm run prepare` already ran `supabase start` and wrote these into `.env`:
   - `NEXT_PUBLIC_SUPABASE_URL` — API URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Publishable key (`sb_publishable_…`)
   - `SUPABASE_SECRET_KEY` — Secret key (`sb_secret_…`, server only)
   - `POSTGRES_URL` — database URL

   Use publishable/secret keys, not legacy `anon` / `service_role` JWTs. To refresh them later, run `npm run prepare` again.

3. Apply the schema:

```bash
npm run db:push
```

Local development uses `db:push`. On hosted Postgres, apply migrations with `npm run db:migrate`.

## 4. Local Brain (dev)

The schema already lives in `brain/`. You do not run `brain init`. `npm install` / `npm run prepare` already installed `@telos.ready/brain@latest`, generated `MY_APP_API_KEY` (same value as app `TOOL_API_KEY`), ran `brain start`, and wrote `BRAIN_API_KEY` from that start into the app `.env` and `brain/.env.local`.

`brain start` boots SQL Server + Brain in Docker, writes `brain/.env.local` if missing, and opens the admin UI at [http://127.0.0.1:60061](http://127.0.0.1:60061) (no sign-in).

Fill in the keys `prepare` cannot know, in `brain/.env.local`:

```bash
ANTHROPIC_API_KEY=your-anthropic-api-key
VOYAGE_API_KEY=your-voyage-api-key
MY_APP_API_URL=http://host.docker.internal:3000
# MY_APP_API_KEY and BRAIN_API_KEY are already set by prepare
```

Leave the `TELOS_*` values that `brain start` wrote — they are the well-known local org key and `http://127.0.0.1:60061`. `TELOS_*` is CLI config only; it is never uploaded to the brain.

Deploy so the brain stores `BRAIN_API_KEY` for tool callbacks:

```bash
brain deploy --env local --instance local-brain
```

Do not delete `brain.lock`. Run `brain snapshot --env local --instance local-brain` before later deploys if the live brain has learned (avoids version conflicts).

Use `host.docker.internal`, not `localhost`, for `MY_APP_API_URL`. Brain runs inside Docker; `localhost` inside the container is Brain, not Next.js.

## 5. Pair the app and Brain

In the **app** `.env`:

```bash
BRAIN_URL=http://127.0.0.1:60061
BRAIN_API_KEY=your-brain-execution-api-key
TOOL_API_KEY=your-shared-tool-api-key
```

`prepare` already sets `BRAIN_URL`, a matching `TOOL_API_KEY` / `MY_APP_API_KEY`, and `BRAIN_API_KEY` on both sides from `brain start`. `BRAIN_API_KEY` must stay in sync.

| Direction | Auth | Purpose |
|---|---|---|
| App → Brain Execution API | `Authorization: Bearer ${BRAIN_API_KEY}` | Create entities, run workflows |
| Brain → App `/api/tools/*` | `Authorization: Bearer ${TOOL_API_KEY}` **and** `X-Brain-Authorization: Bearer ${BRAIN_API_KEY}` | Finance and host tools |

If `BRAIN_URL` / `BRAIN_API_KEY` are unset, the app still runs; organisation entity creation and chat are skipped.

## 6. Run the app

From the repo root (not `brain/`):

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without Clerk keys you land on **Dashboard** as `local@localhost`. With Clerk, sign in and create an organisation, then:

1. Open **Chat** and send a message (workflow `WF-CHAT`). Chats persist in the sidebar; titles are generated automatically (`WF-CHAT-TITLE`). You can watch tools run while Brain works.
2. Paste `samples/bank-statement.txt` into chat, or use **Transactions** / **Budgets**.

You should now have three processes: Next.js `:3000`, Supabase (CLI ports), Brain `:60061`.

```bash
brain status    # API URL, health, Compose project id
# later:
brain stop --project-id <id-from-status>
```

## Stage and production (Telos Hosted)

Use local Docker Brain for **dev** only. For **stage** and **prod**, deploy the same `brain/` schema to [Telos Hosted](https://go.telosbrain.com). Sign up there (includes $10 free credit) and mint an organisation API key.

```bash
cp brain/.env.example brain/.env.stage   # or .env.prod
```

Set at least:

```bash
TELOS_BRAIN_ORG_API_KEY=your-org-api-key
TELOS_BRAIN_API_URL=https://go.telosbrain.com
ANTHROPIC_API_KEY=your-anthropic-api-key
VOYAGE_API_KEY=your-voyage-api-key
MY_APP_API_URL=https://your-app.example.com
MY_APP_API_KEY=your-shared-tool-api-key
```

Add your public app hostname to `allowed-callback-domains` in `brain/brain-compose.yml`, then:

```bash
cd brain
brain deploy --env stage --instance your-stage-brain
# or:
brain deploy --env prod --instance your-prod-brain
```

First hosted deploy prints a **new** execution API key (do not reuse the local one). On the deployed app (Vercel or your host) set:

```bash
BRAIN_URL=https://go.telosbrain.com
BRAIN_API_KEY=your-hosted-brain-execution-api-key
TOOL_API_KEY=your-shared-tool-api-key
NEXT_PUBLIC_SITE_URL=https://your-app.example.com
NEXT_PUBLIC_APP_NAME=TALLY
```

Keep `TOOL_API_KEY` / `MY_APP_API_KEY` and both `BRAIN_API_KEY`s in sync per environment. Use a different instance name from `local-brain`.

Deploy the Next.js app as usual. Set Clerk, Supabase, `POSTGRES_URL`, Brain, and `NEXT_PUBLIC_SITE_URL` for Preview and Production. Apply schema with `npm run db:migrate` against hosted Postgres (add it to the Vercel build command if you want it to run automatically).

Self-hosted Docker Brain on your own servers is the same stack as local (`brain start` / BRA106). Stage and prod in this template are intended to use Telos Hosted.

## Database migrations

```bash
npm run db:push       # local: apply schema.ts directly
npm run db:generate   # write a migration for deploy
npm run db:migrate    # apply migrations (Vercel / production)
```

Do not commit `.env`, `brain/.env.local`, `brain/.env.stage`, `brain/.env.prod`, or `brain.lock` if it contains keys.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `npm install` tries to start Docker | `prepare` runs the local stack. Use `TEL_SKIP_PREPARE=1 npm install` in CI or if you only want dependencies |
| Chat: Brain is not configured | App `.env` missing `BRAIN_URL` or `BRAIN_API_KEY` |
| `BRAIN_API_KEY was not announced` | Leftover local Brain Docker volume; the execution key is shown only once at create. `prepare` resets that volume when neither env file has a real key. Manual recovery: `brain stop --project-id <compose-from-brain-status> --reset`, then `npm run prepare` |
| Tools never hit Next.js | `MY_APP_API_URL` used `localhost` instead of `http://host.docker.internal:3000` |
| Tool webhook 401 | `TOOL_API_KEY` ≠ `MY_APP_API_KEY`, or Brain keys differ |
| Deploy fails on embeddings | Blank `VOYAGE_API_KEY` in the brain env file |
| Port 1433 already allocated | Change `sql_port` in `brain/brain.config.toml`, then `brain start` again |
| Version conflict on redeploy | `brain snapshot --env local --instance local-brain` then deploy |

Schema edits under `brain/` go live with another `brain deploy --env local` (dev) or `--env stage` / `--env prod` (hosted). Details: [`brain/README.md`](brain/README.md) and skill **BRA106**.

## Tech stack

- [Next.js](https://nextjs.org/) — React framework
- [Clerk](https://clerk.com/) — Authentication (optional locally; required in production)
- [Supabase](https://supabase.com/) — Database and storage
- [Drizzle ORM](https://orm.drizzle.team/) — Database ORM
- [Telos Brain](https://go.telosbrain.com) — Local Docker (dev) or Telos Hosted (stage/prod)
- [TailwindCSS](https://tailwindcss.com/) — CSS framework
- [TypeScript](https://www.typescriptlang.org/) — Type safety

## Additional information

Database schema: `db/schema.ts`.

Server helpers:

```ts
import { ensureBrainEntityForOrganisation } from "@/server/brain/entities";
import { runWorkflowSync } from "@/server/brain/client";

const entityId = await ensureBrainEntityForOrganisation(orgId);
if (entityId) {
  await runWorkflowSync("WF-CHAT", { inputMessage: "...", entityId });
}
```

Host tools live in `src/server/tools/host-tools.ts`. Brain tool definitions are under `brain/tools/execution/finance/` and `brain/tools/execution/my-app/`.
