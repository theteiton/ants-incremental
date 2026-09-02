import { A, game, seed, reset, grantAllLineage, play } from "./harness.mjs";
const G = await import("../js/game.js");
const H = await import("../js/hunt.js");
const T = await import("../js/trophies.js");

// What survives each of the four resets, and what must not.
//
// Living Memory's "a daughter leaves with a full crop" was written for the
// nuptial flight and lived in refoundColony(), which all four share -- so
// ENTERING A TRIAL kept a quarter of the colony's food, which is the one thing
// a trial must not do. It founds a colony under conditions that should kill it.
// Abandoning kept a quarter of that again, because the share compounded once
// per refound.
const bad = [];

function deepColony() {
  reset(); seed(11); grantAllLineage();
  game.prestige.royalJelly = 200000;
  game.prestige.royalJellyTotal = 200000;
  game.prestige.flightsTaken = 12;
  game.stats.flightsEver = 12;
  game.achievementPoints = 9999;
  game.instincts = ["inst_keepfood"];
  game.trophies = { aardvark: 3 };
  game.trophyKills = { aardvark: 40 };
  play(70 * 60, { hand: true });
  H.initHunt(game);
  game.hunt.open = true;
  game.hunt.tier = 3;
  for (let i = 0; i < 6; i++) game.hunt.cells[i].held = true;
  return {
    food: game.food, protein: game.protein, pop: A.population(game),
    eggs: game.eggs.length, tier: game.hunt.tier, trophy: T.trophyGrade(game, "aardvark")
  };
}

const CASES = [
  ["nuptial flight", () => G.doFlight(), true],
  ["matriline reset", () => G.doMatrilineReset("solenopsis"), false],
  ["entering a trial", () => G.enterChallenge("drought"), false],
  ["abandoning a trial", () => { G.enterChallenge("drought"); G.abandonChallenge(); }, false]
];

console.log("=== WHAT SURVIVES A RESET ===\n");
console.log("  reset                food kept   protein   ants   eggs   tier   trophy");
for (const [label, act, mayKeepFood] of CASES) {
  const before = deepColony();
  act();
  const after = {
    food: game.food, protein: game.protein, pop: A.population(game),
    eggs: game.eggs.length, tier: (game.hunt && game.hunt.tier) || 0,
    trophy: T.trophyGrade(game, "aardvark")
  };
  const share = before.food > 0 ? after.food / before.food : 0;
  console.log("  " + label.padEnd(20) +
    (100 * share).toFixed(1).padStart(8) + "%" +
    after.protein.toFixed(0).padStart(10) +
    String(after.pop).padStart(7) + String(after.eggs).padStart(7) +
    String(after.tier).padStart(7) + String(after.trophy).padStart(9));

  // the colony itself always goes
  if (after.pop !== 0) bad.push(label + " left " + after.pop + " ants standing");
  if (after.eggs !== 0) bad.push(label + " left " + after.eggs + " eggs in the brood");
  if (after.protein > 0) bad.push(label + " kept " + after.protein.toFixed(0) + " protein");
  // food only where it is earned
  if (!mayKeepFood && after.food > 0) {
    bad.push(label + " kept " + after.food.toExponential(2) +
      " food -- only a nuptial flight may, and only through Living Memory");
  }
  if (mayKeepFood && !(share > 0.2 && share < 0.3)) {
    bad.push("a flight with Living Memory kept " + (100 * share).toFixed(1) + "%, expected 25%");
  }
  // and what IS banked must never be lost
  if (after.tier !== before.tier) bad.push(label + " changed the banked tier " + before.tier + " -> " + after.tier);
  if (after.trophy !== before.trophy) bad.push(label + " changed a trophy " + before.trophy + " -> " + after.trophy);
}

console.log("\n  A trial founds a colony under conditions that should kill it, so it");
console.log("  starts from nothing. Merged circles and trophies are banked against the");
console.log("  line and no reset may take them.");
console.log("\n--- " + (bad.length ? bad.join("\n") : "every reset keeps exactly what it should") + " ---");
process.exit(bad.length ? 1 : 0);
