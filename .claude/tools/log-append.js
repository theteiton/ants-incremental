#!/usr/bin/env node
/*
 * The only sanctioned way to write to an agent log or record a gate verdict. Local only, no dependencies.
 * It numbers the entry, stamps the time, scrubs secrets, and appends under a lock, so logs stay
 * append-only and entries cannot be forged into other formats. The overseer hook blocks direct edits to
 * logs and checks that --from matches the agent actually running this command.
 *
 *   node .claude/tools/log-append.js --agent <log> --kind action --from <me> --title "Short title" <<'EOF'
 *   **Asked:** ...
 *   EOF
 *
 *   --kind feedback    --agent <their log> --from <me> --about "#7"   (about someone else's entry)
 *   --kind resolution  --agent <my log>    --from <me> --of "#8"      (answer to a Feedback entry)
 *   --kind verdict     --agent <my log>    --from <me> --verdict <v> --commit <sha>
 *                      tester: ready | not-ready   reviewer: approve | request-changes   overseer: clear | block
 *                      The merge gate accepts a verdict only for the exact final commit of the task.
 *   --kind marker      --agent <log> --from lead --text "Release v1.0.0 retro closed 2026-10-08"
 */
'use strict';
const fs = require('fs');
const path = require('path');
const lib = require(path.join(__dirname, '..', 'hooks', 'lib.js'));

function fail(msg) { process.stderr.write('log-append: ' + msg + '\n'); process.exit(1); }

const argv = process.argv.slice(2);
const a = {};
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) { a[argv[i].slice(2)] = argv[i + 1] === undefined || argv[i + 1].startsWith('--') ? '' : argv[++i]; }
}

const target = a.agent, kind = a.kind, from = a.from;
if (!lib.AGENTS.includes(target)) fail('--agent must be one of: ' + lib.AGENTS.join(', '));
if (!['action', 'feedback', 'resolution', 'verdict', 'marker'].includes(kind)) fail('--kind must be action, feedback, resolution, verdict, or marker');
if (!from || !(lib.AGENTS.includes(from) || from === 'lead')) fail('--from must be your agent name (or lead)');

if (kind === 'marker') {
  if (from !== 'lead') fail('only the lead writes release markers');
  const text = lib.clip(lib.scrub(a.text), 160);
  if (!/^Release [\w.\- ]+ retro closed/.test(text)) fail('marker text must look like: Release v1.0.0 retro closed 2026-10-08');
  if (!lib.appendMarker(target, text)) fail('log not found for ' + target);
  console.log('Marker added to docs/agent-logs/' + target + '.md');
  process.exit(0);
}

let body = '';
try { body = fs.readFileSync(0, 'utf8'); } catch (e) { fail('no entry text on stdin. Pass it with a heredoc.'); }
body = lib.scrub(body.replace(/\r\n/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')).trim();
if (!body) fail('entry text is empty');
if (body.length > 8000) fail('entry text is over 8000 characters; shorten it');
if (/^(#{2,3} (#\d+|=====))/m.test(body) || /^## ===== /m.test(body)) fail('entry text may not contain lines that look like log headings');

const title = lib.clip(a.title || 'Task', 100);
const about = /^#\d+$/.test(a.about || '') ? a.about : null;
const of = /^#\d+$/.test(a.of || '') ? a.of : null;
if (kind === 'feedback' && !about) fail('feedback needs --about "#N" (the entry number it is about)');
if (kind === 'feedback' && target === from) fail('feedback goes into someone else\'s log; use an action entry for your own');
if (kind === 'resolution' && !of) fail('resolution needs --of "#N" (the Feedback entry you are answering)');
if ((kind === 'action' || kind === 'resolution' || kind === 'verdict') && target !== from) fail(kind + ' entries go in your own log (--agent ' + from + ')');

let verdict = null, commit = null;
if (kind === 'verdict') {
  const allowed = { tester: ['ready', 'not-ready'], reviewer: ['approve', 'request-changes'], overseer: ['clear', 'block'] }[from];
  if (!allowed) fail('the ' + from + ' role does not give gate verdicts');
  verdict = a.verdict;
  if (!allowed.includes(verdict)) fail('--verdict for ' + from + ' must be one of: ' + allowed.join(', '));
  commit = String(a.commit || '').toLowerCase();
  if (!/^[0-9a-f]{7,40}$/.test(commit)) fail('--commit must be the git commit sha you checked (git rev-parse HEAD)');
  if (!lib.SANDBOX || !lib.TASK) fail('verdicts only count inside a task sandbox (start one with: node .claude/tools/task.js start <name>)');
}

const n = lib.appendLogEntry(target, (num) => {
  const ts = lib.stamp();
  let head;
  if (kind === 'action') head = `### #${num} - Action - ${ts} - ${title}`;
  else if (kind === 'feedback') head = `### #${num} - Feedback on ${target} ${about} - from ${from} - ${ts}`;
  else if (kind === 'verdict') head = `### #${num} - Verdict - ${ts} - ${verdict.toUpperCase()} for task ${lib.TASK} at ${commit.slice(0, 7)}`;
  else head = `### #${num} - Resolution of ${of} - ${ts}`;
  return head + '\n' + body;
}, true);

if (kind === 'verdict') {
  lib.appendJsonl(path.join(lib.GATES_DIR, lib.TASK + '.jsonl'), { ts: new Date().toISOString(), task: lib.TASK, role: from, verdict, commit, log_entry: n });
}
console.log('Appended #' + n + ' to docs/agent-logs/' + target + '.md' + (kind === 'verdict' ? ' and recorded the ' + from + ' verdict for task ' + lib.TASK : ''));
