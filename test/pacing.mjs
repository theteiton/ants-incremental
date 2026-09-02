import { A, game, seed, reset, grantAutomation, play } from "./harness.mjs";

// THE PACING TABLE. This is the suite that matters most when balance moves: it
// plays the ordinary run -- no lineage bought, no species, the shipped caste
// shares -- and reports the minutes to each milestone against the figures
// recorded in CLAUDE.md. A change that moves these has changed how long the
// game takes, and that is never a thing to ship without saying so.
//
// The policy is the one the canon figures were taken under: the automation
// switched on artificially, standing in for a competent hand, on a fixed seed.
// Two rows, because rallying is the one thing a hand does that changes the rate.
// The idle row is the one CLAUDE.md states outright and it reproduces exactly.
// For the rallying row the canon records only the 1,000-ant figure of 47.7m --
// the older full row in the pacing table predates the achievement rework and
// was superseded. The rest of this row was measured on 31 August 2026 with this
// harness and is recorded here as the baseline from now on; 47.7 matches canon.
const CANON = {
  idle:     { 20: 1.2, 50: 3.1, 100: 7.1, 250: 22.8, 500: 41.4, 1000: 60.9, 2000: 87.9 },
  // 0.3.0.0 moved the last two rungs of this row and only this row: 47.7 -> 50.0
  // and 66.2 -> 73.0. Modifiers give every attacker a power multiplier, and the
  // expected value of that multiplier is exactly 1.0000 in every band -- but the
  // loss function is convex. Winning a raid by a wider margin gains nothing,
  // while losing one costs up to a fifth of the colony, so mean-neutral variance
  // still costs time. It shows here and not in the idle row because a rallying
  // colony runs closer to the edge. Deliberate: it is what 245 distinct
  // encounters cost, and the idle row is untouched at +0.2% and +0.6%.
  rallying: { 20: 1.2, 50: 2.7, 100: 6.0, 250: 16.6, 500: 29.3, 1000: 50.0, 2000: 73.0 }
};
const MARKS = [20, 50, 100, 250, 500, 1000, 2000];

// How far a milestone may drift before it is a finding. The run is
// deterministic, so this is slack for a deliberate change being small rather
// than for randomness.
const TOLERANCE = 0.10;

function run(label, rally) {
  reset();
  seed(12345);
  grantAutomation();
  game.settings.ratios = { forager: 0, excavator: 0, nurse: 5, soldier: 8 };
  const marks = {};
  for (const n of MARKS) marks[n] = { when: () => A.population(game) >= n };
  const problems = [];
  play(6 * 3600, { problems, marks, rally, label });
  return { marks, problems };
}

console.log("=== PACING: the ordinary run, against the canon table ===\n");
const bad = [];
const notes = [];
for (const [label, canon] of Object.entries(CANON)) {
  const { marks, problems } = run(label, label === "rallying");
  console.log("  " + label);
  console.log("    ants     canon      now     drift");
  for (const n of MARKS) {
    const at = marks[n].at;
    if (at === undefined) {
      console.log("    " + String(n).padStart(5) + canon[n].toFixed(1).padStart(10) + "   not reached");
      bad.push(label + ": " + n + " ants never reached");
      continue;
    }
    const now = at / 60;
    const drift = (now - canon[n]) / canon[n];
    const moved = Math.abs(drift) > TOLERANCE;
    console.log("    " + String(n).padStart(5) + canon[n].toFixed(1).padStart(10) +
      now.toFixed(1).padStart(9) + (drift >= 0 ? "   +" : "   ") +
      (100 * drift).toFixed(1).padStart(5) + "%" + (moved ? "   <-- MOVED" : ""));
    if (moved) notes.push(label + " " + n + " ants: " + canon[n].toFixed(1) + "m -> " +
      now.toFixed(1) + "m (" + (drift > 0 ? "+" : "") + (100 * drift).toFixed(1) + "%)");
  }
  if (problems.length) bad.push(label + ": " + problems.length + " invariant problems, first: " + problems[0]);
  console.log("");
}

if (notes.length) {
  console.log("--- PACING MOVED ---");
  for (const n of notes) console.log("  " + n);
  console.log("");
  console.log("Not automatically a failure -- but it is a change in how long the game");
  console.log("takes. It has to be deliberate, explained, and written into the canon");
  console.log("table in CLAUDE.md, rather than discovered by a player.");
}
if (bad.length) {
  console.log("\n--- BROKEN ---");
  for (const b of bad) console.log("  " + b);
}
if (!notes.length && !bad.length) {
  console.log("--- every milestone within " + (100 * TOLERANCE).toFixed(0) + "% of canon, both rows ---");
}
process.exit(bad.length || notes.length ? 1 : 0);
