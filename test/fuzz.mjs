import { elementFor, descendants } from "./dom.mjs";
await import("../js/ui.js");
const G = await import("../js/game.js");
const A = await import("../js/ants.js");
const R = await import("../js/raids.js");
const C = await import("../js/challenges.js");
const P = await import("../js/prestige.js");

// A different kind of test: hammer the real UI with random actions and assert
// the colony never reaches an impossible state. Clicks go through the same
// handlers a player uses, in orders nobody would choose on purpose.
let seed = 20260830;
const rnd = () => {
  seed ^= seed << 13; seed >>>= 0;
  seed ^= seed >> 17;
  seed ^= seed << 5; seed >>>= 0;
  return seed / 4294967296;
};
const pick = a => a[Math.floor(rnd() * a.length)];

const bad = [];
function check(where) {
  const g = G.game;
  const bads = [];
  if (!Number.isFinite(g.food) || g.food < -1e-9) bads.push("food " + g.food);
  if (!Number.isFinite(g.protein) || g.protein < -1e-9) bads.push("protein " + g.protein);
  if (!Number.isFinite(A.foodPerSecond(g))) bads.push("food/s NaN");
  if (!Number.isFinite(R.combatPower(g))) bads.push("combat NaN");
  for (const id in g.ants) {
    if (!Number.isInteger(g.ants[id]) || g.ants[id] < 0) bads.push(id + "=" + g.ants[id]);
  }
  const cap = A.populationCap(g);
  const pop = A.population(g);
  if (pop > cap && A.capPerExcavator(g) > 0 && !C.sealedActive(g)) {
    // the dig-out rule allows a small overshoot while diggers are in the brood
    if (pop > cap + A.broodCapacity(g) + 8) bads.push("pop " + pop + " over cap " + cap);
  }
  if (g.eggs.some(e => !Number.isFinite(e.progress) || e.progress < 0)) bads.push("egg progress");
  const spent = G.instinctsSpent(g);
  if (spent > g.achievementPoints + 1e-9) bads.push("instincts overspent: " + spent + " of " + g.achievementPoints);
  if (G.instinctPoints(g) < 0) bads.push("negative instinct points");
  // the brood tally must never drift
  for (const c of ["forager", "excavator", "nurse", "soldier"]) {
    let walked = 0;
    for (const e of g.eggs) if (e.caste === c) walked++;
    if (A.broodCount(g, c) !== walked) bads.push("tally " + c);
  }
  for (const b of bads) bad.push(where + ": " + b);
}

const TABS = ["ants", "upgrades", "combat", "achievements", "prestige", "matriline",
              "challenges", "library", "settings"];
const CASTES = ["forager", "excavator", "nurse", "soldier"];

G.hardReset();
for (const u of P.PRESTIGE_UPGRADES) G.game.prestige.upgrades.push(u.id);
G.game.prestige.flightsTaken = 2;

const ACTIONS = [
  () => G.shedWings(),
  () => G.stripWing(),
  () => G.startRally(),
  () => G.layEgg(pick(CASTES)),
  () => G.layEggs(Math.floor(rnd() * 60), pick(CASTES)),
  () => G.setNextCaste(pick(CASTES)),
  () => G.buyUpgradeLevels(pick(A.UPGRADES).id),
  () => G.buyPrestigeUpgrade(pick(P.PRESTIGE_UPGRADES).id),
  () => G.buyInstinct(pick(G.INSTINCTS).id),
  () => G.buyMatrilineUpgrade(pick(G.MATRILINE_UPGRADES).id),
  () => G.exile(pick(CASTES), Math.floor(rnd() * 5)),
  () => G.destroyEggRange(Math.floor(rnd() * 30), Math.floor(rnd() * 60)),
  () => G.promoteEggRange(Math.floor(rnd() * 60), Math.floor(rnd() * 90)),
  () => G.sellProtein(Math.floor(rnd() * 20)),
  () => G.buyProtein(Math.floor(rnd() * 20)),
  () => { if (G.flightReady()) G.doFlight(); },
  () => { if (G.matrilineReady(G.game)) G.doMatrilineReset(pick(G.SPECIES).id); },
  () => { if (!G.game.challenge) G.enterChallenge(pick(C.CHALLENGES).id); },
  () => { if (G.game.challenge) G.abandonChallenge(); },
  () => { if (G.challengeMet()) G.completeChallenge(); },
  () => { G.game.settings.raidDifficulty = pick(["sheltered", "unchecked", "hunted", "relentless"]); },
  () => { G.game.settings.feedBrood = rnd() < 0.5; },
  () => { G.game.settings.autoLay = rnd() < 0.5; },
  () => G.dismissTutorial(),
  () => elementFor("tabButton-" + pick(TABS)).fire("click"),
  () => elementFor("btnBroodDetails").fire("click"),
  () => elementFor("broodPromote").fire("click"),
  () => elementFor("broodClose").fire("click"),
  () => elementFor("tutorialSkip").fire("click")
];

console.log("=== FUZZING THE REAL UI ===");
let acted = 0, threw = 0;
for (let step = 0; step < 24000; step++) {
  try { pick(ACTIONS)(); acted++; } catch (e) { threw++; bad.push("action threw: " + e.message); }
  try { G.tick(1 + rnd() * 3); } catch (e) { bad.push("tick threw: " + e.message); break; }
  if (step % 200 === 0) check("step " + step);
}
check("end");
console.log("  " + acted + " random actions, " + threw + " threw");
console.log("  colony: " + A.population(G.game) + " ants, " +
  G.game.achievementPoints + " tiers, level " + G.game.achievementLevel);
console.log("  species: " + G.currentSpecies(G.game) + ", matrilines: " + G.matrilineCount(G.game) +
  ", flights: " + G.game.prestige.flightsTaken);
console.log("  instincts held: " + G.game.instincts.length + ", points left: " + G.instinctPoints(G.game));

// and it must still save and load
let saveOk = false;
try {
  const code = G.exportSave();
  G.hardReset();
  saveOk = G.importSave(code);
} catch (e) { bad.push("save round trip threw: " + e.message); }
console.log("  saved and reloaded after all that: " + saveOk);
if (!saveOk) bad.push("could not save/load the fuzzed colony");

console.log("\n--- failures ---");
console.log(bad.length ? [...new Set(bad)].slice(0, 12).join("\n") : "none");
process.exit(bad.length ? 1 : 0);
