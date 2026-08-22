import { ACHIEVEMENT_FOOD_PER_LEVEL, ACHIEVEMENT_HATCH_PER_LEVEL, population, UPGRADES, upgradeBranch } from "./ants.js";
import { autoShedOn, autoShedUnlocked } from "./game.js";
import { bigForagerBonus, BIG_FORAGER_PRESTIGE_MULT } from "./ants.js";
import { fmt, watch } from "./panels.js";

const el = id => document.getElementById(id);

export const POINTS_PER_LEVEL = 5;
export const MAX_ACHIEVEMENT_LEVEL = 20;

const DECADES = (from, to) => {
  const out = [];
  for (let e = from; e <= to; e++) out.push(Math.pow(10, e));
  return out;
};

const STEPS = (list, from, to) => list.concat(DECADES(from, to));

// widening steps that finish exactly on the number of upgrades that exist
export function upgradeSteps(total) {
  const steps = [];
  let value = 1;
  let gap = 2;
  while (value < total) {
    steps.push(value);
    value += gap;
    gap += 2;
  }
  if (steps[steps.length - 1] !== total) steps.push(total);
  return steps;
}

function peakOf(game, caste) {
  const peaks = game.peakCastes || {};
  return Math.max(peaks[caste] || 0, game.ants[caste] || 0);
}

// reads the most upgrades ever held, not the live count — a nuptial flight
// clears game.upgrades, and without this the tracks lose tiers and the
// achievement level drops, which no other track can do
function ownedIn(game, branch) {
  let owned = 0;
  for (const id of game.upgrades) {
    const upgrade = UPGRADE_INDEX[id];
    if (!upgrade) continue;
    if (!branch || (upgrade.branch || "colony") === branch) owned++;
  }
  const peaks = game.peakUpgrades || {};
  return Math.max(owned, peaks[branch || "all"] || 0);
}

const UPGRADE_INDEX = {};
const BRANCH_TOTALS = { all: UPGRADES.length, colony: 0, combat: 0 };
for (const upgrade of UPGRADES) {
  UPGRADE_INDEX[upgrade.id] = upgrade;
  BRANCH_TOTALS[upgradeBranch(upgrade)]++;
}

