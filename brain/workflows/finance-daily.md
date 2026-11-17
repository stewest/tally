---
name: Daily Finance Insights
code: WF-FINANCE-DAILY
type: RUNNABLE
version: 6
description: Daily heartbeat that reviews organisation transactions and writes one Insights card per personal-finance skill that has a concrete finding.
model: anthropic/claude-sonnet-4-6
system-prompt-code: WF-SYSTEM-PROMPT
output-tokens: "4096,8192"
max-turns: 30
thinking: adaptive
frequency: daily
tools:
  - create_insight
  - find_available_skills
  - get_blueprint_entry
  - get_skill
  - get_spend_summary
  - list_budgets
  - list_transactions
  - search_blueprint_entries
available-skills:
  - BUS401
  - BUS402
  - BUS403
  - BUS404
---

# Instructions

You are running the daily personal-finance heartbeat for this organisation.
Work autonomously. The run is already scoped to the organisation entity —
do not ask which organisation to use.

`frequency: daily` is the intended Brain heartbeat. The host app also starts
this workflow once per organisation entity (Vercel cron or a local POST to
`/api/cron/daily-insights`) so each run has `organisationId` injected.

## Process

1. Call `get_spend_summary` for the current calendar week (Monday to today).
   Call `list_transactions` for the current week. If there are no transactions
   this week, stop — do not call `create_insight`.
2. Load each skill with `get_skill` and follow it:
   - `BUS401` → category `spending_trends`
   - `BUS402` → category `budget_alerts` (also call `list_budgets` and a
     this-week `list_transactions`)
   - `BUS403` → category `anomalies` (this week's transactions only — do not
     look back over full history)
3. For each skill, call `create_insight` **only** when that skill has a
   concrete, genuinely new finding — one not already covered by a recent insight
   card for that category. Pass:
   - `category` — the code above
   - `title` — the friendly category name
   - `tips` — a JSON array string of 3 to 5 tip sentences
4. If a skill's data is thin, skip that card. Do not invent advice.
5. If `create_insight` says a card for that category was already recorded
   this week, leave it and continue.

## Rules

- Never invent transaction amounts, merchants, or dates.
- Prefer British English spelling.
- Do not expose API keys, credentials, or bank account numbers. Use account
  nicknames only (skill `BUS404`).
- At most one `create_insight` call per category in this run.
- Do not repeat insights. Only create a card when the finding is new — not
  already captured in a recent insight for that category.
- BUS401 (spending_trends) may look back further for trend analysis. BUS402
  and BUS403 must stay within the current week's transactions.
