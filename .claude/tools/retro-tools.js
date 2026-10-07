#!/usr/bin/env node
/*
 * Helper for /retro. Runs locally, no dependencies.
 *
 *   node .claude/tools/retro-tools.js snapshot <version>
 *       Copies every agent's MEMORY.md (from ~/.claude/agent-memory) into
 *       docs/retro/<version>-memory-before/ so the retro can be reviewed.
 *
 *   node .claude/tools/retro-tools.js diff <version>
 *       Prints, per agent, the lines added and removed since the snapshot.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const lib = require(path.join(__dirname, '..', 'hooks', 'lib.js'));
const AGENTS = lib.AGENTS;
const memRoot = path.join(os.homedir(), '.claude', 'agent-memory');
const [cmd, version] = process.argv.slice(2);

if (!['snapshot', 'diff'].includes(cmd) || !version || /[\\/]/.test(version)) {
  console.error('Usage: node .claude/tools/retro-tools.js <snapshot|diff> <version>');
  process.exit(1);
}
const root = lib.HOME_ROOT; // retros run in the real project, where the logs live
const snapDir = path.join(root, 'docs', 'retro', version + '-memory-before');
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch (e) { return ''; } };

if (cmd === 'snapshot') {
  fs.mkdirSync(snapDir, { recursive: true });
  for (const a of AGENTS) fs.writeFileSync(path.join(snapDir, a + '.md'), read(path.join(memRoot, a, 'MEMORY.md')), 'utf8');
  console.log('Saved memory snapshot for ' + AGENTS.length + ' agents to ' + snapDir);
} else {
  if (!fs.existsSync(snapDir)) { console.error('No snapshot found at ' + snapDir + '. Run: snapshot ' + version); process.exit(1); }
  for (const a of AGENTS) {
    const before = read(path.join(snapDir, a + '.md')).split('\n');
    const after = read(path.join(memRoot, a, 'MEMORY.md')).split('\n');
    const b = new Set(before), f = new Set(after);
    const removed = before.filter((l) => l.trim() && !f.has(l));
    const added = after.filter((l) => l.trim() && !b.has(l));
    console.log('\n=== ' + a + ' (' + after.length + ' lines) ===');
    if (!removed.length && !added.length) console.log('  no change');
    removed.forEach((l) => console.log('  - ' + l));
    added.forEach((l) => console.log('  + ' + l));
    const core = after.filter((l) => /^- \*\*When\*\*/.test(l)).length;
    if (core > 15) console.log('  !! ' + core + ' Core lessons, over the cap of 15');
    if (after.length > 120) console.log('  !! file is ' + after.length + ' lines, over the cap of 120');
  }
}
