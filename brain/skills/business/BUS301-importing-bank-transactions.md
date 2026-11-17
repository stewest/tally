---
name: Importing Bank Transactions
code: BUS301
version: 7
description: How to import bank statements — parsing pasted or uploaded text, sequencing multi-account imports, applying batch limits, and persisting transactions with finance host tools.
tools:
  - record_transactions
  - list_transactions
  - update_transaction
  - get_spend_summary
  - search_blueprint_entries
  - get_blueprint_entry
---

# Importing Bank Transactions

Use this skill when the user pastes a bank statement, CSV-like rows, or asks
to import transactions.

## Process

1. Load `Category Taxonomy`, `Statement Parsing Rules`, and `Account Type Rules` from memory
   (`search_blueprint_entries` then `get_blueprint_entry`).
2. Parse every line that has a date and an amount. Skip headers and balances.
3. Map each row to `{ occurredAt, description, amount, merchant?, category?, account? }`.
4. Call `record_transactions` once. Pass `transactions` as a **JSON array
   string** (Brain API tools have no array type), e.g.
   `[{"occurredAt":"2026-08-03","description":"Countdown","amount":-86.42,"category":"Groceries"}]`.
   Keep each object compact (no notes unless the user asked). If the paste has
   more than 40 rows, call the tool in batches of 40 so the payload fits the
   output budget.
5. Do not enumerate or restate every row in thinking — map silently, then
   summarise counts after the tool returns.
6. Report inserted vs skipped counts. Offer to recategorise anything filed as
   `Other`.
7. If the user asks how they are tracking, follow up with `get_spend_summary`
   or `list_transactions`.

## Multi-account imports

When a statement covers more than one account:

1. Identify every account label in the paste before processing any rows.
2. Consult `Account Type Rules` (loaded in step 1 above) to determine which
   accounts to import and which to exclude — for example, savings or investment
   accounts may follow different conventions or be excluded entirely.
3. Process each included account in sequence. Do not combine rows from different
   accounts into a single `record_transactions` call — keep the `account` field
   accurate per row.
4. Track which accounts have been processed. Do not summarise until every
   included account is complete.
5. Report per-account totals in the final summary so the user can confirm every
   account was handled.

## Rules

- Never invent transactions that were not in the paste.
- Negative = spend, positive = income.
- Dates must be `YYYY-MM-DD` when calling tools.
- Do not walk through every row in thinking — it burns the output budget.
- Do not expose API keys or raw tool errors to the user.
- Pass `account` as a nickname from Account Type Rules. Do not write account
  numbers into chat, blueprints, or schema files (skill `BUS404`).
