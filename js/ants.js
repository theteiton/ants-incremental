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
    unlockAt: 25,
    layable: true,
    role: "Digs new chambers, raising the population cap."
  },
  nurse: {
    name: "Nurse",
    unlockAt: 100,
    layable: true,
    role: "Tends the brood, hatching eggs faster."
  },
  bigforager: {
    name: "Big Forager",
    unlockAt: 0,
    layable: false,
    role: "A rare oversized forager. Cannot be laid; she hatches from ordinary forager eggs."
  },
  soldier: {
    name: "Soldier",
    unlockAt: 400,
    layable: true,
    role: "Defends the nest against raids."
  }
};

export const NANITIC_GENERATION = 5;
export const EGG_TIME = 24;
export const BASE_POPULATION_CAP = 30;
export const CAP_PER_EXCAVATOR = 6;
export const RESERVE_EGG_COST = 20;
export const EXCAVATOR_OVERFLOW = 3;
export const NANITIC_LIFESPAN = 7200;
export const BASE_BROOD_SLOTS = 3;
export const SLOTS_PER_NURSE = 0.25;
export const BIG_FORAGER_BASE = 5;
export const BIG_FORAGER_FIRST = 3;
export const BIG_FORAGER_GROWTH = 3.5;
export const BIG_FORAGER_AGE_GAIN = 0.05;
export const BIG_FORAGER_AGE_CAP = 3;
export const ACHIEVEMENT_FOOD_PER_LEVEL = 0.03;
export const ACHIEVEMENT_HATCH_PER_LEVEL = 0.01;

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
  excavator: { base: 15, exponent: 1.8 },
  nurse: { base: 60, exponent: 1.7 },
  soldier: { base: 200, exponent: 1.6 }
};


export const UPGRADES = [
  { id: "nanitic_1", name: "Callow Cuticle", req: { caste: "nanitic", count: 3 }, cost: 30,
    desc: "Thin-shelled nanitics forage twice as hard.", effect: { type: "casteFood", caste: "nanitic", add: 1 } },
  { id: "nanitic_2", name: "Hunger of the First", req: { caste: "nanitic", count: 5 }, cost: 120,
    desc: "The first generation works itself to the bone.", effect: { type: "casteFood", caste: "nanitic", add: 2 } },
  { id: "nanitic_3", name: "Living Larder", req: { caste: "nanitic", count: 5 }, cost: 500,
    desc: "Nanitics store food in their own crops.", effect: { type: "casteFood", caste: "nanitic", add: 4 } },

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
    desc: "Easier digging. Each excavator holds 2 more ants.", effect: { type: "excavatorCap", add: 2 } },
  { id: "excavator_2", name: "Vaulted Galleries", req: { caste: "excavator", count: 15 }, cost: 9000,
    desc: "Arched roofs stop collapses. +3 cap per excavator.", effect: { type: "excavatorCap", add: 3 } },
  { id: "excavator_3", name: "Deep Shafts", req: { caste: "excavator", count: 22 }, cost: 90000,
    desc: "The nest reaches the water table. +6 cap per excavator.", effect: { type: "excavatorCap", add: 6 } },
  { id: "excavator_4", name: "Cathedral Chambers", req: { caste: "excavator", count: 55 }, cost: 500000,
    desc: "Halls big enough to lose a queen in. +12 cap per excavator.", effect: { type: "excavatorCap", add: 12 } },

  { id: "nurse_1", name: "Warm Brood Pile", req: { caste: "nurse", count: 3 }, cost: 15000,
    desc: "Eggs are moved to follow the sun. Each nurse tends more brood.", effect: { type: "nurseSlots", add: 0.05 } },
  { id: "nurse_2", name: "Trophallaxis", req: { caste: "nurse", count: 12 }, cost: 50000,
    desc: "Mouth-to-mouth feeding of the brood. Each nurse tends more brood.", effect: { type: "nurseSlots", add: 0.08 } },
  { id: "nurse_3", name: "Fungal Bedding", req: { caste: "nurse", count: 30 }, cost: 220000,
    desc: "Antibiotic mulch keeps the brood clean. Each nurse tends more brood.", effect: { type: "nurseSlots", add: 0.12 } },
  { id: "nurse_4", name: "Brood Nurseries", req: { caste: "nurse", count: 70 }, cost: 1.5e6,
    desc: "Dedicated chambers sorted by age. Each nurse tends more brood.", effect: { type: "nurseSlots", add: 0.15 } },

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

