import "./stub.mjs";
const G = await import("../js/game.js");
const A = await import("../js/ants.js");
const P = await import("../js/prestige.js");

// the truth, walked fresh every time
function walk(caste) {
  let n = 0;
  for (const egg of G.game.eggs) if (egg.caste === caste) n++;
  return n;
}
const CASTES = ["forager", "excavator", "nurse", "soldier"];
let checks = 0;
const bad = [];
function assertTally(where) {
  for (const c of CASTES) {
    const cached = A.broodCount(G.game, c);
    const truth = walk(c);
    checks++;
    if (cached !== truth) bad.push(`${where}: ${c} cached ${cached} but really ${truth}`);
  }
}

console.log("=== THE CACHED BROOD TALLY MUST NEVER DISAGREE WITH A WALK ===");
G.hardReset(); G.shedWings();
for (const u of P.PRESTIGE_UPGRADES) G.game.prestige.upgrades.push(u.id);
G.game.prestige.flightsTaken = 1;
G.game.settings.ratios = { forager: 78, excavator: 4, nurse: 6, soldier: 12 };

// a long run with the automation laying and eggs hatching every tick
for (let t = 0; t < 4000; t++) {
  G.tick(1);
  if (t % 7 === 0) assertTally("tick " + t);
}
console.log("  after 4,000 ticks of laying and hatching:", bad.length ? "MISMATCH" : "exact");

// hand laying, in batches, mixed castes
G.game.settings.autoLay = false;
G.game.ants.excavator += 5000;
G.game.food = 1e28;
for (let i = 0; i < 300; i++) {
  G.layEggs(20, CASTES[i % CASTES.length]);
  if (i % 5 === 0) assertTally("hand lay " + i);
}
console.log("  after 300 hand-laid batches:            ", bad.length ? "MISMATCH" : "exact");

// destroying ranges out of the middle
for (let i = 0; i < 60 && G.game.eggs.length > 40; i++) {
  const from = 5 + (i % 12);
  G.destroyEggRange(from, from + 3);
  assertTally("destroy " + i);
}
console.log("  after 60 range destructions:            ", bad.length ? "MISMATCH" : "exact");

// ticking again with a queue, so hatches splice from the front
G.game.settings.autoLay = true;
for (let t = 0; t < 800; t++) {
  G.tick(1);
  if (t % 5 === 0) assertTally("mixed tick " + t);
}
console.log("  after 800 more ticks with a queue:      ", bad.length ? "MISMATCH" : "exact");

// a save round trip replaces the array wholesale
const code = G.exportSave();
G.hardReset();
assertTally("after hard reset");
G.importSave(code);
assertTally("after import");
console.log("  across a hard reset and an import:      ", bad.length ? "MISMATCH" : "exact");

// a flight and a matriline reset both refound the colony
G.game.ants.forager += 2000;
if (G.flightReady()) G.doFlight();
assertTally("after a flight");
G.game.stats.challengeLevels = 30;
G.game.prestige.royalJellyTotal = 200;
if (G.matrilineReady(G.game)) G.doMatrilineReset("atta");
assertTally("after a matriline reset");
console.log("  across a flight and a matriline reset:  ", bad.length ? "MISMATCH" : "exact");

console.log("\n  " + checks + " comparisons made.");
console.log(bad.length ? "  FAILURES:\n" + bad.slice(0, 8).join("\n") : "  the cache never disagreed with the walk.");
process.exit(bad.length ? 1 : 0);
