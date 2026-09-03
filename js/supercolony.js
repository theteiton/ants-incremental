// Layer 3 -- the Supercolony.
//
// Layers 1 and 2 are the same machine twice: reset the colony, earn a scalar
// currency proportional to how far you got, spend it on a tree of permanent
// multipliers, own the tree outright, move on. This one breaks all four of
// those on purpose.
//
//   no reset      nothing is wiped; the line ADDS nests and they all keep running
//   no currency   what accumulates is nests, and what is spent is attention
//   no tree       a daughter inherits three of her raiser's traits and no more
//   no completion the set can never be filled, because taking one leaves another
//
// Real, as usual: Linepithema humile holds a supercolony along roughly 6,000km
// of Mediterranean coast, thousands of nests with no aggression between them,
// and they BUD rather than fly -- a daughter walks out with workers and brood
// instead of mating in the air.
//
// This file imports nothing. `ants.js` and `matriline.js` both need to read what
// a nest's traits are worth, and neither can import a module that imports them
// back -- the same rule `species.js` and `instincts.js` follow.

// Ground is what a nest is founded on, so the supercolony cannot outgrow the
// map: a daughter needs a held cell, and held cells need Guards to keep them.
// That is the cap, and it is one the player earns rather than a constant.
export const SUPER_SPECIES_NEEDED = 2;

// Three, and it is the load-bearing rule of the whole layer. If a daughter
// inherited everything, generation N would be at least as strong as N-1 by
// construction and the line would run away -- which is exactly what happened to
// Polyergus at CAPTURE_DIGGER_CAP 4 and to veterancy before it was capped at
// Major. A fixed three means a line DRIFTS rather than accumulates.
export const INHERIT_WIDTH = 3;

// What a nest can earn by being played, and what holding it is worth. Every one
// is scoped: none of them multiplies all food, which is the hardest rule in
// this game and the one a combination system will try hardest to break.
export const TRAITS = [
  { id: "tr_forage", name: "Worn Trails", kind: "food", mult: 1.25,
    desc: "The routes out of this nest are trodden into the ground. Foragers here work a quarter harder.",
    earn: "raise 2,000 ants in this nest",
    test: g => peak(g) >= 2000 },

  { id: "tr_deep", name: "Deep Galleries", kind: "cap", mult: 1.35,
    desc: "Chambers cut further down than the diggers here have any right to reach. Room for half again as many.",
    earn: "hold 400 ants at once",
    test: g => peak(g) >= 400 },

  { id: "tr_warm", name: "Warm Chambers", kind: "brood", add: 3,
    desc: "The nursery here never cools. Three more eggs develop at once.",
    earn: "hatch 3,000 eggs in this nest",
    test: g => (g.stats && g.stats.eggsHatched || 0) >= 3000 },

  { id: "tr_hard", name: "Hardened Gate", kind: "combat", mult: 1.4,
    desc: "This nest has been broken into before and does not intend to be again. Everything here fights harder.",
    earn: "win 40 raids from this nest",
    test: g => (g.stats && g.stats.raidsWonTotal || 0) >= 40 },

  { id: "tr_thrift", name: "Thrifty Brood", kind: "egg", mult: 0.85,
    desc: "The nurses here waste nothing. An egg costs less to lay.",
    earn: "destroy no eggs and reach 1,000 ants",
    test: g => peak(g) >= 1000 && (g.stats && g.stats.eggsCancelled || 0) === 0 },

  { id: "tr_ground", name: "Broad Holding", kind: "food", mult: 1.2,
    desc: "This nest has taken and kept more ground than it needs. The trails run further out.",
    earn: "hold 15 cells at once",
    test: g => (g.stats && g.stats.peakHeld || 0) >= 15 },

  { id: "tr_veteran", name: "Standing Army", kind: "combat", mult: 1.3,
    desc: "A garrison that has never been relieved. Soldiers raised here are worth more.",
    earn: "train 200 soldiers into a higher grade",
    test: g => (g.stats && g.stats.trained || 0) >= 200 },

  { id: "tr_patient", name: "Unhurried Line", kind: "brood", add: 2,
    desc: "Nothing here was ever rushed. Two more eggs develop at once.",
    earn: "exile no ants and hatch 1,000 eggs",
    test: g => (g.stats && g.stats.eggsHatched || 0) >= 1000 &&
      (g.stats && g.stats.exiled || 0) === 0 }
];

