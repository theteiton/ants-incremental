#!/usr/bin/env node
/*
 * Evidence runner: "does this commit actually work?" Local only, no dependencies.
 *
 *   node .claude/tools/verify.js [--quick]
 *
 * Runs, in the current folder (the task sandbox):
 *   1. a syntax check of every project .js/.mjs/.cjs file and every inline <script> in .html files
 *   2. the package.json scripts that exist, in this order: lint, typecheck, check, test, build
 *   3. extra commands listed in verify.json at the project root: { "commands": ["node tests/run.js"] }
 *      (each one is first judged by the overseer, exactly as if a developer had typed it)
 * Then it writes a record to .claude/ledger/verify/ and, inside a task sandbox, a "verify" gate row for the exact
 * commit. The row says "pass" only if everything passed AND the working tree is clean, so the evidence is about the
 * commit that will be merged, not about local edits. `task.js finish` requires it (policy gates.required.verify).
 * --quick skips the package.json scripts and verify.json commands (syntax only; never writes a "pass").
 */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const vm = require('vm');
const lib = require(path.join(__dirname, '..', 'hooks', 'lib.js'));

const ROOT = lib.ROOT;
const quick = process.argv.includes('--quick');
const win = process.platform === 'win32';
const steps = [];
const sh = (cmd, args, extra) => cp.spawnSync(cmd, args, Object.assign({ cwd: ROOT, encoding: 'utf8', shell: win, timeout: 300000, maxBuffer: 20 * 1024 * 1024 }, extra));
const git = (args) => { const r = cp.spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' }); return r.status === 0 ? r.stdout.trim() : ''; };
const add = (name, ok, note, ms) => { steps.push({ name, ok, note: lib.clip(note || '', 400), ms: ms || 0 }); console.log((ok ? '[ok]   ' : '[FAIL] ') + name + (note ? ' - ' + lib.clip(note, 200) : '')); };

function overseerAllows(cmd) {
  const payload = { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: cmd }, cwd: ROOT, agent_type: 'developer', agent_id: 'verify', tool_use_id: 'verify' };
  const r = cp.spawnSync(process.execPath, [path.join(__dirname, '..', 'hooks', 'overseer.js')], { input: JSON.stringify(payload), encoding: 'utf8', env: Object.assign({}, process.env, { OVERSEER_DRY: '1' }) });
  if (r.status === 2) return { ok: false, why: (r.stderr || '').trim().split('\n')[0] };
  try { const d = JSON.parse(r.stdout).hookSpecificOutput.permissionDecision; return d === 'allow' ? { ok: true } : { ok: false, why: 'the overseer would ' + d + ' this' }; } catch (e) { return { ok: false, why: 'the overseer gave no decision' }; }
}

