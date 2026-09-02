import { A, R, C, game, seed, reset, grantAllLineage, play } from "./harness.mjs";
const G = await import("../js/game.js");

// The three matriline trials must each be PLAYABLE: clearable at level 1 by a
// colony holding nothing, and still a trial at level 5. This is the check that
// caught Sealed Nest being impossible before Drought and a formality after it.
const NEW = ["blight", "dulosis", "repletes"];
const LIMIT = 90 * 60;
const bad = [];

function attempt(id, level, mastered) {
  reset();
  seed(4242);
  grantAllLineage();
  if (mastered) {
    game.stats.bestTrial = { generic: {} };
    for (const ch of C.CHALLENGES) game.stats.bestTrial.generic[ch.id] = 5;
  }
  game.challenges = { generic: {} };
  if (level > 1) game.challenges.generic[id] = level - 1;
  if (!G.enterChallenge(id)) return { entered: false };
  const marks = { done: { when: () => G.challengeMet() } };
  const problems = [];
  play(LIMIT, { problems, marks, hand: true, rally: true, cure: true, label: id + " L" + level });
  return {
    entered: true,
    at: marks.done.at,
    failed: C.challengeFailed(game),
    pop: A.population(game),
    problems
  };
}

console.log("=== THE THREE MATRILINE TRIALS ===\n");
for (const id of NEW) {
  const ch = C.CHALLENGES.find(c => c.id === id);
  console.log("  " + ch.name);
  for (const level of [1, 3, 5]) {
    const r = attempt(id, level, false);
    if (!r.entered) { bad.push(id + " L" + level + ": could not be entered"); continue; }
    const when = r.at !== undefined ? (r.at / 60).toFixed(1) + "m" : (r.failed ? "LOST" : "not cleared in 90m");
    console.log("    level " + level + "  " + when.padStart(18) + "   ended at " + r.pop + " ants");
    if (level === 1 && r.at === undefined) {
      bad.push(ch.name + " level 1 cannot be cleared by a colony holding nothing");
    }
    if (r.problems.length) bad.push(ch.name + " L" + level + ": " + r.problems[0]);
  }
  // and it must not become a formality once everything else is mastered
  const m = attempt(id, 5, true);
  const mw = m.at !== undefined ? (m.at / 60).toFixed(1) + "m" : "not cleared";
  console.log("    level 5, everything else mastered: " + mw);
  if (m.at !== undefined && m.at < 60) {
    bad.push(ch.name + " level 5 clears in " + (m.at / 60).toFixed(1) +
      "m once mastered -- that is a formality, not a trial");
  }
  console.log("");
}

// the masteries must actually pay, and in the right direction
reset();
grantAllLineage();
const plain = { losses: C.masteryLosses(game), capture: C.masteryCapture(game), offline: C.masteryOffline(game) };
game.stats.bestTrial = { generic: { blight: 5, dulosis: 5, repletes: 5 } };
const paid = { losses: C.masteryLosses(game), capture: C.masteryCapture(game), offline: C.masteryOffline(game) };
console.log("  mastery            none      five levels");
console.log("  Metapleural Gland  " + plain.losses.toFixed(3) + "     " + paid.losses.toFixed(3) + "   (lower is better)");
console.log("  Dulotic Instinct   " + plain.capture.toFixed(3) + "     " + paid.capture.toFixed(3));
console.log("  Social Stomach     " + plain.offline.toFixed(3) + "     " + paid.offline.toFixed(3));
if (!(paid.losses < plain.losses)) bad.push("Metapleural Gland does not reduce losses");
if (!(paid.capture > plain.capture)) bad.push("Dulotic Instinct does not raise captures");
if (!(paid.offline > plain.offline)) bad.push("Social Stomach does not lengthen offline");
if (paid.losses <= 0) bad.push("Metapleural Gland turns a loss into a gain");

console.log("\n--- " + (bad.length ? bad.join("\n") : "all three are playable and all three pay") + " ---");
process.exit(bad.length ? 1 : 0);
