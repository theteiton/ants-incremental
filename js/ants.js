import { CHALLENGES, bestTrialLevel, challengeDebuff, challengeReward, masteryFood,
  siegeActive, SIEGE_UNLOCK } from "./challenges.js";
import {
  prestigeFoodMultiplier,
  prestigeBaseCap,
  prestigeExcavatorCap,
  prestigeBroodSlots,
  prestigeNaniticMult
} from "./prestige.js";

export const CASTES = {
  nanitic: {
    name: "Nanitic",
    unlockAt: 0,
    layable: false,
    role: "Undersized first generation, fed on the queen's wing muscle. Forages hard, tends the brood, and fades."
  },
  forager: {
    name: "Forager",
    unlockAt: 0,
    layable: true,
    role: "Gathers food."
  },
  excavator: {
    name: "Excavator",
    unlockAt: 16,
    layable: true,
    role: "Digs new chambers, raising the population cap."
  },
  nurse: {
    name: "Nurse",
    unlockAt: 64,
    layable: true,
    role: "Tends the brood, so more eggs develop at once."
  },
  bigforager: {
    name: "Big Forager",
    unlockAt: 0,
    layable: false,
    role: "A rare oversized forager. Cannot be laid; she hatches from ordinary forager eggs."
  },
  soldier: {
    name: "Soldier",
    unlockAt: 256,
    layable: true,
    role: "Fights raids, and hunts between them for protein."
  },
  // The ranks above a soldier. A caste is never a strictly better version of
  // another one, and these are no exception: every grade fights harder and
  // hunts worse, because the head that wins a fight is the head that cannot
  // carry food home. An army of nothing but guards starves the colony of the
  // protein that trained it, which is the whole tension of the Units menu.
  major: {
    name: "Major",
    unlockAt: 256,
    layable: false,
    role: "A soldier grown into her armour. Fights three times as hard, hunts half as well."
  },
  supermajor: {
    name: "Supermajor",
    unlockAt: 256,
    layable: false,
    role: "Head and mandibles out of all proportion. Formidable at the gate, near useless away from it."
  },
  guard: {
    name: "Phragmotic Guard",
    unlockAt: 256,
    layable: false,
    role: "Her head is a living door, shaped to plug the tunnel. She never leaves it, and never hunts."
  }
};

// Rank is a ladder, and the trade runs the whole way up it: power multiplies,
// hunting falls to nothing. Promotion is free but slow -- veterans are made by
// surviving raids -- or bought with protein at the risk of losing the ant.
export const SOLDIER_RANKS = [
  { id: "soldier", power: 1, hunt: 1 },
  { id: "major", power: 3, hunt: 0.5, cost: 40, loss: 0.10 },
  { id: "supermajor", power: 9, hunt: 0.15, cost: 200, loss: 0.20 },
  { id: "guard", power: 25, hunt: 0, cost: 1200, loss: 0.35 }
];

export const RANK_IDS = SOLDIER_RANKS.map(r => r.id);

export function rankAt(index) {
  return SOLDIER_RANKS[index] || null;
}

export function rankOf(id) {
  return SOLDIER_RANKS.find(r => r.id === id) || null;
}

// Every rank counts as a soldier everywhere it matters -- egg price, upgrade
// gates, achievement tracks. Without this, promoting an ant would make the next
// soldier egg cheaper and could re-lock a Combat upgrade behind a soldier count
// the army had already passed.
export function soldierCount(game) {
  let total = 0;
  for (const id of RANK_IDS) total += game.ants[id] || 0;
  return total;
}

export const NANITIC_GENERATION = 4;
export const EGG_TIME = 24;
export const BASE_POPULATION_CAP = 30;
export const CAP_PER_EXCAVATOR = 12;
export const RESERVE_EGG_COST = 20;
export const EXCAVATOR_OVERFLOW = 3;
export const BIG_FORAGER_PRESTIGE_MULT = 25;
export const NANITIC_LIFESPAN = 7200;
export const BASE_BROOD_SLOTS = 3;
export const SLOTS_PER_NURSE = 0.25;
export const BIG_FORAGER_BASE = 5;
export const BIG_FORAGER_FIRST = 3;
export const BIG_FORAGER_GROWTH = 3.5;
export const BIG_FORAGER_AGE_GAIN = 0.05;
export const BIG_FORAGER_AGE_CAP = 3;

