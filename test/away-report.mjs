import { elementFor } from "./dom.mjs";
await import("../js/ui.js");
const G = await import("../js/game.js");
const A = await import("../js/ants.js");
const P = await import("../js/prestige.js");

const fails = [];
const note = (ok, m) => { if (!ok) fails.push(m); };

function beAwayFor(hours, setup) {
  G.hardReset();
  G.shedWings();
  for (const u of P.PRESTIGE_UPGRADES) G.game.prestige.upgrades.push(u.id);
  G.game.prestige.flightsTaken = 1;
  G.game.settings.ratios = { forager: 80, excavator: 0, nurse: 5, soldier: 12 };
  for (let t = 0; t < 3600; t++) G.tick(1);
  if (setup) setup();
  G.save();
  G.game.lastSave = Date.now() - hours * 3600 * 1000;
  const code = G.exportSave();
  // exportSave() re-stamps lastSave, so rewind the stored copy instead
  const raw = JSON.parse(Buffer.from(code, "base64").toString("utf8"));
  raw.lastSave = Date.now() - hours * 3600 * 1000;
  G.importSave(Buffer.from(JSON.stringify(raw), "utf8").toString("base64"));
  return G.lastAway;
}

console.log("=== COMING BACK AFTER BEING AWAY ===");
for (const hours of [0.01, 0.2, 2, 8, 30]) {
  const away = beAwayFor(hours);
  if (!away) { console.log(`  ${String(hours).padStart(5)}h  no report (under a minute)`); continue; }
  console.log(`  ${String(hours).padStart(5)}h  worked ${(away.seconds/3600).toFixed(2)}h` +
    ` of ${(away.requested/3600).toFixed(2)}h  capped=${away.capped}` +
    `  +${Math.round(away.food)} food, ${away.hatched} hatched,` +
    ` ${away.popBefore}->${away.popAfter} ants, ${away.won}W/${away.lost}L`);
  note(away.seconds <= away.cap + 1, hours + "h: worked longer than the cap");
  note(away.requested >= away.seconds - 1, hours + "h: requested less than worked");
  note(Number.isFinite(away.food) && away.food >= 0, hours + "h: bad food figure");
  note(away.popAfter >= 0, hours + "h: bad population");
}

console.log("\n=== THE WINDOW ITSELF ===");
const away = beAwayFor(30);
// the first render opens it
elementFor("tabButton-ants").fire("click");
const modal = elementFor("awayModal");
console.log("  opened:", !modal.hidden);
console.log("  span  :", elementFor("awaySpan").textContent);
console.log("  cap   :", elementFor("awayCapNote").hidden ? "(not shown)" : elementFor("awayCapNote").textContent);
console.log("  clock :", elementFor("awayClock").textContent);
console.log("  rows  :", elementFor("awayRows").children.filter(r => !r.hidden).length, "shown");
note(!modal.hidden, "the window did not open after a 30h absence");
note(!elementFor("awayCapNote").hidden, "a capped absence did not say so");

// skip finishes the sweep, close hides it, and it must not reopen
elementFor("awaySkip").fire("click");
console.log("  after skip, clock:", elementFor("awayClock").textContent);
elementFor("awayClose").fire("click");
console.log("  closed:", modal.hidden);
elementFor("tabButton-ants").fire("click");
console.log("  stays closed on the next render:", modal.hidden);
note(modal.hidden, "the window reopened after being closed");

console.log("\n=== THE SETTING TURNS IT OFF ===");
beAwayFor(30, () => { G.game.settings.awayReport = false; });
elementFor("awayModal").hidden = true;
elementFor("tabButton-ants").fire("click");
console.log("  with the setting off, opened:", !elementFor("awayModal").hidden);
note(elementFor("awayModal").hidden, "the window opened with the setting off");

console.log("\n=== A SHORT ABSENCE DOES NOT NAG ===");
beAwayFor(0.05);   // three minutes, under the five-minute floor
elementFor("awayModal").hidden = true;
elementFor("tabButton-ants").fire("click");
console.log("  after 3 minutes, opened:", !elementFor("awayModal").hidden);
note(elementFor("awayModal").hidden, "the window opened for a three-minute absence");

console.log("\n--- failures ---");
console.log(fails.length ? fails.join("\n") : "none");
process.exit(fails.length ? 1 : 0);
