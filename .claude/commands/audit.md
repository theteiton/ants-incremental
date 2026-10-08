---
description: Ask the overseer to audit recent agent activity and the current task
argument-hint: [task name, optional]
---

Dispatch the `overseer` agent to audit recent activity. Task focus: **$ARGUMENTS** (if empty, audit the latest activity and the active task, if any).

Prompt for the overseer:

> AUDIT. Read `.claude/ledger/overseer.jsonl`, the ledger for the task, `docs/agent-logs/overseer.md` and the other agent logs since their last release marker. If a task sandbox exists, also inspect its diff against the base branch. Report: verdict (clear or block), findings by severity with references, suggested policy changes as exact JSON, and what you could not verify. Record your Action entry with the log tool. Record a gate verdict only if a task sandbox is active and you have the final commit sha.

After the report, show the user the findings and any suggested policy change. The user edits `.claude/overseer/policy.json` themselves, then runs `node .claude/tools/overseer-selftest.js`.
