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
    role: "Undersized first-generation worker. Forages poorly."
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
  }
};

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
export const RALLY_MULT = 3;
export const RALLY_DURATION = 30;
export const RALLY_COOLDOWN = 90;


export const HIDING_FOOD_PENALTY = 0.5;

export const ACHIEVEMENT_FOOD_PER_LEVEL = 0.03;
export const ACHIEVEMENT_HATCH_PER_LEVEL = 0.01;
export const ACHIEVEMENT_JELLY_PER_LEVEL = 0.05;

const FOOD_PER_SECOND = {
  nanitic: 0.9,
  forager: 1,
  bigforager: 0,
  excavator: 0,
  nurse: 0,
  soldier: 0
};

export const CASTE_COSTS = {
  forager: { base: 1.5, exponent: 1.75 },
  // dearer and rarer than they were, and steeper once a colony is past the
  // prestige gate: at 58 cap each, #17 is where the nest first holds 1,000
  excavator: { base: 100, exponent: 1.8, breakAt: 17, exponent2: 2.2 },
  nurse: { base: 60, exponent: 1.7 },
  soldier: { base: 200, exponent: 1.6 }
};


export const UPGRADES = [
  { id: "nanitic_1", name: "Callow Cuticle", req: { caste: "nanitic", count: 1 }, cost: 30,
    desc: "Thin-shelled nanitics forage twice as hard.", effect: { type: "casteFlat", caste: "nanitic", add: 0.9 } },
  { id: "nanitic_2", name: "Hunger of the First", req: { caste: "nanitic", count: 2 }, cost: 120,
    desc: "The first generation works itself to the bone.", effect: { type: "casteFlat", caste: "nanitic", add: 1.2 } },
  { id: "nanitic_3", name: "Living Larder", req: { caste: "nanitic", count: 3 }, cost: 500,
    desc: "Nanitics store food in their own crops.", effect: { type: "casteMult", caste: "nanitic", mult: 1.5 } },
  { id: "nanitic_4", name: "Borrowed Time", req: { caste: "nanitic", count: 4 }, cost: 1200,
    desc: "They will not live to see the colony they build.", effect: { type: "casteMult", caste: "nanitic", mult: 2 } },

  { id: "forager_1", name: "Scent Trails", req: { caste: "forager", count: 3 }, cost: 260,
    desc: "Foragers mark the route home. Forager food +50%.", effect: { type: "casteFood", caste: "forager", add: 0.5 } },
  { id: "forager_2", name: "Leaf Shears", req: { caste: "forager", count: 12 }, cost: 1500,
    desc: "Sharper mandibles cut faster. Forager food +75%.", effect: { type: "casteFood", caste: "forager", add: 0.75 } },
  { id: "forager_3", name: "Aphid Herding", req: { caste: "forager", count: 35 }, cost: 8000,
    desc: "Milked aphids yield honeydew. Forager food +100%.", effect: { type: "casteFood", caste: "forager", add: 1 } },
  { id: "forager_4", name: "Deep Middens", req: { caste: "forager", count: 90 }, cost: 25000,
    desc: "Nothing edible is wasted. Forager food +150%.", effect: { type: "casteFood", caste: "forager", add: 1.5 } },
  { id: "forager_5", name: "Trunk Trails", req: { caste: "forager", count: 150 }, cost: 70000,
    desc: "Cleared highways speed every trip. Forager food +200%.", effect: { type: "casteFood", caste: "forager", add: 2 } },
  { id: "forager_6", name: "Canopy Routes", req: { caste: "forager", count: 400 }, cost: 400000,
    desc: "The colony harvests the whole tree. Forager food +300%.", effect: { type: "casteFood", caste: "forager", add: 3 } },

  { id: "excavator_1", name: "Loose Soil", req: { caste: "excavator", count: 3 }, cost: 1200,
    desc: "Easier digging. Each excavator holds 4 more ants.", effect: { type: "excavatorCap", add: 4 } },
  { id: "excavator_2", name: "Vaulted Galleries", req: { caste: "excavator", count: 15 }, cost: 9000,
    desc: "Arched roofs stop collapses. +6 cap per excavator.", effect: { type: "excavatorCap", add: 6 } },
  { id: "excavator_3", name: "Deep Shafts", req: { caste: "excavator", count: 22 }, cost: 90000,
    desc: "The nest reaches the water table. +12 cap per excavator.", effect: { type: "excavatorCap", add: 12 } },
  { id: "excavator_4", name: "Cathedral Chambers", req: { caste: "excavator", count: 55 }, cost: 500000,
    desc: "Halls big enough to lose a queen in. +24 cap per excavator.", effect: { type: "excavatorCap", add: 24 } },

  { id: "nurse_1", name: "Warm Brood Pile", req: { caste: "nurse", count: 3 }, cost: 15000,
    desc: "Eggs are moved to follow the sun. Each nurse tends more brood.", effect: { type: "nurseSlots", add: 0.05 } },
  { id: "nurse_2", name: "Trophallaxis", req: { caste: "nurse", count: 12 }, cost: 50000,
    desc: "Mouth-to-mouth feeding of the brood. Each nurse tends more brood.", effect: { type: "nurseSlots", add: 0.08 } },
  { id: "nurse_3", name: "Fungal Bedding", req: { caste: "nurse", count: 30 }, cost: 220000,
    desc: "Antibiotic mulch keeps the brood clean. Each nurse tends more brood.", effect: { type: "nurseSlots", add: 0.12 } },
  { id: "nurse_4", name: "Brood Nurseries", req: { caste: "nurse", count: 70 }, cost: 1.5e6,
    desc: "Dedicated chambers sorted by age. Each nurse tends more brood.", effect: { type: "nurseSlots", add: 0.15 } },

  { id: "combat_1", name: "Alarm Pheromone", req: { caste: "population", count: 0 }, cost: 30000, branch: "combat", afterFirstRaid: true,
    desc: "The whole nest answers an attack. Every forager fights at 1 strength.", effect: { type: "combatForager", add: 1 } },
  { id: "combat_2", name: "Gallery Wardens", req: { caste: "excavator", count: 20 }, cost: 120000, branch: "combat", afterFirstRaid: true,
    desc: "Diggers block the tunnels with their bodies. Every excavator fights at 10.", effect: { type: "combatExcavator", add: 10 } },
  { id: "combat_3", name: "Brood Defenders", req: { caste: "nurse", count: 20 }, cost: 200000, branch: "combat", afterFirstRaid: true,
    desc: "Nurses will not leave the brood. Every nurse fights at 2.", effect: { type: "combatNurse", add: 2 } },

  { id: "protein_1", name: "Sharpened Mandibles", req: { caste: "soldier", count: 3 }, cost: 25, currency: "protein", branch: "combat",
    desc: "Honed jaws bite deeper. Soldiers fight 50% harder.", effect: { type: "soldierPower", add: 0.5 } },
  { id: "protein_2", name: "Hunting Parties", req: { caste: "soldier", count: 10 }, cost: 80, currency: "protein", branch: "combat",
    desc: "Kills are stripped to the shell. Raids yield 50% more protein.", effect: { type: "proteinYield", add: 0.5 } },
  { id: "protein_3", name: "Chitin Plating", req: { caste: "soldier", count: 25 }, cost: 250, currency: "protein", branch: "combat",
    desc: "Thickened armour. Soldier strength +100%.", effect: { type: "soldierPower", add: 1 } },
  { id: "protein_4", name: "Butchery", req: { caste: "soldier", count: 50 }, cost: 700, currency: "protein", branch: "combat",
    desc: "Nothing of the carcass is left. Raid protein +100%.", effect: { type: "proteinYield", add: 1 } },
  { id: "protein_5", name: "Royal Larder", req: { caste: "soldier", count: 100 }, cost: 2000, currency: "protein", branch: "combat",
    desc: "Stored meat feeds the brood. Three more eggs develop at once.", effect: { type: "broodSlots", add: 3 } },

  { id: "colony_1", name: "Colony Cohesion", req: { caste: "population", count: 60 }, cost: 12000,
    desc: "A colony that acts as one body. All food +25%.", effect: { type: "globalFood", mult: 1.25 } },
  { id: "colony_2", name: "Pheromone Network", req: { caste: "population", count: 300 }, cost: 150000,
    desc: "Chemical memory spans the whole nest. All food +50%.", effect: { type: "globalFood", mult: 1.5 } },
  { id: "colony_3", name: "Living Bridges", req: { caste: "population", count: 580 }, cost: 650000,
    desc: "Ants become the infrastructure. All food +100%.", effect: { type: "globalFood", mult: 2 } }
];

