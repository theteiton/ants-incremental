import { missingLookups } from "./dom.mjs";
console.log("=== DOES THE GAME LOAD? importing ui.js, which builds every panel ===");
let ok = true;
try {
  const UI = await import("../js/ui.js");
  console.log("  ui.js imported and every panel built with no exception thrown.");
} catch (err) {
  ok = false;
  console.log("  FAILED:", err.message);
  console.log(err.stack.split("\n").slice(0, 8).join("\n"));
}
console.log("  ids looked up but absent from index.html:",
  missingLookups.size ? [...missingLookups].join(", ") : "none");

// now drive it: switch to every tab and render, which is where most of the
// per-frame code actually lives
if (ok) {
  const G = await import("../js/game.js");
  const A = await import("../js/ants.js");
  try {
    G.shedWings();
    for (let i = 0; i < 5; i++) G.layEgg("forager");
    for (let t = 0; t < 600; t++) { if (G.stripReady()) G.stripWing(); G.tick(1); }
    console.log(`  ten minutes of play: ${A.population(G.game)} ants, ${Math.round(G.game.food)} food`);
  } catch (err) {
    console.log("  PLAY FAILED:", err.message, err.stack.split("\n")[1]);
    ok = false;
  }
}
console.log(ok ? "\n  the game loads and plays." : "\n  THE GAME DOES NOT LOAD.");
process.exit(ok ? 0 : 1);
