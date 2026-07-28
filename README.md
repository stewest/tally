# Vercel Brain Supabase Template

A multitenant host app template built with Next.js, Clerk, and Supabase. AI workflows, skills, and tools live in a separately deployed [Telos Brain](https://go.telosbrain.com) (schema from `brain init`); this app calls the Brain Execution API and exposes Tool API webhooks for Brain callbacks.

## Prerequisites

- Node.js v20 or higher (check `.nvmrc` for the exact version)
- Docker (Desktop)
- Supabase CLI (`brew install supabase/tap/supabase`)
- A [Clerk](https://clerk.com) account and application

## Getting Started

### Clone and Install

```bash
git clone <repository-url>
cd <your-repository-folder>
npm install
```

### Environment Setup

```bash
cp .env.example .env
```

Fill in the following values:

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [Clerk Dashboard](https://dashboard.clerk.com) > API Keys |
| `CLERK_SECRET_KEY` | [Clerk Dashboard](https://dashboard.clerk.com) > API Keys |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase CLI output or Dashboard |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase CLI **Publishable** key (`sb_publishable_...`) |
| `SUPABASE_SECRET_KEY` | Supabase CLI **Secret** key (`sb_secret_...`) — server only |
| `POSTGRES_URL` | Supabase CLI output or Dashboard |
| `BRAIN_URL` | Telos Brain execution host (see Telos Brain below) |
| `BRAIN_API_KEY` | Per-brain key from first `brain deploy` |
| `TOOL_API_KEY` | Shared webhook secret for `/api/tools/*` (paired with `BRAIN_API_KEY` handshake) |

> **Note:** Do not commit your `.env` file to version control.

### Clerk Setup

1. Create a Clerk application at [dashboard.clerk.com](https://dashboard.clerk.com)
2. Navigate to [Clerk's Connect with Supabase page](https://dashboard.clerk.com/setup/supabase)
3. Select your application and click **Activate Supabase integration**
4. Copy the Clerk domain provided (e.g. `your-app.clerk.accounts.dev`)
5. In the [Supabase Dashboard](https://supabase.com/dashboard), go to **Authentication > Third-Party Auth** and add Clerk as a provider using that domain

### Local Database Setup

1. Open Docker Desktop
2. Update `supabase/config.toml` with your Clerk domain (from the Clerk Setup step above):

```toml
[auth.third_party.clerk]
enabled = true
domain = "your-app.clerk.accounts.dev"
```

3. Start Supabase:

```bash
supabase start         # First run may take several minutes
```

4. Update your `.env` file with the values from Supabase initialization:
   - `NEXT_PUBLIC_SUPABASE_URL` - The Project URL (API URL)
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - The **Publishable** key (`sb_publishable_...`)
   - `SUPABASE_SECRET_KEY` - The **Secret** key (`sb_secret_...`, server-only)
   - `POSTGRES_URL` - The database connection URL

> Legacy `anon` / `service_role` JWT keys are deprecated. Use publishable and secret keys from the Authentication Keys section of `supabase start` (or Dashboard → Settings → API Keys).

5. Run database migrations:

```bash
npm run db:migrate
```

6. Enable Row Level Security (RLS) on all tables:

```sql
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY;', tbl.schemaname, tbl.tablename);
        RAISE NOTICE 'Enabled RLS on %.%', tbl.schemaname, tbl.tablename;
    END LOOP;
END $$;
```

> You can visit the Studio URL provided by Supabase CLI to manage your database.

### Storage Policies Setup

#### Setting up storage.buckets and storage.object policies:

1. In the Supabase dashboard, go to **Storage** > **Policies**
2. Under **storage.buckets**, click **New Policy**
3. Select **From Template**
4. Choose **Enable insert for authenticated users only**

## Database Migrations

### Generate a new migration

```bash
npm run db:generate
```

### Apply migrations

```bash
npm run db:migrate
```

## Telos Brain

This template does **not** ship a `brain/` schema folder. Author and deploy the brain separately with the Telos Brain CLI, then point this app at the Execution API.

### 1. Install the CLI

Requires **Node.js 25+**.

```bash
npm install -g @telos.ready/brain
```

### 2. Scaffold a starter brain

```bash
brain init                 # creates ./brain
# or: brain init my-brain
```

Requires GitHub SSH access to the private starter template (`git@github.com:telos-brain/starter-brain.git`). Override with `--template <url>` or `TELOS_STARTER_BRAIN_URL` if needed.

Edit the schema so that:

- An entity type with deploy code `organisation` exists, with a variable key `organisationId` (this app maps each org to that entity).
- Tools that should call back into this host use `api.path` like `/api/tools/{toolId}` and inject `organisationId` from the entity variable.
- Tool requests use a **dual-secret handshake**: `Authorization: Bearer <TOOL_API_KEY>` and `X-Brain-Authorization: Bearer <BRAIN_API_KEY>` (both stored in the brain `.env` and injected via `secret:`).

Keep the brain schema in a separate repo or local folder — do not commit it into this template.

### 3. Deploy the brain

Mint an organisation API key (admin) via the Management API, then:

```bash
# In the brain schema folder .env (not this app's .env)
TELOS_ORG_API_KEY=tbk_...
TELOS_API_URL=https://go.telosbrain.com

brain deploy --instance <your-instance-name>
```

On first deploy the CLI prints the **per-brain execution API key once**. Copy it into this app's `.env` as `BRAIN_API_KEY`, and set `BRAIN_URL` to the execution host.

### 4. App ↔ Brain wiring

| Direction | Auth | Purpose |
|---|---|---|
| App → Brain Execution API | `Authorization: Bearer ${BRAIN_API_KEY}` | Create entities, run workflows (`src/server/brain/`) |
| Brain → App tools | `Authorization: Bearer ${TOOL_API_KEY}` **and** `X-Brain-Authorization: Bearer ${BRAIN_API_KEY}` | Invoke host tools at `/api/tools/{toolId}` |

On organisation create, the app fail-soft creates a Brain entity and caches its id on `organisations.brain_entity_id`. If `BRAIN_URL` / `BRAIN_API_KEY` are unset (local UI-only work), entity creation is skipped.

#### Tool webhook contract (dual-secret handshake)

Only a caller that knows **both** the tool webhook secret and this brain's execution key can invoke tools:

```http
POST /api/tools/getUsers
Authorization: Bearer <TOOL_API_KEY>
X-Brain-Authorization: Bearer <BRAIN_API_KEY>
Content-Type: application/json

{ "organisationId": "<app-org-uuid>" }
```

Host tool definitions live in the local brain schema under `brain/tools/host/` (gitignored with the rest of `brain/`). Set `TOOL_API_KEY` + `BRAIN_API_KEY` in the brain `.env`, point each tool’s `api.path` at your public app URL, then `brain deploy`.

App-side implementation: `getUsers` in `src/server/tools/host-tools.ts`.

The app sidebar links to `/chat`, a full-page chat UI that calls
`POST /api/ai/chat`, which runs the starter-brain workflow `WF-CHAT`
(`brain/workflows/chat.md`) scoped to the current organisation entity.

After changing `brain/brain-compose.yml` (e.g. adding the `organisation` entity),
redeploy:

```bash
brain deploy --instance <your-instance-name>
```

Server helpers:

```ts
import { ensureBrainEntityForOrganisation } from "@/server/brain/entities";
import { runWorkflowSync } from "@/server/brain/client";

const entityId = await ensureBrainEntityForOrganisation(orgId);
if (entityId) {
  await runWorkflowSync("WF-CHAT", { inputMessage: "...", entityId });
}
```

## Development

```bash
npm run dev
```

Your application will be available at [http://localhost:3000](http://localhost:3000)

## Building for Production

```bash
npm run build
npm run start
```

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [Clerk](https://clerk.com/) - Authentication
- [Supabase](https://supabase.com/) - Database and storage
- [Drizzle ORM](https://orm.drizzle.team/) - Database ORM
- [Telos Brain](https://go.telosbrain.com) - External AI brain (Execution API + Tool webhooks)
- [TailwindCSS](https://tailwindcss.com/) - CSS framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety

## Additional Information

For more details about the database schema, check `db/schema.ts`.