// Rallying is the one thing a player can do to the food rate by hand. It is a
// forager multiplier, so big foragers ride on it too and the founding
// nanitics do not -- they are not out there to be called back.
// The queen's four wings survive the shed as something to work on. Stripping
// one is the only food the colony has before the first nanitics emerge, and
// nothing is buyable during that wall -- the nanitic upgrades gate on nanitic
// count -- so the food banks and pays out the moment they hatch.
export const WING_COUNT = 4;
export const WING_FOOD = 80;
export const WING_STRIP_TIME = 10;

// Nanitics burn the queen's dissolved flight muscle. They start far above a
// forager and fade, so the founding phase is a race to raise a real workforce
// before the founders are spent -- and the two-hour death stops being a cliff
// because by then they produce almost nothing.
export const NANITIC_HALFLIFE = 1200;
export const NANITIC_HATCH_SPEED = 2;
// Nanitics tend the queen's second brood -- that is what a founding generation
// is for. It is also the only lever that moves the opening: the first ten
// minutes are brood-throughput bound, so no amount of extra food touches them.
export const NANITIC_BROOD_SLOTS = 1;

export const RALLY_MULT = 3;
export const RALLY_DURATION = 30;
export const RALLY_COOLDOWN = 90;


export const HIDING_FOOD_PENALTY = 0.5;

// What one achievement level is worth. Stated as the RATE rather than the top,
// because the rate is the thing a player feels -- every level is the same step
// up -- and the top is then whatever the ladder happens to reach.
//
// The relative shape is kept from the original design: jelly climbs fastest,
// then food, then hatch speed. Food was briefly 1.070, which put a x10 top on
// it and took a first run to 1,000 ants from 80 minutes to 57; 1.0479 is the
// settled figure.
export const ACHIEVEMENT_FOOD_RATE = 1.0479;
export const ACHIEVEMENT_HATCH_RATE = 1.0274;
export const ACHIEVEMENT_JELLY_RATE = 1.0643;

// The cap lives in achievements.js, which already imports this file. Rather than
// import it back -- a cycle that would evaluate achievements.js before UPGRADES
// exists and throw -- achievements.js hands the cap over once it has derived it.
let achievementCap = 34;

export function registerAchievementCap(levels) {
  if (levels > 0) achievementCap = levels;
}

export function achievementCapLevels() {
  return achievementCap;
}

function achievementBonus(game, rate) {
  return Math.pow(rate, game.achievementLevel || 0);
}

// what the ladder pays at the top, for anything that wants to show it
export function achievementTop(rate) {
  return Math.pow(rate, achievementCap);
}

const FOOD_PER_SECOND = {
  nanitic: 6,
  forager: 1,
  bigforager: 0,
  excavator: 0,
  nurse: 0,
  soldier: 0,
  major: 0,
  supermajor: 0,
  guard: 0
};

export const CASTE_COSTS = {
  forager: { base: 1.5, exponent: 1.65 },
  // dearer and rarer than they were, and steeper once a colony is past the
  // prestige gate: at 58 cap each, #17 is where the nest first holds 1,000
  excavator: { base: 100, exponent: 1.8, breakAt: 17, exponent2: 2.2 },
  nurse: { base: 60, exponent: 1.7 },
  soldier: { base: 200, exponent: 1.6 }
};


