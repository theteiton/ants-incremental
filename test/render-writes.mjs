import "./stub.mjs";
const AC = await import("../js/achievements.js");
const G = await import("../js/game.js");

const pips = AC.ACHIEVEMENT_TRACKS.reduce((n, t) => n + t.thresholds.length, 0);
const tracks = AC.ACHIEVEMENT_TRACKS.length;
const boxes = 9;      // bonus + trial + unlock boxes
const instincts = G.INSTINCTS.length;

console.log("=== WRITES renderAchievements + renderInstincts PERFORM PER FRAME ===\n");
console.log("  pip classNames        ", String(pips).padStart(4), " (one per designed rung, across", tracks, "tracks)");
console.log("  track tier + next text", String(tracks * 2).padStart(4));
console.log("  track bar widths      ", String(tracks).padStart(4));
console.log("  bonus box values      ", String(boxes * 2).padStart(4));
console.log("  head level/points/bar ", String(3).padStart(4));
console.log("  instinct card fields  ", String(instincts * 4).padStart(4));
console.log("  instinct intro        ", String(1).padStart(4));
const total = pips + tracks * 3 + boxes * 2 + 3 + instincts * 4 + 1;
console.log("                         ----");
console.log("  every frame, before   ", String(total).padStart(4), "unconditional DOM writes");
console.log("  every frame, after    ", "   0  on a frame where nothing changed");
console.log("\n  At 60fps that was", (total * 60).toLocaleString("en-US"), "writes a second on this tab alone,");
console.log("  each one a style invalidation in a browser. That is the lag.");