export function upgradeUnlocked(game, upgrade) {
  return casteCount(game, upgrade.req.caste) >= upgrade.req.count;
}

export function visibleUpgrades(game) {
  return UPGRADES.filter(u => !upgradeOwned(game, u) && upgradeUnlocked(game, u));
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

function productEffect(game, type) {
  let total = 1;
  for (const upgrade of UPGRADES) {
    if (upgrade.effect.type !== type) continue;
    if (!upgradeOwned(game, upgrade)) continue;
    total *= upgrade.effect.mult;
  }
  return total;
}

export function achievementFoodBonus(game) {
  return 1 + ACHIEVEMENT_FOOD_PER_LEVEL * game.achievementLevel;
}

export function achievementHatchBonus(game) {
  return 1 + ACHIEVEMENT_HATCH_PER_LEVEL * game.achievementLevel;
}

export function casteFoodPerSecond(game, casteId) {
  const base = FOOD_PER_SECOND[casteId];
  if (!base) return 0;
  return base * (1 + sumEffect(game, "casteFood", casteId)) * globalFoodMultiplier(game);
}

export function globalFoodMultiplier(game) {
  return productEffect(game, "globalFood") * achievementFoodBonus(game);
}

export function bigForagerThreshold(game) {
  const found = game.bigForagers ? game.bigForagers.length : 0;
  return Math.round(BIG_FORAGER_FIRST * Math.pow(BIG_FORAGER_GROWTH, found));
}

export function bigForagerMultiplier(game, bornAt) {
  const minutes = Math.max(0, (game.stats.playtime - bornAt) / 60);
  return Math.min(BIG_FORAGER_AGE_CAP, 1 + BIG_FORAGER_AGE_GAIN * minutes);
}

export function bigForagerOutput(game) {
  if (!game.bigForagers || game.bigForagers.length === 0) return 0;
  const each = BIG_FORAGER_BASE * (1 + sumEffect(game, "casteFood", "forager")) * globalFoodMultiplier(game);
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
  const perExcavator = CAP_PER_EXCAVATOR + sumEffect(game, "excavatorCap");
  return BASE_POPULATION_CAP + perExcavator * game.ants.excavator;
}

export function hatchRate(game) {
  return achievementHatchBonus(game);
}

export function slotsPerNurse(game) {
  return SLOTS_PER_NURSE + sumEffect(game, "nurseSlots");
}

export function broodCapacity(game) {
  return Math.max(1, Math.floor(BASE_BROOD_SLOTS + slotsPerNurse(game) * game.ants.nurse));
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

export function eggCost(game, casteId) {
  if (game.emerged === 0) {
    return { resource: "reserves", amount: RESERVE_EGG_COST };
  }
  const caste = casteId || game.nextCaste;
  const curve = CASTE_COSTS[caste];
  return {
    resource: "food",
    amount: curve.base * Math.pow(casteStock(game, caste) + 1, curve.exponent)
  };
}

export function isUnlocked(game, casteId) {
  return Math.max(game.peakPopulation || 0, population(game)) >= CASTES[casteId].unlockAt;
}

export function layableCastes() {
  return Object.keys(CASTES).filter(id => CASTES[id].layable);
}

export function emergingCaste(game, egg) {
  return game.emerged < NANITIC_GENERATION ? "nanitic" : egg.caste;
}