// Upgrades are LINES with LEVELS, not 29 one-shot purchases. Most of the old
// entries were the same upgrade at a bigger number -- six forager yields, four
// excavator caps, four nurse slots -- so they are one line each now, and the
// flavour name, cost and gate of every old entry survives as a level of it.
//
// Nothing about the balance moved: every level below carries the exact cost,
// gate and magnitude of the one-shot upgrade it replaces, in the same order.
// 12 lines, 29 defined levels, 21 colony and 8 combat -- the same totals the
// achievement ladders are generated from.
//
// A line can be pushed PAST its defined levels, and that is what the trials
// sell. Each trial gives back the thing it took, so Drought's cleared levels
// raise the cap on the three lines that make food. Extended levels cost protein
// as well as food, which is the sink protein never had.
export const EXTENDED_FOOD_STEP = 6;
export const EXTENDED_PROTEIN_BASE = 50000;
export const EXTENDED_PROTEIN_STEP = 4;
// An extended level is deliberately worth LESS than the defined one it repeats.
// Measured with them at full strength: the colony line repeating x2 five times
// is a x32 global multiplier on its own, food per second reached 1.56 trillion
// and population 2.66M -- twelve times what the same colony reaches without
// them, and past the top of every achievement ladder. Half an additive step and
// a flat x1.15 multiplicative one make five cleared levels worth about x3.6
// overall, which is a reward rather than a different game.
export const EXTENDED_ADD_SCALE = 0.5;
export const EXTENDED_MULT_STEP = 1.15;

