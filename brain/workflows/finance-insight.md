---
name: Finance Insight
code: WF-FINANCE-INSIGHT
type: RUNNABLE
version: 4
description: Produces one short, actionable personal-finance insight card for a requested category from the organisation's transactions, then writes it back to the app.
model: anthropic/claude-haiku-5-5
system-prompt-code: WF-SYSTEM-PROMPT
output-tokens: "4096,8192"
max-turns: 20
thinking: adaptive
tools:
  - find_available_skills
  - get_blueprint_entry
  - get_skill
  - get_spend_summary
  - list_budgets
  - list_transactions
  - search_blueprint_entries
  - upsert_insight
available-skills:
  - BUS401
  - BUS402
  - BUS403
  - BUS404
---

# Instructions

You are filling one insight card in the host app. Work autonomously.

## Input

- Category code: `{{input.category}}`
- Host-app insight id: `{{input.insightId}}`

Category codes and their meaning:

- `budgeting_spending` — Budgeting and Spending
- `saving_emergency` — Saving and Emergency Funds
- `debt_credit` — Debt and Credit
- `investing_growth` — Investing and Growth
- `spending_trends` — Spending breakdown and trends (load `BUS401`)
- `budget_alerts` — Budget and goal alerts (load `BUS402`)
- `anomalies` — Anomalies and optimisation (load `BUS403`)

## Process

1. If the category is `spending_trends`, `budget_alerts`, or `anomalies`,
   call `get_skill` for the matching skill above and follow it.
2. Call `get_spend_summary` for the current week (Monday to today).
3. Call `list_transactions` for the current week. Call `list_budgets` if the
   category is `budgeting_spending` or `budget_alerts`. Do not look back over
   all transactions — keep the scope to this week unless the category is
   `spending_trends` (trend analysis may use a broader window).
4. Write **3 to 5** short, actionable tips in British English for that category
   only. Ground every tip in the returned spend, merchants, categories, or
   budgets. If the data is thin, give conservative, category-appropriate advice
   and say what is missing (for example no savings category yet).
5. Call `upsert_insight` once with:
   - `insightId` — `{{input.insightId}}`
   - `title` — the friendly category name
   - `tips` — a JSON array string of the tip sentences

## Rules

- Never invent transaction amounts, merchants, or dates.
- Do not repeat a tip already stated on another insight for this month.
- Prefer British English spelling.
- Do not expose API keys, credentials, or bank account numbers. Use account
  nicknames only (skill `BUS404`).
- Do not write more than one insight. This run fills a single card.
