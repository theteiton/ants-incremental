import { elementFor } from "./dom.mjs";
await import("../js/ui.js");
const G = await import("../js/game.js");
const A = await import("../js/ants.js");
const P = await import("../js/prestige.js");

const bad = [];
G.hardReset(); G.shedWings();
for (const u of P.PRESTIGE_UPGRADES) G.game.prestige.upgrades.push(u.id);
G.game.prestige.flightsTaken = 3;
G.game.settings.ratios = { forager: 80, excavator: 0, nurse: 5, soldier: 12 };
for (let t = 0; t < 3600; t++) G.tick(1);
elementFor("tabButton-ants").fire("click");

console.log("=== WHAT EACH TAB DOT SAYS ===");
for (const id of ["badge-upgrades", "badge-achievements", "badge-prestige",
                  "badge-library", "badge-matriline"]) {
  const n = elementFor(id);
  console.log("  " + id.padEnd(22) + (n.hidden ? "hidden" : 'shows "' + n.textContent + '"'));
  if (!n.hidden && !/^\d+$|^99\+$/.test(n.textContent)) {
    bad.push(id + " shows " + JSON.stringify(n.textContent) + " rather than a count");
  }
}

console.log("\n=== OPENING A TAB CLEARS ITS DOT ===");
elementFor("tabButton-upgrades").fire("click");
console.log("  upgrades dot after opening Upgrades:",
  elementFor("badge-upgrades").hidden ? "hidden" : "still showing");
if (!elementFor("badge-upgrades").hidden) bad.push("the upgrades dot did not clear");

console.log("\n=== SUB-TAB DOTS ===");
elementFor("tabButton-achievements").fire("click");
for (const b of elementFor("achievementTabs").children) {
  const badge = b.children[0];
  console.log("  " + String(b.dataset.tab).padEnd(12) +
    (badge && !badge.hidden ? 'shows "' + badge.textContent + '"' : "hidden"));
}

console.log("\n=== A BIG COUNT IS CLAMPED ===");
const node = elementFor("badge-library");
G.game.seen.library = 0;
elementFor("tabButton-ants").fire("click");
console.log("  library unread:", G.libraryUnread ? "n/a" : "");
console.log("  badge shows:", JSON.stringify(node.textContent), " (never wider than 99+)");
if (node.textContent.length > 3) bad.push("badge text is wider than 99+");

console.log("\n--- failures ---");
console.log(bad.length ? bad.join("\n") : "none");
process.exit(bad.length ? 1 : 0);
