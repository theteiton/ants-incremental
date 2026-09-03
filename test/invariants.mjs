import { elementFor } from "./dom.mjs";
await import("../js/ui.js");
const G = await import("../js/game.js");
const A = await import("../js/ants.js");
const L = await import("../js/library.js");
const AC = await import("../js/achievements.js");
const P = await import("../js/prestige.js");

const fails = [];
const note = (ok, m) => { if (!ok) fails.push(m); };

function veteran(withNode) {
  G.hardReset();
  for (const u of P.PRESTIGE_UPGRADES) G.game.prestige.upgrades.push(u.id);
  G.game.prestige.flightsTaken = 30;
  G.game.prestige.royalJelly = 160000;
  G.game.prestige.royalJellyTotal = 160000;
  G.game.stats.challengeLevels = 30;
  if (withNode) G.game.matriline.upgrades = ["mat_jelly"];
  const code = G.exportSave();
  G.hardReset();
  G.importSave(code);
}

console.log("=== 5. A VETERAN'S 160,000 ROYAL JELLY ===");
veteran(false);
console.log("  without Retained Royalty: haplotype paid", G.haplotypeEarned(G.game));
G.doMatrilineReset("atta");
console.log("    jelly kept:", G.game.prestige.royalJelly, " gate figure:", G.game.prestige.royalJellyTotal);
veteran(true);
const paid = G.haplotypeEarned(G.game);
G.doMatrilineReset("atta");
console.log("  with Retained Royalty   : haplotype paid", paid);
console.log("    jelly kept:", G.game.prestige.royalJelly, " gate figure:", G.game.prestige.royalJellyTotal);
console.log("    gate met already?", G.matrilineReady(G.game), "(must be false — the gate is re-earned)");
note(G.game.prestige.royalJelly === 80000, "Retained Royalty did not keep half of 160,000");
note(!G.matrilineReady(G.game), "the gate was already met, so matrilines would be free");

console.log("\n=== 4. HAPLOTYPE COUNTS THE FLIGHTS ALREADY TAKEN ===");
console.log("  30 flights behind the line pays", paid, "haplotype (was 4)");
note(paid > 20, "a veteran's flights still are not counted");

console.log("\n=== 25. THE LIBRARY DOT, LEFT ON 'WHAT CHANGED' ===");
G.hardReset(); G.shedWings();
for (const u of P.PRESTIGE_UPGRADES) G.game.prestige.upgrades.push(u.id);
G.game.settings.ratios = { forager: 80, excavator: 0, nurse: 5, soldier: 12 };
for (let t = 0; t < 3600; t++) G.tick(1);
console.log("  unread before opening:", L.libraryUnread(G.game));
// switch to the What changed sub-tab, then open the Library tab
elementFor("tabButton-library").fire("click");
const subtabs = elementFor("libraryTabs").children;
subtabs[subtabs.length - 1].fire("click");           // "What changed"
elementFor("tabButton-ants").fire("click");
elementFor("tabButton-library").fire("click");
console.log("  unread after opening it on What changed:", L.libraryUnread(G.game));
note(L.libraryUnread(G.game) === 0, "the library dot still does not clear from What changed");

console.log("\n=== 21. THE TRIALS TRACK'S RUNGS ARE WHOLE NUMBERS ===");
const trials = AC.ACHIEVEMENT_TRACKS.find(t => t.id === "trials");
console.log("  designed rungs:", trials.thresholds.join(", "));
console.log("  softcap rungs :", [1, 2, 3, 4].map(n =>
  AC.thresholdAt(trials, trials.thresholds.length + n)).join(", "));
note([1, 2, 3, 4].every(n => Number.isInteger(AC.thresholdAt(trials, trials.thresholds.length + n))),
  "the trials track still grows fractional rungs");

console.log("\n=== 36. THE BROOD WINDOW WITH 208,000 EGGS IN 2,080 BATCHES ===");
G.hardReset(); G.shedWings();
for (const u of P.PRESTIGE_UPGRADES) G.game.prestige.upgrades.push(u.id);
G.game.prestige.flightsTaken = 2;
G.game.settings.ratios = { forager: 80, excavator: 0, nurse: 5, soldier: 12 };
for (let t = 0; t < 2 * 3600; t++) G.tick(1);
G.game.settings.autoLay = false; G.game.settings.autoBuy = false;
G.game.ants.excavator += 40000;
G.game.food = 1e30;
const castes = ["forager", "excavator", "nurse", "soldier"];
for (let i = 0; i < 2080; i++) G.layEggs(100, castes[i % castes.length]);
console.log("  eggs:", G.game.eggs.length);
elementFor("btnBroodDetails").fire("click");

// How long one render takes, averaged, so a single unlucky sample cannot decide
// the run.
function renderCost(times) {
  elementFor("tabButton-ants").fire("click");            // warm
  const t0 = Date.now();
  for (let i = 0; i < times; i++) elementFor("tabButton-ants").fire("click");
  return (Date.now() - t0) / times;
}

const bigMs = renderCost(5);
const rows = elementFor("broodWaitingList");
const bigRows = rows.children.length;
console.log("  rows built:", bigRows, " one render:", bigMs.toFixed(1) + "ms");
console.log("  heading   :", elementFor("broodWaitingHead").textContent);
note(bigRows <= 45, "the window still builds a row per batch");

// This USED to assert `ms < 45` against a wall clock. Measured ten times on an
// unchanged tree that figure ranges 19-57ms -- the threshold sat inside its own
// noise, and the suite failed intermittently under load with nothing wrong.
// A wall-clock bound on a shim-dominated measurement is not a test.
//
// What the window actually promises is that it reads the FRONT of the queue
// rather than all of it, so the honest assertion is a ratio: the same render
// against a queue five hundred times smaller must cost about the same. That is
// scale-free, so it does not care how loaded the machine is.
const bigEggs = G.game.eggs.length;
G.destroyEggRange(400, G.game.eggs.length - 1);
const smallMs = renderCost(5);
const ratio = bigMs / Math.max(0.2, smallMs);
console.log("  " + bigEggs + " eggs: " + bigMs.toFixed(1) + "ms, " +
  G.game.eggs.length + " eggs: " + smallMs.toFixed(1) + "ms  -> x" + ratio.toFixed(2));
note(ratio < 4, "a 500x larger queue costs x" + ratio.toFixed(2) + " to render, so the " +
  "window is walking the whole queue again");

console.log("\n--- failures ---");
console.log(fails.length ? fails.join("\n") : "none");
process.exit(fails.length ? 1 : 0);