export const UPGRADES = [
  { id: "nanitic_food", name: "The founding brood", branch: "colony",
    effect: { type: "casteFlat", caste: "nanitic" }, mastery: "food",
    levels: [
      { name: "Callow Cuticle", cost: 30, req: { caste: "nanitic", count: 1 }, add: 0.9,
        desc: "Thin-shelled nanitics forage twice as hard." },
      { name: "Hunger of the First", cost: 120, req: { caste: "nanitic", count: 2 }, add: 1.2,
        desc: "The first generation works itself to the bone." }
    ] },

  { id: "nanitic_vigour", name: "Borrowed time", branch: "colony",
    effect: { type: "naniticVigour" },
    levels: [
      { name: "Living Larder", cost: 500, req: { caste: "nanitic", count: 3 }, add: 1,
        desc: "Nanitics store food in their own crops. They fade half as fast." },
      { name: "Borrowed Time", cost: 1200, req: { caste: "nanitic", count: 4 }, add: 2,
        desc: "They will not live to see the colony they build, but they last longer trying." }
    ] },

  { id: "forager", name: "Foraging", branch: "colony",
    effect: { type: "casteFood", caste: "forager" }, mastery: "food",
    levels: [
      { name: "Scent Trails", cost: 260, req: { caste: "forager", count: 3 }, add: 0.5,
        desc: "Foragers mark the route home. Forager food +50%." },
      { name: "Leaf Shears", cost: 1500, req: { caste: "forager", count: 12 }, add: 0.75,
        desc: "Sharper mandibles cut faster. Forager food +75%." },
      { name: "Aphid Herding", cost: 8000, req: { caste: "forager", count: 35 }, add: 1,
        desc: "Milked aphids yield honeydew. Forager food +100%." },
      { name: "Deep Middens", cost: 25000, req: { caste: "forager", count: 90 }, add: 1.5,
        desc: "Nothing edible is wasted. Forager food +150%." },
      { name: "Trunk Trails", cost: 70000, req: { caste: "forager", count: 150 }, add: 2,
        desc: "Cleared highways speed every trip. Forager food +200%." },
      { name: "Canopy Routes", cost: 400000, req: { caste: "forager", count: 400 }, add: 3,
        desc: "The colony harvests the whole tree. Forager food +300%." }
    ] },

  { id: "excavator", name: "Excavation", branch: "colony",
    effect: { type: "excavatorCap" },
    levels: [
      { name: "Loose Soil", cost: 1200, req: { caste: "excavator", count: 3 }, add: 4,
        desc: "Easier digging. Each excavator holds 4 more ants." },
      { name: "Vaulted Galleries", cost: 9000, req: { caste: "excavator", count: 15 }, add: 6,
        desc: "Arched roofs stop collapses. +6 cap per excavator." },
      { name: "Deep Shafts", cost: 90000, req: { caste: "excavator", count: 22 }, add: 12,
        desc: "The nest reaches the water table. +12 cap per excavator." },
      { name: "Cathedral Chambers", cost: 500000, req: { caste: "excavator", count: 55 }, add: 24,
        desc: "Halls big enough to lose a queen in. +24 cap per excavator." }
    ] },

  { id: "nurse", name: "Nursing", branch: "colony",
    effect: { type: "nurseSlots" },
    levels: [
      { name: "Warm Brood Pile", cost: 15000, req: { caste: "nurse", count: 3 }, add: 0.05,
        desc: "Brood is carried up to the sun-warmed chambers near the surface. Each nurse tends more." },
      { name: "Trophallaxis", cost: 50000, req: { caste: "nurse", count: 12 }, add: 0.08,
        desc: "Mouth-to-mouth feeding of the brood. Each nurse tends more brood." },
      { name: "Fungal Bedding", cost: 220000, req: { caste: "nurse", count: 30 }, add: 0.12,
        desc: "Antibiotic mulch keeps the brood clean. Each nurse tends more brood." },
      { name: "Brood Nurseries", cost: 1.5e6, req: { caste: "nurse", count: 70 }, add: 0.15,
        desc: "Dedicated chambers sorted by age. Each nurse tends more brood." }
    ] },

  { id: "colony", name: "Colony cohesion", branch: "colony",
    effect: { type: "globalFood" }, mastery: "food",
    levels: [
      { name: "Colony Cohesion", cost: 12000, req: { caste: "population", count: 60 }, mult: 1.25,
        desc: "A colony that acts as one body. All food +25%." },
      { name: "Pheromone Network", cost: 150000, req: { caste: "population", count: 300 }, mult: 1.5,
        desc: "Chemical memory spans the whole nest. All food +50%." },
      { name: "Living Bridges", cost: 650000, req: { caste: "population", count: 580 }, mult: 2,
        desc: "Ants become the infrastructure. All food +100%." }
    ] },

  { id: "combat_forager", name: "Alarm Pheromone", branch: "combat", afterFirstRaid: true,
    effect: { type: "combatForager" }, mastery: "soldier",
    levels: [
      { name: "Alarm Pheromone", cost: 30000, req: { caste: "population", count: 0 }, add: 1,
        desc: "The whole nest answers an attack. Every forager fights at 1 strength." }
    ] },

  { id: "combat_excavator", name: "Gallery Wardens", branch: "combat", afterFirstRaid: true,
    effect: { type: "combatExcavator" }, mastery: "soldier",
    levels: [
      { name: "Gallery Wardens", cost: 120000, req: { caste: "excavator", count: 20 }, add: 10,
        desc: "Diggers block the tunnels with their bodies. Every excavator fights at 10." }
    ] },

  { id: "combat_nurse", name: "Brood Defenders", branch: "combat", afterFirstRaid: true,
    effect: { type: "combatNurse" }, mastery: "soldier",
    levels: [
      { name: "Brood Defenders", cost: 200000, req: { caste: "nurse", count: 20 }, add: 2,
        desc: "Nurses will not leave the brood. Every nurse fights at 2." }
    ] },

  { id: "soldier_power", name: "Soldiery", branch: "combat", currency: "protein",
    effect: { type: "soldierPower" }, mastery: "soldier",
    levels: [
      { name: "Sharpened Mandibles", cost: 25, req: { caste: "soldier", count: 3 }, add: 0.5,
        desc: "Honed jaws bite deeper. Soldiers fight 50% harder." },
      { name: "Chitin Plating", cost: 250, req: { caste: "soldier", count: 25 }, add: 1,
        desc: "Thickened armour. Soldier strength +100%." }
    ] },

  { id: "protein_yield", name: "Butchery", branch: "combat", currency: "protein",
    effect: { type: "proteinYield" },
    levels: [
      { name: "Hunting Parties", cost: 80, req: { caste: "soldier", count: 10 }, add: 0.5,
        desc: "Kills are stripped to the shell. Raids yield 50% more protein." },
      { name: "Butchery", cost: 700, req: { caste: "soldier", count: 50 }, add: 1,
        desc: "Nothing of the carcass is left. Raid protein +100%." }
    ] },

  { id: "brood_slots", name: "Royal Larder", branch: "combat", currency: "protein",
    effect: { type: "broodSlots" },
    levels: [
      { name: "Royal Larder", cost: 2000, req: { caste: "soldier", count: 100 }, add: 3,
        desc: "Stored meat feeds the brood. Three more eggs develop at once." }
    ] }
];

