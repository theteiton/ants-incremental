import { ACHIEVEMENT_FOOD_RATE, ACHIEVEMENT_HATCH_RATE, ACHIEVEMENT_JELLY_RATE,
  achievementTop, registerAchievementCap,
  achievementFoodBonus, achievementHatchBonus, achievementJellyBonus,
  population, UPGRADES, upgradeBranch, levelsOwned, definedLevelsIn,
  upgradeLevel,
  achievementSpawnBonus, achievementSpawnUnlocked,
  ACHIEVEMENT_SPAWN_RATE, ACHIEVEMENT_SPAWN_UNLOCK} from "./ants.js";
import { autoShedOn, autoShedUnlocked } from "./game.js";
import {
  CHALLENGES, CHALLENGE_MAX_LEVEL, CHALLENGE_REWARD_STEP,
  bestTrialLevel, trialLevelsEver, trialsWithMastery
} from "./challenges.js";
import { bigForagerBonus, BIG_FORAGER_PRESTIGE_MULT, populationCap,
  broodCapacity, hatchRate } from "./ants.js";
import { combatPower } from "./raids.js";
import { instinctOfflineHours, instinctKeptFood, instinctEggCost,
  instinctProtein } from "./instincts.js";
import { fmt, fmtFactor, watch, setText, setClass, setWidth } from "./panels.js";

function setHidden(node, hide) { if (node && node.hidden !== !!hide) node.hidden = !!hide; }

import { INSTINCTS, instinctOwned, instinctPoints, instinctsSpent } from "./instincts.js";
import { trophyCount } from "./trophies.js";
import { CELLS } from "./hunt.js";

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

