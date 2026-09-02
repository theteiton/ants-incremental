import "./stub.mjs";
import fs from "fs";

import { fileURLToPath } from "node:url";
// resolved from this file, so the harness runs from anywhere -- and via
// fileURLToPath rather than .pathname, which URL-encodes the space in the path
const ROOT = fileURLToPath(new URL("../", import.meta.url));
const fails = [];
const note = (ok, m) => { if (!ok) fails.push(m); };

const A = await import("../js/ants.js");
const C = await import("../js/challenges.js");
const S = await import("../js/species.js");
const M = await import("../js/matriline.js");
const I = await import("../js/instincts.js");
const L = await import("../js/library.js");
const AC = await import("../js/achievements.js");
const P = await import("../js/prestige.js");
const G = await import("../js/game.js");

console.log("=== DATA TABLES: unique ids, required fields ===");
function uniq(label, list, key) {
  const seen = new Set();
  for (const item of list) {
    const id = item[key];
    note(!!id, `${label}: an entry has no ${key}`);
    note(!seen.has(id), `${label}: duplicate ${key} "${id}"`);
    seen.add(id);
  }
  console.log(`  ${label.padEnd(22)} ${list.length} entries, ${seen.size} unique`);
}
uniq("UPGRADES", A.UPGRADES, "id");
uniq("SPECIES", S.SPECIES, "id");
uniq("MATRILINE_UPGRADES", M.MATRILINE_UPGRADES, "id");
uniq("INSTINCTS", I.INSTINCTS, "id");
uniq("CHALLENGES", C.CHALLENGES, "id");
uniq("LIBRARY", L.LIBRARY, "id");
uniq("PRESTIGE_UPGRADES", P.PRESTIGE_UPGRADES, "id");
uniq("ACHIEVEMENT_TRACKS", AC.ACHIEVEMENT_TRACKS, "id");
uniq("UPDATES", L.UPDATES, "version");

console.log("\n=== MATRILINE NODES ARE WELL FORMED ===");
const SPECIES_IDS = new Set(S.SPECIES.map(s => s.id));
for (const u of M.MATRILINE_UPGRADES) {
  note(u.cost > 0, `${u.id}: no cost`);
  note(!!u.desc, `${u.id}: no description`);
  note(["inheritance", "expression", "species"].indexOf(u.group) >= 0, `${u.id}: unknown group ${u.group}`);
  if (u.group === "species") note(SPECIES_IDS.has(u.species), `${u.id}: unknown species ${u.species}`);
  else note(!u.species, `${u.id}: non-species node tagged with a species`);
}
// a species node key shared with ANOTHER species must be covered by the species
// check, which it is -- but a key shared inside one species is a silent stack
const byKey = {};
for (const u of M.MATRILINE_UPGRADES) {
  if (u.group !== "species") continue;
  const k = u.effect.key;
  (byKey[k] = byKey[k] || []).push(u.species);
}
for (const k in byKey) {
  const shared = [...new Set(byKey[k])];
  if (shared.length > 1) console.log(`  key "${k}" shared by ${shared.join(", ")} — covered by the species check`);
}
console.log(`  ${M.MATRILINE_UPGRADES.length} nodes, ${M.MATRILINE_UPGRADES.filter(u => u.group === "species").length} in species branches`);
for (const s of S.SPECIES) {
  const branch = M.speciesBranch(s.id);
  note(branch.length === 4, `${s.id}: ${branch.length} branch nodes, expected 4`);
}

console.log("\n=== INSTINCTS ARE WELL FORMED ===");
const KINDS = new Set(["baseCap", "brood", "combat", "protein", "hatch", "offlineHours", "keepFood"]);
for (const i of I.INSTINCTS) {
  note(i.cost > 0, `${i.id}: no cost`);
  note(!!i.desc, `${i.id}: no description`);
  note(KINDS.has(i.effect.type), `${i.id}: unknown effect type ${i.effect.type}`);
}
console.log(`  ${I.INSTINCTS.length} instincts, ${I.INSTINCTS.reduce((n, i) => n + i.cost, 0)} points to buy them all`);

console.log("\n=== SPECIES ARE WELL FORMED ===");
for (const s of S.SPECIES) {
  for (const field of ["name", "latin", "flavour", "activeText", "passiveName", "passiveText"]) {
    note(!!s[field], `${s.id}: missing ${field}`);
  }
  note(!!S.PASSIVE_KINDS[s.passive.kind], `${s.id}: unknown passive kind ${s.passive.kind}`);
  note(Object.keys(s.active).length > 0, `${s.id}: no active effect at all`);
}
console.log(`  ${S.SPECIES.length} species, all with an active and a passive`);

console.log("\n=== CSS VARIABLES: every var() used is defined in every theme ===");
const css = fs.readFileSync(ROOT + "style.css", "utf8");
const used = new Set([...css.matchAll(/var\((--[a-z0-9-]+)\)/g)].map(m => m[1]));
const themes = [...css.matchAll(/:root(\[data-theme="[a-z]+"\])?\s*\{([^}]*)\}/g)];
const defined = {};
for (const t of themes) {
  const label = t[1] || ":root";
  defined[label] = new Set([...t[2].matchAll(/(--[a-z0-9-]+)\s*:/g)].map(m => m[1]));
}
const base = defined[":root"] || new Set();
for (const v of used) note(base.has(v), `css: var(${v}) is used but never defined on :root`);
for (const label in defined) {
  if (label === ":root") continue;
  const missing = [...base].filter(v => !defined[label].has(v));
  console.log(`  ${label.padEnd(26)} redefines ${defined[label].size} of ${base.size}` +
    (missing.length ? `  (inherits ${missing.length})` : ""));
}
console.log(`  ${used.size} variables used, ${base.size} defined on :root`);

console.log("\n=== EVERY IMPORT IN EVERY MODULE RESOLVES ===");
const files = fs.readdirSync(ROOT + "js").filter(f => f.endsWith(".js"));
let missing = 0;
for (const file of files) {
  const src = fs.readFileSync(ROOT + "js/" + file, "utf8");
  const re = /import\s*\{([^}]*)\}\s*from\s*"\.\/([a-z]+\.js)"/g;
  let m;
  while ((m = re.exec(src))) {
    const mod = await import("../js/" + m[2]);
    for (const raw of m[1].split(",")) {
      const name = raw.trim().split(/\s+as\s+/)[0];
      if (!name) continue;
      if (!(name in mod)) { console.log(`  MISSING: ${file} imports ${name} from ${m[2]}`); missing++; }
    }
  }
}
note(missing === 0, missing + " unresolved imports");
console.log(`  ${files.length} modules checked, ${missing} unresolved`);

console.log("\n--- failures ---");
console.log(fails.length ? fails.join("\n") : "none");
process.exit(fails.length ? 1 : 0);