// every defined level across every line, which is what the achievement ladders
// are generated from -- extended levels deliberately do not add tiers, because
// a ladder built from a module constant cannot grow per save
export const DEFINED_LEVELS = UPGRADES.reduce((n, u) => n + u.levels.length, 0);

const UPGRADE_INDEX = {};
for (const line of UPGRADES) UPGRADE_INDEX[line.id] = line;

export function upgradeById(id) {
  return UPGRADE_INDEX[id] || null;
}

export function upgradeLevel(game, line) {
  const held = game.upgrades || {};
  return held[line.id] || 0;
}

// How far a line can be pushed. Defined levels, plus what the trials have
// given back: a trial pays into the thing it took, so Drought's cleared levels
// raise the food lines and nothing else.
export function upgradeMaxLevel(game, line) {
  if (!line.mastery) return line.levels.length;
  return line.levels.length + masteryLevels(game, line.mastery);
}

// Which upgrade lines a trial's mastery raises the cap on. The trials pay in
// two halves and the cards only ever named one of them: clearing a level of
// Drought also gives every food line another rung, which is a large part of
// what clearing is worth and went unmentioned entirely.
export function linesWithMastery(type) {
  return UPGRADES.filter(line => line.mastery === type);
}

export function upgradeMaxed(game, line) {
  return upgradeLevel(game, line) >= upgradeMaxLevel(game, line);
}

// what one level of a line is worth, defined or extended. An extended level
// repeats the last defined step, so a line never stops being worth buying and
// never suddenly jumps.
export function levelEffect(line, level) {
  const defined = line.levels[level - 1];
  if (defined) return defined;
  const last = line.levels[line.levels.length - 1];
  const past = level - line.levels.length;
  if (last.mult !== undefined) {
    return { mult: EXTENDED_MULT_STEP,
      desc: "The colony keeps refining what it already knows. All food x" +
        EXTENDED_MULT_STEP + " again." };
  }
  return { add: last.add * EXTENDED_ADD_SCALE,
    desc: "Another step past what the colony had learned, worth half the last one." };
}

export function levelCost(line, level) {
  const defined = line.levels[level - 1];
  if (defined) return { food: line.currency === "protein" ? 0 : defined.cost,
                        protein: line.currency === "protein" ? defined.cost : 0 };
  const last = line.levels[line.levels.length - 1];
  const past = level - line.levels.length;
  const base = line.currency === "protein" ? 0 : last.cost * Math.pow(EXTENDED_FOOD_STEP, past);
  const proteinBase = line.currency === "protein"
    ? last.cost * Math.pow(EXTENDED_FOOD_STEP, past)
    : EXTENDED_PROTEIN_BASE * Math.pow(EXTENDED_PROTEIN_STEP, past - 1);
  return { food: base, protein: proteinBase };
}

// the gate on a level: defined levels keep their own, extended levels inherit
// the last one, so nothing new is gated on a caste count nobody reaches
export function levelReq(line, level) {
  const defined = line.levels[level - 1];
  return (defined || line.levels[line.levels.length - 1]).req;
}

export function levelName(line, level) {
  const defined = line.levels[level - 1];
  return defined ? defined.name : line.name + " " + toRoman(level - line.levels.length);
}

function toRoman(n) {
  const table = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let out = "";
  for (const [value, sign] of table) while (n >= value) { out += sign; n -= value; }
  return out;
}

export function population(game) {
  let total = 0;
  for (const id in game.ants) total += game.ants[id];
  return total;
}

export function casteCount(game, key) {
  if (key === "population") return population(game);
  if (key === "soldier") return soldierCount(game);
  return game.ants[key];
}

