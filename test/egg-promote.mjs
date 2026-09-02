import "./stub.mjs";
const G = await import("../js/game.js");
const A = await import("../js/ants.js");
const P = await import("../js/prestige.js");

const bad = [];
G.hardReset(); G.shedWings();
for (const u of P.PRESTIGE_UPGRADES) G.game.prestige.upgrades.push(u.id);
G.game.prestige.flightsTaken = 1;
G.game.settings.ratios = { forager: 80, excavator: 0, nurse: 5, soldier: 12 };
for (let t = 0; t < 3600; t++) G.tick(1);
G.game.settings.autoLay = false;
G.game.ants.excavator += 3000;
G.game.food = 1e28;

// Feliza's case exactly: a thousand foragers queued, then nurses behind them
G.layEggs(1000, "forager");
G.layEggs(20, "nurse");
const tended = Math.min(A.broodCapacity(G.game), G.game.eggs.length);
console.log("=== A THOUSAND FORAGERS AHEAD OF TWENTY NURSES ===");
console.log("  eggs:", G.game.eggs.length, " tended:", tended);
const nurseAt = G.game.eggs.findIndex((e, i) => i >= tended && e.caste === "nurse");
console.log("  the first nurse sits at position", nurseAt);

const before = G.game.eggs.length;
const tallyBefore = { f: A.broodCount(G.game, "forager"), n: A.broodCount(G.game, "nurse") };
const moved = G.promoteEggRange(nurseAt, G.game.eggs.length - 1);
console.log("  moved", moved, "eggs to the front");
const nurseNow = G.game.eggs.findIndex((e, i) => i >= tended && e.caste === "nurse");
console.log("  the first nurse now sits at position", nurseNow, "(front of the queue is", tended + ")");
console.log("  total eggs unchanged:", G.game.eggs.length === before);
const tallyAfter = { f: A.broodCount(G.game, "forager"), n: A.broodCount(G.game, "nurse") };
console.log("  tally unchanged:", JSON.stringify(tallyBefore) === JSON.stringify(tallyAfter),
  JSON.stringify(tallyAfter));
if (G.game.eggs.length !== before) bad.push("promoting changed the egg count");
if (nurseNow !== tended) bad.push("the nurses did not reach the front");
if (JSON.stringify(tallyBefore) !== JSON.stringify(tallyAfter)) bad.push("the brood tally drifted");

// tended eggs must never be reordered
const progressBefore = G.game.eggs.slice(0, tended).map(e => e.progress);
G.promoteEggRange(0, 2);
const progressAfter = G.game.eggs.slice(0, tended).map(e => e.progress);
console.log("  promoting a tended egg is refused:",
  JSON.stringify(progressBefore) === JSON.stringify(progressAfter));
if (JSON.stringify(progressBefore) !== JSON.stringify(progressAfter)) bad.push("a tended egg was moved");

// and it keeps ticking
let threw = null;
try { for (let t = 0; t < 300; t++) G.tick(1); } catch (e) { threw = e.message; }
console.log("  300 ticks after promoting:", threw ? "THREW " + threw : "fine,",
  A.population(G.game), "ants");
if (threw) bad.push("tick threw after promoting");

// the tally is still exact
let mismatch = 0;
for (const c of ["forager", "excavator", "nurse", "soldier"]) {
  let walked = 0;
  for (const e of G.game.eggs) if (e.caste === c) walked++;
  if (A.broodCount(G.game, c) !== walked) mismatch++;
}
console.log("  tally still exact:", mismatch === 0);
if (mismatch) bad.push("tally mismatch after promoting");

console.log("\n--- failures ---");
console.log(bad.length ? bad.join("\n") : "none");
process.exit(bad.length ? 1 : 0);