export function population(game) {
  let total = 0;
  for (const id in game.ants) total += game.ants[id];
  return total;
}

export function casteCount(game, key) {
  return key === "population" ? population(game) : game.ants[key];
}

export function upgradeOwned(game, upgrade) {
  return game.upgrades.indexOf(upgrade.id) >= 0;
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

export function upgradeUnlocked(game, upgrade) {
  if (upgradeNeedsRaid(game, upgrade)) return false;
  return runPeakCount(game, upgrade.req.caste) >= upgrade.req.count;
}

export function upgradeCurrency(upgrade) {
  return upgrade.currency || "food";
}

export function visibleUpgrades(game) {
  return UPGRADES.filter(u => !upgradeOwned(game, u) && upgradeUnlocked(game, u));
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

function sumEffect(game, type, caste) {
  let total = 0;
  for (const upgrade of UPGRADES) {
    const effect = upgrade.effect;
    if (effect.type !== type) continue;
    if (caste && effect.caste !== caste) continue;
    if (!upgradeOwned(game, upgrade)) continue;
    total += effect.add;
  }
  return total;
}

function productEffect(game, type, caste) {
  let total = 1;
  for (const upgrade of UPGRADES) {
    if (upgrade.effect.type !== type) continue;
    if (caste && upgrade.effect.caste !== caste) continue;
    if (!upgradeOwned(game, upgrade)) continue;
    total *= upgrade.effect.mult;
  }
  return total;
}

// does this caste have any multiplier upgrades at all? the formula only shows
// the term when there is one to show
export function casteHasMultiplier(casteId) {
  return UPGRADES.some(u => u.effect.type === "casteMult" && u.effect.caste === casteId);
}

export function achievementFoodBonus(game) {
  return 1 + ACHIEVEMENT_FOOD_PER_LEVEL * game.achievementLevel;
}

export function achievementHatchBonus(game) {
  return 1 + ACHIEVEMENT_HATCH_PER_LEVEL * game.achievementLevel;
}

export function achievementJellyBonus(game) {
  return 1 + ACHIEVEMENT_JELLY_PER_LEVEL * game.achievementLevel;
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

export function rallyActive(game) {
  return (game.rallyTime || 0) > 0;
}

export function rallyMultiplier(game, casteId) {
  return casteId === "forager" && rallyActive(game) ? RALLY_MULT : 1;
}

export function casteFoodPerSecond(game, casteId) {
  const base = FOOD_PER_SECOND[casteId];
  if (!base) return 0;
  const naniticMult = casteId === "nanitic" ? prestigeNaniticMult(game) : 1;
  return (base + casteFlatBonus(game, casteId)) *
    casteMultiplier(game, casteId) * naniticMult * rallyMultiplier(game, casteId) *
    globalFoodMultiplier(game);
}

export function hidingPenalty(game) {
  return game.hiding ? HIDING_FOOD_PENALTY : 1;
}

export function globalFoodMultiplier(game) {
  return productEffect(game, "globalFood") * achievementFoodBonus(game) *
    prestigeFoodMultiplier(game) * hidingPenalty(game);
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
  return rate + bigForagerOutput(game);
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
    BASE_BROOD_SLOTS + prestigeBroodSlots(game) + sumEffect(game, "broodSlots") + slotsPerNurse(game) * game.ants.nurse
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
  return game.ants[casteId] + broodCount(game, casteId);
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

export function isUnlocked(game, casteId) {
  return runPeakCount(game, "population") >= CASTES[casteId].unlockAt;
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
