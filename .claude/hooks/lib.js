'use strict';
/*
 * Shared helpers for the ledger hook, the overseer hook, and the log tools.
 * Local only, no dependencies. This file lives in <project>/.claude/hooks/,
 * so the project root is two folders up from here, whatever the working directory is.
 */
const fs = require('fs');
const path = require('path');

// ROOT is where the agents work. In a task sandbox that is the sandbox folder (a git worktree).
// HOME_ROOT is the real project checkout: logs, the ledger, gate verdicts and the policy live
// there, outside anything an agent can edit. Outside a sandbox the two are the same folder.
const ROOT = path.resolve(__dirname, '..', '..');
const AGENTS = ['manager', 'thinker', 'game-designer', 'engineer', 'developer', 'ui-designer', 'tester', 'reviewer', 'release-manager', 'overseer'];
function readJsonFile(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return null; } }
const SANDBOX_CFG = readJsonFile(path.join(ROOT, '.claude', 'team-home.json'));
// OVERSEER_DRY is only set by the self-test, which needs to try both modes.
const FORCED = process.env.OVERSEER_DRY ? process.env.OVERSEER_FORCE_SANDBOX : undefined;
const SANDBOX = FORCED === '1' ? true : FORCED === '0' ? false : !!(SANDBOX_CFG && SANDBOX_CFG.home);
const HOME_ROOT = SANDBOX_CFG && SANDBOX_CFG.home ? path.resolve(SANDBOX_CFG.home) : ROOT;
const TASK = SANDBOX_CFG && SANDBOX_CFG.task ? String(SANDBOX_CFG.task) : (FORCED === '1' ? 'selftest' : null);
const LEDGER_DIR = path.join(HOME_ROOT, '.claude', 'ledger');
const GATES_DIR = path.join(LEDGER_DIR, 'gates');
const LOG_DIR = path.join(HOME_ROOT, 'docs', 'agent-logs');
const POLICY_FILE = path.join(HOME_ROOT, '.claude', 'overseer', 'policy.json');

function scrub(s) {
  return String(s == null ? '' : s)
    .replace(/\b(sk|pk|rk)-[A-Za-z0-9_-]{16,}/g, '[redacted-key]')
    .replace(/\b(ghp|gho|ghu|ghs|github_pat)_[A-Za-z0-9_]{16,}/g, '[redacted-token]')
    .replace(/\bAKIA[0-9A-Z]{16}\b/g, '[redacted-key]')
    .replace(/Bearer\s+[A-Za-z0-9._~+\/=-]{10,}/gi, 'Bearer [redacted]')
    .replace(/((?:api[_-]?key|secret|token|passwd|password|authorization)\s*[:=]\s*)("[^"]*"|'[^']*'|\S+)/gi, '$1[redacted]');
}

function clip(s, n) {
  s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function posix(p) { return String(p || '').split(path.sep).join('/').replace(/\\/g, '/'); }

function rel(p) {
  if (!p) return '';
  try {
    const r = path.relative(ROOT, p);
    if (r && !r.startsWith('..') && !path.isAbsolute(r)) return posix(r);
  } catch (e) { /* fall through */ }
  return posix(p);
}

function safeName(s) { return String(s || 'lead').replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 60) || 'lead'; }
function pad(n) { return String(n).padStart(2, '0'); }
function stamp(d) {
  d = d || new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function sleep(ms) { try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch (e) { /* ignore */ } }

// Cross-process lock using an exclusive lock file. Never blocks for long: after ~1.5s it proceeds anyway.
function withLock(name, fn) {
  const lock = path.join(LEDGER_DIR, '.lock-' + safeName(name));
  let fd = null;
  try { fs.mkdirSync(LEDGER_DIR, { recursive: true }); } catch (e) { /* ignore */ }
  for (let i = 0; i < 60; i++) {
    try { fd = fs.openSync(lock, 'wx'); break; } catch (e) {
      try { if (Date.now() - fs.statSync(lock).mtimeMs > 5000) fs.unlinkSync(lock); } catch (e2) { /* ignore */ }
      sleep(25);
    }
  }
  try { return fn(); } finally {
    if (fd !== null) { try { fs.closeSync(fd); fs.unlinkSync(lock); } catch (e) { /* ignore */ } }
  }
}

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fallback; }
}

function appendJsonl(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, JSON.stringify(obj) + '\n', 'utf8');
}

