#!/usr/bin/env node
/*
 * Agent action ledger. Runs locally as a Claude Code hook. No network, no dependencies.
 *
 * Events handled (see .claude/settings.json):
 *   SubagentStart, PostToolUse, PostToolUseFailure, SubagentStop
 *
 * What it writes (in the real project checkout, even when an agent works in a sandbox):
 *   .claude/ledger/<agent>.jsonl     raw trail, one JSON line per action (git-ignored)
 *   docs/agent-logs/<agent>.md       at SubagentStop, one human-readable "Auto-record"
 *                                    entry is appended to that agent's log
 *   docs/agent-logs/overseer.md      when you approved a question the overseer asked, an outcome line
 *
 * Tool OUTPUT is never stored. Inputs are shortened and scrubbed of obvious secrets.
 * The hook never blocks the agent: any error is swallowed and it exits 0.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const lib = require('./lib');

const MAX_ERR = 240;
const MAX_FINAL = 700;

function readStdin() { try { return fs.readFileSync(0, 'utf8'); } catch (e) { return ''; } }

function dur(ms) {
  if (!(ms >= 0)) return 'unknown time';
  const s = Math.round(ms / 1000);
  if (s < 60) return s + 's';
  return Math.floor(s / 60) + 'm' + lib.pad(s % 60) + 's';
}
const uniq = (a) => Array.from(new Set(a));
function list(a, max) {
  if (!a.length) return 'none';
  const shown = a.slice(0, max).map((x) => '`' + x + '`').join(', ');
  return a.length > max ? shown + ', and ' + (a.length - max) + ' more' : shown;
}

// An ask the overseer put to the user is resolved when the tool actually ran.
function resolveAsk(input) {
  const id = input.tool_use_id;
  if (!id) return;
  const stateFile = path.join(lib.LEDGER_DIR, '.overseer-state.json');
  lib.withLock('overseer-state', () => {
    const st = lib.readJson(stateFile, null);
    if (!st || !st.pending || !st.pending[id]) return;
    const p = st.pending[id];
    delete st.pending[id];
    fs.writeFileSync(stateFile, JSON.stringify(st), 'utf8');
    lib.appendLogEntry('overseer', (n) => `### #${n} - Outcome of #${p.n} - ${lib.stamp()} - approved by you and ran\n**What happened:** ${p.agent} ran \`${p.detail}\` after you approved it.`, true);
    lib.appendJsonl(path.join(lib.LEDGER_DIR, 'overseer.jsonl'), { ts: new Date().toISOString(), event: 'ask-approved', agent: p.agent, tool_use_id: id });
  });
}

function overseerDigest(agentId) {
  const rows = lib.readJsonl(path.join(lib.LEDGER_DIR, 'overseer.jsonl'), (o) => o.agent_id === agentId && o.event === 'decision');
  if (!rows.length) return null;
  const approved = new Set(lib.readJsonl(path.join(lib.LEDGER_DIR, 'overseer.jsonl'), (o) => o.event === 'ask-approved').map((o) => o.tool_use_id));
  const c = { allow: 0, ask: 0, deny: 0, defer: 0 };
  rows.forEach((r) => { c[r.decision] = (c[r.decision] || 0) + 1; });
  const asks = rows.filter((r) => r.decision === 'ask');
  const askOk = asks.filter((r) => approved.has(r.tool_use_id)).length;
  const denies = uniq(rows.filter((r) => r.decision === 'deny').map((r) => '`' + (r.detail || r.tool) + '` (' + r.rule + ')'));
  let s = c.allow + ' allowed, ' + c.ask + ' asked' + (c.ask ? ' (' + askOk + ' approved by you, ' + (c.ask - askOk) + ' not run)' : '') + ', ' + c.deny + ' blocked';
  if (denies.length) s += ': ' + denies.slice(0, 6).join('; ') + (denies.length > 6 ? '; and ' + (denies.length - 6) + ' more' : '');
  return s + '.';
}

function writeAutoRecord(agent, ledgerFile, input) {
  if (!fs.existsSync(lib.logPath(agent))) return; // only team agents have logs; ignore built-in agents
  const rows = lib.readJsonl(ledgerFile, (o) => o.agent_id === input.agent_id);
  const start = rows.find((r) => r.event === 'SubagentStart');
  const tools = rows.filter((r) => r.event === 'PostToolUse' || r.event === 'PostToolUseFailure');
  const counts = {};
  tools.forEach((r) => { counts[r.tool] = (counts[r.tool] || 0) + 1; });
  const countText = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).map((k) => k + ' x' + counts[k]).join(', ') || 'none';

  const isShell = (r) => r.tool === 'Bash' || r.tool === 'PowerShell';
  const logCalls = tools.filter((r) => isShell(r) && /log-append\.js/.test(r.detail || ''));
  const changed = uniq(tools.filter((r) => ['Write', 'Edit', 'MultiEdit', 'NotebookEdit'].includes(r.tool) && r.detail).map((r) => r.detail));
  const read = uniq(tools.filter((r) => r.tool === 'Read' && r.detail).map((r) => r.detail));
  const cmds = tools.filter((r) => isShell(r) && r.detail && !/log-append\.js/.test(r.detail)).map((r) => '`' + r.detail + '`' + (r.ok === false ? ' (failed)' : ''));
  const fails = tools.filter((r) => r.ok === false).map((r) => r.tool + (r.detail ? ' ' + lib.clip(r.detail, 80) : '') + ': ' + (r.error || 'failed'));
  const web = uniq(tools.filter((r) => (r.tool === 'WebFetch' || r.tool === 'WebSearch') && r.detail).map((r) => r.detail));
  const okLog = logCalls.filter((r) => r.ok !== false);
  const wroteAction = okLog.some((r) => /--kind\s+action\b/.test(r.detail));
  const feedbackGiven = okLog.filter((r) => /--kind\s+feedback\b/.test(r.detail)).length;
  const verdicts = okLog.filter((r) => /--kind\s+verdict\b/.test(r.detail)).map((r) => (r.detail.match(/--verdict\s+(\S+)/) || [, '?'])[1]);

  const startTs = start ? Date.parse(start.ts) : NaN;
  const took = isNaN(startTs) ? 'unknown time' : dur(Date.now() - startTs);
  const finalMsg = lib.clip(lib.scrub(input.last_assistant_message), MAX_FINAL);
  const oversight = overseerDigest(input.agent_id);

  lib.appendLogEntry(agent, (n) => {
    const lines = [
      '### #' + n + ' - Auto-record - ' + lib.stamp() + ' - recorded by the hook, not written by the agent',
      '**Run:** ' + (input.agent_id || 'unknown') + (lib.TASK ? ', task ' + lib.TASK : '') + ', took ' + took + ', ' + tools.length + ' tool calls.',
      '**Tools used:** ' + countText + '.',
      '**Files changed:** ' + list(changed, 25) + '.',
      '**Files read:** ' + list(read, 15) + '.',
      '**Commands run:** ' + (cmds.length ? cmds.slice(0, 12).join('; ') + (cmds.length > 12 ? '; and ' + (cmds.length - 12) + ' more' : '') : 'none') + '.',
    ];
    if (web.length) lines.push('**Web lookups:** ' + list(web, 8) + '.');
    lines.push('**Failures:** ' + (fails.length ? fails.slice(0, 8).join('; ') : 'none') + '.');
    if (oversight) lines.push('**Overseer:** ' + oversight);
    if (verdicts.length) lines.push('**Gate verdicts recorded:** ' + verdicts.join(', ') + '.');
    lines.push('**Log entries written this run:** ' + okLog.length + ' (' + (wroteAction ? 'includes its Action entry' : 'NO Action entry - the agent did not record its reasoning') + (feedbackGiven ? '; ' + feedbackGiven + ' feedback to others' : '') + ').');
    lines.push('**Final message (excerpt):** ' + (finalMsg || 'none'));
    return lines.join('\n');
  }, false);
}

function main() {
  const raw = readStdin();
  if (!raw.trim()) return;
  const input = JSON.parse(raw);
  const event = input.hook_event_name;
  const agent = lib.safeName(input.agent_type || 'lead');
  const ledgerFile = path.join(lib.LEDGER_DIR, agent + '.jsonl');

  if (event === 'SubagentStart') {
    lib.appendJsonl(ledgerFile, { ts: new Date().toISOString(), event, agent, agent_id: input.agent_id, session: input.session_id });
    return;
  }

  if (event === 'PostToolUse' || event === 'PostToolUseFailure') {
    const row = {
      ts: new Date().toISOString(), event, agent, agent_id: input.agent_id || null,
      tool: input.tool_name, detail: lib.describeTool(input.tool_name, input.tool_input),
    };
    if (event === 'PostToolUseFailure') {
      row.ok = false;
      row.error = lib.clip(lib.scrub(input.error), MAX_ERR);
    } else if ((input.tool_name === 'Bash' || input.tool_name === 'PowerShell') && input.tool_response && typeof input.tool_response === 'object') {
      const code = input.tool_response.exit_code;
      if (typeof code === 'number') { row.exit = code; if (code !== 0) { row.ok = false; row.error = 'exit code ' + code; } }
    }
    lib.appendJsonl(ledgerFile, row);
    resolveAsk(input);
    return;
  }

  if (event === 'SubagentStop') {
    lib.appendJsonl(ledgerFile, { ts: new Date().toISOString(), event, agent, agent_id: input.agent_id });
    writeAutoRecord(agent, ledgerFile, input);
  }
}

try { main(); } catch (e) {
  try { fs.mkdirSync(lib.LEDGER_DIR, { recursive: true }); fs.appendFileSync(path.join(lib.LEDGER_DIR, '_hook-errors.txt'), new Date().toISOString() + ' ledger: ' + (e && e.message) + '\n'); } catch (e2) { /* never block the agent */ }
}
process.exit(0);
