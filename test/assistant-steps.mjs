import { elementFor } from "./dom.mjs";
await import("../js/ui.js");
const G = await import("../js/game.js");
const A = await import("../js/ants.js");

const bad = [];
console.log("=== THE OPENING GUIDE, STEP BY STEP ===");
G.hardReset();
const seen = [];
function note() {
  const step = G.tutorialStep();
  const id = step ? step.id : "(none)";
  if (seen[seen.length - 1] !== id) {
    seen.push(id);
    console.log(`  ${String(A.population(G.game)).padStart(4)} ants  [${id}]` +
      (step ? "  " + step.text.slice(0, 76) + "…" : ""));
  }
}
note();
G.shedWings(); note();
for (let i = 0; i < 5; i++) G.layEgg("forager");
note();
for (let t = 0; t < 60; t++) { if (G.stripReady()) G.stripWing(); G.tick(1); note(); }
// then play on by hand until soldiers unlock
for (let t = 0; t < 4 * 3600; t++) {
  if (G.stripReady()) G.stripWing();
  while (G.canLay(G.managedCaste())) { if (!G.layEgg(G.managedCaste())) break; }
  for (const line of A.UPGRADES) G.buyUpgradeLevels(line.id);
  G.tick(1);
  if (t % 30 === 0) note();
  if (A.isUnlocked(G.game, "soldier")) break;
}
note();
console.log("\n  steps seen, in order:", seen.join(" -> "));
if (seen[0] !== "shed") bad.push("the first step was not shedding");
if (seen.indexOf("lay") < 0) bad.push("the laying step never showed");
// it no longer retires at soldiers -- it hands over from the explanatory
// opening steps to the standing assistant, so the last thing seen must be one
// of the assistant's and never one of the opening's
const openingIds = G.TUTORIAL_STEPS.map(s => s.id);
const last = seen[seen.length - 1];
if (last !== "(none)" && openingIds.includes(last)) {
  bad.push("still on an opening step (" + last + ") after soldiers unlocked");
}

console.log("\n=== THE SKIP BUTTON ===");
G.hardReset();
console.log("  step before skipping:", (G.tutorialStep() || {}).id);
elementFor("tutorialSkip").fire("click");
console.log("  step after skipping :", G.tutorialStep());
if (G.tutorialStep() !== null) bad.push("skipping did not stop the guide");
// and it stays skipped across a save
const code = G.exportSave();
G.hardReset();
G.importSave(code);
console.log("  still skipped after a reload:", G.tutorialStep() === null);
if (G.tutorialStep() !== null) bad.push("skipping did not survive a reload");

console.log("\n--- failures ---");
console.log(bad.length ? bad.join("\n") : "none");
process.exit(bad.length ? 1 : 0);
