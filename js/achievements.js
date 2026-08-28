import { ACHIEVEMENT_FOOD_RATE, ACHIEVEMENT_HATCH_RATE, ACHIEVEMENT_JELLY_RATE,
  achievementTop, registerAchievementCap,
  achievementFoodBonus, achievementHatchBonus, achievementJellyBonus,
  population, UPGRADES, upgradeBranch, levelsOwned, definedLevelsIn,
  upgradeLevel } from "./ants.js";
import { autoShedOn, autoShedUnlocked } from "./game.js";
import {
  CHALLENGES, CHALLENGE_MAX_LEVEL, CHALLENGE_REWARD_STEP,
  bestTrialLevel, trialLevelsEver, trialsWithMastery
} from "./challenges.js";
import { bigForagerBonus, BIG_FORAGER_PRESTIGE_MULT } from "./ants.js";
import { fmt, watch } from "./panels.js";

const el = id => document.getElementById(id);

// A tier is not worth the same as every other tier. The first rung of a track
// is a formality and the last is a grind, so a tier is worth its own depth:
// tier 1 pays 1, tier 2 pays 2, tier 9 pays 9. And a level costs more than the
// one before it, so the ladder does not flatten out at the top.
//
// Measured against the seventeen tracks: 181 tiers exist and they are worth
// 1,187 XP in total. Under the old flat scoring -- one point a tier, five
// points a level -- the cap fell out at 150 of 181 tiers and a finished player
// hit it in about two hours. Level 30 now costs 930 XP, which is 78% of every
// rung in the game, and the deep rungs are where most of that lives.
export const POINTS_PER_LEVEL = 5;

// A level costs COMPOUNDING XP, not a fixed step more than the last. Under the
// old n(n+1) the cost rose by a flat 2 XP a level, which is barely a curve at
// all once the ladders got long -- 235 tiers would have run the cap out to 46,
// and with it the food top to x8.7, undoing the very reduction the 1.0479 rate
// was chosen for. Compounding keeps the late levels genuinely expensive: level
// 1 costs 9 XP and level 33 costs 190.
export const XP_LEVEL_BASE = 9;
export const XP_LEVEL_GROWTH = 1.10;

// what the i-th tier of any track is worth (1-based)
export function tierXp(index) {
  return index;
}

// a track with n tiers earned is worth 1+2+...+n
export function trackXp(game, track) {
  const tier = trackTier(game, track);
  return (tier * (tier + 1)) / 2;
}

export function totalXp(game) {
  let total = 0;
  for (const track of ACHIEVEMENT_TRACKS) total += trackXp(game, track);
  return total;
}

// cumulative XP needed to have reached a level
export function xpForLevel(level) {
  if (level <= 0) return 0;
  return XP_LEVEL_BASE * (Math.pow(XP_LEVEL_GROWTH, level) - 1) / (XP_LEVEL_GROWTH - 1);
}
// MAX_ACHIEVEMENT_LEVEL is derived, below, once the ladders are known.

const DECADES = (from, to) => {
  const out = [];
  for (let e = from; e <= to; e++) out.push(Math.pow(10, e));
  return out;
};

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

// the furthest any one upgrade line has been pushed
function deepestUpgradeLevel(game) {
  let deepest = 0;
  for (const line of UPGRADES) deepest = Math.max(deepest, upgradeLevel(game, line));
  return deepest;
}

function peakOf(game, caste) {
  const peaks = game.peakCastes || {};
  return Math.max(peaks[caste] || 0, game.ants[caste] || 0);
}

// reads the most upgrades ever held, not the live count — a nuptial flight
// clears game.upgrades, and without this the tracks lose tiers and the
// achievement level drops, which no other track can do
// Counts LEVELS, not lines. Merging 29 one-shot upgrades into 12 lines would
// otherwise have dropped these ladders' tops from 29 to 12 and taken tiers --
// and achievement levels with them -- off every save that had passed them.
function ownedIn(game, branch) {
  const owned = levelsOwned(game, branch || null);
  const peaks = game.peakUpgrades || {};
  return Math.max(owned, peaks[branch || "all"] || 0);
}