// "Owned" now means every level a colony can currently reach is bought. It is
// what the panel greys out and what the achievement tracks used to count; the
// tracks count levels instead, so a merged line cannot take a tier back.
export function upgradeOwned(game, upgrade) {
  return upgradeMaxed(game, upgrade);
}

// total levels held, all lines or one branch -- the figure the upgrade
// achievement ladders are generated against
export function levelsOwned(game, branch) {
  let total = 0;
  for (const line of UPGRADES) {
    if (branch && upgradeBranch(line) !== branch) continue;
    total += upgradeLevel(game, line);
  }
  return total;
}

export function definedLevelsIn(branch) {
  let total = 0;
  for (const line of UPGRADES) {
    if (branch && upgradeBranch(line) !== branch) continue;
    total += line.levels.length;
  }
  return total;
}

export function upgradeBranch(upgrade) {
  return upgrade.branch || "colony";
}

// Two scopes, and they must not be confused. The run peak is the largest this
// colony has ever been and resets with the nuptial flight; it gates what the
// colony has earned — castes, upgrades, raids. The all-time peak never falls
// and feeds achievements only. Gating on all-time meant a brand-new colony of
// zero ants was already past every gate, facing a monster scaled to the best
// colony the player ever had.
export function runPeakCount(game, key) {
  const live = casteCount(game, key);
  const run = game.run || {};
  if (key === "population") return Math.max(run.peakPopulation || 0, live);
  const peaks = run.peakCastes || {};
  return Math.max(peaks[key] || 0, live);
}

export function peakCasteCount(game, key) {
  const live = casteCount(game, key);
  if (key === "population") return Math.max(game.peakPopulation || 0, live);
  const peaks = game.peakCastes || {};
  return Math.max(peaks[key] || 0, live);
}

export function upgradeNeedsRaid(game, upgrade) {
  return !!upgrade.afterFirstRaid && (game.raidsWon || 0) + (game.raidsLost || 0) === 0;
}

// gated on the NEXT level's requirement, so a line opens one rung at a time
export function upgradeUnlocked(game, upgrade) {
  if (upgradeNeedsRaid(game, upgrade)) return false;
  const next = Math.min(upgradeLevel(game, upgrade) + 1, upgradeMaxLevel(game, upgrade));
  const req = levelReq(upgrade, next);
  return runPeakCount(game, req.caste) >= req.count;
}

// what buying the next level of this line costs, in both currencies
export function nextLevelCost(game, line) {
  const next = upgradeLevel(game, line) + 1;
  if (next > upgradeMaxLevel(game, line)) return null;
  return levelCost(line, next);
}

export function upgradeCurrency(upgrade) {
  return upgrade.currency || "food";
}

export function visibleUpgrades(game) {
  return UPGRADES.filter(u => !upgradeMaxed(game, u) && upgradeUnlocked(game, u));
}

export function effectTotal(game, type, caste) {
  return sumEffect(game, type, caste);
}

export function baseFood(casteId) {
  return FOOD_PER_SECOND[casteId] || 0;
}

// the upgrade half of the food multiplier, without the achievement half
export function globalUpgradeMultiplier(game) {
  return productEffect(game, "globalFood");
}

// Every level bought on every matching line. This is the one place the old
// "is it owned" test became "how many levels", and everything that reads a rate
// goes through here, so a line and its levels can never disagree with the game.
function sumEffect(game, type, caste) {
  let total = 0;
  for (const line of UPGRADES) {
    const effect = line.effect;
    if (effect.type !== type) continue;
    if (caste && effect.caste !== caste) continue;
    const held = upgradeLevel(game, line);
    for (let level = 1; level <= held; level++) total += levelEffect(line, level).add || 0;
  }
  return total;
}

function productEffect(game, type, caste) {
  let total = 1;
  for (const line of UPGRADES) {
    if (line.effect.type !== type) continue;
    if (caste && line.effect.caste !== caste) continue;
    const held = upgradeLevel(game, line);
    for (let level = 1; level <= held; level++) total *= levelEffect(line, level).mult || 1;
  }
  return total;
}

