#!/usr/bin/env node
/*
 * Scorecard: turns the ledger and the agent logs into numbers, so improvement is measured, not guessed.
 * Local only, no dependencies, read-only unless --write.
 *
 *   node .claude/tools/insights.js [--write]
 *
 * Per agent: runs, tool calls, failure rate, overseer blocks (by rule), Action entries missing, feedback received
 * (by type and severity), feedback still open, and gate outcomes (first-pass rate for tester/reviewer/overseer).
 * Then "Recurring problems": the same block or the same Error feedback three or more times. Those are the
 * candidates for a Core lesson (retro), a clearer agent instruction, or a policy change for the user to decide.
 * --write saves docs/retro/scorecard.md. The retro and the lead use it as evidence.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const lib = require(path.join(__dirname, '..', 'hooks', 'lib.js'));
const { openFeedback } = require(path.join(__dirname, 'brief.js'));

const rows = {};
const row = (a) => (rows[a] = rows[a] || { runs: 0, calls: 0, fails: 0, blocks: {}, noAction: 0, fb: { Error: 0, Improvement: 0, Praise: 0 }, sev: { blocker: 0, major: 0, minor: 0 }, open: 0, verdicts: [] });

for (const a of lib.AGENTS) {
  const r = row(a);
  for (const o of lib.readJsonl(path.join(lib.LEDGER_DIR, a + '.jsonl'))) {
    if (o.event === 'SubagentStart') r.runs++;
    if (o.event === 'PostToolUse' || o.event === 'PostToolUseFailure') { r.calls++; if (o.ok === false) r.fails++; }
  }
  let log = '';
  try { log = fs.readFileSync(lib.logPath(a), 'utf8'); } catch (e) { /* no log yet */ }
  r.noAction = (log.match(/NO Action entry/g) || []).length;
  for (const m of log.matchAll(/^### #\d+ - Feedback on [^\n]*\n\*\*Type:\*\*\s*(\w+)[^\n]*\n\*\*Severity:\*\*\s*(\w+)/gm)) {
    if (r.fb[m[1]] !== undefined) r.fb[m[1]]++;
    if (r.sev[m[2]] !== undefined) r.sev[m[2]]++;
  }
  for (const m of log.matchAll(/^### #\d+ - Verdict - [^\n]* - (\S+) for task (\S+) at (\w+)/gm)) r.verdicts.push({ v: m[1].toLowerCase(), task: m[2] });
  r.open = openFeedback(a).length;
}
const overseerRows = lib.readJsonl(path.join(lib.LEDGER_DIR, 'overseer.jsonl'), (o) => o.event === 'decision' && o.decision === 'deny');
for (const o of overseerRows) { const r = row(o.agent); r.blocks[o.rule] = (r.blocks[o.rule] || 0) + 1; }

const pct = (a, b) => (b ? Math.round((100 * a) / b) + '%' : '-');
const good = { tester: 'ready', reviewer: 'approve', overseer: 'clear' };
const out = [];
out.push('# Agent scorecard', '', 'Generated ' + lib.stamp() + ' from the ledger and agent logs. Counts are all-time for this project.', '');
out.push('| agent | runs | tool calls | failed | blocked | no Action entry | Error fb | blocker/major | open fb | gate first-pass |');
out.push('|---|---|---|---|---|---|---|---|---|---|');
for (const a of lib.AGENTS) {
  const r = rows[a];
  const blocked = Object.values(r.blocks).reduce((x, y) => x + y, 0);
  let fp = '-';
  if (good[a] && r.verdicts.length) {
    const byTask = {};
    r.verdicts.forEach((v) => { (byTask[v.task] = byTask[v.task] || []).push(v.v); });
    const tasks = Object.keys(byTask);
    fp = pct(tasks.filter((t) => byTask[t][0] === good[a]).length, tasks.length) + ' of ' + tasks.length;
  }
  out.push('| ' + [a, r.runs, r.calls, pct(r.fails, r.calls), blocked, r.noAction, r.fb.Error, r.sev.blocker + '/' + r.sev.major, r.open, fp].join(' | ') + ' |');
}
out.push('', '## Recurring problems (3 or more)', '');
let any = false;
for (const a of lib.AGENTS) {
  for (const k of Object.keys(rows[a].blocks).filter((x) => rows[a].blocks[x] >= 3)) { any = true; out.push('- **' + a + '** was blocked ' + rows[a].blocks[k] + 'x by `' + k + '`. Fix the instruction in its agent file, or propose a policy change.'); }
  if (rows[a].noAction >= 3) { any = true; out.push('- **' + a + '** finished ' + rows[a].noAction + ' runs without an Action entry. Tighten its Logging section or have the lead ask for it.'); }
  if (rows[a].fb.Error >= 3) { any = true; out.push('- **' + a + '** received ' + rows[a].fb.Error + ' Error feedback entries. Read them together: the same cause is a Core lesson.'); }
  if (rows[a].open >= 3) { any = true; out.push('- **' + a + '** has ' + rows[a].open + ' feedback entries with no Resolution.'); }
}
if (!any) out.push('None yet.');
const text = out.join('\n') + '\n';
console.log(text);
if (process.argv.includes('--write')) {
  const f = path.join(lib.HOME_ROOT, 'docs', 'retro', 'scorecard.md');
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, text, 'utf8');
  console.log('Saved docs/retro/scorecard.md');
}