function readJsonl(file, pred) {
  let text = '';
  try { text = fs.readFileSync(file, 'utf8'); } catch (e) { return []; }
  const out = [];
  for (const line of text.split('\n')) {
    if (!line) continue;
    try { const o = JSON.parse(line); if (!pred || pred(o)) out.push(o); } catch (e) { /* ignore torn line */ }
  }
  return out;
}

function logPath(agent) { return path.join(LOG_DIR, safeName(agent) + '.md'); }

function logHeader(agent) {
  return `# ${agent} - agent log

The full history of what the ${agent} did, plus feedback from other agents about that work. Append-only, oldest at the top, newest at the bottom. Entry formats and rules: "Agent logs" in /CLAUDE.md.

How to read it: find the last \`## ===== Release\` marker and read everything after it. Look for Feedback entries that have no matching Resolution entry.

<!-- entries start below -->
`;
}

// Appends one entry to docs/agent-logs/<agent>.md under a lock. makeBlock(n) returns the entry text.
// Returns the entry number used. Creates the log (with header) if missing and createIfMissing is true.
function appendLogEntry(agent, makeBlock, createIfMissing) {
  const file = logPath(agent);
  return withLock('log-' + agent, () => {
    let text = '';
    try { text = fs.readFileSync(file, 'utf8'); } catch (e) {
      if (!createIfMissing) return null;
      fs.mkdirSync(LOG_DIR, { recursive: true });
      text = logHeader(agent);
      fs.writeFileSync(file, text, 'utf8');
    }
    let max = 0;
    const re = /^### #(\d+)\b/gm;
    let m;
    while ((m = re.exec(text))) max = Math.max(max, parseInt(m[1], 10));
    const n = max + 1;
    const block = makeBlock(n);
    fs.appendFileSync(file, (text.endsWith('\n') ? '' : '\n') + '\n' + block.replace(/\s+$/, '') + '\n', 'utf8');
    return n;
  });
}

function appendMarker(agent, text) {
  const file = logPath(agent);
  return withLock('log-' + agent, () => {
    if (!fs.existsSync(file)) return false;
    fs.appendFileSync(file, '\n## ===== ' + text + ' =====\n', 'utf8');
    return true;
  });
}

// gitignore-style glob -> RegExp, matched against forward-slash paths.
function globToRegExp(glob) {
  let g = String(glob).replace(/\\/g, '/');
  if (!g.includes('/')) g = '**/' + g;
  let re = '';
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*') {
      if (g[i + 1] === '*') {
        if (g[i + 2] === '/') { re += '(?:.*/)?'; i += 2; } else { re += '.*'; i += 1; }
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp('^' + re + '$', 'i');
}

// Patterns starting with "!" are exceptions.
function matchAny(globs, p) {
  let hit = false;
  for (const g of globs || []) {
    if (g.startsWith('!')) { if (globToRegExp(g.slice(1)).test(p)) return false; }
    else if (globToRegExp(g).test(p)) hit = true;
  }
  return hit;
}


// One short, scrubbed description of what a tool call does. Contents are never recorded.
function describeTool(tool, input) {
  input = input || {};
  const file = input.file_path || input.notebook_path || input.path;
  switch (tool) {
    case 'Bash': case 'PowerShell': {
      let c = String(input.command || '');
      if (/log-append\.js/.test(c.split('\n')[0])) c = c.split('\n')[0].split('<<')[0];
      return clip(scrub(c), 300);
    }
    case 'Read': case 'Write': case 'Edit': case 'NotebookEdit': return rel(file ? path.resolve(ROOT, file) : '');
    case 'Grep': return clip(scrub('/' + (input.pattern || '') + '/ in ' + (input.path ? rel(path.resolve(ROOT, input.path)) : '.')), 160);
    case 'Glob': return clip(scrub(input.pattern || ''), 160);
    case 'WebFetch': return clip(scrub(input.url), 200);
    case 'WebSearch': return clip(scrub(input.query), 200);
    default: return '';
  }
}

module.exports = {
  describeTool,
  ROOT, HOME_ROOT, SANDBOX, TASK, AGENTS, LEDGER_DIR, GATES_DIR, LOG_DIR, POLICY_FILE, scrub, clip, posix, rel, safeName, pad, stamp, sleep, withLock,
  readJson, appendJsonl, readJsonl, logPath, logHeader, appendLogEntry, appendMarker, globToRegExp, matchAny,
};
