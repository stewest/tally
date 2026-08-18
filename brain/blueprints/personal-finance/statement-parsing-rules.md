---
name: Statement Parsing Rules
category: Categories
version: 2
---

# Statement Parsing Rules

When the user pastes bank statement text (including a `bank-statement` fenced
block):

1. Parse every line that contains a date and an amount.
2. Normalise dates to `YYYY-MM-DD`. Accept `DD/MM/YYYY`, `DD-MM-YYYY`,
   `YYYY-MM-DD`, and `D Mon YYYY`.
3. Treat amounts as signed. A leading minus, `(42.50)`, or a debit column is
   spend. Credits and refunds are positive.
4. Strip currency symbols and thousands separators before recording.
5. Use the remaining text as `description`. Infer `merchant` when a store name
   is obvious.
6. Assign a category from the Category Taxonomy. If unsure, use `Other` and
   say so.
7. Call `record_transactions` once, or in batches of 40 for large pastes.
   Pass `transactions` as a JSON array string (not a native array). Do not
   invent rows that were not in the paste. Do not enumerate every row in
   thinking.
8. Re-pasting the same statement is safe — duplicates are skipped by
   date + amount + normalised description.
9. After recording, summarise inserted vs skipped counts and the category
   totals.
