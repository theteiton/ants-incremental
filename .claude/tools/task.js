#!/usr/bin/env node
/*
 * Task sandboxes: every piece of agent work happens on its own git branch in its own folder (a git worktree),
 * so the main app is never touched until YOU merge. Local only, no dependencies except git.
 *
 *   node .claude/tools/task.js start <name>     create branch team/<name> and the sandbox folder (run in the main project)
 *   node .claude/tools/task.js status [name]    list tasks, their commits, and which gates are green
 *   node .claude/tools/task.js finish <name>    YOU run this in a terminal: checks every gate, shows the diff, asks you to
 *                                               type the task name, then merges into your branch. Never pushes.
 *   node .claude/tools/task.js close <name>     remove a merged sandbox
 *   node .claude/tools/task.js abandon <name>   throw a sandbox away without merging (asks you to confirm)
 *
 * finish, close and abandon refuse to run unless a human is at a terminal, so no agent can merge.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const readline = require('readline');
const lib = require(path.join(__dirname, '..', 'hooks', 'lib.js'));

const MAIN = lib.HOME_ROOT;
const REGISTRY = path.join(lib.LEDGER_DIR, 'tasks.json');
const KIT_FILES = ['CLAUDE.md', '.claude/settings.json', '.claude/hooks/overseer.js', '.claude/hooks/ledger.js', '.claude/hooks/lib.js', '.claude/overseer/policy.json', '.claude/tools/log-append.js', '.claude/tools/task.js'];

const die = (m) => { console.error('task: ' + m); process.exit(1); };
function git(args, cwd) {
  const r = cp.spawnSync('git', args, { cwd: cwd || MAIN, encoding: 'utf8' });
  if (r.error) die('git could not be run (' + r.error.message + '). Is git installed and on your PATH?');
  return { ok: r.status === 0, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
}
const norm = (p) => path.resolve(p).replace(/\\/g, '/').toLowerCase();
const readReg = () => lib.readJson(REGISTRY, { tasks: {} });
function writeReg(r) { fs.mkdirSync(path.dirname(REGISTRY), { recursive: true }); fs.writeFileSync(REGISTRY, JSON.stringify(r, null, 2), 'utf8'); }
const needHuman = () => { if (!(process.stdin.isTTY && process.stdout.isTTY)) die('this command must be run by you, in a terminal. Agents cannot run it.'); };
const notInSandbox = () => { if (lib.SANDBOX) die('run this in your main project folder (' + MAIN + '), not inside a sandbox.'); };
function ask(q) {
  return new Promise((res) => { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); rl.question(q, (a) => { rl.close(); res(a.trim()); }); });
}
function policy() { return lib.readJson(lib.POLICY_FILE, {}); }

function gateTable(name, tip) {
  const need = (policy().gates || {}).required || {};
  const rows = lib.readJsonl(path.join(lib.GATES_DIR, name + '.jsonl'));
  const out = [];
  for (const role of Object.keys(need)) {
    const mine = rows.filter((r) => r.role === role);
    const last = mine[mine.length - 1];
    let ok = false, note;
    if (!last) note = 'no verdict recorded';
    else if (!need[role].includes(last.verdict)) note = 'latest verdict is "' + last.verdict + '"';
    else if (!tip.startsWith(last.commit.toLowerCase()) && !last.commit.toLowerCase().startsWith(tip.slice(0, last.commit.length))) note = 'verdict "' + last.verdict + '" was for commit ' + last.commit.slice(0, 7) + ', but the task is now at ' + tip.slice(0, 7) + ' (stale)';
    else { ok = true; note = last.verdict + ' at ' + last.commit.slice(0, 7); }
    out.push({ role, ok, note });
  }
  return out;
}

function start(name, flags) {
  if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(name || '')) die('give the task a short lowercase name, for example: node .claude/tools/task.js start save-export');
  notInSandbox();
  const top = git(['rev-parse', '--show-toplevel']);
  if (!top.ok) die('this folder is not a git repository. Run these once, then try again:\n  git init\n  git add -A\n  git commit -m "First commit"');
  if (norm(top.out) !== norm(MAIN)) die('the git repository root is ' + top.out + ', but the team kit is installed in ' + MAIN + '. Install the kit in the repository root.');
  const base = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  if (!base.ok || base.out === 'HEAD') die('git has no current branch (detached or no commits yet). Make a first commit on a branch, then try again.');
  const missing = KIT_FILES.filter((f) => !git(['ls-files', '--error-unmatch', f]).ok);
  if (missing.length) die('the team kit must be committed before sandboxes can carry it. Not tracked by git: ' + missing.join(', ') + '\nRun:\n  git add .claude CLAUDE.md .gitignore\n  git commit -m "Add game dev team kit"');
  const dirty = git(['status', '--porcelain', '--untracked-files=no']).out;
  if (dirty && !flags['allow-dirty']) die('the main project has uncommitted changes, and a sandbox only carries committed work:\n' + dirty + '\nCommit or stash them, or pass --allow-dirty to start from the last commit anyway.');
  const branch = 'team/' + name;
  if (git(['rev-parse', '--verify', '--quiet', branch]).ok) die('branch ' + branch + ' already exists. Choose another name or close the old task.');
  const sandboxRoot = path.join(path.dirname(MAIN), path.basename(MAIN) + '.sandbox');
  const dir = path.join(sandboxRoot, name);
  if (fs.existsSync(dir)) die('folder already exists: ' + dir);

  const baseCommit = git(['rev-parse', 'HEAD']).out;
  const add = git(['worktree', 'add', '-b', branch, dir, 'HEAD']);
  if (!add.ok) die('git could not create the sandbox: ' + add.err);

  const undo = (why) => { git(['worktree', 'remove', '--force', dir]); git(['branch', '-D', branch]); die(why); };
  if (!fs.existsSync(path.join(dir, '.claude', 'hooks', 'overseer.js'))) undo('the sandbox does not contain the overseer hook, so it would be unsupervised. It was removed.');

  fs.writeFileSync(path.join(dir, '.claude', 'team-home.json'), JSON.stringify({ home: MAIN, task: name, branch, base: base.out, baseCommit, created: new Date().toISOString() }, null, 2), 'utf8');
  if (!git(['check-ignore', '-q', '.claude/team-home.json'], dir).ok) {
    const ex = git(['rev-parse', '--git-path', 'info/exclude'], dir).out;
    const exFile = path.isAbsolute(ex) ? ex : path.join(dir, ex);
    fs.mkdirSync(path.dirname(exFile), { recursive: true });
    fs.appendFileSync(exFile, '\n.claude/team-home.json\n');
  }

  // Agents read their logs through this link; the logs themselves stay in the main project.
  const logsReal = path.join(MAIN, 'docs', 'agent-logs');
  fs.mkdirSync(logsReal, { recursive: true });
  const link = path.join(dir, 'docs', 'agent-logs');
  if (git(['ls-files', 'docs/agent-logs'], dir).out) undo('docs/agent-logs is tracked by git, so a sandbox would copy the logs. Run: git rm -r --cached docs/agent-logs, add "docs/agent-logs" to .gitignore, commit, and try again. The sandbox was removed.');
  try {
    if (fs.existsSync(link)) fs.rmSync(link, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(link), { recursive: true });
    fs.symlinkSync(logsReal, link, 'junction');
  } catch (e) { undo('could not link the logs folder into the sandbox (' + e.message + '). The sandbox was removed.'); }

  const reg = readReg();
  reg.tasks[name] = { name, branch, base: base.out, baseCommit, path: dir, created: new Date().toISOString(), status: 'open' };
  writeReg(reg);
  lib.appendLogEntry('overseer', (n) => `### #${n} - Task started - ${lib.stamp()} - ${name}\n**Branch:** ${branch} (from ${base.out} at ${baseCommit.slice(0, 7)})\n**Sandbox:** \`${dir}\``, true);

  console.log('Sandbox ready for task "' + name + '"');
  console.log('  Folder : ' + dir);
  console.log('  Branch : ' + branch + ' (from ' + base.out + ')');
  console.log('\nNext: open a Claude Code session IN that folder and run the team there. Your main project stays untouched.');
  console.log('  PowerShell:  cd "' + dir + '"; claude');
  console.log('First thing inside the sandbox: install dependencies if the game needs them (for example: npm install).');
}

function status(name) {
  const reg = readReg();
  const names = name ? [name] : Object.keys(reg.tasks);
  if (!names.length) { console.log('No tasks yet. Start one with: node .claude/tools/task.js start <name>'); return; }
  for (const n of names) {
    const t = reg.tasks[n];
    if (!t) { console.log(n + ': unknown task'); continue; }
    console.log('\n' + n + '  [' + t.status + ']  branch ' + t.branch + '  sandbox ' + t.path);
    if (t.status !== 'open') { if (t.mergedCommit) console.log('  merged as ' + t.mergedCommit.slice(0, 7)); continue; }
    if (!fs.existsSync(t.path)) { console.log('  the sandbox folder is missing'); continue; }
    const tip = git(['rev-parse', t.branch]).out;
    const ahead = git(['rev-list', '--count', t.base + '..' + t.branch]).out;
    const dirty = git(['status', '--porcelain', '--untracked-files=no'], t.path).out;
    console.log('  commits ahead of ' + t.base + ': ' + ahead + ', tip ' + tip.slice(0, 7) + (dirty ? ', UNCOMMITTED CHANGES in the sandbox' : ''));
    for (const g of gateTable(n, tip)) console.log('  ' + (g.ok ? '[ok]  ' : '[no]  ') + g.role + ': ' + g.note);
  }
}

async function finish(name, flags) {
  needHuman();
  notInSandbox();
  const reg = readReg(), t = reg.tasks[name];
  if (!t || t.status !== 'open') die('no open task named "' + name + '". See: node .claude/tools/task.js status');
  const cur = git(['rev-parse', '--abbrev-ref', 'HEAD']).out;
  if (cur !== t.base) die('the main project is on branch "' + cur + '" but this task was started from "' + t.base + '". Switch back with: git switch ' + t.base);
  if (git(['status', '--porcelain', '--untracked-files=no']).out) die('the main project has uncommitted changes. Commit or stash them first.');
  if (!fs.existsSync(t.path)) die('the sandbox folder is missing: ' + t.path);
  if (git(['status', '--porcelain', '--untracked-files=no'], t.path).out) die('the sandbox has uncommitted changes. The agents must commit everything (and the gates must be re-run) before a merge.');
  const untracked = git(['ls-files', '--others', '--exclude-standard'], t.path).out.split('\n').filter(Boolean);
  if (untracked.length && !flags['allow-untracked']) die('the sandbox has files that are not committed and would NOT be merged:\n  ' + untracked.slice(0, 10).join('\n  ') + (untracked.length > 10 ? '\n  ...' : '') + '\nHave the agents commit them (or add them to .gitignore), or pass --allow-untracked to leave them out.');
  const tip = git(['rev-parse', t.branch]).out;
  const ahead = parseInt(git(['rev-list', '--count', t.base + '..' + t.branch]).out, 10);
  if (!(ahead > 0)) die('the task has no commits to merge.');

  const mb = git(['merge-base', t.base, t.branch]).out;
  const files = git(['diff', '--name-only', mb, t.branch]).out.split('\n').filter(Boolean);
  const P = policy();
  const secrets = files.filter((f) => lib.matchAny(P.secrets, f));
  if (secrets.length) die('the task changes secrets files, which is never allowed: ' + secrets.join(', '));
  const kit = files.filter((f) => lib.matchAny((P.gates || {}).kitPaths || [], f));
  if (kit.length && !flags['allow-kit-change']) die('the task changes the team kit or project rules, which agents must never do:\n  ' + kit.join('\n  ') + '\nIf you made these changes yourself on purpose, re-run with --allow-kit-change.');

  console.log('Task "' + name + '" (' + t.branch + ', ' + ahead + ' commit' + (ahead === 1 ? '' : 's') + ', ' + files.length + ' files changed)');
  const gates = gateTable(name, tip);
  gates.forEach((g) => console.log('  ' + (g.ok ? '[ok]  ' : '[NO]  ') + g.role + ': ' + g.note));
  if (gates.some((g) => !g.ok)) die('not every gate is green, so nothing was merged. The agents must fix the problem, commit, and re-run the failed checks.');
  console.log('\n' + git(['diff', '--stat', mb, t.branch]).out + '\n');
  console.log(git(['log', '--oneline', mb + '..' + t.branch]).out + '\n');
  if (kit.length) console.log('WARNING: this merge changes the team kit / project rules:\n  ' + kit.join('\n  ') + '\n');
  const typed = await ask('Type the task name to merge it into ' + t.base + ' (anything else cancels): ');
  if (typed !== name) { console.log('Cancelled. Nothing changed.'); process.exit(0); }
  const merge = git(['merge', '--no-ff', '-m', 'Merge ' + t.branch + ' (tester, reviewer and overseer verdicts on ' + tip.slice(0, 7) + ')', t.branch]);
  if (!merge.ok) { git(['merge', '--abort']); die('the merge hit a conflict and was undone. Nothing changed.\n' + merge.err); }
  const head = git(['rev-parse', 'HEAD']).out;
  reg.tasks[name].status = 'merged';
  reg.tasks[name].mergedCommit = head;
  writeReg(reg);
  lib.appendLogEntry('overseer', (n) => `### #${n} - Task merged - ${lib.stamp()} - ${name}\n**You merged** ${t.branch} into ${t.base} at ${head.slice(0, 7)}.\n**Gates:** ${gates.map((g) => g.role + ' ' + g.note).join('; ')}.\n**Files changed:** ${files.length}.`, true);
  console.log('\nMerged into ' + t.base + ' at ' + head.slice(0, 7) + '. Nothing was pushed.');
  console.log('To publish, run git push yourself. To remove the sandbox: node .claude/tools/task.js close ' + name);
}

function removeSandbox(t, force) {
  const link = path.join(t.path, 'docs', 'agent-logs');
  // Take the logs link out first so removing the sandbox can never touch the real logs.
  try { const st = fs.lstatSync(link); if (st.isSymbolicLink() || process.platform === 'win32') { try { fs.rmdirSync(link); } catch (e) { fs.unlinkSync(link); } } } catch (e) { /* not there */ }
  if (fs.existsSync(link)) die('could not detach the logs link at ' + link + '; not removing the sandbox to protect your logs.');
  const rm = git(['worktree', 'remove', '--force', t.path]);
  if (!rm.ok) die('git could not remove the sandbox: ' + rm.err);
  const br = git(['branch', force ? '-D' : '-d', t.branch]);
  if (!br.ok) console.log('Note: the branch was kept (' + br.err + ')');
  try { fs.rmdirSync(path.dirname(t.path)); } catch (e) { /* not empty */ }
}

