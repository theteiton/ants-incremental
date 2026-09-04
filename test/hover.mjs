// The inspector watches nearly everything, and a note is a closure -- so a
// symbol that is not in scope there throws only when a player points at it.
// That is exactly how "game is not defined" shipped on the instinct cards:
// nothing else in the suite ever fired a mouseenter.
import { elementFor, allIds, descendants } from "./dom.mjs";
await import("../js/ui.js");
const G = await import("../js/game.js");
const g = G.game;
G.hardReset();
g.ants.forager = 2000; g.ants.soldier = 300; g.ants.nurse = 100; g.ants.excavator = 100;
g.ants.guard = 20; g.ants.bigforager = 3; g.bigForagers = [10, 200, 900];
g.peakPopulation = 5000; g.run.peakPopulation = 5000; g.stats.playtime = 9000;
g.achievementLevel = 30; g.achievementPoints = 400;
g.matriline.finished = ["atta", "solenopsis"];
g.prestige.flightsTaken = 3;
G.openHunt();

const fails = [];
let hovered = 0;
const seen = new Set();
function sweep(where) {
  for (const id of allIds()) {
    const root = elementFor(id);
    if (!root) continue;
    for (const node of [root, ...descendants(root)]) {
      if (seen.has(node)) continue;
      seen.add(node);
      if (!node.hasHandler || !node.hasHandler("mouseenter")) continue;
      hovered++;
      try { node.fire("mouseenter"); }
      catch (e) {
        if (!fails.some(f => f.msg === e.message)) fails.push({ msg: e.message, where });
      }
    }
  }
}
for (const b of allIds().filter(i => i.startsWith("tabButton-"))) {
  elementFor(b).fire("click");
  sweep(b);
  for (const barId of ["settingsTabs", "achievementTabs", "combatTabs", "upgradeTabs", "libraryTabs"]) {
    const bar = elementFor(barId);
    if (!bar) continue;
    for (const sub of bar.children) { try { sub.fire("click"); } catch (e) {} sweep(b + "/" + barId); }
  }
}
console.log("  hovered " + hovered + " watched elements across every tab");
console.log(fails.length ? "  FAILURES:" : "  no hover threw");
for (const f of fails) console.log("    " + f.where + " -> " + f.msg);
process.exit(fails.length ? 1 : 0);
