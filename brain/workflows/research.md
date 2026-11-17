---
name: Research
code: WF-RESEARCH
type: TRIGGERED
version: 4
description: Researches a topic from an inbox entry using web search, web fetch, skills, and memory. Compiles findings into a new PROCESSED inbox entry (no RESEARCH routing — prevents recursion).
model: anthropic/claude-sonnet-4-6
system-prompt-code: WF-SYSTEM-PROMPT
trigger: inbox:RESEARCH
trigger-mode: manual
output-tokens: "4096,8192"
caching: automatic
max-turns: 30
thinking: effort
max-runs-per-hour: 100
tools:
  - create_inbox_entry
  - find_available_skills
  - get_blueprint_entry
  - get_skill
  - search_blueprint_entries
  - web_fetch
  - web_search
---

# Instructions

You research **one** topic from this inbox entry. Fully autonomous — do not ask
questions or wait for confirmation. Do **not** update the source inbox entry
status.

## This task

**Reference:** `{{task.reference}}`
{{#if task.action}}**Instructions:** {{task.action}}{{/if}}

{{#if task.expertOpinion}}
### Expert Opinion

The following expert input has been provided for this task:

{{task.expertOpinion}}
{{/if}}

## Topic

Derive the research question from this task's instructions, plus the entry
title and body. Prefer an explicit question or "research …" ask over a vague
theme.

- **Entry reference:** {{inboxEntry.reference}}
- **Title:** {{inboxEntry.title}}

{{#if inboxEntry.body}}
<entry-body>
{{inboxEntry.body}}
</entry-body>
{{/if}}

## Process

1. State the research question in one line (internally — do not ask the user).
2. Search existing knowledge first:
   - `search_blueprint_entries` (then `get_blueprint_entry` for useful hits)
   - `find_available_skills` (then `get_skill` when a skill is clearly relevant)
3. Gather external sources:
   - `web_search` for candidate URLs
   - `web_fetch` on the most relevant pages (prefer primary sources; skip junk)
4. Compile a structured markdown summary:
   - **Question** — what was researched
   - **Findings** — concise bullets grounded in sources
   - **Existing brain knowledge** — what skills/memory already covered (or none)
   - **Sources** — URLs and titles used
   - **Gaps / confidence** — what remains uncertain
5. Call `create_inbox_entry` **once** with:
   - `title` — short specific summary of the research outcome
   - `body` — the full structured summary (markdown)
   - `routing_type` — `MEMORY_UPDATE` (never `RESEARCH`)
   - `status` — `PROCESSED` (required — skips entry-create inbox triggers so
     this output cannot re-enter `WF-RESEARCH` / triage recursion)
   - `source` — `WF-RESEARCH`
6. Reply in one or two lines: the new entry reference and a one-line outcome.
   If research is impossible (empty/unusable topic), create **no** entry and say
   so in one line.

## Rules

- Never set `routing_type` to `RESEARCH` on the output entry
- Never invent facts not supported by fetched sources or loaded skills/memory
- Prefer a missed claim over an unsupported one
- Do not edit skills, workflows, tools, or blueprints in this workflow
- Do not call `add_inbox_task` on the output entry — `PROCESSED` is enough
