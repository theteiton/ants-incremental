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

export function royalJellyEarned(game) {
  return Math.max(1, Math.floor(
    Math.sqrt(Math.max(1000, game.peakPopulation || 0) / 1000) *
    (1 + (game.raidsWon || 0) / 20)
  ));
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
