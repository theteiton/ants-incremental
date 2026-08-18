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
  soldier: {
    name: "Soldier",
    unlockAt: 400,
    layable: true,
    role: "Defends the nest against raids."
  }
};

export const NANITIC_GENERATION = 5;
export const EGG_TIME = 15;
export const BASE_POPULATION_CAP = 30;
export const CAP_PER_EXCAVATOR = 5;
export const RESERVE_EGG_COST = 20;
export const FOOD_EGG_BASE = 10;
export const FOOD_EGG_EXPONENT = 1.2;

const FOOD_PER_SECOND = {
  nanitic: 0.35,
  forager: 1,
  excavator: 0,
  nurse: 0,
  soldier: 0
};

export function population(game) {
  let total = 0;
  for (const id in game.ants) total += game.ants[id];
  return total;
}

export function populationCap(game) {
  return BASE_POPULATION_CAP + CAP_PER_EXCAVATOR * game.ants.excavator;
}

export function foodPerSecond(game) {
  let rate = 0;
  for (const id in game.ants) rate += game.ants[id] * FOOD_PER_SECOND[id];
  return rate;
}

export function hatchRate(game) {
  return 1 + 0.25 * game.ants.nurse;
}

export function eggCost(game) {
  if (game.emerged === 0) {
    return { resource: "reserves", amount: RESERVE_EGG_COST };
  }
  return {
    resource: "food",
    amount: FOOD_EGG_BASE * Math.pow(1 + population(game), FOOD_EGG_EXPONENT)
  };
}

export function isUnlocked(game, casteId) {
  return population(game) >= CASTES[casteId].unlockAt;
}

export function layableCastes() {
  return Object.keys(CASTES).filter(id => CASTES[id].layable);
}

export function emergingCaste(game, egg) {
  return game.emerged < NANITIC_GENERATION ? "nanitic" : egg.caste;
}
