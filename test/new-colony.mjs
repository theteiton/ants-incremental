import { G, A, C, R, game, seed, reset, grantAllLineage, grantAutomation, play, mins } from "./harness.mjs";

const bad = [];
const note = (ok, m) => { if (!ok) bad.push(m); };

console.log("=== BASELINE, still untouched? (1.2/3.1/7.1/22.8/41.4/60.9/87.9) ===");
reset(); seed(12345); grantAutomation();
game.settings.ratios = { forager: 0, excavator: 0, nurse: 5, soldier: 8 };
const marks = {};
for (const n of [20, 50, 100, 250, 500, 1000, 2000]) marks[n] = { when: () => A.population(game) >= n };
const problems = [];
play(6 * 3600, { problems, marks, rally: false });
console.log("  ", [20,50,100,250,500,1000,2000].map(n => marks[n].at ? mins(marks[n].at) : "-").join(" | "));
note(problems.length === 0, "baseline problems");

console.log("\n=== INSTINCTS ===");
reset(); seed(4); grantAllLineage(); play(3600, { rally: true });
console.log(`  tiers ${game.achievementPoints}, unspent ${G.instinctPoints(game)}`);
const capBefore = A.populationCap(game), broodBefore = A.broodCapacity(game);
const hatchBefore = A.hatchRate(game), combatBefore = R.combatPower(game);
const offBefore = A.offlineCapSeconds(game) / 3600;
for (const i of G.INSTINCTS) {
  const ok = G.buyInstinct(i.id);
  console.log(`  ${i.name.padEnd(18)} ${String(i.cost).padStart(3)} pts  ${ok ? "bought" : "cannot afford"}` +
    `   ${G.instinctPoints(game)} left`);
}
console.log(`  cap ${capBefore} -> ${A.populationCap(game)},` +
  ` brood ${broodBefore} -> ${A.broodCapacity(game)},` +
  ` hatch ${hatchBefore.toFixed(2)} -> ${A.hatchRate(game).toFixed(2)},` +
  ` combat ${combatBefore.toFixed(0)} -> ${R.combatPower(game).toFixed(0)},` +
  ` offline ${offBefore}h -> ${(A.offlineCapSeconds(game)/3600)}h`);
note(A.populationCap(game) > capBefore, "instinct cap did nothing");
note(A.broodCapacity(game) > broodBefore, "instinct brood did nothing");
const levelBefore = game.achievementLevel;
G.tick(1);
note(game.achievementLevel === levelBefore, "spending points lowered the achievement level");
console.log(`  achievement level after spending: ${game.achievementLevel} (was ${levelBefore})`);

console.log("\n=== INSTINCTS SURVIVE EVERY RESET, AND LIVING MEMORY KEEPS FOOD ===");
const held = game.instincts.slice();
game.food = 1000000;
const keptShare = G.instinctKeptFood(game);
game.stats.challengeLevels = 30; game.prestige.royalJellyTotal = 60;
G.doMatrilineReset("atta");
console.log(`  instincts after a matriline: ${game.instincts.length} of ${held.length}` +
  `   food kept ${Math.round(game.food)} (share ${keptShare})`);
note(game.instincts.length === held.length, "instincts did not survive the matriline");
note(keptShare === 0 || game.food > 0, "Living Memory kept no food");

console.log("\n=== MASTERIES ARE GLOBAL AND PERMANENT ===");
reset(); seed(8); grantAllLineage();
game.challenges = { generic: { drought: 5, siege: 3 } };
game.stats.bestTrial = { generic: { drought: 5, siege: 3 } };
game.stats.challengeLevels = 30; game.prestige.royalJellyTotal = 60;
console.log(`  as generic:  food ×${C.masteryFood(game)}  soldier ×${C.masterySoldier(game)}`);
G.doMatrilineReset("eciton");
console.log(`  as eciton:   food ×${C.masteryFood(game)}  soldier ×${C.masterySoldier(game)}`);
note(C.masteryFood(game) === 32, "the food mastery did not carry to a new species");
console.log(`  species trial levels: eciton ${G.speciesTrialLevels(game, "eciton")},` +
  ` generic ${G.speciesTrialLevels(game, "generic")}`);
note(G.speciesTrialLevels(game, "eciton") === 0, "eciton inherited generic's trial record");

console.log("\n=== SPECIES BRANCHES STAY ISOLATED WITH FOUR NODES EACH ===");
for (const s of G.SPECIES) {
  reset(); seed(1); grantAllLineage();
  game.stats.challengeLevels = 30; game.prestige.royalJellyTotal = 60;
  G.doMatrilineReset(s.id);
  game.matriline.upgrades = G.MATRILINE_UPGRADES.map(u => u.id);
  game.ants.forager = 100; game.ants.nurse = 20; game.ants.excavator = 10;
  console.log(`  ${s.name.padEnd(15)} cap ${String(A.populationCap(game)).padStart(6)}` +
    `  brood ${String(A.broodCapacity(game)).padStart(3)}` +
    `  garden ×${A.gardenThrottle(game).toFixed(2)}` +
    `  foodCap ${A.foodCap(game).toExponential(1)}` +
    `  raid ${R.raidInterval(game).toFixed(0)}s` +
    `  branch ${G.speciesBranch(s.id).length} nodes`);
}

console.log("\n=== SAVE ROUND TRIP ===");
reset(); seed(3); grantAllLineage();
game.stats.challengeLevels = 30; game.prestige.royalJellyTotal = 60;
G.doMatrilineReset("myrmecocystus");
game.matriline.upgrades = ["mat_myr_1", "mat_myr_4", "mat_express_1"];
game.instincts = ["inst_cap_1", "inst_brood_1"];
play(600, { rally: true });
game.settings.autoBuy = false; game.settings.autoLay = false; game.settings.autoShed = false;
const snap = () => JSON.stringify({ sp: G.currentSpecies(game), inst: game.instincts,
  up: game.matriline.upgrades, pop: A.population(game), cap: A.populationCap(game),
  brood: A.broodCapacity(game), foodCap: Math.round(A.foodCap(game)) });
const before = snap();
const code = G.exportSave();
reset(); G.importSave(code);
console.log("  before:", before);
console.log("  after :", snap());
note(before === snap(), "the save round trip changed the colony");

console.log("\n--- failures ---");
console.log(bad.length ? bad.join("\n") : "none");
