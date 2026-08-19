# Starter Brain

Schema for the host app in the parent folder. **First-time install:** follow the [root README](../README.md) — clone the repo, run local Supabase (Clerk is optional locally), then `brain start` / `brain deploy --env local`. Do not run `brain init`; this folder is already the schema.

| Environment | Brain | Command |
|---|---|---|
| **Dev** | Local Docker | `brain start` then `brain deploy --env local --instance local-brain` |
| **Stage / prod** | [Telos Hosted](https://go.telosbrain.com) ($10 free credit) | `brain deploy --env stage` or `--env prod` |

Precise enough for Cursor / Claude Code. Complete local steps in the root README first.

## Local (dev)

```bash
# From repo root: npm install (or npm run prepare) starts Brain and writes MY_APP_API_KEY
# Then fill ANTHROPIC_API_KEY, VOYAGE_API_KEY, and remaining MY_APP_* in .env.local
brain deploy --env local --instance local-brain
```

**Capture the Brain API key from stdout immediately.** First deploy prints it once. Put it in this folder’s `.env.local` as `BRAIN_API_KEY` and in the app `.env` as `BRAIN_API_KEY`. Do not delete `brain.lock`.

`brain snapshot --env local --instance local-brain` before redeploying if the live brain has learned.

Full local stack behaviour: skill **BRA106** (`skills/telos-brain/concepts/BRA106-local-development.md`).

## Stage and production (Telos Hosted)

Copy `.env.example` to `.env.stage` or `.env.prod`. Set a real `TELOS_BRAIN_ORG_API_KEY` from https://go.telosbrain.com, `TELOS_BRAIN_API_URL=https://go.telosbrain.com`, LLM/embedding keys, and `MY_APP_API_URL` to the public HTTPS app URL. Add that hostname to `allowed-callback-domains` in `brain-compose.yml`.

```bash
brain deploy --env stage --instance your-stage-brain
brain deploy --env prod --instance your-prod-brain
```

Hosted first deploy prints a **new** execution key — do not reuse the local key.

## Building the schema

The starter includes the Telos Brain skill book and learning/maintenance workflows. Two ways to turn that into *your* brain (do this before a hosted deploy). Category quality determines learning quality.

1. **Auto-build from an existing application** — load skill **BRA211** (`skills/telos-brain/brain-schema/BRA211-auto-building-a-brain.md`). Fully contained. Do not copy that process into this README.
2. **Guided interview** — load skill **BRA104** (`skills/telos-brain/concepts/BRA104-getting-started.md`). **Requires human input** — an AI agent must not skip or auto-answer.

Use BRA211 when the host application already exists. Use BRA104 for a greenfield brain.

## Train the brain

After the schema exists, upload documents, transcripts, or emails via the Brain admin UI or API inbox. `brain-compose.yml` defaults to `learning-mode: high`. Start at `high`, review daily checkpoints for the first 5 days, then set `low` when quality is acceptable.

## Execute API smoke test

Local:

```bash
curl -X POST http://127.0.0.1:60061/workflows/WF-CHAT/run/sync \
  -H "Authorization: Bearer YOUR_BRAIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"inputMessage": "Hello world"}'
```

Hosted: same path on `https://go.telosbrain.com`. Run skills **BRA401** onwards for the Execution API.

## Host app tool handshake

Finance tools call the Next.js app at `POST /api/tools/{toolId}` using the `my-app` connector.

- `MY_APP_API_URL` — host the Brain can reach (local Docker: `http://host.docker.internal:3000`; stage/prod: `https://your-app.example.com`)
- `MY_APP_API_KEY` — **must equal** the app’s `TOOL_API_KEY`
- `BRAIN_API_KEY` — the same per-brain execution key the app stores as `BRAIN_API_KEY`

Both `Authorization: Bearer <TOOL_API_KEY>` and `X-Brain-Authorization: Bearer <BRAIN_API_KEY>` are required. After changing finance tools or `WF-CHAT`, redeploy.

## Repository hygiene

Gitignore (do not commit):

- `.env`, `.env.local`, `.env.stage`, `.env.prod`
- `.brain/` (Compose state, encryption key)
- `brain.lock` if it contains API keys
- `node_modules/`, `dist/`

Commit `.env.example` with placeholder values only.

## Support

Copyright Telos IP Limited 2026
www.telosbrain.com
support@telosbrain.com
