import { G, A, C, game, seed, reset, grantAllLineage, play } from "./harness.mjs";

const fails = [];
console.log("=== A SAVE FROM EVERY VERSION STILL LOADS ===");
// build a real v8 save, then strip it back to look like each older version
reset(); seed(5); grantAllLineage(); play(1800, { rally: true });
const full = JSON.parse(JSON.stringify(game));

function shrink(v) {
  const d = JSON.parse(JSON.stringify(full));
  d.version = v;
  if (v <= 7) { delete d.matriline; delete d.instincts;
    d.challenges = { drought: 3 }; d.stats.bestTrial = { drought: 3 }; }
  if (v <= 6) { d.upgrades = ["forager_1","forager_2","excavator_1","nurse_1","colony_1","nanitic_1"];
    delete d.lossStreak; }
  if (v <= 5) { delete d.prestige; delete d.run; delete d.peakUpgrades; delete d.best; delete d.runTime; }
  if (v <= 4) { delete d.protein; delete d.raidTimer; delete d.raidsWon; delete d.raidsLost; delete d.lastRaid; }
  if (v <= 3) { delete d.queenName; delete d.seen; delete d.bigForagers; delete d.foragersSinceBig; }
  if (v <= 2) { delete d.peakPopulation; delete d.naniticsDied; delete d.settings; }
  return d;
}

for (let v = 1; v <= 8; v++) {
  const data = shrink(v);
  const code = Buffer.from(JSON.stringify(data), "utf8").toString("base64");
  reset();
  let loaded = false, err = null;
  try { loaded = G.importSave(code); } catch (e) { err = e.message; }
  if (!loaded) { fails.push("v" + v + " did not load" + (err ? ": " + err : "")); }
  const bad = [];
  if (loaded) {
    if (!Number.isFinite(game.food) || game.food < 0) bad.push("food " + game.food);
    if (!Number.isFinite(A.population(game))) bad.push("population");
    if (!Number.isFinite(A.foodPerSecond(game))) bad.push("food/s");
    if (game.version !== 8) bad.push("version " + game.version);
    if (!game.matriline) bad.push("no matriline block");
    if (!Array.isArray(game.instincts)) bad.push("no instincts array");
    if (typeof game.challenges !== "object") bad.push("challenges not an object");
    // and it must keep playing
    try { for (let i = 0; i < 120; i++) G.tick(1); } catch (e) { bad.push("tick threw: " + e.message); }
  }
  if (bad.length) fails.push("v" + v + ": " + bad.join(", "));
  console.log(`  v${v} -> ${loaded ? "loaded" : "REFUSED"}` +
    (loaded ? `, now v${game.version}, ${A.population(game)} ants, drought ${C.bestTrialLevel(game, "drought")}` : "") +
    (bad.length ? "   PROBLEM: " + bad.join(", ") : ""));
}

console.log("\n=== GARBAGE IS REFUSED RATHER THAN THROWN ===");
for (const junk of ["", "not a save", "e30=", Buffer.from('{"ants":null}').toString("base64"),
                    Buffer.from('{"version":99,"ants":{}}').toString("base64"), "!!!!"]) {
  reset();
  let out, threw = null;
  try { out = G.importSave(junk); } catch (e) { threw = e.message; }
  console.log(`  ${JSON.stringify(junk.slice(0, 24)).padEnd(28)} -> ${threw ? "THREW: " + threw : out}`);
  if (threw) fails.push("garbage import threw: " + threw);
}

console.log("\n--- failures ---");
console.log(fails.length ? fails.join("\n") : "none");
process.exit(fails.length ? 1 : 0);
