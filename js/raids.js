import { effectTotal, globalFoodMultiplier, population } from "./ants.js";

export const RAID_UNLOCK = 400;
export const RAID_INTERVAL = 360;
export const RAID_WARNING = 30;
export const EGG_PROTEIN_COST = 1;
export const FED_EGG_SPEED = 2;
export const MONSTER_BASE = 1000;
export const MONSTER_EXPONENT = 1.05;
export const PROTEIN_PER_POWER = 0.04;
export const FOOD_PER_POWER = 60;
export const LOSS_CAP = 0.2;

export const SOLDIER_COMBAT = 25;
export const BIG_FORAGER_COMBAT_MULT = 3;
export const HUNT_PROTEIN_PER_SOLDIER = 0.01;
export const RAID_RAMP = [0.25, 0.5, 0.75];

const COMBAT_EFFECT = {
  forager: "combatForager",
  excavator: "combatExcavator",
  nurse: "combatNurse"
};

export const DEATH_ORDER = ["soldier", "forager", "bigforager", "nanitic", "nurse", "excavator"];


export function combatPerSoldier(game) {
  return SOLDIER_COMBAT * (1 + effectTotal(game, "soldierPower"));
}

export function combatPerCaste(game, caste) {
  if (caste === "soldier") return combatPerSoldier(game);
  if (caste === "bigforager") {
    return effectTotal(game, COMBAT_EFFECT.forager) * BIG_FORAGER_COMBAT_MULT;
  }
  const effect = COMBAT_EFFECT[caste];
  return effect ? effectTotal(game, effect) : 0;
}

export function combatPower(game) {
  let power = 0;
  for (const id in game.ants) power += game.ants[id] * combatPerCaste(game, id);
  return power;
}

export function raidsSeen(game) {
  return (game.raidsWon || 0) + (game.raidsLost || 0);
}

export function hunting(game) {
  return raidsUnlocked(game) && game.raidTimer > RAID_WARNING && game.ants.soldier > 0;
}

export function huntRate(game) {
  if (!hunting(game)) return 0;
  return game.ants.soldier * HUNT_PROTEIN_PER_SOLDIER * (1 + effectTotal(game, "proteinYield"));
}

export function monsterPower(game) {
  const reach = Math.max(RAID_UNLOCK, game.peakPopulation || 0);
  const seen = raidsSeen(game);
  const ramp = seen < RAID_RAMP.length ? RAID_RAMP[seen] : 1;
  return MONSTER_BASE * Math.pow(reach / RAID_UNLOCK, MONSTER_EXPONENT) *
    (1 + 0.05 * (game.raidsWon || 0)) * ramp;
}

export function raidRewards(game, power) {
  return {
    protein: Math.max(1, Math.round(power * PROTEIN_PER_POWER * (1 + effectTotal(game, "proteinYield")))),
    food: power * FOOD_PER_POWER * globalFoodMultiplier(game)
  };
}

export function raidsUnlocked(game) {
  return Math.max(game.peakPopulation || 0, population(game)) >= RAID_UNLOCK;
}

export function raidCountdown(game) {
  return Math.max(0, game.raidTimer);
}

export function raidImminent(game) {
  return raidsUnlocked(game) && game.raidTimer <= RAID_WARNING;
}

function killAnts(game, toll) {
  const dead = {};
  let remaining = toll;
  for (const caste of DEATH_ORDER) {
    if (remaining <= 0) break;
    const held = game.ants[caste];
    if (held <= 0) continue;
    const taken = Math.min(held, remaining);
    game.ants[caste] -= taken;
    if (caste === "bigforager") game.bigForagers.splice(0, taken);
    dead[caste] = taken;
    remaining -= taken;
  }
  return dead;
}

export function resolveRaid(game) {
  const power = monsterPower(game);
  const defence = combatPower(game);
  const won = defence >= power;
  const reward = raidRewards(game, power);

  if (won) {
    game.protein += reward.protein;
    game.stats.proteinEarned = (game.stats.proteinEarned || 0) + reward.protein;
    game.food += reward.food;
    game.stats.foodEarned += reward.food;
    game.raidsWon++;
    game.lastRaid = { won: true, power, protein: reward.protein, food: reward.food, dead: {} };
    return game.lastRaid;
  }

  const shortfall = Math.min(1, (power - defence) / power);
  const toll = Math.max(1, Math.floor(population(game) * LOSS_CAP * shortfall));
  const dead = killAnts(game, toll);
  const salvage = Math.round(reward.protein * (defence / power));
  game.protein += salvage;
  game.stats.proteinEarned = (game.stats.proteinEarned || 0) + salvage;
  game.raidsLost++;
  game.lastRaid = { won: false, power, protein: salvage, food: 0, dead };
  return game.lastRaid;
}
