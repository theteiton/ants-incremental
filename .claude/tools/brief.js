#!/usr/bin/env node
/*
 * Start-of-run briefing for an agent. Local only, no dependencies, read-only.
 *
 *   node .claude/tools/brief.js <agent> [--json]
 *
 * It answers, in about 40 lines, what an agent would otherwise spend many tool calls finding out:
 *   - where it is (task, branch, commit, uncommitted files, last commits)
 *   - which gates are green on the current commit
 *   - its OPEN feedback (written by others, no Resolution yet) since the last release marker
 *   - its own recurring pitfalls, measured from the ledger: actions the overseer blocked and commands that failed,
 *     each with the fix that worked before (hints below)
 * The ledger hook also injects this brief automatically when a team agent starts, so lessons from the
 * last run reach the next run without anyone retyping them.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const lib = require(path.join(__dirname, '..', 'hooks', 'lib.js'));

const DAY = 86400000;
const HINTS = {
  'no-sandbox': 'Work only inside a task sandbox. Ask the lead to run: node .claude/tools/task.js start <name>.',
  'role-scope': 'Your role may not edit that path. Hand the change to the agent whose job it is, through the lead.',
  'protected-path': 'The kit (.claude, CLAUDE.md, .git) belongs to the user. Propose the change in your report instead.',
  'logs-via-tool': 'Write logs only with node .claude/tools/log-append.js (heredoc, no cd, no &&).',
  'secrets': 'Never read or write secrets. If a value is needed, ask the lead to supply it.',
  'outside-project': 'Stay inside the sandbox folder. Use relative paths.',
  'bash.outside-project': 'Stay inside the sandbox folder. Use relative paths; no ../ and no absolute paths elsewhere.',
  'bash.mentions-protected': 'Do not mention kit or log paths in commands. Use the log tool for logs.',
  'bash.net-upload': 'Only public GET requests may run. Never send project data to a website.',
  'bash.runs-downloaded': 'Do not run files fetched from the internet. Read them, then ask the lead.',
  'bash.inline-obfuscation': 'Put code in a file in the sandbox instead of node -e / python -c.',
  'bash.package-exec': 'npx downloads and runs code. Use npm install first, then npm run.',
  'bash.package-system': 'Install nothing outside the project folder. Use npm install inside the sandbox.',
  'bash.process-control': 'Do not kill programs. Ask the lead.',
  'bash.open-program': 'Do not open programs. Run the code, read its output.',
  'bash.git-leaves-sandbox': 'Only the user pushes or merges. Commit on your sandbox branch and stop.',
  'bash.git-main-branch': 'Never touch main. Stay on the team/<task> branch.',
  'verdict-commit': 'A verdict needs --commit <sha> from git rev-parse HEAD.',
  'role-bash': 'Your role may only run read-only commands and the log tool.',
};

const git = (args) => {
  const r = cp.spawnSync('git', args, { cwd: lib.ROOT, encoding: 'utf8', timeout: 15000 });
  return r.status === 0 ? (r.stdout || '').trim() : '';
};
const short = (s, n) => lib.clip(s, n);

function openFeedback(agent) {
  let t = '';
  try { t = fs.readFileSync(lib.logPath(agent), 'utf8'); } catch (e) { return []; }
  const i = t.lastIndexOf('\n## ===== Release');
  if (i >= 0) t = t.slice(i);
  const fb = [], answered = new Set();
  for (const b of t.split(/\n(?=### #\d+ )/)) {
    let m = b.match(/^### #(\d+) - Feedback on \S+ (#\d+) - from (\S+)/);
    if (m) {
      const get = (k) => ((b.match(new RegExp('\\*\\*' + k + ':\\*\\*\\s*([^\\n]*)')) || [])[1] || '').trim();
      fb.push({ n: +m[1], about: m[2], from: m[3], type: get('Type'), severity: get('Severity'), found: get('What I found'), fix: get('Suggested fix or better approach') });
    }
    m = b.match(/^### #\d+ - Resolution of #(\d+)/);
    if (m) answered.add(+m[1]);
  }
  return fb.filter((f) => !answered.has(f.n));
}

function pitfalls(agent) {
  const since = Date.now() - 3 * DAY;
  const out = [];
  const denies = lib.readJsonl(path.join(lib.LEDGER_DIR, 'overseer.jsonl'), (o) => o.event === 'decision' && o.decision === 'deny' && o.agent === agent && Date.parse(o.ts) > since);
  const byRule = {};
  denies.forEach((d) => { (byRule[d.rule] = byRule[d.rule] || []).push(d); });
  for (const rule of Object.keys(byRule).sort((a, b) => byRule[b].length - byRule[a].length).slice(0, 4)) {
    const rows = byRule[rule];
    out.push('Blocked ' + rows.length + 'x by "' + rule + '" (e.g. `' + short(rows[0].detail || rows[0].tool, 70) + '`). ' + (HINTS[rule] || short(rows[0].reason, 140)));
  }
  const fails = lib.readJsonl(path.join(lib.LEDGER_DIR, agent + '.jsonl'), (o) => o.event === 'PostToolUseFailure' || o.ok === false);
  const byCmd = {};
  fails.filter((f) => Date.parse(f.ts) > since).forEach((f) => { const k = f.tool + ' ' + short(f.detail || '', 60); (byCmd[k] = byCmd[k] || []).push(f); });
  for (const k of Object.keys(byCmd).filter((x) => byCmd[x].length >= 2).slice(0, 3)) out.push('Failed ' + byCmd[k].length + 'x: `' + k + '` (' + short(byCmd[k][0].error || 'failed', 80) + '). Find the cause before running it again.');
  return out;
}

function gates(tip) {
  if (!lib.TASK) return [];
  const rows = lib.readJsonl(path.join(lib.GATES_DIR, lib.TASK + '.jsonl'));
  const policy = lib.readJson(lib.POLICY_FILE, {});
  const need = Object.keys(((policy.gates || {}).required) || {});
  return need.map((role) => {
    const last = rows.filter((r) => r.role === role).pop();
    if (!last) return role + ': none yet';
    const fresh = tip && tip.startsWith(String(last.commit).slice(0, 7));
    return role + ': ' + last.verdict + ' at ' + String(last.commit).slice(0, 7) + (fresh ? '' : ' (STALE, tip is ' + (tip || '?').slice(0, 7) + ')');
  });
}

function buildBrief(agent) {
  agent = lib.safeName(agent || 'lead');
  const L = [];
  const tip = git(['rev-parse', 'HEAD']);
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  L.push('# Brief for ' + agent);
  L.push('Task: ' + (lib.TASK || 'none (no sandbox: you may only read)') + ' | branch ' + (branch || '?') + ' | commit ' + (tip ? tip.slice(0, 7) : '?'));
  const dirty = git(['status', '--porcelain', '--untracked-files=normal']).split('\n').filter(Boolean);
  L.push('Uncommitted: ' + (dirty.length ? dirty.length + ' file(s): ' + dirty.slice(0, 6).map((x) => x.trim()).join(', ') + (dirty.length > 6 ? ', ...' : '') : 'none'));
  const log = git(['log', '--oneline', '-5']);
  if (log) L.push('Recent commits:\n' + log.split('\n').map((x) => '  ' + x).join('\n'));
  const g = gates(tip);
  if (g.length) L.push('Gates on this task: ' + g.join('; '));
  const fb = openFeedback(agent);
  L.push('');
  L.push('## Open feedback for you (' + fb.length + ')' + (fb.length ? ' - answer each with a Resolution entry' : ''));
  if (!fb.length) L.push('None.');
  fb.slice(0, 6).forEach((f) => L.push('- #' + f.n + ' from ' + f.from + ' about ' + f.about + ' [' + (f.type || '?') + '/' + (f.severity || '?') + ']: ' + short(f.found, 220) + (f.fix ? ' Suggested: ' + short(f.fix, 140) : '')));
  if (fb.length > 6) L.push('- ... and ' + (fb.length - 6) + ' more in your log.');
  const p = pitfalls(agent);
  L.push('');
  L.push('## Your recent pitfalls (measured, last 3 days)');
  if (!p.length) L.push('None recorded.'); else p.forEach((x) => L.push('- ' + x));
  L.push('');
  L.push('Rules that save time: stay in the sandbox; do not retry a blocked action (the hint above is the alternative); run `node .claude/tools/verify.js` before you hand work over; write your Action entry when done.');
  return L.join('\n');
}

module.exports = { buildBrief, openFeedback, pitfalls };

if (require.main === module) {
  const agent = process.argv[2];
  if (!agent || agent.startsWith('--')) { console.error('usage: node .claude/tools/brief.js <agent>'); process.exit(1); }
  if (process.argv.includes('--json')) console.log(JSON.stringify({ agent, feedback: openFeedback(agent), pitfalls: pitfalls(agent) }, null, 2));
  else console.log(buildBrief(agent));
}