export const ACHIEVEMENT_TRACKS = [
  { id: "population", name: "Colony size", unit: "ants",
    desc: "The largest colony you have raised.",
    value: g => Math.max(g.peakPopulation || 0, population(g)),
    thresholds: STEPS([1, 5, 10, 25, 50, 100, 250, 500], 3, 12) },

  { id: "food", name: "Food gathered", unit: "food",
    desc: "Every crumb the colony has ever brought home.",
    value: g => g.stats.foodEarned,
    thresholds: DECADES(2, 24) },

  { id: "eggs", name: "Eggs hatched", unit: "eggs",
    desc: "Workers raised from egg to adult.",
    value: g => g.stats.eggsHatched,
    thresholds: STEPS([10, 50], 2, 12) },

  { id: "forager", name: "Foragers", unit: "foragers",
    desc: "The most foragers the colony has held at once.",
    value: g => peakOf(g, "forager"),
    thresholds: STEPS([5, 25, 50, 100, 250, 500], 3, 10) },

  { id: "excavator", name: "Excavators", unit: "excavators",
    desc: "The most diggers the colony has held at once.",
    value: g => peakOf(g, "excavator"),
    thresholds: STEPS([3, 10, 25, 50], 2, 8) },

  { id: "nurse", name: "Nurses", unit: "nurses",
    desc: "The most nurses the colony has held at once.",
    value: g => peakOf(g, "nurse"),
    thresholds: STEPS([3, 10, 25, 50], 2, 8) },

  { id: "bigforager", name: "Big Foragers", unit: "big foragers",
    desc: "Oversized foragers that hatched by chance.",
    value: g => peakOf(g, "bigforager"),
    thresholds: [1, 2, 3, 5, 8, 12, 20, 30, 50, 80] },

  { id: "soldier", name: "Soldiers", unit: "soldiers",
    desc: "The standing army at its largest.",
    value: g => peakOf(g, "soldier"),
    thresholds: STEPS([1, 5, 10, 25, 50], 2, 8) },

  { id: "raids", name: "Raids won", unit: "raids",
    desc: "Attackers killed at the nest gate.",
    value: g => Math.max(g.raidsWon || 0, (g.stats && g.stats.raidsWonTotal) || 0),
    thresholds: STEPS([1, 3, 5, 10, 25, 50], 2, 7) },

  { id: "strength", name: "Fighting strength", unit: "strength",
    desc: "The most fighting strength the colony has fielded.",
    value: g => g.peakStrength || 0,
    thresholds: STEPS([25, 100, 500], 3, 12) },

  { id: "protein", name: "Protein gathered", unit: "protein",
    desc: "Everything the soldiers have dragged home.",
    value: g => g.stats.proteinEarned || 0,
    thresholds: STEPS([10, 50], 2, 12) },

  { id: "upgrades", name: "Upgrades bought", unit: "upgrades",
    desc: "Every adaptation the colony has paid for.",
    value: g => ownedIn(g, null),
    thresholds: upgradeSteps(BRANCH_TOTALS.all) },

  { id: "upgrades_colony", name: "Colony upgrades", unit: "colony upgrades",
    desc: "Adaptations from the Colony branch.",
    value: g => ownedIn(g, "colony"),
    thresholds: upgradeSteps(BRANCH_TOTALS.colony) },

  { id: "upgrades_combat", name: "Combat upgrades", unit: "combat upgrades",
    desc: "Adaptations from the Combat branch.",
    value: g => ownedIn(g, "combat"),
    thresholds: upgradeSteps(BRANCH_TOTALS.combat) },

  { id: "flights", name: "Nuptial flights", unit: "flights",
    desc: "Times the queen has taken wing and founded a new colony.",
    value: g => (g.prestige && g.prestige.flightsTaken) || 0,
    thresholds: [1, 2, 3, 5, 10, 20, 35, 50] },

  { id: "royal_jelly", name: "Royal jelly gathered", unit: "royal jelly",
    desc: "Total royal jelly earned across all flights.",
    value: g => (g.prestige && g.prestige.royalJellyTotal) || 0,
    thresholds: [1, 2, 5, 10, 25, 50, 100, 250] }
];

export function trackTier(game, track) {
  const value = track.value(game);
  let tier = 0;
  while (tier < track.thresholds.length && value >= track.thresholds[tier]) tier++;
  return tier;
}

export function trackNext(game, track) {
  const tier = trackTier(game, track);
  return tier < track.thresholds.length ? track.thresholds[tier] : null;
}

export function trackProgress(game, track) {
  const next = trackNext(game, track);
  if (next === null) return 1;
  const tier = trackTier(game, track);
  const floor = tier > 0 ? track.thresholds[tier - 1] : 0;
  return Math.max(0, Math.min(1, (track.value(game) - floor) / (next - floor)));
}

export function totalTiers(game) {
  let total = 0;
  for (const track of ACHIEVEMENT_TRACKS) total += trackTier(game, track);
  return total;
}

export function trackSeenTier(game, track) {
  const seen = game.seen.tracks;
  return seen ? seen[track.id] || 0 : trackTier(game, track);
}

export function trackIsNew(game, track) {
  return trackTier(game, track) > trackSeenTier(game, track);
}

export function newTrackCount(game) {
  let count = 0;
  for (const track of ACHIEVEMENT_TRACKS) if (trackIsNew(game, track)) count++;
  return count;
}

export function markTrackSeen(game, track) {
  if (game.seen.tracks) game.seen.tracks[track.id] = trackTier(game, track);
}

// a save written before per-track dots existed has nothing to compare against;
// treat everything already earned as already seen rather than lighting all fourteen
export function seedSeenTracks(game) {
  if (game.seen.tracks) return;
  const seen = {};
  for (const track of ACHIEVEMENT_TRACKS) seen[track.id] = trackTier(game, track);
  game.seen.tracks = seen;
}

