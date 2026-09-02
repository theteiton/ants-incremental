// The whole gate, in one command:
//
//   node test/run.mjs           the fast suites, about a minute
//   node test/run.mjs --slow    everything, including pacing and the fuzz run
//   node test/run.mjs pacing    one suite by name
//
// Plain node, no dependencies, no build step -- the same rule the game follows.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";

const HERE = fileURLToPath(new URL("./", import.meta.url));

// Suites that take real time: they simulate hours of play rather than checking
// a value. Kept out of the default run so the gate stays quick enough to use.
const SLOW = new Set(["pacing", "fuzz"]);

// not suites -- shared machinery
const SUPPORT = new Set(["run", "dom", "stub", "harness"]);

const args = process.argv.slice(2);
const wantSlow = args.includes("--slow");
const named = args.filter(a => !a.startsWith("--"));

const all = fs.readdirSync(HERE)
  .filter(f => f.endsWith(".mjs"))
  .map(f => path.basename(f, ".mjs"))
  .filter(f => !SUPPORT.has(f))
  .sort();

const suites = named.length
  ? all.filter(s => named.includes(s))
  : all.filter(s => wantSlow || !SLOW.has(s));

if (named.length) {
  const unknown = named.filter(n => !all.includes(n));
  if (unknown.length) {
    console.error("no such suite: " + unknown.join(", "));
    console.error("available: " + all.join(", "));
    process.exit(2);
  }
}

function runOne(name) {
  return new Promise(resolve => {
    const started = Date.now();
    const child = spawn(process.execPath, [path.join(HERE, name + ".mjs")], { encoding: "utf8" });
    let out = "";
    child.stdout.on("data", d => { out += d; });
    child.stderr.on("data", d => { out += d; });
    child.on("close", code => resolve({ name, code, out, ms: Date.now() - started }));
  });
}

const results = [];
for (const name of suites) {
  const r = await runOne(name);
  results.push(r);
  const mark = r.code === 0 ? "ok  " : "FAIL";
  console.log("  " + mark + "  " + name.padEnd(18) + (r.ms / 1000).toFixed(1) + "s");
  if (r.code !== 0) {
    for (const line of r.out.trimEnd().split("\n").slice(-20)) console.log("        " + line);
  }
}

const failed = results.filter(r => r.code !== 0);
const secs = (results.reduce((a, r) => a + r.ms, 0) / 1000).toFixed(1);
console.log("");
console.log("  " + (results.length - failed.length) + " of " + results.length +
  " passed in " + secs + "s" + (wantSlow ? "" : "   (--slow adds " + [...SLOW].join(", ") + ")"));
if (failed.length) console.log("  failed: " + failed.map(f => f.name).join(", "));
process.exit(failed.length ? 1 : 0);