function peak(g) {
  return Math.max(g.peakPopulation || 0, (g.run && g.run.peakPopulation) || 0);
}

const INDEX = {};
for (const t of TRAITS) INDEX[t.id] = t;

export function traitById(id) {
  return INDEX[id] || null;
}

// Which traits this nest has actually earned by being played. Derived from the
// colony rather than stored, so nothing can go stale and no migration is needed.
export function earnedTraits(game) {
  return TRAITS.filter(t => t.test(game)).map(t => t.id);
}

// ...and which it holds: what it was founded with plus what it has since earned.
// A nest keeps what it earns; only what it PASSES ON is limited.
export function nestTraits(game) {
  const born = Array.isArray(game.traits) ? game.traits : [];
  const earned = earnedTraits(game);
  const all = born.slice();
  for (const id of earned) if (all.indexOf(id) < 0) all.push(id);
  return all;
}

export function hasTrait(game, id) {
  return nestTraits(game).indexOf(id) >= 0;
}

// What the traits a nest holds are worth, by kind. Scoped, and read by the same
// functions every other modifier goes through.
export function traitMult(game, kind) {
  let total = 1;
  for (const id of nestTraits(game)) {
    const t = INDEX[id];
    if (t && t.kind === kind && t.mult !== undefined) total *= t.mult;
  }
  return total;
}

export function traitAdd(game, kind) {
  let total = 0;
  for (const id of nestTraits(game)) {
    const t = INDEX[id];
    if (t && t.kind === kind && t.add !== undefined) total += t.add;
  }
  return total;
}

export function traitFood(game) { return traitMult(game, "food"); }
export function traitCap(game) { return traitMult(game, "cap"); }
export function traitCombat(game) { return traitMult(game, "combat"); }
export function traitEgg(game) { return traitMult(game, "egg"); }
export function traitBrood(game) { return traitAdd(game, "brood"); }

// ------------------------------------------------------------------ the network
//
// A nest that is not focused is a plain colony snapshot. It is ticked through
// the REAL tick(), never an approximation: the away-report rule applies here
// too -- anything that runs in the background must run the same path the player
// would have seen, or switching to it lands somewhere the live path never
// would.
export function nests(game) {
  return Array.isArray(game.nests) ? game.nests : [];
}

export function nestCount(game) {
  return 1 + nests(game).length;
}

// What the whole network is worth, which is the figure the layer is read on.
// Nest-hours: the summed running time of every nest, so BREADTH is what
// accumulates. It buys nothing -- there is no third tree -- it is simply the
// measure of how much colony this line has had running.
export function networkAge(game) {
  let total = (game.runTime || 0);
  for (const nest of nests(game)) total += (nest.runTime || 0);
  return total;
}

export function networkPopulation(game, populationOf) {
  let total = populationOf(game);
  for (const nest of nests(game)) total += populationOf(nest);
  return total;
}

// A nest is founded on ground the colony holds, so the map is the cap. Guards
// keep ground held, so the size of the network is set by an army you build.
export function buddableCells(game) {
  const h = game.hunt;
  if (!h || !h.open || !h.cells) return [];
  return h.cells
    .map((c, i) => ({ cell: c, index: i }))
    .filter(x => x.cell.held && !x.cell.monster && !x.cell.nest);
}

export function superUnlocked(game, finishedCount) {
  return finishedCount >= SUPER_SPECIES_NEEDED;
}
