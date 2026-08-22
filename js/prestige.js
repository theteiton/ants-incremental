export const PRESTIGE_UNLOCK = 1000;

export const PRESTIGE_UPGRADES = [
  { id: "prestige_1", name: "Founding Memory", cost: 1,
    desc: "The queen remembers her first flight. Starting reserves +50.",
    effect: { type: "startingReserves", add: 50 } },
  { id: "prestige_2", name: "Royal Lineage", cost: 1,
    desc: "The bloodline feeds itself better. All food production ×1.25.",
    effect: { type: "prestigeGlobalFood", mult: 1.25 } },
  { id: "prestige_3", name: "Chamber Instinct", cost: 1,
    desc: "The queen knows where to dig. Base population cap +20.",
    effect: { type: "prestigeBaseCap", add: 20 } },
  { id: "prestige_4", name: "Brood Pheromones", cost: 2,
    desc: "The queen's pheromones warm the chamber. +2 base brood slots.",
    effect: { type: "prestigeBroodSlots", add: 2 } },
  { id: "prestige_5", name: "Martial Lineage", cost: 2,
    desc: "Soldiers descended from veterans. Soldier combat power ×1.5.",
    effect: { type: "prestigeSoldierMult", mult: 1.5 } },
  { id: "prestige_6", name: "Ancient Vigour", cost: 3,
    desc: "The first workers carry the queen's strength. Nanitic food ×2.",
    effect: { type: "prestigeNaniticMult", mult: 2 } },
  { id: "prestige_7", name: "Deep Galleries", cost: 3,
    desc: "Remembered tunnels are wider. Each excavator holds 3 more ants.",
    effect: { type: "prestigeExcavatorCap", add: 3 } },
  { id: "prestige_8", name: "Queen Sovereignty", cost: 4,
    desc: "The queen's presence lifts the whole colony. All food ×2.",
    effect: { type: "prestigeGlobalFood", mult: 2 } },

  { id: "prestige_9", name: "Nest Memory", cost: 3,
    desc: "The colony remembers every adaptation it has ever paid for, and buys them back as food allows.",
    effect: { type: "automation", key: "autoBuy" } },
  { id: "prestige_10", name: "Brood Instinct", cost: 4,
    desc: "The queen lays the chosen caste without being told, keeping the brood chambers full.",
    effect: { type: "automation", key: "autoLay" } },
  { id: "prestige_11", name: "Standing Orders", cost: 6,
    desc: "The colony holds the caste balance you set, and digs when the nest runs out of room.",
    effect: { type: "automation", key: "autoRatio" } },
  { id: "prestige_12", name: "Granary Instinct", cost: 5,
    desc: "The colony learns to keep a store back. Laying stops before it spends the food you are saving.",
    effect: { type: "automation", key: "foodReserve" } },
];

export const AUTOMATIONS = [
  { key: "autoShed", name: "Shed her wings", note: "She sheds the moment she lands." },
  { key: "autoBuy", name: "Buy known adaptations", note: "Re-buys anything this colony has owned before." },
  { key: "autoLay", name: "Keep the brood full", note: "Lays into every free slot.", inBrood: true },
  { key: "autoRatio", name: "Hold the caste balance", note: "Chooses the caste, and digs when the nest is full." }
];

export function prestigeUpgradeOwned(game, upgrade) {
  const p = game.prestige;
  if (!p || !Array.isArray(p.upgrades)) return false;
  return p.upgrades.indexOf(upgrade.id) >= 0;
}

function prestigeProductEffect(game, type) {
  let total = 1;
  for (const upgrade of PRESTIGE_UPGRADES) {
    if (upgrade.effect.type !== type) continue;
    if (!prestigeUpgradeOwned(game, upgrade)) continue;
    total *= upgrade.effect.mult;
  }
  return total;
}

function prestigeSumEffect(game, type) {
  let total = 0;
  for (const upgrade of PRESTIGE_UPGRADES) {
    if (upgrade.effect.type !== type) continue;
    if (!prestigeUpgradeOwned(game, upgrade)) continue;
    total += upgrade.effect.add;
  }
  return total;
}

export const JELLY_SCALE = 3;
export const JELLY_EXPONENT = 0.8;

// Earned from the colony standing at the moment of the flight, not from
// peakPopulation -- that survives the reset, so paying out on it let a player
// flight repeatedly with no ants and collect every time.
//
// The payout is deliberately not floored. Under sqrt-and-floor every flight
// paid exactly 1 whatever the colony did: tripling a run from 1,000 to 3,000
// ants moved the raw value from 1.00 to 1.73 and still rounded to 1, so
// pushing a run was punished and the whole tree took 35 identical flights.
export function royalJellyEarned(game, population, jellyBonus) {
  if (population < PRESTIGE_UNLOCK) return 0;
  const raw = JELLY_SCALE *
    Math.pow(population / PRESTIGE_UNLOCK, JELLY_EXPONENT) *
    (1 + (game.raidsWon || 0) / 20) *
    (jellyBonus || 1);
  return Math.max(1, Math.round(raw * 10) / 10);
}

// what an hour of this colony is currently worth in jelly, so a player can see
// whether to fly now or push on
export function jellyPerHour(reward, runTime) {
  if (!(runTime > 60)) return 0;
  return reward / (runTime / 3600);
}

// automation is the thing the flight actually sells, so it is bought with
// jelly rather than handed over by a flight count
export function automationUnlocked(game, key) {
  if (key === "autoShed") return (game.prestige && game.prestige.flightsTaken || 0) > 0;
  return PRESTIGE_UPGRADES.some(u =>
    u.effect.type === "automation" && u.effect.key === key && prestigeUpgradeOwned(game, u));
}

export function prestigeFoodMultiplier(game) {
  return prestigeProductEffect(game, "prestigeGlobalFood");
}

export function prestigeStartingReserves(game) {
  return prestigeSumEffect(game, "startingReserves");
}

export function prestigeBaseCap(game) {
  return prestigeSumEffect(game, "prestigeBaseCap");
}

export function prestigeExcavatorCap(game) {
  return prestigeSumEffect(game, "prestigeExcavatorCap");
}

export function prestigeBroodSlots(game) {
  return prestigeSumEffect(game, "prestigeBroodSlots");
}

export function prestigeSoldierMult(game) {
  return prestigeProductEffect(game, "prestigeSoldierMult");
}

export function prestigeNaniticMult(game) {
  return prestigeProductEffect(game, "prestigeNaniticMult");
}