export function achievementLevelFor(points) {
  return Math.min(MAX_ACHIEVEMENT_LEVEL, Math.floor(points / POINTS_PER_LEVEL));
}

export function levelPoints(level) {
  return POINTS_PER_LEVEL * level;
}

const trackRows = {};

const ACH_TABS = [
  { id: "tracks", name: "Tracks" },
  { id: "bonuses", name: "Bonuses" }
];
let achTab = "tracks";

// the standing bonuses every achievement level pays, and what a flight unlocks
const BONUS_BOXES = [
  { id: "food", name: "Colony appetite",
    desc: "Every achievement level feeds the whole colony better.",
    value: game => "+" + Math.round(ACHIEVEMENT_FOOD_PER_LEVEL * game.achievementLevel * 100) + "% food",
    note: game => "Level " + game.achievementLevel + " of " + MAX_ACHIEVEMENT_LEVEL +
      ", worth " + Math.round(ACHIEVEMENT_FOOD_PER_LEVEL * 100) + "% each. It multiplies every caste at once." },
  { id: "hatch", name: "Warm brood",
    desc: "Levels also shorten how long an egg takes to develop.",
    value: game => "+" + Math.round(ACHIEVEMENT_HATCH_PER_LEVEL * game.achievementLevel * 100) + "% hatch speed",
    note: game => "Level " + game.achievementLevel + " of " + MAX_ACHIEVEMENT_LEVEL +
      ", worth " + Math.round(ACHIEVEMENT_HATCH_PER_LEVEL * 100) + "% each. Incubation is 24s divided by this." }
];

const UNLOCK_BOXES = [
  { id: "bigforager", name: "Raised on royal jelly",
    desc: "The colony finally knows how to feed an oversized forager.",
    unlocked: game => bigForagerBonus(game) > 1,
    value: game => bigForagerBonus(game) > 1
      ? BIG_FORAGER_PRESTIGE_MULT + "× big forager food" : "Locked",
    note: game => bigForagerBonus(game) > 1
      ? "Every big forager gathers " + BIG_FORAGER_PRESTIGE_MULT +
        " times what she did. They stop being a curiosity and carry the colony until the deep forager upgrades land."
      : "Locked until your first nuptial flight." },
  { id: "autoshed", name: "Instinct to shed",
    desc: "She has landed before. She sheds her wings without being told.",
    unlocked: () => autoShedUnlocked(),
    value: () => autoShedUnlocked() ? (autoShedOn() ? "On" : "Off") : "Locked",
    note: () => autoShedUnlocked()
      ? "Unlocked — shedding her wings is automatic. Turn it on or off under Automation in Settings."
      : "Locked until your first nuptial flight." }
];

const bonusBoxes = {};

function buildBox(list, entry, game) {
  const box = document.createElement("div");
  box.className = "bonus-box";
  box.innerHTML = '<b></b><span class="bonus-value"></span><span class="bonus-note"></span>';
  box.querySelector("b").textContent = entry.name;
  box.querySelector(".bonus-note").textContent = entry.desc;
  watch(box, { title: entry.name, body: entry.desc, note: () => entry.note(game) });
  bonusBoxes[entry.id] = { box, value: box.querySelector(".bonus-value") };
  list.appendChild(box);
}

export function selectAchievementTab(name) {
  achTab = name;
  el("achievementPanel-tracks").hidden = name !== "tracks";
  el("achievementPanel-bonuses").hidden = name !== "bonuses";
  for (const button of el("achievementTabs").children) {
    button.classList.toggle("active", button.dataset.tab === name);
  }
}

export function buildAchievements(game) {
  ACH_TABS.forEach(tab => {
    const button = document.createElement("button");
    button.textContent = tab.name;
    button.dataset.tab = tab.id;
    button.onclick = () => selectAchievementTab(tab.id);
    el("achievementTabs").appendChild(button);
  });
  BONUS_BOXES.forEach(entry => buildBox(el("bonusList"), entry, game));
  UNLOCK_BOXES.forEach(entry => buildBox(el("unlockList"), entry, game));
  selectAchievementTab("tracks");
  buildTracks(game);
}