// LITERALS, and they must stay literals. `upgradeSteps` walks a fixed sequence
// -- 1, 3, 7, 13, 21, 31 -- and then appends the total as a final rung, so the
// stepped rungs are stable and THE APPENDED TOP IS NOT. Reading these from
// `definedLevelsIn()` meant that adding the three War Parties levels moved the
// totals from 29 / 21 / 8 to 32 / 21 / 11, and with them the last rung: swept,
// a save holding 29 or 30 upgrades lost a tier, and one holding 8, 9 or 10
// combat upgrades lost a tier. That is the rule this game has broken before --
// an achievement level once earned is never taken back, and it pays food and
// hatch bonuses, so a live save must never score fewer tiers than it did.
//
// Pinned, the ladders are byte-identical to the shipped ones and the softcap
// carries a player past 29 the way it does on every other track. This is the
// same fault as TRIAL_TIER_TOP, one indirection further out: **do not compute a
// ladder top from anything that can grow.**
const BRANCH_TOTALS = { all: 29, colony: 21, combat: 8 };

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
// ...and it is a LITERAL, because deriving it from `CHALLENGES.length` was the
// very bug this comment warns about, one indirection further out. Opening the
// six species trials took the list from 9 to 15 and moved this from 45 to 75 on
// its own, shifting every rung underneath exactly as described above. Pinned at
// 45 the shipped ladder is untouched, and the softcap carries a player past it
// the way it does on every other track. Do not compute this from anything that
// can grow.
export const TRIAL_TIER_TOP = 45;

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
    // lifetime, because a matriline reset zeroes flightsTaken
    value: g => Math.max((g.stats && g.stats.flightsEver) || 0,
      (g.prestige && g.prestige.flightsTaken) || 0),
    thresholds: ladder(1, 50, 1.68) },

  { id: "trials", name: "Trials cleared", unit: "levels",
    desc: "Levels of the trials survived. Each pays back the thing its trial took.",
    value: g => trialLevelsEver(g),
    thresholds: ladder(1, TRIAL_TIER_TOP, 1.42) },

  { id: "royal_jelly", name: "Royal jelly gathered", unit: "royal jelly",
    desc: "Total royal jelly earned across all flights.",
    // lifetime, because a matriline reset zeroes royalJellyTotal -- that figure
    // is the gate for the next matriline and is meant to reset
    value: g => Math.max((g.stats && g.stats.jellyEver) || 0,
      (g.prestige && g.prestige.royalJellyTotal) || 0),
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

  // The Hunt paid no tiers at all until now: three systems -- ground, circles
  // and the trophy wall -- and not one of the twenty-three tracks looked at any
  // of them. All three read lifetime figures, because a flight refounds the
  // colony at zero ants and a track must never lose a tier to a reset.
  { id: "held", name: "Ground held", unit: "cells",
    desc: "The most of the board this line has held at once. Thirty cells to a circle.",
    value: g => (g.stats && g.stats.peakHeld) || 0,
    thresholds: ladder(1, CELLS, 1.35) },

  { id: "circles", name: "Circles merged", unit: "circles",
    desc: "Rings taken whole and folded into the nest. Each one is ground the colony keeps for good.",
    value: g => (g.stats && g.stats.circlesEver) || 0,
    thresholds: ladder(1, 40, 1.35) },

  { id: "trophies", name: "Trophies taken", unit: "trophies",
    desc: "How much of the wall is filled. Forty-nine creatures, and every one of them keeps something.",
    value: g => trophyCount(g),
    thresholds: ladder(1, 49, 1.3) },

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

// A track counting whole things must not grow fractional rungs past its
// designed top. Measured, the trials track ran 30, then 43.77, 73.46, 141.77,
// which reads as broken on a number that can only ever be an integer.
//
// That was first fixed for levels and flights alone, which left twenty of the
// twenty-three tracks still doing it -- "next: 27.899 big foragers", "56.869
// upgrades bought", "679,458.586 eggs". The test is not which track it was
// noticed on, it is whether the quantity can be a fraction at all, so the four
// that genuinely can are named and everything else counts whole things.
//
// Rounding UP is safe here and only here: it can only remove values lying
// strictly between the old rung and the next integer, and for a quantity that
// is always a whole number there are none. Ceiling a continuous track really
// would take a tier from somebody standing between the two, which is why food,
// protein, fighting strength and royal jelly are left alone.
const FRACTIONAL_UNITS = { food: 1, protein: 1, strength: 1, "royal jelly": 1, hours: 1 };

function roundRung(track, value) {
  if (track.integer === false) return value;
  return FRACTIONAL_UNITS[track.unit] && !track.integer ? value : Math.ceil(value);
}

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
  return roundRung(track, th[th.length - 1] * Math.pow(trackStep(track), past) * stretch);
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

// Instincts used to be a third sub-tab here. They are bought and they are
// permanent, which makes them upgrades -- and achievements read as something
// extra rather than as part of the game, so a tree tucked inside them was
// easy to miss entirely. They live on the Upgrades tab now.
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
    note: "Multiplies every caste at once." },
  { id: "jelly", name: "Richer jelly",
    desc: "A colony with a long record behind it sends off a better queen.",
    formula: game => "×" + ACHIEVEMENT_JELLY_RATE + " a level — ×" + fmt(achievementTop(ACHIEVEMENT_JELLY_RATE)) +
      " a level — you are at " +
      game.achievementLevel + " = ×" + fmt(achievementJellyBonus(game)),
    value: game => "×" + fmt(achievementJellyBonus(game)) + " Royal Jelly",
    note: "Multiplies what every nuptial flight pays." },
  // The first achievement bonus that is not another multiplier on growth, and
  // the only one with a gate. It answers a problem that only exists very late:
  // a colony that outguns the whole board and marches without stopping still
  // cannot finish a circle, because the ground offers a new creature every 110
  // seconds. Below the unlock level it pays nothing and says so.
  { id: "spawn", name: "Restless ground", locked: game => !achievementSpawnUnlocked(game),
    desc: "A line that has hunted long enough finds quarry faster. Creatures come to the board sooner.",
    value: game => achievementSpawnUnlocked(game)
      ? "×" + fmt(achievementSpawnBonus(game)) + " spawn rate"
      : "locked until level " + ACHIEVEMENT_SPAWN_UNLOCK,
    formula: game => "×" + ACHIEVEMENT_SPAWN_RATE + " for every level past " +
      ACHIEVEMENT_SPAWN_UNLOCK + " — you are at " + game.achievementLevel +
      " = ×" + fmt(achievementSpawnBonus(game)),
    note: game => achievementSpawnUnlocked(game)
      ? "Creatures reach the board sooner. The trophy wall speeds it too."
      : "Locked until achievement level " + ACHIEVEMENT_SPAWN_UNLOCK + "." },
  { id: "hatch", name: "Warm brood",
    desc: "Levels also shorten how long an egg takes to develop.",
    value: game => "×" + fmt(achievementHatchBonus(game)) + " hatch speed",
    formula: game => "×" + ACHIEVEMENT_HATCH_RATE + " a level — ×" + fmt(achievementTop(ACHIEVEMENT_HATCH_RATE)) +
      " a level — you are at " +
      game.achievementLevel + " = ×" + fmt(achievementHatchBonus(game)),
    note: "Incubation is 24s divided by this." }
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
  // a note may be a plain string now that most of them are one sentence
  watch(box, { title: entry.name, body: entry.desc,
    note: () => typeof entry.note === "function" ? entry.note(game) : entry.note });
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

let onBuyInstinct = () => {};

export function setInstinctBuyer(fn) { onBuyInstinct = fn; }

