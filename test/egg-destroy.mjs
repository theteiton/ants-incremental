import { elementFor } from "./dom.mjs";
await import("../js/ui.js");
const G = await import("../js/game.js");
const A = await import("../js/ants.js");

// Sub-batch destroying: trimming n eggs off a batch rather than taking the
// whole run. Open since Akami's report -- the details window worked in runs, so
// a 400-egg batch went whole or not at all.
const bad = [];
const el = elementFor;

function colonyWith(batches) {
  G.hardReset();
  G.shedWings();
  G.game.food = 1e15;
  G.game.emerged = 10;
  G.game.ants.forager = 40;
  // eggs count against the cap, so a colony laying a thousand of them needs the
  // room for a thousand -- and against the brood, so the queue has to be allowed
  G.game.ants.excavator = 400;
  G.game.ants.nurse = 200;
  G.game.peakCastes = { forager: 4000, excavator: 400, nurse: 200, soldier: 300 };
  G.game.run = G.game.run || {};
  G.game.run.peakCastes = Object.assign({}, G.game.peakCastes);
  G.game.run.peakPopulation = 5000;
  G.game.peakPopulation = 5000;
  for (const [caste, n] of batches) G.layEggs(n, caste);
  return G.game.eggs.length;
}

function openDialog() {
  el("btnBroodDetails").fire("click");
}

function setLimit(v) {
  el("broodLimit").value = String(v);
  el("broodLimit").fire("input");
}

console.log("=== SUB-BATCH DESTROYING ===\n");

// a thousand foragers then twenty nurses, the reported case
const total = colonyWith([["forager", 1000], ["nurse", 20]]);
console.log("  queue: " + total + " eggs in two batches");
openDialog();
el("broodScope").value = "waiting";
el("broodScope").fire("change");
el("broodDirection").value = "back";
el("broodDirection").fire("change");

// pick the first waiting run, trim to ten
setLimit(10);
const before = G.game.eggs.length;
const beforeF = A.broodCount(G.game, "forager");
el("broodConfirm").fire("click");
const took = before - G.game.eggs.length;
console.log("  at most 10, reaching back  -> destroyed " + took);
if (took !== 10) bad.push("expected 10 destroyed, got " + took);
if (A.broodCount(G.game, "forager") !== beforeF - 10) {
  bad.push("the ten were not all foragers: forager count moved by " +
    (beforeF - A.broodCount(G.game, "forager")));
}

// no limit still takes the whole reach. The dialog clears the selection after a
// destroy -- correctly, since the eggs it pointed at are gone -- so re-open it.
openDialog();
setLimit("");
const before2 = G.game.eggs.length;
el("broodConfirm").fire("click");
const took2 = before2 - G.game.eggs.length;
// waiting-only is the default scope, so the tended eggs are protected and stay
const tendedLeft = G.game.eggs.length;
console.log("  no limit, reaching back    -> destroyed " + took2 + " of " + before2 +
  ", leaving the " + tendedLeft + " tended");
if (took2 !== before2 - tendedLeft) {
  bad.push("no limit should take every waiting egg: took " + took2 +
    " of " + (before2 - tendedLeft) + " waiting");
}
if (tendedLeft > A.broodCapacity(G.game)) {
  bad.push("more eggs survived than there are tended slots: " + tendedLeft);
}

// reaching forward trims from the picked end instead
colonyWith([["forager", 200], ["nurse", 30]]);
openDialog();
el("broodDirection").value = "forward";
el("broodDirection").fire("change");
setLimit(5);
const before3 = G.game.eggs.length;
el("broodConfirm").fire("click");
const took3 = before3 - G.game.eggs.length;
console.log("  at most 5, reaching ahead  -> destroyed " + took3);
if (took3 !== 5) bad.push("expected 5 destroyed reaching forward, got " + took3);

// garbage in the field must not destroy anything unexpected
colonyWith([["forager", 50]]);
openDialog();
for (const junk of ["abc", "-5", "0", "1.", " "]) {
  const n = G.game.eggs.length;
  setLimit(junk);
  const range = n;
  el("broodConfirm").fire("click");
  const gone = range - G.game.eggs.length;
  // unreadable or zero means "no limit", which is the old behaviour
  if (gone !== range && gone !== 0) bad.push("junk limit " + JSON.stringify(junk) + " destroyed " + gone);
  colonyWith([["forager", 50]]);
  openDialog();
}
console.log("  junk in the field          -> falls back to no limit, never a surprise");

// the tally must not drift, which is the invariant that matters most here
colonyWith([["forager", 300], ["nurse", 40], ["forager", 60]]);
openDialog();
setLimit(37);
el("broodConfirm").fire("click");
let walked = 0;
for (const e of G.game.eggs) if (e.caste === "forager") walked++;
if (A.broodCount(G.game, "forager") !== walked) {
  bad.push("brood tally drifted: cached " + A.broodCount(G.game, "forager") + " walked " + walked);
}
console.log("  brood tally after a trim   -> exact");

console.log("\n--- " + (bad.length ? bad.join("\n") : "sub-batch destroying works") + " ---");
process.exit(bad.length ? 1 : 0);
