#!/usr/bin/env node
/*
 * The overseer: a local PreToolUse hook that checks every tool call by every agent (and the lead)
 * against .claude/overseer/policy.json before it runs. No network, no dependencies.
 *
 *   allow  runs silently (inside the policy)
 *   ask    Claude Code shows YOU a prompt with the reason
 *   deny   blocked; the agent is told why and must not retry
 *
 * This is a script, not a model: it is fast, deterministic, and cannot be talked out of a decision.
 * It is also not a sandbox in the operating-system sense. Shell commands can be written in endless ways;
 * the rules catch the common ones, and by default every shell command asks you anyway.
 * The git sandbox (a separate worktree per task) is what keeps the main app safe.
 *
 * Every decision is written to .claude/ledger/overseer.jsonl. Denies and asks are also written, in plain
 * words, to docs/agent-logs/overseer.md, with a follow-up line once you have answered.
 *
 * If this script itself fails, it fails closed: the call is sent to you as an ask.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const lib = require('./lib');

const DRY = !!process.env.OVERSEER_DRY; // selftest: decide, but write no logs
const RANK = { defer: 0, allow: 1, ask: 2, deny: 3 };
const D = (d, rule, reason) => ({ d, rule, reason });
const worst = (a, b) => (!a ? b : !b ? a : RANK[b.d] > RANK[a.d] ? b : a);
const HOME = () => lib.posix(path.resolve(os.homedir()));
const NO_SANDBOX_MSG = 'No task sandbox is active, so agents may not change the main app. Ask the lead to start one with: node .claude/tools/task.js start <name>. Then the work happens in the sandbox folder it prints.';

// ---------- paths ----------
function expand(p) {
  p = String(p || '');
  const h = path.resolve(os.homedir());
  if (p === '~' || p.startsWith('~/') || p.startsWith('~\\')) p = h + p.slice(1);
  p = p.replace(/^\$\{?HOME\}?/, h).replace(/%USERPROFILE%/gi, h);
  if (process.platform === 'win32') {
    const m = p.match(/^\/([a-zA-Z])(\/|$)/);
    if (m) p = m[1].toUpperCase() + ':' + (p.slice(2) || '/');
  }
  return p;
}
function absPath(p, cwd) { return lib.posix(path.resolve(cwd || lib.ROOT, expand(p))); }
const cmpCase = (s) => (process.platform === 'win32' ? s.toLowerCase() : s);
function relInside(ap) {
  const root = lib.posix(lib.ROOT);
  const a = cmpCase(ap), r = cmpCase(root);
  if (a === r) return '';
  if (a.startsWith(r + '/')) return ap.slice(root.length + 1);
  return null;
}
function isUnder(ap, base) {
  const a = cmpCase(ap), b = cmpCase(base);
  return a === b || a.startsWith(b + '/');
}
function ownMemory(ctx, ap) {
  if (ctx.isLead) return false;
  return isUnder(ap, HOME() + '/.claude/agent-memory/' + ctx.agent);
}
const isDevNull = (w) => /^(\/dev\/null|nul|\$null)$/i.test(w);

// ---------- auto mode ----------
// autonomy.level = "auto": agents are never asked. Whatever the rules do not block runs; the rest is blocked with a reason.
// The lead (the user's own session) still gets a question for the few user-gated things (push, publish, kit edits).
const isAuto = (P) => !!(P && P.autonomy && P.autonomy.level === 'auto');
const PENDING_DL = []; // files this decision would download; saved by main() once the command is allowed
const DL_FILE = () => path.join(lib.LEDGER_DIR, 'downloads.json');
const readDownloads = () => (lib.readJson(DL_FILE(), { files: [] }).files || []);
const INTERPRETERS = /^(node|python3?|py|ruby|perl|php|deno|bun|sh|bash|zsh|powershell|pwsh|cmd|cscript|wscript|java|dotnet|npm|npx)(\.exe)?$/i;
const EXEC_EXT = /\.(exe|msi|bat|cmd|ps1|psm1|vbs|vbe|scr|com|dll|lnk|jar|sh|reg|hta|cpl|msc)$/i;

function askRule(ctx, r) {
  const id = 'bash.' + r.id;
  if (isAuto(ctx.policy) && r.auto) {
    if (r.auto === 'allow') return D('allow', id, r.reason);
    if (r.auto === 'deny') return D('deny', id, 'Blocked: ' + r.reason + '.');
    if (r.auto === 'gate') return violation(ctx, id, 'Needs the user (not decided by agents): ' + r.reason + '. Tell the lead what you need and why.');
  }
  return D('ask', id, 'Needs your approval: ' + r.reason + '.');
}

// One URL, for WebFetch and for curl/wget in the shell.
function checkUrl(ctx, raw, shell) {
  const P = ctx.policy, W = P.web || {}, A = P.autonomy || {};
  let u;
  try { u = new URL(String(raw || '')); } catch (e) { return D('ask', 'web-url', 'The URL could not be parsed.'); }
  if (!/^https?:$/.test(u.protocol)) return D('deny', 'web-scheme', 'Only http and https pages may be fetched.');
  if (u.username || u.password) return D('deny', 'web-credentials-in-url', 'Links with a user name or password in them are not allowed.');
  if (String(raw).length > (A.maxUrlLength || 1500)) return D('deny', 'web-long-url', 'The link is very long, which can smuggle data out. Shorten it.');
  // data smuggled out in the query string or path of an otherwise harmless link
  let tail = u.search + u.pathname;
  try { tail = decodeURIComponent(tail); } catch (e) { /* keep the raw text */ }
  if (lib.scrub(tail) !== tail || /[A-Za-z0-9+\/=_-]{48,}/.test(u.search)) return D('deny', 'web-secret-in-url', 'The link carries what looks like a key or an encoded blob in its query string. Nothing is sent out in links.');
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (shell && isAuto(P) && W.allowLoopbackInShell !== false && /^(localhost|127(\.\d+){3}|::1)$/.test(host)) {
    return D('allow', 'web-loopback', 'Reads the project\'s own local server.');
  }
  for (const re of W.denyHosts || []) if (new RegExp(re, 'i').test(host)) return D('deny', 'web-private-host', 'Local and private network addresses may not be fetched (' + host + ').');
  const full = host + u.pathname.toLowerCase();
  for (const d of W.denyDomains || []) {
    const dh = d.split('/')[0].toLowerCase();
    if ((host === dh || host.endsWith('.' + dh)) && (!d.includes('/') || full.startsWith(d.toLowerCase()))) return D('deny', 'web-dropsite', 'Known data-drop or tunnel site (' + host + '): nothing is sent there.');
  }
  if ((W.allowDomains || []).some((d) => host === d || host.endsWith('.' + d))) return D('allow', 'web-allowed-domain', 'Fetch from an approved documentation site.');
  if (isAuto(P) && A.openWeb) return D('allow', 'web-open', 'Public website, read only.');
  return D('ask', 'web-new-domain', 'Fetching from a site not on the approved list (' + host + ').');
}

