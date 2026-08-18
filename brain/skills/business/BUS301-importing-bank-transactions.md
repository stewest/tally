---
name: Importing Bank Transactions
code: BUS301
version: 3
description: How to parse pasted bank statement text and persist it with finance host tools.
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

1. Load `Category Taxonomy` and `Statement Parsing Rules` from memory
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

## Rules

- Never invent transactions that were not in the paste.
- Negative = spend, positive = income.
- Dates must be `YYYY-MM-DD` when calling tools.
- Do not walk through every row in thinking — it burns the output budget.
- Do not expose API keys or raw tool errors to the user.
