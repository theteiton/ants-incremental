import { elementFor, descendants, missingLookups } from "./dom.mjs";
await import("../js/ui.js");
const G = await import("../js/game.js");
const A = await import("../js/ants.js");

const fails = [];
function tryIt(label, fn) {
  try { fn(); } catch (err) { fails.push(label + " -> " + err.message + "  @ " + (err.stack.split("\n")[1] || "").trim()); }
}

// build a real colony so the panels have something to render
G.shedWings();
for (const u of (await import("../js/prestige.js")).PRESTIGE_UPGRADES) {
  if (G.game.prestige.upgrades.indexOf(u.id) < 0) G.game.prestige.upgrades.push(u.id);
}
G.game.prestige.flightsTaken = 2;
G.game.settings.ratios = { forager: 80, excavator: 0, nurse: 5, soldier: 12 };
for (let t = 0; t < 4 * 3600; t++) G.tick(1);
console.log(`colony for the test: ${A.population(G.game)} ants, level ${G.game.achievementLevel}, ${G.game.achievementPoints} tiers`);

const TABS = ["ants", "upgrades", "combat", "achievements", "prestige", "matriline", "challenges", "library", "settings"];
console.log("\n=== CLICKING EVERY TAB AND RENDERING IT ===");
for (const tab of TABS) {
  const button = elementFor("tabButton-" + tab);
  if (!button) { fails.push("no tab button for " + tab); continue; }
  tryIt("tab " + tab, () => button.fire("click"));
  console.log(`  ${tab.padEnd(13)} ok`);
}

console.log("\n=== EVERY SUB-TAB ===");
for (const bar of ["achievementTabs", "matTabs", "combatTabs", "settingsTabs", "libraryTabs", "upgradeFilters"]) {
  const node = elementFor(bar);
  if (!node) { console.log(`  ${bar.padEnd(16)} (absent)`); continue; }
  let n = 0;
  for (const child of node.children) { tryIt(bar + " child " + n, () => child.fire("click")); n++; }
  console.log(`  ${bar.padEnd(16)} ${n} buttons clicked`);
}

console.log("\n=== EVERY CARD IN EVERY LIST ===");
for (const list of ["upgradeList", "matUpgradeList", "matSpeciesList", "matPickList",
                    "instinctList", "prestigeUpgradeList", "challengeList", "casteList",
                    "bonusList", "achievementList", "libraryList", "updatesList", "rankList"]) {
  const node = elementFor(list);
  if (!node) { console.log(`  ${list.padEnd(20)} (absent)`); continue; }
  const kids = descendants(node);
  let clicked = 0;
  for (const k of kids) { if (k.hasHandler && k.hasHandler("click")) { tryIt(list + " card", () => k.fire("click")); clicked++; } }
  console.log(`  ${list.padEnd(20)} ${kids.length} nodes, ${clicked} clickable fired`);
}

console.log("\n=== RE-RENDER EVERY TAB AFTER ALL THAT ===");
for (const tab of TABS) {
  const button = elementFor("tabButton-" + tab);
  if (button) tryIt("re-render " + tab, () => button.fire("click"));
}
console.log("  done");

console.log("\n  ids looked up but absent:", missingLookups.size ? [...missingLookups].join(", ") : "none");
console.log("\n--- failures ---");
console.log(fails.length ? fails.slice(0, 20).join("\n") : "none");
process.exit(fails.length ? 1 : 0);