export function buildAchievements(game) {
  ACH_TABS.forEach(tab => {
    const button = document.createElement("button");
    button.textContent = tab.name;
    button.dataset.tab = tab.id;
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.hidden = true;
    button.appendChild(badge);
    button.onclick = () => selectAchievementTab(tab.id);
    el("achievementTabs").appendChild(button);
  });
  BONUS_BOXES.forEach(entry => buildBox(el("bonusList"), entry, game));
  TRIAL_BOXES.forEach(entry => buildBox(el("bonusList"), entry, game));
  UNLOCK_BOXES.forEach(entry => buildBox(el("unlockList"), entry, game));
  buildInstincts();
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

const instinctCards = {};

// Tiers finally buy something. Cards are built once and never reparented -- a
// node detached between mousedown and mouseup never receives its click, which is
// what once made upgrades unbuyable.
// Takes no callback: the handler has to read the live onBuyInstinct rather than
// close over whatever it was at build time. buildAchievements() runs during
// ui.js's module scope, BEFORE ui.js calls setInstinctBuyer, so a captured
// parameter is the initial no-op for ever -- every instinct card was
// unclickable, which is the same shape as the two upgrade-click bugs before it.
function buildInstincts() {
  const list = el("instinctList");
  if (!list || list.children.length) return;
  for (const instinct of INSTINCTS) {
    const card = document.createElement("button");
    card.className = "upgrade instinct";
    card.innerHTML = '<div class="upgrade-head"><b></b><span class="upgrade-level"></span></div>' +
      '<span class="upgrade-desc"></span><span class="upgrade-effect"></span>' +
      '<span class="upgrade-cost"></span>';
    card.addEventListener("click", () => onBuyInstinct(instinct.id));
    list.appendChild(card);
    instinctCards[instinct.id] = { card, name: card.querySelector("b"),
      level: card.querySelector(".upgrade-level"), desc: card.querySelector(".upgrade-desc"),
      effect: card.querySelector(".upgrade-effect"),
      cost: card.querySelector(".upgrade-cost") };
    // `game` is not in scope here and never was: buildInstincts() takes no
    // arguments and this file does not import the colony, so every hover of an
    // instinct card threw "game is not defined". The note does not need a live
    // figure anyway -- the card already shows whether it is affordable.
    watch(card, {
      title: instinct.name,
      body: instinct.desc,
      note: instinct.cost + " achievement points, kept for good — a flight, a " +
        "matriline and a trial all keep it." });
  }
}

// What buying this instinct would actually do to the colony standing now, in
// the same before-and-after shape the upgrade cards use. Probing costs a
// population cap, a brood figure and a fighting strength per instinct, so it is
// on the same 250ms clock the upgrade previews are on rather than every frame.
const INSTINCT_PREVIEW_MS = 250;
const instinctPreview = { at: 0, key: null, text: {} };

function instinctProbe(game, id) {
  const held = (game.instincts || []).slice();
  if (held.indexOf(id) < 0) held.push(id);
  return Object.assign({}, game, { instincts: held });
}

function instinctEffectText(game, instinct) {
  const probe = instinctProbe(game, instinct.id);
  const bits = [];
  const cap = populationCap(game), capNow = populationCap(probe);
  if (capNow !== cap) bits.push("cap " + fmt(cap) + " to " + fmt(capNow));
  const brood = broodCapacity(game), broodNow = broodCapacity(probe);
  if (broodNow !== brood) bits.push("brood " + fmt(brood) + " to " + fmt(broodNow));
  const hatch = hatchRate(game), hatchNow = hatchRate(probe);
  if (hatchNow !== hatch) bits.push("hatch ×" + fmtFactor(hatchNow / hatch));
  // instinctEggCost, not eggCostMultiplier: the latter is the matriline's
  // discount and does not read the instincts at all, so four cards that make an
  // egg cheaper were reporting nothing
  const egg = instinctEggCost(game), eggNow = instinctEggCost(probe);
  if (eggNow !== egg) bits.push("eggs " + Math.round((1 - eggNow / egg) * 100) + "% cheaper");
  const protein = instinctProtein(game), proteinNow = instinctProtein(probe);
  if (proteinNow !== protein) bits.push("protein ×" + fmtFactor(proteinNow / protein));
  const power = combatPower(game), powerNow = combatPower(probe);
  if (powerNow !== power && power > 0) bits.push("strength ×" + fmtFactor(powerNow / power));
  const off = instinctOfflineHours(game), offNow = instinctOfflineHours(probe);
  if (offNow !== off) bits.push("+" + (offNow - off) + "h offline");
  const kept = instinctKeptFood(game), keptNow = instinctKeptFood(probe);
  if (keptNow !== kept) bits.push(Math.round(keptNow * 100) + "% of food kept on a flight");
  return bits.join(" · ");
}

export function renderInstincts(game) {
  const available = instinctPoints(game);
  // when Hide maxed empties the block entirely, the heading and the count go
  // with it rather than leaving a title over nothing
  const allHeld = INSTINCTS.every(i => instinctOwned(game, i.id));
  const blank = allHeld && !!game.settings.hideOwned;
  setHidden(el("instinctHead"), blank || game.settings.upgradeFilter === "instincts");
  setHidden(el("instinctIntro"), blank);
  const earned = game.achievementPoints || 0;
  const spent = instinctsSpent(game);
  setText(el("instinctIntro"),
    "Instincts cost achievement points and are kept for good. " +
    earned + " earned, " + spent + " spent, " + available + " left.");
  const now = Date.now();
  const key = (game.instincts || []).length + "|" + available;
  const due = key !== instinctPreview.key || now - instinctPreview.at >= INSTINCT_PREVIEW_MS;
  if (due) { instinctPreview.at = now; instinctPreview.key = key; }
  for (const instinct of INSTINCTS) {
    const ui = instinctCards[instinct.id];
    if (!ui) continue;
    const owned = instinctOwned(game, instinct.id);
    const afford = available >= instinct.cost;
    setText(ui.name, instinct.name);
    setText(ui.level, owned ? "held" : "not bought");
    setText(ui.desc, instinct.desc);
    // never a bare number: a bare number beside a card reads as the level it
    // unlocks at rather than the price it costs
    setText(ui.cost, owned
      ? "held for good"
      : afford
      ? "Click to buy \u2014 " + instinct.cost + " points"
      : instinct.cost + " points, " + (instinct.cost - available) + " more needed");
    if (due) {
      instinctPreview.text[instinct.id] = owned ? "" : instinctEffectText(game, instinct);
    }
    setText(ui.effect, instinctPreview.text[instinct.id] || "");
    ui.cost.classList.toggle("affordable", !owned && afford);
    ui.cost.classList.toggle("owned-tag", owned);
    ui.card.classList.toggle("owned", owned);
    // Hide maxed applies here too: an instinct you hold is bought out, the same
    // as a line at its last level, and leaving it on screen under that toggle
    // was simply a miss.
    setHidden(ui.card, owned && !!game.settings.hideOwned);
    // Only a held one is dead. An instinct you cannot yet afford is not locked
    // -- there is no gate on it, just a price -- so it stays live and readable
    // rather than greyed out like something you have not unlocked.
    ui.card.disabled = owned;
  }
}

// concatenated once rather than on every frame
const ALL_BOXES = BONUS_BOXES.concat(TRIAL_BOXES, UNLOCK_BOXES);

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
      setClass(ui.pips.children[i], i < tier ? "earned" : "");
    }
    const beyond = tier - definedRungs(track);
    setText(ui.tier, "tier " + tier + (beyond > 0 ? " (+" + beyond + " past the ladder)" : ""));
    setWidth(ui.bar, (trackProgress(game, track) * 100).toFixed(1) + "%");
    setText(ui.next, "Next at " + fmt(next) + " " + track.unit +
      " (you have " + fmt(track.value(game)) + ")");
  });

  ALL_BOXES.forEach(entry => {
    const ui = bonusBoxes[entry.id];
    if (!ui) return;
    setText(ui.value, entry.value(game));
    if (ui.formula) setText(ui.formula, entry.formula ? entry.formula(game) : "");
    if (entry.unlocked) ui.box.classList.toggle("locked", !entry.unlocked(game));
  });

  const tiers = totalTiers(game);
  const xp = totalXp(game);
  const level = game.achievementLevel;
  setText(el("achievementLevel"), "Level " + level);
  // tiers, what is left of them to spend, and the climb to the next level. The
  // spendable figure was only on the Instincts page, so a player on any other
  // sub-tab had no idea what they were holding.
  const spent = instinctsSpent(game);
  const spare = Math.max(0, tiers - spent);
  setText(el("achievementPoints"),
    tiers + " tiers earned · " + spare + " point" + (spare === 1 ? "" : "s") +
    " to spend on instincts" + (spent > 0 ? " (" + spent + " spent)" : "") +
    " · " + fmt(Math.max(0, xpForLevel(level + 1) - xp)) + " XP to level " + (level + 1));
  const floor = xpForLevel(level);
  const span = xpForLevel(level + 1) - floor;
  const progress = Math.max(0, Math.min(1, (xp - floor) / span));
  setWidth(el("achievementBar"), (progress * 100).toFixed(1) + "%");
}
