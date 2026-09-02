import { elementFor } from "./dom.mjs";
await import("../js/ui.js");
const G = await import("../js/game.js");
const L = await import("../js/library.js");
const P = await import("../js/prestige.js");

const bad = [];
G.hardReset(); G.shedWings();
for (const u of P.PRESTIGE_UPGRADES) G.game.prestige.upgrades.push(u.id);
G.game.prestige.flightsTaken = 3;
G.game.settings.ratios = { forager: 80, excavator: 0, nurse: 5, soldier: 12 };
for (let t = 0; t < 3600; t++) G.tick(1);
elementFor("tabButton-library").fire("click");

console.log("=== PRESSING EACH LIBRARY CATEGORY SHOWS ITS OWN ENTRIES ===");
const tabs = elementFor("libraryTabs").children;
console.log("  tabs built:", tabs.length, "(7 groups + What changed)");
for (const button of tabs) {
  const id = button.dataset.tab;
  button.fire("click");
  elementFor("tabButton-library").fire("click");     // a frame
  const termsHidden = elementFor("libraryPanel-terms").hidden;
  const updatesHidden = elementFor("libraryPanel-updates").hidden;
  const emptyNote = elementFor("libraryEmpty").hidden ? "" : "  (page empty)";
  const known = L.LIBRARY.filter(e => e.group === id && L.entryState(G.game, e) >= 1).length;
  console.log("  " + String(id).padEnd(11) +
    " terms:" + (termsHidden ? "hidden" : "shown ") +
    "  updates:" + (updatesHidden ? "hidden" : "shown ") +
    "  entries here: " + known + emptyNote);
  if (id === "updates") {
    if (!termsHidden || updatesHidden) bad.push("What changed did not swap the panels");
  } else {
    if (termsHidden || !updatesHidden) bad.push(id + " did not show the terms panel");
    if (known > 0 && !elementFor("libraryEmpty").hidden) {
      bad.push(id + " has " + known + " entries but shows the empty note");
    }
  }
}

console.log("\n--- failures ---");
console.log(bad.length ? bad.join("\n") : "none");
process.exit(bad.length ? 1 : 0);