// curl / wget / iwr / irm. Public GET requests run; anything that sends data out or fetches a program does not.
const NET_TOOLS = /^(curl|wget|iwr|irm|invoke-webrequest|invoke-restmethod|aria2c)(\.exe)?$/i;
function netCommand(ctx, ws, i0) {
  const w = (ws[i0] || '').replace(/^.*[\\/]/, '');
  if (!NET_TOOLS.test(w)) return null;
  if (!isAuto(ctx.policy)) return D('ask', 'bash.network', 'Needs your approval: uses the network or transfers data.');
  const name = w.toLowerCase().replace(/\.exe$/, '');
  const ps = /^(iwr|irm|invoke-webrequest|invoke-restmethod)$/.test(name);
  const wget = name === 'wget' || name === 'aria2c';
  const args = ws.slice(i0 + 1);
  const bad = (m) => D('deny', 'bash.net-upload', 'Blocked: ' + m + '. Only public GET requests may run from the shell.');
  const urls = [], outs = [];
  for (let k = 0; k < args.length; k++) {
    const a = args[k], l = a.toLowerCase(), nx = args[k + 1] || '';
    if (ps) {
      if (l === '-method' && /^(post|put|delete|patch|merge)$/i.test(nx)) return bad('sends data out (' + nx + ')');
      if (['-body', '-infile', '-form', '-inputobject'].includes(l)) return bad('sends data out');
      if (l === '-outfile') outs.push(nx);
      if (l === '-uri' || l === '-url') urls.push(nx);
    } else if (wget) {
      if (/^--(post-data|post-file|body-data|body-file|upload-file)/i.test(a) || (/^--method=(post|put|delete|patch)/i.test(a))) return bad('sends data out');
      if (l === '--method' && /^(post|put|delete|patch)$/i.test(nx)) return bad('sends data out (' + nx + ')');
      if (a === '-O' || l === '--output-document') outs.push(nx);
      if (/^--output-document=/i.test(a)) outs.push(a.split('=')[1]);
    } else {
      if (/^--(data|data-\w+|form|form-string|upload-file|json)(=|$)/.test(a)) return bad('sends data out');
      if (/^-[A-Za-z]+$/.test(a) && /[dFT]/.test(a.slice(1))) return bad('sends data out');
      if ((a === '-X' || l === '--request') && /^(post|put|delete|patch)$/i.test(nx)) return bad('sends data out (' + nx + ')');
      if (/^-X(POST|PUT|DELETE|PATCH)$/i.test(a) || /^--request=(post|put|delete|patch)/i.test(a)) return bad('sends data out');
      if (a === '-o' || l === '--output') outs.push(nx);
      if (/^--output=/i.test(a)) outs.push(a.split('=')[1]);
      if (l === '--url') urls.push(nx);
    }
    if (/^https?:\/\//i.test(a)) urls.push(a);
    else if (/^[a-z][a-z0-9+.-]*:\/\//i.test(a)) return D('deny', 'web-scheme', 'Only http and https pages may be fetched.');
  }
  let res = D('allow', 'bash.web-get', 'Public GET request.');
  for (const u of urls) {
    const r = checkUrl(ctx, u, true);
    if (r.d === 'deny' || r.d === 'ask') return r;
  }
  // output files: a program may not be fetched, and anything fetched may not be run later
  const keepName = args.some((a) => a === '-O' || /^-[A-Za-z]*O[A-Za-z]*$/.test(a)) && !wget; // curl -O keeps the remote name
  const names = outs.filter(Boolean).slice();
  if (keepName || (wget && !outs.length)) for (const u of urls) { try { names.push(path.basename(new URL(u).pathname) || 'index.html'); } catch (e) { /* ignore */ } }
  for (const n of names) {
    if (EXEC_EXT.test(n)) return D('deny', 'bash.download-program', 'Blocked: downloads a program or script file (' + n + '). Agents may not fetch things to run.');
    if (!INERT_EXT.test(n)) PENDING_DL.push(n);
  }
  return res;
}
const INERT_EXT = /\.(json|md|txt|csv|tsv|xml|ya?ml|html?|css|svg|png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|mp3|ogg|wav|flac|mp4|webm|pdf|map|wasm|glsl|atlas|tmx|tsx|log)$/i;
const WRAP_RE = /^\s*(?:cmd(?:\.exe)?\s+\/[ck]|(?:powershell|pwsh)(?:\.exe)?\s+(?:-\w+\s+)*-c(?:ommand)?|(?:ba|z)?sh\s+-c)\s+([\s\S]+)$/i;

// Running a file that came from the internet is the user's decision.
function runsDownloaded(ctx, seg, ws, i0, input, extra) {
  const known = readDownloads().concat(extra || []);
  if (!known.length) return null;
  const keys = new Set(known.map((f) => cmpCase(lib.posix(f)).replace(/^.*\//, '')));
  const first = (ws[i0] || '').replace(/^.*[\\/]/, '');
  const interp = INTERPRETERS.test(first);
  const hit = ws.slice(i0).find((w, idx) => (idx === 0 ? !interp : interp) && keys.has(cmpCase(lib.posix(w)).replace(/^.*\//, '')));
  if (!hit) return null;
  return violation(ctx, 'bash.runs-downloaded', 'Blocked: "' + hit + '" came from the internet. Read it if you must, but running it is the user\'s decision.');
}

// A rule violation is a hard block for subagents and a question for the lead (who answers to you).
const violation = (ctx, rule, reason) => D(ctx.isLead ? 'ask' : 'deny', rule, reason);
const needSandbox = (ctx) => ctx.requireSandbox && !lib.SANDBOX;

// ---------- file checks ----------
function checkWrite(ctx, ap) {
  const P = ctx.policy;
  if (lib.matchAny(P.secrets, ap)) return D('deny', 'secrets', 'This is a protected secrets file. Agents may not read or change it.');
  if (ownMemory(ctx, ap)) return D('allow', 'own-memory', 'Writes the agent\'s own experience file.');
  if (needSandbox(ctx)) return violation(ctx, 'no-sandbox', ctx.isLead ? 'The lead is editing the main app directly (no task sandbox is active).' : NO_SANDBOX_MSG);
  const r = relInside(ap);
  if (r === null) return violation(ctx, 'outside-project', 'Writing outside the ' + (lib.SANDBOX ? 'task sandbox' : 'project folder') + ' (' + ap + ') is not allowed.');
  if (lib.matchAny(P.logsOnlyViaTool, r)) {
    return violation(ctx, 'logs-via-tool', 'Agent logs are append-only and may only be written with: node .claude/tools/log-append.js --agent <log> --kind <action|feedback|resolution> --from <you> --title "..." <<\'EOF\' (entry text) EOF');
  }
  if (lib.matchAny(P.protectedWrite, r)) {
    return violation(ctx, 'protected-path', '"' + r + '" is protected (overseer, hooks, agents, settings, ledger, CLAUDE.md). Only the user changes these.');
  }
  const role = P.roles[ctx.isLead ? 'lead' : ctx.agent] || P.roles._default || { write: ['**'] };
  if (!lib.matchAny(role.write || [], r)) {
    return D('deny', 'role-scope', 'The ' + ctx.agent + ' role may not edit "' + r + '". Hand this to the agent whose job it is (developer for code, game-designer for specs, tester for tests) via the lead.');
  }
  if (P.profile === 'strict') return D('ask', 'strict-profile', 'Strict profile: every edit asks first.');
  return D('allow', 'in-scope', 'Edit inside this role\'s allowed area.');
}

function checkRead(ctx, ap) {
  const P = ctx.policy;
  if (lib.matchAny(P.secrets, ap)) return D('deny', 'secrets', 'This is a protected secrets file. Agents may not read it.');
  if (relInside(ap) !== null) return D('allow', 'read-in-project', 'Read inside the project.');
  if (isUnder(ap, HOME() + '/.claude/agent-memory')) return D('allow', 'read-memory', 'Reads agent experience files.');
  return D('ask', 'read-outside-project', 'Reading outside the ' + (lib.SANDBOX ? 'task sandbox' : 'project folder') + ' (' + ap + ').');
}

// ---------- shell commands ----------
function splitCommand(cmd) {
  const segs = [];
  let cur = '', q = null, subst = false, heredoc = false;
  const push = () => { if (cur.trim()) segs.push(cur.trim()); cur = ''; };
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i], n = cmd[i + 1];
    if (q === "'") { cur += c; if (c === "'") q = null; continue; }
    if (q === '"') { if (c === '`' || (c === '$' && n === '(')) subst = true; cur += c; if (c === '"') q = null; continue; }
    if (c === "'" || c === '"') { q = c; cur += c; continue; }
    if (c === '`' || (c === '$' && n === '(') || ((c === '<' || c === '>') && n === '(')) subst = true;
    if (c === '<' && n === '<') heredoc = true;
    if (c === ';' || c === '\n' || c === '|' || c === '&') {
      if (c === '&' && (cur.endsWith('>') || cur.endsWith('<'))) { cur += c; continue; } // 2>&1
      push();
      continue;
    }
    cur += c;
  }
  push();
  return { segs, subst, heredoc, unbalanced: q !== null };
}

function words(seg) {
  const out = [];
  let cur = '', q = null, has = false;
  for (const c of seg) {
    if (q) { if (c === q) q = null; else cur += c; continue; }
    if (c === '"' || c === "'") { q = c; has = true; continue; }
    if (/\s/.test(c)) { if (cur || has) out.push(cur); cur = ''; has = false; continue; }
    cur += c;
  }
  if (cur || has) out.push(cur);
  return out;
}

const REDIR = /(?:^|[^<>&\d])\d*>>?\s*(?!&)("[^"]*"|'[^']*'|[^\s;&|<>]+)/g;

function checkLogAppend(ctx, cmd) {
  const lines = cmd.replace(/\r/g, '').split('\n');
  const first = lines[0];
  const m = first.match(/<<-?\s*(['"]?)([A-Za-z_][\w-]*)\1\s*$/);
  const who = ctx.isLead ? 'lead' : ctx.agent;
  const usage = 'Use exactly: node .claude/tools/log-append.js --agent <log> --kind <action|feedback|resolution|verdict> --from ' + who + ' --title "..." followed by a heredoc (<<\'EOF\' ... EOF) holding the entry text.';
  let head = first;
  if (m) {
    head = first.slice(0, m.index);
    const rest = lines.slice(1);
    let end = rest.length - 1;
    while (end >= 0 && rest[end].trim() === '') end--;
    if (end < 0 || rest[end].trim() !== m[2]) return D('deny', 'log-append-form', 'The heredoc must end with ' + m[2] + ' on its own line, with nothing after it. ' + usage);
  } else if (lines.slice(1).some((l) => l.trim() !== '')) {
    return D('deny', 'log-append-form', 'Nothing may follow the log-append command. ' + usage);
  }
  const sp = splitCommand(head);
  if (sp.segs.length !== 1 || sp.subst || sp.unbalanced) return D('deny', 'log-append-form', 'log-append must be the only command, with no substitutions. ' + usage);
  const w = words(sp.segs[0]);
  const f = {};
  for (let i = 0; i < w.length; i++) if (w[i].startsWith('--')) f[w[i].slice(2)] = w[i + 1] === undefined || w[i + 1].startsWith('--') ? '' : w[++i];
  if (f.from !== who) return D('deny', 'log-forged-author', '--from must be "' + who + '" (the agent actually running this). Forging another author is not allowed.');
  if (!lib.AGENTS.includes(f.agent)) return D('deny', 'log-form', '--agent must be one of: ' + lib.AGENTS.join(', ') + '. ' + usage);
  if (f.kind === 'marker') {
    if (!ctx.isLead) return D('deny', 'log-marker', 'Only the lead writes release markers.');
  } else if (f.kind === 'action' || f.kind === 'resolution') {
    if (f.agent !== who) return D('deny', 'log-own-log', 'Action and resolution entries go in your own log (--agent ' + who + ').');
  } else if (f.kind === 'feedback') {
    if (f.agent === who) return D('deny', 'log-own-feedback', 'Feedback goes into someone else\'s log. Use an action entry for your own.');
  } else if (f.kind === 'verdict') {
    const V = (ctx.policy.gates && ctx.policy.gates.verdicts) || {};
    if (ctx.isLead || !V[who]) return D('deny', 'verdict-role', 'The ' + who + ' role does not give gate verdicts. Only: ' + Object.keys(V).join(', ') + '.');
    if (!V[who].includes(f.verdict)) return D('deny', 'verdict-value', 'The ' + who + ' may record only: ' + V[who].join(', ') + '.');
    if (f.agent !== who) return D('deny', 'log-own-log', 'Verdicts go in your own log (--agent ' + who + ').');
    if (!/^[0-9a-f]{7,40}$/i.test(f.commit || '')) return D('deny', 'verdict-commit', 'A verdict needs --commit <sha> of the exact commit you checked (git rev-parse HEAD). Verdicts on any later commit are void.');
    if (needSandbox(ctx)) return D('deny', 'no-sandbox', 'Verdicts only count inside a task sandbox. ' + NO_SANDBOX_MSG);
  } else return D('deny', 'log-form', '--kind must be action, feedback, resolution, verdict, or marker. ' + usage);
  return D('allow', 'log-append', 'Writes a log entry through the sanctioned tool.');
}

function checkBash(ctx, input) {
  const P = ctx.policy, B = P.bash;
  const cmd = String(input.command || '');
  const role = P.roles[ctx.isLead ? 'lead' : ctx.agent] || P.roles._default || {};
  const firstLine = cmd.replace(/\r/g, '').split('\n')[0];
  const isLogAppend = /^\s*node\s+["']?(?:\.\/)?\.claude[\/\\]tools[\/\\]log-append\.js["']?(\s|$)/.test(firstLine);
  if (isLogAppend) return checkLogAppend(ctx, cmd);
  if (!ctx.isLead && needSandbox(ctx)) return D('deny', 'no-sandbox', NO_SANDBOX_MSG);
  if (role.bash === 'log-append-only') {
    return D('deny', 'role-bash', 'The ' + ctx.agent + ' role may only run the log tool in a shell. Ask the lead to run anything else.');
  }
  for (const r of B.denyWhole || []) if (new RegExp(r.re, 'i').test(cmd)) return D('deny', 'bash.' + r.id, 'Blocked: ' + r.reason + '.');

  const sp = splitCommand(cmd);
  let result = null;
  if (sp.unbalanced) result = worst(result, D('ask', 'bash.unbalanced-quotes', 'The command has unbalanced quotes, so it cannot be checked.'));
  // auto mode: substitutions and heredocs are common (git commit -m "$(cat <<EOF ...)", PowerShell $(...)). Their text is still
  // scanned by every rule below, so they run; in supervised mode they ask.
  if (sp.subst) result = worst(result, D(isAuto(P) ? 'allow' : 'ask', 'bash.substitution', 'The command uses substitution or subshells; its text was scanned but its result cannot be predicted.'));
  if (sp.heredoc) result = worst(result, D(isAuto(P) ? 'allow' : 'ask', 'bash.heredoc', 'The command embeds a heredoc; its text was scanned.'));
  if (!sp.segs.length) return D('defer', 'empty', 'Empty command.');

  for (const seg of sp.segs) {
    let segRes = null;
    // network commands, files from the internet, and the same inside cmd /c, powershell -command, bash -c
    {
      const ws0 = words(seg);
      let j0 = 0;
      while (j0 < ws0.length && /^[A-Za-z_]\w*=/.test(ws0[j0])) j0++;
      const net = netCommand(ctx, ws0, j0);
      if (net) segRes = worst(segRes, net);
      const dl = runsDownloaded(ctx, seg, ws0, j0, input, PENDING_DL);
      if (dl) segRes = worst(segRes, dl);
      const wrap = seg.match(WRAP_RE);
      if (wrap) {
        for (const s2 of splitCommand(wrap[1].trim().replace(/^["']|["']$/g, '')).segs) {
          const w2 = words(s2);
          let k = 0;
          while (k < w2.length && /^[A-Za-z_]\w*=/.test(w2[k])) k++;
          const n2 = netCommand(ctx, w2, k);
          if (n2) segRes = worst(segRes, n2);
          const d2 = runsDownloaded(ctx, s2, w2, k, input, PENDING_DL);
          if (d2) segRes = worst(segRes, d2);
        }
      }
    }
    for (const r of B.deny || []) if (new RegExp(r.re, 'i').test(seg)) segRes = worst(segRes, D('deny', 'bash.' + r.id, 'Blocked: ' + r.reason + '.'));
    for (const r of B.sandboxRules || []) if (new RegExp(r.re, 'i').test(seg)) segRes = worst(segRes, violation(ctx, 'bash.' + r.id, 'Blocked: ' + r.reason + '.'));
    for (const r of B.ask || []) if (new RegExp(r.re, 'i').test(seg)) segRes = worst(segRes, askRule(ctx, r));
    let allowRule = null;
    for (const r of B.allow || []) {
      if (r.agents && !r.agents.includes(ctx.isLead ? 'lead' : ctx.agent)) continue;
      if (new RegExp(r.re, 'i').test(seg)) { allowRule = r; break; }
    }
    const readonly = !!(allowRule && allowRule.readonly);
    const exempt = !!(allowRule && allowRule.exempt);

    // mentions of protected files anywhere in a command that can change things (inline code, sed -i, tee ...)
    if (!readonly && !exempt && B.protectedMentions && new RegExp(B.protectedMentions, 'i').test(seg)) {
      segRes = worst(segRes, violation(ctx, 'bash.mentions-protected', 'The command mentions protected files (overseer, hooks, agents, settings, logs or CLAUDE.md). Logs are written only with the log tool; the rest is changed only by the user.'));
    }

    // redirections are writes
    const targets = [];
    let m;
    REDIR.lastIndex = 0;
    while ((m = REDIR.exec(seg))) targets.push(m[1].replace(/^["']|["']$/g, ''));
    for (const t of targets) {
      if (isDevNull(t)) continue;
      segRes = worst(segRes, checkWrite(ctx, absPath(t, input.cwd)));
    }

    // paths mentioned as arguments
    const ws = words(seg.replace(REDIR, ' '));
    let i0 = 0;
    while (i0 < ws.length && /^[A-Za-z_]\w*=/.test(ws[i0])) i0++;
    for (let i = i0 + 1; i < ws.length; i++) {
      let w = ws[i];
      if (w.startsWith('-')) { const eq = w.indexOf('='); if (eq < 0) continue; w = w.slice(eq + 1); }
      if (!w || /^[a-z][a-z0-9+.-]*:\/\//i.test(w) || isDevNull(w)) continue;
      if (!(/[\/\\]/.test(w) || /^[A-Za-z]:/.test(w) || /^[~.$%]/.test(w) || /\.[A-Za-z0-9]{1,6}$/.test(w))) continue;
      const ap = absPath(w, input.cwd);
      if (lib.matchAny(P.secrets, ap)) { segRes = worst(segRes, D('deny', 'secrets', 'The command touches a protected secrets file (' + w + ').')); continue; }
      const r = relInside(ap);
      if (r === null) {
        if (!(readonly && isUnder(ap, HOME() + '/.claude/agent-memory')) && !ownMemory(ctx, ap)) {
          segRes = worst(segRes, D('ask', 'bash.outside-project', 'The command touches a path outside the ' + (lib.SANDBOX ? 'task sandbox' : 'project') + ' (' + w + ').'));
        }
      } else if (!readonly && !exempt && (lib.matchAny(P.protectedWrite, r) || lib.matchAny(P.logsOnlyViaTool, r))) {
        segRes = worst(segRes, violation(ctx, 'bash.protected-path', 'The command touches a protected path (' + r + '). Logs are written only with the log tool; overseer, hooks, agents and settings are changed only by the user.'));
      }
    }

    if (role.bash === 'read-only' && !(allowRule && (allowRule.readonly || allowRule.id === 'team-tools'))) {
      segRes = worst(segRes, D('deny', 'role-bash', 'The ' + ctx.agent + ' role may only run read-only commands (ls, cat, grep, git status/diff/log/show) and the log tool. Ask the lead to run anything else.'));
    }
    if (!segRes || segRes.d === 'allow') {
      if (allowRule) segRes = worst(segRes, D('allow', 'bash.' + allowRule.id, 'Routine command.'));
      else segRes = worst(segRes, D(isAuto(P) ? (B.autoDefault || 'allow') : (B.default || 'ask'), 'bash.unlisted', isAuto(P) ? 'Auto mode: nothing in the policy blocks this command.' : 'This command is not on the allow list.'));
    }
    result = worst(result, segRes);
  }
  if (B.askEveryCommand && !isAuto(P) && result.d === 'allow') {
    result = D('ask', result.rule, 'Every shell command asks you first (policy: askEveryCommand).');
  }
  return result;
}

// ---------- other tools ----------
function checkWeb(ctx, tool, input) {
  const W = ctx.policy.web || {};
  if (tool === 'WebSearch') {
    if (isAuto(ctx.policy) && (ctx.policy.autonomy || {}).openWeb) return D('allow', 'web-search', 'Web search (auto mode).');
    return (W.searchAgents || []).includes(ctx.isLead ? 'lead' : ctx.agent)
      ? D('allow', 'web-search', 'Web search by a research role.')
      : D('ask', 'web-search', 'Web search by a role that does not normally need it.');
  }
  return checkUrl(ctx, input.url, false);
}

function decide(ctx, tool, input) {
  const P = ctx.policy;
  switch (tool) {
    case 'Read': case 'NotebookRead':
      return checkRead(ctx, absPath(input.file_path || input.notebook_path || '', input.cwd));
    case 'Grep': case 'Glob':
      return input.path ? checkRead(ctx, absPath(input.path, input.cwd)) : D('allow', 'search-in-project', 'Search inside the project.');
    case 'Write': case 'Edit': case 'MultiEdit': case 'NotebookEdit':
      return checkWrite(ctx, absPath(input.file_path || input.notebook_path || '', input.cwd));
    case 'Bash': case 'PowerShell':
      return checkBash(ctx, input);
    case 'WebFetch': case 'WebSearch':
      return checkWeb(ctx, tool, input);
    case 'Agent': case 'Task': {
      const st = input.subagent_type;
      if (!st || lib.AGENTS.includes(st) || ['Explore', 'Plan', 'general-purpose'].includes(st)) return D(P.tools.agentSpawn || 'allow', 'spawn', 'Dispatches a team or built-in agent.');
      return D('ask', 'spawn-unknown', 'Dispatches an agent that is not part of the team (' + st + ').');
    }
    default:
      if ((P.tools.allow || []).includes(tool)) return D('allow', 'tool-allowed', 'Harmless tool.');
      if (/^mcp__/.test(tool)) return D(P.tools.mcp || 'ask', 'mcp', 'Uses an external connected tool (' + tool + ').');
      return D(P.tools.unknown || 'ask', 'unknown-tool', 'A tool the policy does not list (' + tool + ').');
  }
}

// ---------- logging ----------
const STATE = path.join(lib.LEDGER_DIR, '.overseer-state.json');
const readState = () => lib.readJson(STATE, { pending: {}, recent: {} });
const writeState = (s) => { try { fs.mkdirSync(lib.LEDGER_DIR, { recursive: true }); fs.writeFileSync(STATE, JSON.stringify(s), 'utf8'); } catch (e) { /* ignore */ } };

function logDecision(ctx, input, dec, mode) {
  let reps = 0;
  const detail = lib.describeTool(input.tool_name, input.tool_input);
  const row = {
    ts: new Date().toISOString(), event: 'decision', decision: dec.d, rule: dec.rule, agent: ctx.agent,
    agent_id: input.agent_id || null, tool: input.tool_name, detail, reason: lib.clip(dec.reason, 300),
    tool_use_id: input.tool_use_id || null, mode, task: lib.TASK || null,
  };
  lib.appendJsonl(path.join(lib.LEDGER_DIR, 'overseer.jsonl'), row);
  if (dec.d !== 'deny' && dec.d !== 'ask') return 0;

  lib.withLock('overseer-state', () => {
    const st = readState();
    const now = Date.now();
    // sweep asks nobody answered
    for (const k of Object.keys(st.pending)) {
      const p = st.pending[k];
      if (now - p.t > 15 * 60 * 1000) {
        lib.appendLogEntry('overseer', (n) => `### #${n} - Outcome of #${p.n} - ${lib.stamp()} - not run\n**What happened:** no sign that ${p.agent} ran \`${p.detail}\` after the question (declined, or abandoned).`, true);
        lib.appendJsonl(path.join(lib.LEDGER_DIR, 'overseer.jsonl'), { ts: new Date().toISOString(), event: 'ask-not-run', agent: p.agent, tool_use_id: k });
        delete st.pending[k];
      }
    }
    // collapse a retry storm into one log entry
    const key = [ctx.agent, input.tool_name, detail, dec.rule].join('|');
    const repeat = dec.d === 'deny' && st.recent[key] && now - st.recent[key] < 60000;
    st.recent[key] = now;
    if (dec.d === 'deny') {
      st.counts = st.counts || {};
      const c = st.counts[key] && now - st.counts[key].t < 600000 ? st.counts[key].n + 1 : 1;
      st.counts[key] = { n: c, t: now };
      for (const k of Object.keys(st.counts)) if (now - st.counts[k].t > 600000) delete st.counts[k];
      reps = c;
    }
    for (const k of Object.keys(st.recent)) if (now - st.recent[k] > 120000) delete st.recent[k];
    if (!repeat) {
      const n = lib.appendLogEntry('overseer', (num) => [
        `### #${num} - Decision - ${lib.stamp()} - ${dec.d === 'deny' ? 'BLOCKED' : 'ASKED YOU'}: ${ctx.agent} ${input.tool_name}`,
        `**Agent:** ${ctx.agent}${input.agent_id ? ' (' + input.agent_id + ')' : ''}${lib.TASK ? ', task ' + lib.TASK : ''}`,
        `**Action:** \`${detail || input.tool_name}\``,
        `**Rule:** ${dec.rule}`,
        `**Why:** ${dec.reason}`,
        `**Result:** ${dec.d === 'deny' ? 'Blocked. The agent was told why and told not to retry.' : 'Waiting for your answer. The outcome is recorded below once known.'}${mode === 'audit' ? ' (audit mode: not enforced)' : ''}`,
      ].join('\n'), true);
      if (dec.d === 'ask' && input.tool_use_id) st.pending[input.tool_use_id] = { n, agent: ctx.agent, tool: input.tool_name, detail, t: now };
    }
    writeState(st);
  });
  return reps;
}

// ---------- main ----------
function emit(dec, ctx) {
  const tag = '[Overseer ' + dec.rule + '] ';
  if (dec.d === 'deny') {
    fs.writeSync(2, tag + dec.reason + '\nThis is final: do not retry it in another form or work around it. Tell the lead what you were trying to do and why, and propose an alternative within your role. The user decides what changes.\n');
    process.exit(2);
  }
  if (dec.d === 'ask' || dec.d === 'allow') {
    const who = ctx.isLead ? 'lead' : ctx.agent;
    fs.writeSync(1, JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: dec.d, permissionDecisionReason: dec.d === 'ask' ? '[Overseer] ' + who + ': ' + dec.reason : tag.trim() + ' ' + dec.reason } }));
  }
  process.exit(0);
}

function main() {
  const raw = fs.readFileSync(0, 'utf8');
  if (!raw.trim()) process.exit(0);
  const input = JSON.parse(raw);
  const policy = lib.readJson(lib.POLICY_FILE, null);
  const ctx = { agent: lib.safeName(input.agent_type || 'lead'), isLead: !input.agent_type, policy, requireSandbox: !policy || !policy.sandbox || policy.sandbox.required !== false };
  if (!policy || !policy.bash || !policy.roles) {
    return emit(D('ask', 'policy-missing', 'The overseer policy file is missing or unreadable, so this action cannot be checked.'), ctx);
  }
  // the self-test can try both modes
  if (DRY && process.env.OVERSEER_LEVEL) {
    policy.autonomy = Object.assign({}, policy.autonomy, { level: process.env.OVERSEER_LEVEL });
    if (process.env.OVERSEER_LEVEL === 'supervised') policy.bash.askEveryCommand = true; // supervised = the old behaviour
  }
  const tool = input.tool_name;
  const ti = Object.assign({ cwd: input.cwd }, input.tool_input || {});
  let dec = decide(ctx, tool, ti);
  if (dec.d === 'ask' && policy.askAs === 'deny') {
    dec = D('deny', dec.rule, dec.reason + ' This needs the user\'s approval: tell the lead what you need and why, and the lead will ask.');
  }
  // auto mode: agents are never asked. A question becomes a block with a reason; the lead (the user's own session) is still asked.
  if (dec.d === 'ask' && isAuto(policy) && !ctx.isLead && (policy.autonomy.agentAsk || 'deny') === 'deny') {
    dec = D('deny', dec.rule, dec.reason + ' Auto mode: agents are never asked. If this is really needed, tell the lead what you need and why; the lead decides with the user.');
  }
  // never silently approve edits or commands while in plan mode
  if (input.permission_mode === 'plan' && dec.d === 'allow' && !/^(Read|Grep|Glob|WebFetch|WebSearch)$/.test(tool)) dec = D('defer', dec.rule, dec.reason);
  const enforced = policy.mode !== 'audit';
  let reps = 0;
  if (!DRY) { try { reps = logDecision(ctx, input, dec, enforced ? 'enforce' : 'audit') || 0; } catch (e) { /* logging must never change the decision */ } }
  const limit = (policy.autonomy && policy.autonomy.repeatBlockLimit) || 3;
  if (dec.d === 'deny' && reps >= limit) {
    dec = D('deny', dec.rule, dec.reason + ' STOP: this exact action has now been blocked ' + reps + ' times in the last 10 minutes. Do not try again. End your turn and report to the lead what you need and why.');
  }
  // remember files fetched from the internet, so nobody runs them later without the user
  if (!DRY && enforced && dec.d !== 'deny' && PENDING_DL.length) {
    try {
      lib.withLock('downloads', () => {
        const cur = lib.readJson(DL_FILE(), { files: [] });
        cur.files = Array.from(new Set((cur.files || []).concat(PENDING_DL))).slice(-500);
        fs.mkdirSync(lib.LEDGER_DIR, { recursive: true });
        fs.writeFileSync(DL_FILE(), JSON.stringify(cur), 'utf8');
      });
    } catch (e) { /* ignore */ }
  }
  if (!enforced) process.exit(0);
  emit(dec, ctx);
}

try { main(); } catch (e) {
  try { fs.mkdirSync(lib.LEDGER_DIR, { recursive: true }); fs.appendFileSync(path.join(lib.LEDGER_DIR, '_hook-errors.txt'), new Date().toISOString() + ' overseer: ' + (e && e.stack || e) + '\n'); } catch (e2) { /* ignore */ }
  try {
    fs.writeSync(1, JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: '[Overseer] The overseer hit an internal error and could not check this action. Approve only if you recognise it.' } }));
  } catch (e3) { process.exit(2); }
  process.exit(0);
}