// Defined levels, so the ladders stay at 29 / 21 / 8 exactly as before. Levels
// a trial unlocks past those deliberately add no tiers: these ladders are built
// once from a module constant and cannot grow per save.
const BRANCH_TOTALS = {
  all: definedLevelsIn(null),
  colony: definedLevelsIn("colony"),
  combat: definedLevelsIn("combat")
};

// ---------------------------------------------------------------- the ladders
//
// A ladder is generated from three stated numbers rather than typed out rung by
// rung: where it starts, where it tops out, and how far apart the rungs are.
//
// The SPACING is the interesting one, and it comes from how fast that resource
// actually grows. Measured on a finished colony, food accumulates x2.13 an hour,
// protein x1.92, fighting strength x1.44, and everything population-linked
// x1.32. A rung every two hours of late play means the step is that growth
// squared -- so food rungs sit x4.5 apart, protein x3.7, and colony size x1.7.
// Hand-typed ladders could not express that: they were all roughly decades or
// doublings whatever the resource did, which is why food and protein filled up
// in an hour while big foragers never moved.
//
// Slow discrete tracks -- big foragers, raids, flights, trials, royal jelly --
// do not grow by a ratio at all, so they state their own step.
export const RUNG_HOURS = 2;

// Every level of every trial there will ever be -- counting the ones not built
// yet, deliberately. Counting only the playable ones made this move each time a
// trial opened, and because ladder() interpolates, moving the top shifts every
// rung under it: going from two playable trials to five pushed the fifth rung
// from 5 to 6 and took a tier off anyone standing on it.
export const TRIAL_TIER_TOP = CHALLENGE_MAX_LEVEL * CHALLENGES.length;

// rounds to something a player would recognise: 1, 1.5, 2, 3, 5, 7 x 10^k
const NICE = [1, 1.5, 2, 3, 5, 7];

function niceNumber(value) {
  if (value <= 10) return Math.max(1, Math.round(value));
  const power = Math.pow(10, Math.floor(Math.log10(value)));
  const scaled = value / power;
  let best = NICE[0];
  for (const candidate of NICE) {
    if (Math.abs(candidate - scaled) < Math.abs(best - scaled)) best = candidate;
  }
  return Math.round(best * power);
}

// A strictly increasing ladder that ends exactly on the stated top.
//
// It interpolates between start and top, which means the TOP MUST BE STABLE:
// raise it and every rung underneath shifts, which silently takes tiers from
// anyone who had already earned them. That is not hypothetical -- the trials
// ladder was topped at "five levels per playable trial", and opening three more
// trials moved its fifth rung from 5 to 6. Any top fed to this must be a figure
// that does not move as content is added.
export function ladder(start, top, step) {
  const rungs = Math.max(2, Math.round(Math.log(top / start) / Math.log(step)) + 1);
  const out = [];
  for (let i = 0; i < rungs; i++) {
    const raw = start * Math.pow(top / start, i / (rungs - 1));
    const value = niceNumber(raw);
    if (out.length === 0 || value > out[out.length - 1]) out.push(value);
  }
  if (out[out.length - 1] !== top) {
    if (out[out.length - 1] > top) out.pop();
    out.push(top);
  }
  return out;
}

// a resource that multiplies by `hourly` each hour of late play
const grown = (start, top, hourly) => ladder(start, top, Math.pow(hourly, RUNG_HOURS));