// does this caste have any multiplier upgrades at all? the formula only shows
// the term when there is one to show
export function casteHasMultiplier(casteId) {
  return UPGRADES.some(u => u.effect.type === "casteMult" && u.effect.caste === casteId);
}

// how many levels a trial has given back for one kind of thing. Drought pays
// into food, so its cleared levels raise the food lines' cap and nothing else.
function masteryLevels(game, type) {
  let total = 0;
  for (const challenge of CHALLENGES) {
    if (!challenge.mastery || challenge.mastery.type !== type) continue;
    total += bestTrialLevel(game, challenge.id);
  }
  return total;
}

export function achievementFoodBonus(game) {
  return achievementBonus(game, ACHIEVEMENT_FOOD_RATE);
}

export function achievementHatchBonus(game) {
  return achievementBonus(game, ACHIEVEMENT_HATCH_RATE);
}

export function achievementJellyBonus(game) {
  return achievementBonus(game, ACHIEVEMENT_JELLY_RATE);
}

// flat food added to a caste's base: casteFood upgrades are stored as a share of
// the base, casteFlat upgrades as the food itself
export function casteFlatBonus(game, casteId) {
  const base = FOOD_PER_SECOND[casteId] || 0;
  return base * sumEffect(game, "casteFood", casteId) + sumEffect(game, "casteFlat", casteId);
}

export function casteMultiplier(game, casteId) {
  return productEffect(game, "casteMult", casteId);
}

// how long the founders take to halve, stretched by the upgrades that buy them
// time rather than output
export function naniticHalflife(game) {
  return NANITIC_HALFLIFE * (1 + sumEffect(game, "naniticVigour"));
}

// The upgrades that slow the fade extend the life with it. Without this a
// colony that bought Borrowed Time still lost its founders at two hours while
// they were producing a quarter of their output -- the cliff the decay exists
// to remove, handed back to the player who paid to avoid it.
export function naniticLifespan(game) {
  return NANITIC_LIFESPAN * (1 + sumEffect(game, "naniticVigour"));
}

export function naniticVigour(game) {
  return Math.pow(0.5, (game.runTime || 0) / naniticHalflife(game));
}

// food per second from the wing currently being stripped
export function wingYield(game) {
  return (game.wingStrip || 0) > 0 ? WING_FOOD / WING_STRIP_TIME : 0;
}

export function rallyActive(game) {
  return (game.rallyTime || 0) > 0;
}

export function rallyMultiplier(game, casteId) {
  return casteId === "forager" && rallyActive(game) ? RALLY_MULT : 1;
}

export function casteFoodPerSecond(game, casteId) {
  const base = FOOD_PER_SECOND[casteId];
  if (!base) return 0;
  const naniticMult = casteId === "nanitic"
    ? prestigeNaniticMult(game) * naniticVigour(game)
    : 1;
  return (base + casteFlatBonus(game, casteId)) *
    casteMultiplier(game, casteId) * naniticMult * rallyMultiplier(game, casteId) *
    globalFoodMultiplier(game) * foodPenalty(game);
}

export function hidingPenalty(game) {
  return game.hiding ? HIDING_FOOD_PENALTY : 1;
}

// Everything that raises food above its base. Penalties are not in here --
// they live in foodPenalty(), so a debuff is one term in one place rather than
// something hidden inside a factor called "colony".
export function globalFoodMultiplier(game) {
  return productEffect(game, "globalFood") * achievementFoodBonus(game) *
    prestigeFoodMultiplier(game) * challengeReward(game) * masteryFood(game);
}

// Everything that takes food away, multiplied together. Trials plug in here,
// and so does whatever comes after them.
export function foodPenalty(game) {
  return hidingPenalty(game) * challengeDebuff(game);
}

export function bigForagerThreshold(game) {
  const found = game.bigForagers ? game.bigForagers.length : 0;
  return Math.round(BIG_FORAGER_FIRST * Math.pow(BIG_FORAGER_GROWTH, found));
}

