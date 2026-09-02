import { elementFor } from "./dom.mjs";
await import("../js/ui.js");
const G = await import("../js/game.js");
const A = await import("../js/ants.js");
const P = await import("../js/prestige.js");

const bad = [];
console.log("=== THE ASSISTANT THROUGH A WHOLE RUN ===");
G.hardReset();
const seen = [];
function look(label) {
  const step = G.tutorialStep();
  const id = step ? step.id : "(quiet)";
  if (seen[seen.length - 1] !== id) {
    seen.push(id);
    console.log("  " + String(A.population(G.game)).padStart(5) + " ants  [" + id + "]" +
      (step ? (step.act ? "  BUTTON: " + step.label : "  (no button)") : "") +
      (step ? "\n           " + step.text.slice(0, 82) : ""));
  }
}
look();
G.shedWings(); look();
for (const u of P.PRESTIGE_UPGRADES) G.game.prestige.upgrades.push(u.id);
G.game.prestige.flightsTaken = 1;
G.game.settings.ratios = { forager: 80, excavator: 0, nurse: 5, soldier: 12 };
for (let t = 0; t < 4 * 3600; t++) {
  G.tick(1);
  if (t % 60 === 0) look();
  if (A.population(G.game) > 4000) break;
}
look();

console.log("\n=== THE BUTTON DOES THE THING, AND ONLY WHEN CLICKED ===");
G.hardReset();
G.game.settings.tutorial = true;
const before = G.game.wingsShed;
elementFor("tabButton-ants").fire("click");
console.log("  step at the very start:", (G.tutorialStep() || {}).id,
  " has a button:", !!(G.tutorialStep() || {}).act);
console.log("  wings shed without touching it:", G.game.wingsShed, "(must be false)");
if (G.game.wingsShed !== before) bad.push("the assistant acted on its own");

// now somewhere it does offer to act
G.shedWings();
for (let t = 0; t < 400; t++) G.tick(1);
let acted = 0;
for (let i = 0; i < 40; i++) {
  const step = G.tutorialStep();
  if (step && step.act) { elementFor("tutorialDo").fire("click"); acted++; }
  G.tick(5);
}
console.log("  clicked its button", acted, "times without an exception");

console.log("\n=== IT NEVER OFFERS SOMETHING IRREVERSIBLE ===");
const unsafe = ["exile", "destroy", "flight", "matriline"];
let offered = [];
for (const s of G.ASSISTANT_STEPS) if (s.act) offered.push(s.id);
console.log("  steps with a button:", offered.join(", "));
for (const id of offered) {
  if (unsafe.some(u => id.includes(u))) bad.push("the assistant offers to " + id);
}
console.log("  flight and matriline are suggestions only:",
  G.ASSISTANT_STEPS.filter(s => ["flight","matriline"].includes(s.id)).every(s => !s.act));

console.log("\n=== THE TOGGLE ===");
G.game.settings.tutorial = false;
console.log("  with it off:", G.tutorialStep());
if (G.tutorialStep() !== null) bad.push("the toggle did not silence it");

console.log("\n  steps seen across the run: " + seen.join(" -> "));
console.log("\n--- failures ---");
console.log(bad.length ? bad.join("\n") : "none");
process.exit(bad.length ? 1 : 0);