// Every ladder ends on a number a colony actually reaches, and the tops are set
// against what a *finished* colony reaches -- whole lineage, Drought mastered --
// because that colony exists now. Measured at 8 hours it holds 122K ants, 104K
// foragers, 9.8K soldiers, 1.05M fighting strength and 9.7M protein, so the old
// tops of 10K ants and 100K strength were all cleared inside the first hour and
// fifteen of the seventeen tracks finished before the player had done anything.
//
// Every change here is an APPEND above the old top rung. Rungs are never
// removed, reordered or lowered: tiers pay food and hatch bonuses, so shortening
// a ladder silently takes an achievement level off a save that already passed it.
export const ACHIEVEMENT_TRACKS = [
  { id: "population", name: "Colony size", unit: "ants",
    desc: "The largest colony you have raised.",
    value: g => Math.max(g.peakPopulation || 0, population(g)),
    thresholds: grown(1, 400000, 1.32) },

  { id: "food", name: "Food gathered", unit: "food",
    desc: "Every crumb the colony has ever brought home.",
    value: g => g.stats.foodEarned,
    thresholds: grown(100, 3e14, 2.13) },

  { id: "eggs", name: "Eggs hatched", unit: "eggs",
    desc: "Workers raised from egg to adult.",
    value: g => g.stats.eggsHatched,
    thresholds: grown(10, 400000, 1.32) },

  { id: "forager", name: "Foragers", unit: "foragers",
    desc: "The most foragers the colony has held at once.",
    value: g => peakOf(g, "forager"),
    thresholds: grown(5, 350000, 1.32) },

  { id: "excavator", name: "Excavators", unit: "excavators",
    desc: "The most diggers the colony has held at once.",
    value: g => peakOf(g, "excavator"),
    thresholds: grown(3, 8000, 1.32) },

  { id: "nurse", name: "Nurses", unit: "nurses",
    desc: "The most nurses the colony has held at once.",
    value: g => peakOf(g, "nurse"),
    thresholds: grown(3, 20000, 1.32) },

  // the k-th big forager needs round(3 x 3.5^k) forager hatches since the last,
  // so twelve is about 4,600 hatches and twenty is about 690,000. The old ladder
  // ran to eighty, which read as "you are playing this wrong" to anyone counting.
  { id: "bigforager", name: "Big Foragers", unit: "big foragers",
    desc: "Oversized foragers that hatched by chance.",
    value: g => peakOf(g, "bigforager"),
    thresholds: ladder(1, 20, 1.33) },

  { id: "soldier", name: "Soldiers", unit: "soldiers",
    desc: "The standing army at its largest.",
    value: g => peakOf(g, "soldier"),
    thresholds: grown(1, 30000, 1.32) },

  { id: "raids", name: "Raids won", unit: "raids",
    desc: "Attackers killed at the nest gate.",
    value: g => Math.max(g.raidsWon || 0, (g.stats && g.stats.raidsWonTotal) || 0),
    thresholds: ladder(1, 500, 1.7) },

  { id: "strength", name: "Fighting strength", unit: "strength",
    desc: "The most fighting strength the colony has fielded.",
    value: g => g.peakStrength || 0,
    thresholds: grown(25, 8e6, 1.44) },

  { id: "protein", name: "Protein gathered", unit: "protein",
    desc: "Everything the soldiers have dragged home.",
    value: g => g.stats.proteinEarned || 0,
    // protein grows x1.92 an hour, so two-hourly rungs would sit x3.7 apart --
    // but the old ladder was denser than that low down, and no rung may be lost
    thresholds: ladder(10, 25e6, 2.97) },

  { id: "upgrades", name: "Upgrades bought", unit: "upgrades",
    desc: "Every level bought across all twelve upgrade lines.",
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

  // flights and royal jelly keep their old tops. They are prestige-grind tracks
  // rather than colony-size ones, and shortening them would have taken a tier
  // back from anyone who had already gone past.
  { id: "flights", name: "Nuptial flights", unit: "flights",
    desc: "Times the queen has taken wing and founded a new colony.",
    value: g => (g.prestige && g.prestige.flightsTaken) || 0,
    thresholds: ladder(1, 50, 1.68) },

  { id: "trials", name: "Trials cleared", unit: "levels",
    desc: "Levels of the trials survived. Each pays back the thing its trial took.",
    value: g => trialLevelsEver(g),
    thresholds: ladder(1, TRIAL_TIER_TOP, 1.42) },

  { id: "royal_jelly", name: "Royal jelly gathered", unit: "royal jelly",
    desc: "Total royal jelly earned across all flights.",
    value: g => (g.prestige && g.prestige.royalJellyTotal) || 0,
    thresholds: ladder(1, 250, 1.9) },

  // ---- what nothing else was watching -----------------------------------
  // Six tracks that recognise things the colony already did and got no credit
  // for. Growth-driven ladders take their spacing from measurement like the
  // rest; the ones a player chooses rather than earns -- exiling, destroying --
  // cannot be measured that way and state round numbers instead.

  { id: "trained", name: "Soldiers trained", unit: "promotions",
    desc: "Soldiers raised into a higher grade in the Units menu, and survived it.",
    value: g => (g.stats && g.stats.trained) || 0,
    thresholds: ladder(1, 20000, 2.2) },

  { id: "guard", name: "Phragmotic Guards", unit: "guards",
    desc: "The heaviest grade the colony can make. Her head is the door.",
    value: g => peakOf(g, "guard"),
    thresholds: ladder(1, 2000, 1.9) },

  { id: "deepest", name: "Deepest adaptation", unit: "levels",
    desc: "The highest level reached on any single upgrade line.",
    value: g => Math.max((g.peakUpgrades && g.peakUpgrades.deepest) || 0,
      deepestUpgradeLevel(g)),
    thresholds: ladder(1, 20, 1.3) },

  { id: "matriline", name: "Matriline age", unit: "hours",
    desc: "Hours across every colony in the line, not just the one standing.",
    value: g => (g.stats && g.stats.playtime || 0) / 3600,
    thresholds: ladder(1, 300, 1.7) },

  { id: "exiled", name: "Ants exiled", unit: "ants",
    desc: "Sent away for good. Nothing else in the colony remembers them.",
    value: g => (g.stats && g.stats.exiled) || 0,
    thresholds: ladder(1, 5000, 2.2) },

  { id: "destroyed", name: "Eggs destroyed", unit: "eggs",
    desc: "Brood the queen laid and the colony decided against.",
    value: g => (g.stats && g.stats.eggsCancelled) || 0,
    thresholds: ladder(1, 10000, 2.4) }
];

// Every XP the game contains: each track fully cleared is 1+2+...+n.
export function maxEarnableXp() {
  let total = 0;
  for (const track of ACHIEVEMENT_TRACKS) {
    const rungs = track.thresholds.length;
    total += (rungs * (rungs + 1)) / 2;
  }
  return total;
}

// The cap is one level above what all of that XP can buy, so it is a bound
// rather than a wall: there is always one more level in front of you, and it
// re-derives itself whenever a ladder is extended instead of having to be
// remembered and hand-edited. A hand-set 20 was reached in half an hour and
// then paid nothing for the rest of the run, which is what this prevents.
// There is no level cap. A level costs x1.10 more XP than the one before it, so
// the ladder throttles itself: measured, level 40 needs about ten times today's
// colony and level 50 about a thousand times. A cap was a number that had to be
// remembered, and every value it ever held was reached and then sat at.
export const MAX_ACHIEVEMENT_LEVEL = Infinity;

registerAchievementCap(MAX_ACHIEVEMENT_LEVEL);

// A ladder does not end. Its stated rungs are the designed part; past them it
// carries on at its own step, so no track ever finishes and sits there with a
// full bar paying nothing -- measured, 13 of 23 were dead by 24 hours.
//
// Past the top each rung is SOFTCAP_STEP further apart than the last, which is
// what stops one number running away with the whole ladder. The growth-driven
// tracks mostly police themselves -- a step of growth-squared means every one
// of them earns half a tier an hour whatever its scale -- but the tracks a
// player drives by hand do not: exiling ants and destroying eggs are free and
// repeatable, and without a softcap they could be farmed for tiers forever. With
// it, ten extra rungs cost about a million times the activity.
export const SOFTCAP_STEP = 1.15;

const stepCache = new Map();

function trackStep(track) {
  if (!stepCache.has(track.id)) {
    const th = track.thresholds;
    stepCache.set(track.id, th.length > 1
      ? Math.pow(th[th.length - 1] / th[0], 1 / (th.length - 1)) : 2);
  }
  return stepCache.get(track.id);
}

// the value needed for a tier, defined or past the end
export function thresholdAt(track, tier) {
  const th = track.thresholds;
  if (tier <= th.length) return th[tier - 1];
  const past = tier - th.length;
  // each extra rung is SOFTCAP_STEP further apart than the one before it
  const stretch = Math.pow(SOFTCAP_STEP, (past * (past - 1)) / 2);
  return th[th.length - 1] * Math.pow(trackStep(track), past) * stretch;
}

export function trackTier(game, track) {
  const value = track.value(game);
  let tier = 0;
  // guard is generous: the softcap makes tiers this deep unreachable in practice
  while (tier < 400 && value >= thresholdAt(track, tier + 1)) tier++;
  return tier;
}

// how many rungs were actually designed, for the pip ladder
export function definedRungs(track) {
  return track.thresholds.length;
}

// there is always a next one
export function trackNext(game, track) {
  return thresholdAt(track, trackTier(game, track) + 1);
}

export function trackProgress(game, track) {
  const tier = trackTier(game, track);
  const next = thresholdAt(track, tier + 1);
  const floor = tier > 0 ? thresholdAt(track, tier) : 0;
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

export function achievementLevelFor(xp) {
  let level = 0;
  while (level < 400 && xpForLevel(level + 1) <= xp) level++;
  return level;
}

export function levelPoints(level) {
  return xpForLevel(level);
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
    value: game => "×" + fmt(achievementFoodBonus(game)) + " food",
    formula: game => "×" + ACHIEVEMENT_FOOD_RATE + " a level — ×" + fmt(achievementTop(ACHIEVEMENT_FOOD_RATE)) +
      " a level — you are at " +
      game.achievementLevel + " = ×" + fmt(achievementFoodBonus(game)),
    note: game => "Level " + game.achievementLevel +
      ". Every level is the same step up, and every level costs more XP than the one " +
      "before it. It multiplies every caste at once." },
  { id: "jelly", name: "Richer jelly",
    desc: "A colony with a long record behind it sends off a better queen.",
    formula: game => "×" + ACHIEVEMENT_JELLY_RATE + " a level — ×" + fmt(achievementTop(ACHIEVEMENT_JELLY_RATE)) +
      " a level — you are at " +
      game.achievementLevel + " = ×" + fmt(achievementJellyBonus(game)),
    value: game => "×" + fmt(achievementJellyBonus(game)) + " Royal Jelly",
    note: game => "Level " + game.achievementLevel +
      ". Every level is the same step up, and each costs more than the last. " +
      "It multiplies what every nuptial flight pays." },
  { id: "hatch", name: "Warm brood",
    desc: "Levels also shorten how long an egg takes to develop.",
    value: game => "×" + fmt(achievementHatchBonus(game)) + " hatch speed",
    formula: game => "×" + ACHIEVEMENT_HATCH_RATE + " a level — ×" + fmt(achievementTop(ACHIEVEMENT_HATCH_RATE)) +
      " a level — you are at " +
      game.achievementLevel + " = ×" + fmt(achievementHatchBonus(game)),
    note: game => "Level " + game.achievementLevel +
      ". Every level is the same step up, and each costs more than the last. " +
      "Incubation is 24s divided by this." }
];

// One box per trial, because each trial gives back the thing it took. The
// Drought starves the colony and pays in food; the others will pay in cap,
// brood and soldiers when they are built.
const TRIAL_BOXES = trialsWithMastery().map(challenge => ({
  id: "mastery_" + challenge.id,
  name: challenge.mastery.name,
  desc: challenge.mastery.desc,
  value: game => "×" + fmt(Math.pow(challenge.mastery.step, bestTrialLevel(game, challenge.id))) +
    " " + challenge.mastery.type,
  formula: game => challenge.mastery.step + "^highest clear " +
    bestTrialLevel(game, challenge.id) + " = ×" +
    fmt(Math.pow(challenge.mastery.step, bestTrialLevel(game, challenge.id))),
  note: game => {
    const level = bestTrialLevel(game, challenge.id);
    return "Highest clear of " + challenge.name + ": level " + level + " of " +
      CHALLENGE_MAX_LEVEL + "." +
      (level < CHALLENGE_MAX_LEVEL
        ? " Level " + (level + 1) + " would take it to ×" +
          fmt(Math.pow(challenge.mastery.step, level + 1)) + "."
        : " Every level of it is behind you.") +
      " Separate from the ×" + CHALLENGE_REWARD_STEP + " per level the trials themselves pay.";
  }
}));

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
    desc: "She has landed before. She sheds her wings on touching down, and strips them for food without being told.",
    unlocked: () => autoShedUnlocked(),
    value: () => autoShedUnlocked() ? (autoShedOn() ? "On" : "Off") : "Locked",
    note: () => autoShedUnlocked()
      ? "Unlocked — she sheds on landing and strips each wing for food by herself. Turn it off under Automation in Settings."
      : "Locked until your first nuptial flight." }
];