function buildTracks(game) {
  const list = el("achievementList");
  ACHIEVEMENT_TRACKS.forEach(track => {
    const row = document.createElement("li");
    row.className = "track";
    row.innerHTML =
      '<span class="track-head"><span class="track-name"><b></b>' +
      '<span class="track-dot" hidden></span></span><span class="track-tier"></span></span>' +
      '<span class="track-pips"></span>' +
      '<span class="bar"><i></i></span>' +
      '<span class="track-next"></span>';
    row.querySelector("b").textContent = track.name;
    const pips = row.querySelector(".track-pips");
    track.thresholds.forEach(() => pips.appendChild(document.createElement("i")));
    watch(row, {
      title: track.name,
      body: track.desc,
      note: () => {
        const next = trackNext(game, track);
        const tier = trackTier(game, track);
        const earned = track.thresholds.slice(0, tier).map(fmt);
        const listed = earned.length > 6 ? "…, " + earned.slice(-6).join(", ") : earned.join(", ");
        const done = tier === 0
          ? "No tiers yet."
          : tier + (tier === 1 ? " tier: " : " tiers: ") + listed + ".";
        if (next === null) return done + " Every tier on this track is earned.";
        return done + " Tier " + (tier + 1) + " at " + fmt(next) + " " + track.unit +
          " — you have " + fmt(track.value(game)) + ".";
      }
    });
    const clearDot = () => markTrackSeen(game, track);
    row.addEventListener("mouseenter", clearDot);
    row.addEventListener("click", clearDot);
    trackRows[track.id] = {
      row,
      dot: row.querySelector(".track-dot"),
      pips,
      tier: row.querySelector(".track-tier"),
      bar: row.querySelector(".bar i"),
      next: row.querySelector(".track-next")
    };
    list.appendChild(row);
  });
}

export function renderAchievements(game) {
  ACHIEVEMENT_TRACKS.forEach(track => {
    const ui = trackRows[track.id];
    const tier = trackTier(game, track);
    const next = trackNext(game, track);
    const fresh = trackIsNew(game, track);
    ui.row.classList.toggle("maxed", next === null);
    ui.row.classList.toggle("fresh", fresh);
    ui.dot.hidden = !fresh;
    for (let i = 0; i < ui.pips.children.length; i++) {
      ui.pips.children[i].className = i < tier ? "earned" : "";
    }
    ui.tier.textContent = "tier " + tier + " / " + track.thresholds.length;
    ui.bar.style.width = (trackProgress(game, track) * 100).toFixed(1) + "%";
    ui.next.textContent = next === null
      ? "Every tier earned."
      : "Next at " + fmt(next) + " " + track.unit + " (you have " + fmt(track.value(game)) + ")";
  });

  BONUS_BOXES.concat(UNLOCK_BOXES).forEach(entry => {
    const ui = bonusBoxes[entry.id];
    if (!ui) return;
    ui.value.textContent = entry.value(game);
    if (entry.unlocked) ui.box.classList.toggle("locked", !entry.unlocked(game));
  });

  const points = totalTiers(game);
  const level = Math.min(MAX_ACHIEVEMENT_LEVEL, Math.floor(points / POINTS_PER_LEVEL));
  const capped = level >= MAX_ACHIEVEMENT_LEVEL;
  el("achievementLevel").textContent = "Level " + level + (capped ? " (max)" : "");
  el("achievementPoints").textContent = capped
    ? points + " tiers earned across " + ACHIEVEMENT_TRACKS.length + " tracks"
    : points + " tiers earned — " + Math.max(0, levelPoints(level + 1) - points) + " to the next level";
  const progress = capped ? 1 : (points - levelPoints(level)) / POINTS_PER_LEVEL;
  el("achievementBar").style.width = Math.min(100, progress * 100).toFixed(1) + "%";
}
