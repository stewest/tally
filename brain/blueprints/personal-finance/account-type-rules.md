---
name: Account Type Rules
category: Accounts
version: 1
---

# Account Type Rules

Map statement accounts to **nicknames**. The host app may store a number on
the transaction row. Brain memory and chat use the nickname only.

| Nickname | Typical statement labels | Import? |
|---|---|---|
| Current | Everyday / cheque / 00 suffix current | Yes — spend and income |
| Investment | Investment, PIE, brokerage | Yes — as Transfers / Investments, not spend |
| Savings | Savings, sub-accounts | Yes unless the user asked to skip |
| Giving payee | Capital Vineyard or similar regular giving | Outgoing from Current; category Giving |

Do not list, quote, or remember the digit string. If two accounts collide on
nickname, append a short role (`Current (joint)`), still no number.

When `record_transactions` needs `account`, pass the nickname (or the label
the statement used if it is already non-numeric). Never copy an
`00-0000-0000000-00` value into a blueprint entry.
