import fs from "fs";

// Parses the real palette out of style.css so this fails if a theme drifts,
// rather than checking numbers I typed in by hand.
const css = fs.readFileSync(new URL("../style.css", import.meta.url), "utf8");

function paletteFor(header) {
  const start = css.indexOf(header);
  if (start < 0) throw new Error("no block: " + header);
  const block = css.slice(start, css.indexOf("}", start));
  const out = {};
  for (const m of block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) out[m[1]] = m[2];
  return out;
}
const THEMES = {
  dark: paletteFor(":root {"),
  light: paletteFor(':root[data-theme="light"]'),
  soil: paletteFor(':root[data-theme="soil"]')
};

const lum = hex => {
  const c = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16) / 255)
    .map(x => x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// what each control resolves to, and the floor it has to clear.
// 4.5 is WCAG AA for body text; 3.0 is AA for non-text (borders) and large text.
const CASES = [
  ["assistant, Do",            "text",   "panel2", 4.5],
  ["assistant, Do border",     "accent", "panel2", 3.0],
  ["assistant, Dismiss",       "dim",    "panel2", 4.5],
  ["assistant, hovered",       "text",   "hover",  4.5],
  ["species pick, chosen",     "text",   "panel",  4.5],
  ["species pick, resting",    "dim",    "panel",  4.5],
  ["species pick, hovered",    "dim",    "hover",  4.5],
  ["caste choice, selected",   "text",   "panel",  4.5],
  ["caste choice, hovered",    "dim",    "hover",  4.5],
  ["sub-tab, active",          "text",   "panel",  4.5],
  ["sub-tab, hovered",         "dim",    "hover",  4.5],
  ["filled button",            "btn-text", "accent", 3.0]
];

// the declarations these depend on must actually be in the file
const REQUIRED = [
  ".species-pick {\n  background: transparent;",
  ".species-pick.active { color: var(--text); border-color: var(--accent); }",
  ".tutorial button {\n  background: transparent;",
  "#tutorialDo { color: var(--text); border-color: var(--accent); font-weight: 600; }",
  ".tutorial button:hover:not(:disabled)"
];
const missing = REQUIRED.filter(r => !css.includes(r));

console.log("=== CONTRAST, every control against every theme ===\n");
console.log("  control                    floor    dark    light    soil");
const bad = [];
for (const [name, fg, bg, floor] of CASES) {
  const cells = ["dark", "light", "soil"].map(t => {
    const r = ratio(THEMES[t][fg], THEMES[t][bg]);
    if (r < floor) bad.push(name + " in " + t + ": " + r.toFixed(2) + ":1 (needs " + floor + ")");
    return r.toFixed(2) + (r < floor ? "!" : " ");
  });
  console.log("  " + name.padEnd(26) + String(floor).padEnd(8) + cells.map(c => c.padStart(7)).join("  "));
}

console.log("\n  declarations present: " + (missing.length ? "MISSING " + missing.length : "all " + REQUIRED.length));
for (const m of missing) console.log("    - " + m.split("\n")[0]);

// and nothing may paint a variable onto itself
const selfPaint = [];
for (const m of css.matchAll(/([^\n{}]+)\{([^}]*)\}/g)) {
  const body = m[2];
  const col = body.match(/[^-]color:\s*var\(--([\w-]+)\)/);
  const bgv = body.match(/background:\s*var\(--([\w-]+)\)/);
  if (col && bgv && col[1] === bgv[1]) selfPaint.push(m[1].trim() + " paints --" + col[1] + " on itself");
}
console.log("  same colour as its own background: " + (selfPaint.length ? selfPaint.join("; ") : "none"));

console.log("\n--- " + (bad.length || missing.length ? "FAILURES\n" + bad.join("\n") : "every control clears its floor in all three themes") + " ---");
process.exit(bad.length || missing.length ? 1 : 0);
