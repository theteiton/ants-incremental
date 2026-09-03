import { A, R, game, seed, reset, grantAllLineage, play } from "./harness.mjs";
const G = await import("../js/game.js");
const H = await import("../js/hunt.js");
const T = await import("../js/trophies.js");
const B = await import("../js/bestiary.js");

const bad = [];
console.log("=== THE HUNT ===\n");

// --- the board opens with the soldiers and opens MOSTLY EMPTY ---------------
reset(); seed(77); grantAllLineage();
play(60 * 60, { hand: true, rally: false });
const opened = H.huntUnlocked(game);
const there = H.occupied(game).length;
console.log("  after an hour: board open " + opened + ", " + there + " of " + H.CELLS + " occupied");
if (!opened) bad.push("the board never opened");
if (there >= H.CELLS * 0.7) bad.push("the board filled up: " + there + " of " + H.CELLS);

// --- territory is bounded ---------------------------------------------------
const empty = A.huntTerritory(game);
for (const c of game.hunt.cells) { c.monster = null; c.mod = null; c.held = true; }
const full = A.huntTerritory(game);
game.hunt.tier = 25;
const deep = A.huntTerritory(game);
console.log("  territory: empty x" + empty.toFixed(3) + ", full board x" + full.toFixed(3) +
  ", plus 25 merged circles x" + deep.toFixed(2));
if (full > 2.0) bad.push("a full board is worth x" + full.toFixed(2) + " -- meant to be about x1.72");
if (deep > 4.85) bad.push("25 tiers reaches x" + deep.toFixed(2) + ", past the x4.85 Amdahl ceiling");

// --- a full board merges into a new circle ----------------------------------
game.hunt.tier = 0;
for (const c of game.hunt.cells) { c.monster = null; c.mod = null; c.held = true; }
const merged = H.mergeTier(game);
console.log("  a cleared circle merges: " + merged + " -> tier " + game.hunt.tier +
  ", fresh board with " + H.heldCells(game).length + " held");
if (!merged || game.hunt.tier !== 1) bad.push("a cleared board did not merge");
if (H.heldCells(game).length !== 0) bad.push("the new circle did not start empty");

// --- soldiers in the field cannot defend ------------------------------------
reset(); seed(9); grantAllLineage();
play(45 * 60, { hand: true });
game.hunt.open = true;
H.initHunt(game);
const cell = game.hunt.cells[H.CELLS - 1];
cell.monster = "aardvark"; cell.mod = "plain";
const home = R.combatPower(game);
H.sendMarch(game, H.CELLS - 1, 0.75);
console.log("  march sent: " + Math.round(H.marchShare(game) * 100) + "% away, " +
  "defence at home falls from " + home.toFixed(0) + " to " +
  (home * (1 - H.marchShare(game))).toFixed(0));
if (H.marchShare(game) !== 0.75) bad.push("marchShare wrong");
if (H.marchReady(game)) bad.push("a second march was allowed while one was out");

// it arrives, fights, and comes home
let fought = 0;
for (let i = 0; i < 400 && H.marchesOut(game).length; i++) {
  H.marchTick(game, 1, c => { fought++; c.monster = null; c.mod = null; c.held = true; return {}; });
}
console.log("  it arrived, fought " + fought + " time(s), and came home: march is " +
  (H.marchesOut(game).length ? "still out" : "back"));
if (fought !== 1) bad.push("the march fought " + fought + " times, expected 1");
if (H.marchesOut(game).length) bad.push("the march never came home");

// --- trophies ---------------------------------------------------------------
console.log("");
const g = {};
const unlucky = () => 0.99;
let first = T.awardTrophy(g, "aardvark", 3, unlucky);
console.log("  first kill always gives one: grade " + first.to + ", first=" + first.first);
if (!first || first.to !== 1) bad.push("the first kill did not give a trophy");
for (let i = 0; i < 600; i++) T.awardTrophy(g, "aardvark", 3, unlucky);
const unluckyGrade = T.trophyGrade(g, "aardvark");
console.log("  600 unlucky kills reach grade " + unluckyGrade + " (band top " +
  B.topGradeFor(B.monsterById("aardvark")) + ") -- luck can slow it, never block it");
if (unluckyGrade < 4) bad.push("the kill floor did not carry an unlucky player to grade 4");

const g2 = {};
T.awardTrophy(g2, "dragon", 5, () => 0.01);
if (T.trophyGrade(g2, "dragon") !== 5) bad.push("a lucky Ancient kill did not give grade 5");
const g3 = {};
for (let i = 0; i < 200; i++) T.awardTrophy(g3, "phorid", 5, () => 0.01);
console.log("  a Phorid Fly is capped at grade " + T.trophyGrade(g3, "phorid") +
  " however lucky or persistent you are");
if (T.trophyGrade(g3, "phorid") !== 2) bad.push("the band cap did not hold");