const bonusBoxes = {};

function buildBox(list, entry, game) {
  const box = document.createElement("div");
  box.className = "bonus-box";
  box.innerHTML = '<b></b><span class="bonus-value"></span>' +
    '<span class="bonus-formula"></span><span class="bonus-note"></span>';
  box.querySelector("b").textContent = entry.name;
  box.querySelector(".bonus-note").textContent = entry.desc;
  watch(box, { title: entry.name, body: entry.desc, note: () => entry.note(game) });
  bonusBoxes[entry.id] = {
    box,
    value: box.querySelector(".bonus-value"),
    formula: entry.formula ? box.querySelector(".bonus-formula") : null
  };
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
  TRIAL_BOXES.forEach(entry => buildBox(el("bonusList"), entry, game));
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
        const worth = " This track is worth " + fmt(trackXp(game, track)) + " XP so far.";
        const beyond = tier - definedRungs(track);
        const past = beyond > 0
          ? " You are " + beyond + " past the designed ladder, where each rung sits " +
            "further from the last than the one before it."
          : "";
        return done + " Tier " + (tier + 1) + " at " + fmt(next) + " " + track.unit +
          " — you have " + fmt(track.value(game)) + ", and it would pay " +
          fmt(tierXp(tier + 1)) + " XP." + worth + past;
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
    ui.row.classList.toggle("maxed", tier > definedRungs(track));
    ui.row.classList.toggle("fresh", fresh);
    ui.dot.hidden = !fresh;
    for (let i = 0; i < ui.pips.children.length; i++) {
      ui.pips.children[i].className = i < tier ? "earned" : "";
    }
    const beyond = tier - definedRungs(track);
    ui.tier.textContent = "tier " + tier + (beyond > 0 ? " (+" + beyond + " past the ladder)" : "");
    ui.bar.style.width = (trackProgress(game, track) * 100).toFixed(1) + "%";
    ui.next.textContent = "Next at " + fmt(next) + " " + track.unit +
      " (you have " + fmt(track.value(game)) + ")";
  });

  BONUS_BOXES.concat(TRIAL_BOXES, UNLOCK_BOXES).forEach(entry => {
    const ui = bonusBoxes[entry.id];
    if (!ui) return;
    ui.value.textContent = entry.value(game);
    if (ui.formula) ui.formula.textContent = entry.formula ? entry.formula(game) : "";
    if (entry.unlocked) ui.box.classList.toggle("locked", !entry.unlocked(game));
  });

  const tiers = totalTiers(game);
  const xp = totalXp(game);
  const level = game.achievementLevel;
  el("achievementLevel").textContent = "Level " + level;
  el("achievementPoints").textContent =
    tiers + " tiers, " + fmt(xp) + " XP — " +
    fmt(Math.max(0, xpForLevel(level + 1) - xp)) + " to level " + (level + 1) +
    " (each level costs more than the last)";
  const floor = xpForLevel(level);
  const span = xpForLevel(level + 1) - floor;
  const progress = Math.max(0, Math.min(1, (xp - floor) / span));
  el("achievementBar").style.width = (progress * 100).toFixed(1) + "%";
}
