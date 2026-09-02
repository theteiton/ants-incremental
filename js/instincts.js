// Instincts -- what achievement tiers buy.
//
// Tiers were pure scoring: they fed XP, XP fed a level, and the level paid three
// fixed bonuses. Nothing ever spent them. `CLAUDE.md` has carried a deferred note
// since the 20 August playtest -- "more achievement bonus types, deferred until a
// few prestige layers exist" -- and two layers now exist, so this is that.
//
// **Spending never lowers the level.** The level is computed from XP and the XP
// is computed from tiers, neither of which this file touches; what an instinct
// costs is subtracted only from the pool this file reports. A level once reached
// is never taken back, and that rule is older than this system.
//
// Four of the eight move the growth loop -- cap, brood, hatch, cap again --
// which is exactly what the species passives turned out not to do. None of them
// multiplies all food, because that is the one shape that has broken this game
// twice.
//
// This module imports nothing, for the same reason species.js does not: ants.js
// cannot import achievements.js without evaluating it before UPGRADES exists.

export const INSTINCTS = [
  { id: "inst_cap_1", name: "Deep Chambers", cost: 8,
    desc: "The line remembers how deep to dig. Base population cap +40.",
    effect: { type: "baseCap", add: 40, also: { type: "eggCost", mult: 0.94 } } },
  { id: "inst_brood_1", name: "Wide Brood", cost: 14,
    desc: "More of the nest is nursery. +2 brood slots in every colony.",
    effect: { type: "brood", add: 2, also: { type: "eggCost", mult: 0.93 } } },
  { id: "inst_combat", name: "Hard Carapace", cost: 20,
    desc: "Every generation is a little harder to break. Fighting strength ×1.5.",
    effect: { type: "combat", mult: 1.5 } },
  { id: "inst_protein", name: "Rich Render", cost: 26,
    desc: "The colony strips a corpse better than its mothers did. Protein ×1.5.",
    effect: { type: "protein", mult: 1.5 } },
  { id: "inst_hatch", name: "Quick Larvae", cost: 32,
    desc: "Brood that knows what it is becoming. Hatch speed ×1.25.",
    effect: { type: "hatch", mult: 1.25, also: { type: "eggCost", mult: 0.93 } } },
  { id: "inst_cap_2", name: "Deeper Chambers", cost: 38,
    desc: "Galleries below the frost line. Base population cap +150.",
    effect: { type: "baseCap", add: 150, also: { type: "eggCost", mult: 0.92 } } },
  { id: "inst_offline", name: "Full Crop", cost: 44,
    desc: "The colony works far longer without being watched. +8 hours of offline progress.",
    effect: { type: "offlineHours", add: 8 } },
  { id: "inst_keepfood", name: "Living Memory", cost: 50,
    desc: "A daughter leaves with a full crop. A quarter of the colony's food survives every reset — a nuptial flight, a matriline, a trial.",
    effect: { type: "keepFood", share: 0.25 } }
];

const INDEX = {};
for (const i of INSTINCTS) INDEX[i.id] = i;

export function instinctById(id) {
  return INDEX[id] || null;
}

export function instinctOwned(game, id) {
  return !!game.instincts && game.instincts.indexOf(id) >= 0;
}

// what has been spent, derived from what is owned rather than counted -- a
// separate counter is one more thing a migration can get wrong
export function instinctsSpent(game) {
  let spent = 0;
  for (const i of INSTINCTS) if (instinctOwned(game, i.id)) spent += i.cost;
  return spent;
}

// how many are affordable and not yet held, for the sub-tab dot
export function affordableInstincts(game) {
  const points = instinctPoints(game);
  return INSTINCTS.filter(i => !instinctOwned(game, i.id) && i.cost <= points).length;
}

export function instinctPoints(game) {
  return Math.max(0, (game.achievementPoints || 0) - instinctsSpent(game));
}

function sum(game, type) {
  let total = 0;
  for (const i of INSTINCTS) {
    if (i.effect.type !== type || !instinctOwned(game, i.id)) continue;
    total += i.effect.add;
  }
  return total;
}

function product(game, type) {
  let total = 1;
  for (const i of INSTINCTS) {
    if (!instinctOwned(game, i.id)) continue;
    if (i.effect.type === type && i.effect.mult !== undefined) total *= i.effect.mult;
    const also = i.effect.also;
    if (also && also.type === type && also.mult !== undefined) total *= also.mult;
  }
  return total;
}

export function instinctBaseCap(game) {
  return sum(game, "baseCap");
}

// What an egg costs, as a multiplier. Measured, the colony spends 79.4% of its
// food on eggs and 2.4% on room, so this is the only lever an instinct has that
// reaches the part of the loop that actually binds -- and it is not a global
// food multiplier, which the design refuses: it lowers the sink rather than
// raising the income, and it is self-limiting, because eggs approaching free
// hands the constraint back to the cap and the brood.
export function instinctEggCost(game) {
  return product(game, "eggCost");
}

export function instinctBrood(game) {
  return sum(game, "brood");
}

export function instinctCombat(game) {
  return product(game, "combat");
}

export function instinctProtein(game) {
  return product(game, "protein");
}

export function instinctHatch(game) {
  return product(game, "hatch");
}

export function instinctOfflineHours(game) {
  return sum(game, "offlineHours");
}

// what survives a reset of any kind, as a share of the food standing
export function instinctKeptFood(game) {
  let share = 0;
  for (const i of INSTINCTS) {
    if (i.effect.type !== "keepFood" || !instinctOwned(game, i.id)) continue;
    share = Math.max(share, i.effect.share);
  }
  return share;
}