// bonuses must be 1 with nothing held, and must rise
const none = { };
if (T.trophyStrength(none) !== 1 || T.trophyTerritory(none) !== 1) {
  bad.push("trophy bonuses are not 1 for a colony holding none");
}
const full2 = { trophies: {} };
for (const m of B.MONSTERS) full2.trophies[m.id] = B.topGradeFor(m);
// Every kind a trophy can pay into must actually be reachable, and every one of
// them must be worth something with the whole wall held. The myth band is no
// longer a special case -- its creatures carry their own kinds like the rest.
const KINDS = Object.keys(T.TROPHY_KINDS);
console.log("  every trophy at its top grade:");
for (const kind of KINDS) {
  const v = kind === "egg" ? 1 / T.trophyEgg(full2) : T.trophyBonus(full2, kind);
  console.log("    " + T.kindName(kind).padEnd(24) + "x" + v.toFixed(3));
  if (!(v > 1)) bad.push(kind + " pays nothing even with every trophy held");
}
// and no kind may be authored that nothing actually grants
for (const kind of KINDS) {
  const granted = B.MONSTERS.some(m => m.trophy && m.trophy.kinds.indexOf(kind) >= 0);
  if (!granted) bad.push("no creature anywhere grants " + kind);
}

// --- a flight keeps the trophies and the tiers ------------------------------
reset(); seed(3); grantAllLineage();
game.trophies = { aardvark: 3 };
game.trophyKills = { aardvark: 40 };
game.hunt = { cells: H.newBoard(), tier: 4, open: true, marches: [], spawnTimer: 1, advanceTimer: 1 };
game.hunt.cells[0].held = true;
while (A.population(game) < 1000) play(60, { hand: true });
G.doFlight();
console.log("");
console.log("  after a flight: trophies kept " + (T.trophyGrade(game, "aardvark") === 3) +
  ", tiers kept " + game.hunt.tier + ", board reset to " + H.heldCells(game).length + " held");
if (T.trophyGrade(game, "aardvark") !== 3) bad.push("a flight took a trophy back");
if (game.hunt.tier !== 4) bad.push("a flight lost the banked tiers");
if (H.heldCells(game).length !== 0) bad.push("a flight kept the standing board");


// ---------------------------------------------------------- War Parties
// One column was the whole decision the board offered, and on a mastered colony
// it became the wall: x643-x3,907 power against the weakest cell, marching
// 97.8% of the time, and no circle merged in four hours.
console.log("=== SEVERAL COLUMNS AT ONCE ===");
G.hardReset();
G.game.ants.soldier = 4000;
G.game.run.peakPopulation = 4000; G.game.peakPopulation = 4000;
G.openHunt();
const board = G.game.hunt.cells;
for (let i = 0; i < 6; i++) { board[i].monster = "phorid"; board[i].mod = "plain"; board[i].held = false; }

if (!H.marchReady(G.game, 1)) bad.push("no column could be sent at all");
H.sendMarch(G.game, 0, 0.2, 1);
if (H.marchReady(G.game, 1)) bad.push("a second column was allowed at max 1");
if (!H.marchReady(G.game, 3)) bad.push("a second column was refused at max 3");
H.sendMarch(G.game, 1, 0.2, 3);
H.sendMarch(G.game, 2, 0.2, 3);
if (H.marchesOut(G.game).length !== 3) bad.push("three columns did not go out");
if (H.sendMarch(G.game, 3, 0.2, 3)) bad.push("a fourth column went out at max 3");
console.log("  columns out: " + H.marchesOut(G.game).length +
  ", committed " + Math.round(H.marchShare(G.game) * 100) + "%, " +
  Math.round((1 - H.marchShare(G.game)) * 100) + "% left at the gate");
if (Math.abs(H.marchShare(G.game) - 0.6) > 1e-9) bad.push("shares do not add up across columns");
if (H.sendMarch(G.game, 0, 0.1, 9)) bad.push("two columns were sent to one cell");

G.game.hunt.marches = [];
H.sendMarch(G.game, 0, 0.9, 9);
H.sendMarch(G.game, 1, 0.9, 9);
console.log("  after asking for 90% twice, committed " +
  Math.round(H.marchShare(G.game) * 100) + "%");
if (H.marchShare(G.game) > 1.0000001) bad.push("more than the whole army was committed");

let hits = 0;
for (let i = 0; i < 400 && H.marchesOut(G.game).length; i++) {
  H.marchTick(G.game, 1, c => { hits++; c.monster = null; c.held = true; return {}; });
}
console.log("  " + hits + " separate fights resolved, all columns home");
if (hits !== 2) bad.push("expected 2 fights from 2 columns, got " + hits);

G.game.hunt = { cells: H.newBoard(), tier: 0, open: true,
  march: { cell: 3, share: 0.5, out: 5, home: 0 }, spawnTimer: 1, advanceTimer: 1 };
H.initHunt(G.game);
console.log("  a v9 save's single march migrated to a list of " +
  H.marchesOut(G.game).length + ", old field gone: " + !("march" in G.game.hunt));
if (H.marchesOut(G.game).length !== 1) bad.push("the old single march did not migrate");
if ("march" in G.game.hunt) bad.push("the old march field survived the migration");

console.log("\n--- " + (bad.length ? bad.join("\n") : "the map, the march, the merge and the trophies all hold") + " ---");
process.exit(bad.length ? 1 : 0);