async function close(name, discard) {
  needHuman();
  notInSandbox();
  const reg = readReg(), t = reg.tasks[name];
  if (!t || t.status === 'closed') die('no task named "' + name + '" to close.');
  if (t.status === 'open' && !discard) die('"' + name + '" has not been merged. Merge it with finish, or throw it away with: node .claude/tools/task.js abandon ' + name);
  if (discard) { const typed = await ask('This permanently discards the work in "' + name + '". Type the task name to confirm: '); if (typed !== name) { console.log('Cancelled.'); process.exit(0); } }
  if (fs.existsSync(t.path)) removeSandbox(t, discard);
  reg.tasks[name].status = 'closed';
  writeReg(reg);
  lib.appendLogEntry('overseer', (n) => `### #${n} - Task closed - ${lib.stamp()} - ${name}\n**Sandbox removed** (${discard ? 'discarded without merging' : 'after merge'}).`, true);
  console.log('Task "' + name + '" closed.');
}

(async () => {
  const [cmd, name, ...rest] = process.argv.slice(2);
  const flags = {};
  rest.concat(name && name.startsWith('--') ? [name] : []).forEach((a) => { if (a.startsWith('--')) flags[a.slice(2)] = true; });
  const n = name && !name.startsWith('--') ? name : undefined;
  if (cmd === 'start') return start(n, flags);
  if (cmd === 'status' || cmd === 'list') return status(n);
  if (cmd === 'finish') return finish(n, flags);
  if (cmd === 'close') return close(n, false);
  if (cmd === 'abandon') return close(n, true);
  console.log('Usage: node .claude/tools/task.js <start|status|finish|close|abandon> [name] [--allow-dirty] [--allow-kit-change]');
})().catch((e) => die(e && e.message));
