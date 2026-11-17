---
name: Financial Memory Hygiene
code: BUS404
version: 1
description: >-
  What the brain may remember about money — nicknames and patterns only.
  Account numbers and statement ledgers stay on host-app transaction rows.
tools:
  - add_blueprint_entry
  - search_blueprint_entries
  - get_blueprint_entry
  - update_blueprint_entry
---

# Financial Memory Hygiene

Use this skill before any `add_blueprint_entry`, `update_blueprint_entry`, or
schema write that mentions money, payees, or bank accounts. Load
`Account Type Rules` and `Memory Hygiene` from the personal-finance blueprint
(`search_blueprint_entries` then `get_blueprint_entry`).

## System of record

| Data | Where it lives |
|---|---|
| Individual transactions, amounts, dates | Host app (`transactions`) |
| Account numbers on a row | Host app `transactions.account` only |
| Recurring pattern, typical range, payee *name* | Brain blueprint, nickname only |

## Allowed in memory

- Account **nicknames**: Current, Investment, Giving payee, Salary (iPayroll)
- Cadence and approximate range: "fortnightly salary", "monthly giving about $100–160"
- Category and merchant *names*
- How to treat a pattern: reimbursements are income, not spend-to-cut

## Forbidden in memory, schema files, insight tips, and chat

- Full or partial bank account numbers (NZ `00-0000-0000000-00`, IBAN, BSB)
- Card numbers, IRD / tax IDs, payroll source account numbers
- Tables of individual statement rows copied into a blueprint
- One-off personal events identified by a bank reference (inheritance
  receipts, international transfer refs)

If a statement or tool result includes a number, use it only to choose a
nickname when calling `record_transactions`. Do not persist that number in
blueprint content.

## When writing a blueprint entry

1. Search existing Insights / Finance entries first.
2. Write a short pattern, not a ledger.
3. If the draft contains an account number, strip it and substitute the
   nickname from `Account Type Rules` before calling the write tool.
4. If you cannot name the account without a number, omit the account field.
