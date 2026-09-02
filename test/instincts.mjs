import { elementFor } from "./dom.mjs";
await import("../js/ui.js");
const G = await import("../js/game.js");
const P = await import("../js/prestige.js");

G.hardReset(); G.shedWings();
for (const u of P.PRESTIGE_UPGRADES) G.game.prestige.upgrades.push(u.id);
G.game.prestige.flightsTaken = 2;
G.game.settings.ratios = { forager: 80, excavator: 0, nurse: 5, soldier: 12 };
for (let t = 0; t < 900; t++) G.tick(1);

elementFor("tabButton-achievements").fire("click");
elementFor("achievementTabs").children[2].fire("click");
elementFor("tabButton-achievements").fire("click");

const tail = () => elementFor("instinctIntro").textContent.slice(-62);

console.log("=== THE INSTINCTS PAGE ===\n");
console.log(elementFor("instinctIntro").textContent);

const pts = G.instinctPoints(G.game);
console.log("\ncost line on each card:");
for (const inst of G.INSTINCTS) {
  const afford = pts >= inst.cost;
  console.log("  " + inst.name.padEnd(17) +
    (afford ? "Click to buy - " + inst.cost + " points"
            : inst.cost + " points, " + (inst.cost - pts) + " more needed"));
}

console.log("\n=== CLICKING A CARD BUYS IT ===");
console.log("  before:        " + tail());
console.log("  level before:  " + G.game.achievementLevel);
elementFor("instinctList").children[0].fire("click");   // Deep Chambers, 8
elementFor("tabButton-achievements").fire("click");
console.log("  after a click: " + tail());
console.log("  level after:   " + G.game.achievementLevel + "   (must be unchanged)");
console.log("  held:          " + JSON.stringify(G.game.instincts));

console.log("\n=== WHEN YOU CANNOT AFFORD ONE ===");
G.hardReset();
G.checkAchievements();
const few = G.instinctPoints(G.game);
console.log("  a brand new colony has " + few + " points");
for (const inst of G.INSTINCTS.slice(0, 3)) {
  console.log("    " + inst.name.padEnd(17) +
    (few >= inst.cost ? "Click to buy - " + inst.cost + " points"
                      : inst.cost + " points, " + (inst.cost - few) + " more needed"));
}
process.exit(0);