// 1. syntax
{
  const t0 = Date.now();
  const files = git(['ls-files', '-co', '--exclude-standard']).split('\n').filter(Boolean)
    .filter((f) => !/(^|\/)(node_modules|dist|build|vendor|\.claude|coverage)\//.test(f) && !/\.min\.js$/.test(f));
  const bad = [];
  let n = 0;
  for (const f of files.filter((x) => /\.(m|c)?js$/.test(x)).slice(0, 400)) {
    n++;
    const r = cp.spawnSync(process.execPath, ['--check', path.join(ROOT, f)], { encoding: 'utf8' });
    if (r.status !== 0) bad.push(f + ': ' + ((r.stderr || '').split('\n').find((l) => /Error/.test(l)) || 'syntax error'));
  }
  for (const f of files.filter((x) => /\.html?$/.test(x)).slice(0, 100)) {
    let html = '';
    try { html = fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (e) { continue; }
    const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
    let m, idx = 0;
    while ((m = re.exec(html))) {
      idx++;
      if (/\bsrc\s*=/.test(m[1]) || /type\s*=\s*["'](?!text\/javascript|module)/i.test(m[1]) || /^\s*(import|export)\s/m.test(m[2]) || !m[2].trim()) continue;
      n++;
      try { new vm.Script(m[2], { filename: f + '#script' + idx }); } catch (e) { bad.push(f + ' script #' + idx + ': ' + e.message); }
    }
  }
  add('syntax (' + n + ' scripts)', bad.length === 0, bad.slice(0, 3).join(' | '), Date.now() - t0);
}

if (!quick) {
  // 2. package.json scripts
  const pkgFile = path.join(ROOT, 'package.json');
  if (fs.existsSync(pkgFile)) {
    let pkg = {};
    try { pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8')); } catch (e) { add('package.json', false, 'not valid JSON'); }
    const hasDeps = Object.keys(Object.assign({}, pkg.dependencies, pkg.devDependencies)).length > 0;
    const scripts = pkg.scripts || {};
    const wanted = ['lint', 'typecheck', 'check', 'test', 'build'].filter((s) => scripts[s] && !/no test specified/i.test(scripts[s]));
    if (wanted.length && hasDeps && !fs.existsSync(path.join(ROOT, 'node_modules'))) add('dependencies', false, 'node_modules is missing. Run: npm install');
    else for (const s of wanted) {
      const t0 = Date.now();
      const r = sh('npm', ['run', s, '--silent']);
      const tail = ((r.stdout || '') + (r.stderr || '')).trim().split('\n').slice(-6).join(' / ');
      add('npm run ' + s, r.status === 0, r.status === 0 ? '' : (r.error ? r.error.message : tail), Date.now() - t0);
    }
    if (!wanted.length) console.log('[info] package.json has no lint/typecheck/check/test/build script');
  } else console.log('[info] no package.json: only syntax and verify.json commands apply');

  // 3. verify.json commands
  const vf = path.join(ROOT, 'verify.json');
  if (fs.existsSync(vf)) {
    let cfg = {};
    try { cfg = JSON.parse(fs.readFileSync(vf, 'utf8')); } catch (e) { add('verify.json', false, 'not valid JSON'); }
    for (const cmd of (cfg.commands || []).slice(0, 10)) {
      const ok = overseerAllows(String(cmd));
      if (!ok.ok) { add(cmd, false, 'not run: ' + ok.why); continue; }
      const t0 = Date.now();
      const r = sh(String(cmd), [], { shell: true });
      add(cmd, r.status === 0, r.status === 0 ? '' : ((r.stdout || '') + (r.stderr || '')).trim().split('\n').slice(-6).join(' / '), Date.now() - t0);
    }
  }
}

const sha = git(['rev-parse', 'HEAD']);
const clean = git(['status', '--porcelain', '--untracked-files=no']) === '';
const allOk = steps.every((s) => s.ok);
const pass = allOk && clean && !quick && !!sha;
if (!clean) console.log('[note] uncommitted changes: commit first. The gate only counts a clean tree at the final commit.');
if (quick) console.log('[note] --quick never writes a pass.');

try {
  const rec = { ts: new Date().toISOString(), task: lib.TASK || null, commit: sha, clean, quick, pass, steps };
  const dir = path.join(lib.LEDGER_DIR, 'verify');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, (lib.TASK || 'main') + '-' + (sha || 'nogit').slice(0, 7) + '.json'), JSON.stringify(rec, null, 2));
  if (lib.SANDBOX && lib.TASK && sha && !quick) {
    lib.appendJsonl(path.join(lib.GATES_DIR, lib.TASK + '.jsonl'), { ts: rec.ts, task: lib.TASK, role: 'verify', verdict: pass ? 'pass' : 'fail', commit: sha, log_entry: null });
  }
} catch (e) { console.log('[note] could not write the record: ' + e.message); }

console.log('\nVerify: ' + (pass ? 'PASS' : 'NOT PASSED') + ' (' + steps.filter((s) => s.ok).length + '/' + steps.length + ' steps ok' + (sha ? ', commit ' + sha.slice(0, 7) : '') + ')');
process.exit(allOk ? 0 : 1);
