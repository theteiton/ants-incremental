import { A, game, seed, reset, grantAutomation, play } from "./harness.mjs";

// THE PACING TABLE. The suite that matters most when balance moves: it plays
// the ordinary run -- no lineage bought, no species, the shipped caste shares --
// and reports minutes to each milestone against the recorded figures.
//
// IT AVERAGES FIVE SEEDS, and it has to. Measured on one unchanged build, the
// same policy reached 1,000 ants anywhere between 60.1m and 68.2m depending on
// the seed -- a spread of 12.7%, wider than the 10% tolerance this suite used
// to apply to a SINGLE seed. So it was reporting noise as signal, and any change
// that merely consumed random numbers in a different order looked like a
// balance change. Rolling terrain for the Hunt board did exactly that.
//
// Five seeds cuts the noise on the mean to roughly 12.7 / sqrt(5) = 5.7%, so an
// 8% tolerance catches a real move and ignores the rest.
const SEEDS = [12345, 777, 4242, 90210, 31337];
const TOLERANCE = 0.08;

// Means across those five seeds, measured 31 August 2026. The older figures in
// CLAUDE.md were single-seed and sat near the bottom of the range rather than
// at the middle of it.
const CANON = {
  idle:     { 20: 1.2, 50: 3.1, 100: 7.1, 250: 22.5, 500: 40.6, 1000: 63.8, 2000: 92.0 },
  rallying: { 20: 1.2, 50: 2.6, 100: 5.7, 250: 16.4, 500: 29.1, 1000: 47.2, 2000: 66.2 }
};
const MARKS = [20, 50, 100, 250, 500, 1000, 2000];

function runOne(s, rally) {
  reset();
  seed(s);
  grantAutomation();
  game.settings.ratios = { forager: 0, excavator: 0, nurse: 5, soldier: 8 };
  const marks = {};
  for (const n of MARKS) marks[n] = { when: () => A.population(game) >= n };
  const problems = [];
  play(6 * 3600, { problems, marks, rally });
  return { marks, problems };
}

console.log("=== PACING: the ordinary run, mean of " + SEEDS.length + " seeds ===\n");
const bad = [];
const notes = [];
for (const [label, canon] of Object.entries(CANON)) {
  const got = {};
  for (const n of MARKS) got[n] = [];
  for (const s of SEEDS) {
    const { marks, problems } = runOne(s, label === "rallying");
    for (const n of MARKS) if (marks[n].at !== undefined) got[n].push(marks[n].at / 60);
    if (problems.length) bad.push(label + " seed " + s + ": " + problems[0]);
  }
  console.log("  " + label);
  console.log("    ants     canon     mean     range          drift");
  for (const n of MARKS) {
    const runs = got[n];
    if (runs.length < SEEDS.length) {
      console.log("    " + String(n).padStart(5) + canon[n].toFixed(1).padStart(10) +
        "   reached in only " + runs.length + " of " + SEEDS.length + " runs");
      bad.push(label + ": " + n + " ants not reached in every run");
      continue;
    }
    const mean = runs.reduce((a, b) => a + b, 0) / runs.length;
    const lo = Math.min(...runs), hi = Math.max(...runs);
    const drift = (mean - canon[n]) / canon[n];
    const moved = Math.abs(drift) > TOLERANCE;
    console.log("    " + String(n).padStart(5) + canon[n].toFixed(1).padStart(10) +
      mean.toFixed(1).padStart(9) +
      ("  " + lo.toFixed(1) + "-" + hi.toFixed(1) + "m").padEnd(15) +
      (drift >= 0 ? "  +" : "  ") + (100 * drift).toFixed(1).padStart(5) + "%" +
      (moved ? "   <-- MOVED" : ""));
    if (moved) notes.push(label + " " + n + " ants: " + canon[n].toFixed(1) + "m -> " +
      mean.toFixed(1) + "m (" + (drift > 0 ? "+" : "") + (100 * drift).toFixed(1) + "%)");
  }
  console.log("");
}

if (notes.length) {
  console.log("--- PACING MOVED ---");
  for (const n of notes) console.log("  " + n);
  console.log("");
  console.log("This is a mean of " + SEEDS.length + " seeds, so it is not seed noise. It is a change");
  console.log("in how long the game takes: deliberate, explained, and written into the");
  console.log("canon table rather than discovered by a player.");
}
if (bad.length) {
  console.log("\n--- BROKEN ---");
  for (const b of bad) console.log("  " + b);
}
if (!notes.length && !bad.length) {
  console.log("--- every milestone within " + (100 * TOLERANCE).toFixed(0) +
    "% of canon, on the mean of " + SEEDS.length + " seeds ---");
}
process.exit(bad.length || notes.length ? 1 : 0);