export function bigForagerMultiplier(game, bornAt) {
  const minutes = Math.max(0, (game.stats.playtime - bornAt) / 60);
  return Math.min(BIG_FORAGER_AGE_CAP, 1 + BIG_FORAGER_AGE_GAIN * minutes);
}

// the flight teaches the colony to raise them properly; before it they are an
// early-game curiosity that fades to a few percent of production
// Earned on the Achievements tab rather than bought in the lineage, and every
// achievement bonus stays live inside a trial. Suppressing this one made the
// Bonuses page contradict itself: it says the colony knows how to feed an
// oversized forager, and then it did not.
export function bigForagerBonus(game) {
  return (game.prestige && game.prestige.flightsTaken || 0) > 0 ? BIG_FORAGER_PRESTIGE_MULT : 1;
}

export function bigForagerOutput(game) {
  if (!game.bigForagers || game.bigForagers.length === 0) return 0;
  const each = BIG_FORAGER_BASE * bigForagerBonus(game) * casteFoodPerSecond(game, "forager");
  let total = 0;
  for (const bornAt of game.bigForagers) total += each * bigForagerMultiplier(game, bornAt);
  return total;
}

export function foodPerSecond(game) {
  let rate = 0;
  for (const id in game.ants) rate += game.ants[id] * casteFoodPerSecond(game, id);
  return rate + bigForagerOutput(game) + wingYield(game);
}

export function populationCap(game) {
  const perExcavator = CAP_PER_EXCAVATOR + sumEffect(game, "excavatorCap") + prestigeExcavatorCap(game);
  return BASE_POPULATION_CAP + prestigeBaseCap(game) + perExcavator * game.ants.excavator;
}

export function hatchRate(game) {
  return achievementHatchBonus(game);
}

export function slotsPerNurse(game) {
  return SLOTS_PER_NURSE + sumEffect(game, "nurseSlots");
}

export function broodCapacity(game) {
  return Math.max(1, Math.floor(
    BASE_BROOD_SLOTS + prestigeBroodSlots(game) + sumEffect(game, "broodSlots") +
    slotsPerNurse(game) * game.ants.nurse + NANITIC_BROOD_SLOTS * game.ants.nanitic
  ));
}

export function incubationTime(game) {
  return EGG_TIME / hatchRate(game);
}

export function broodCount(game, casteId) {
  let n = 0;
  for (const egg of game.eggs) if (egg.caste === casteId) n++;
  return n;
}

export function casteStock(game, casteId) {
  const held = casteId === "soldier" ? soldierCount(game) : game.ants[casteId];
  return held + broodCount(game, casteId);
}

export function eggPrice(casteId, n) {
  const curve = CASTE_COSTS[casteId] || CASTE_COSTS.forager;
  const exponent = curve.breakAt && n > curve.breakAt ? curve.exponent2 : curve.exponent;
  return curve.base * Math.pow(n, exponent);
}

export function eggCost(game, casteId) {
  if (game.emerged === 0) {
    return { resource: "reserves", amount: RESERVE_EGG_COST };
  }
  const caste = casteId || game.nextCaste;
  return { resource: "food", amount: eggPrice(caste, casteStock(game, caste) + 1) };
}

// Under siege the colony meets its first attacker at 16 ants, so it has to be
// able to lay a soldier at 16 as well. Without this the trial is unwinnable by
// construction: attacked from 16, unable to raise a defender until 256.
export function casteUnlockAt(game, casteId) {
  if (casteId === "soldier" && siegeActive(game)) return SIEGE_UNLOCK;
  return CASTES[casteId].unlockAt;
}

export function isUnlocked(game, casteId) {
  return runPeakCount(game, "population") >= casteUnlockAt(game, casteId);
}

export function layableCastes() {
  return Object.keys(CASTES).filter(id => CASTES[id].layable);
}

export function emergingCaste(game, egg, queuePosition) {
  const before = game.emerged + (queuePosition || 0);
  return before < NANITIC_GENERATION ? "nanitic" : egg.caste;
}

export function nextEggCaste(game) {
  return game.emerged + game.eggs.length < NANITIC_GENERATION ? "nanitic" : game.nextCaste;
}
