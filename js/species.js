// Layer 2 -- the Matriline.
//
// The first run is generic ants: layer 0 and layer 1 are played as no
// particular species, exactly as they always were. A matriline reset commits
// the line to one species and plays it out, which is what the layer is.
//
// Every species has two halves and they are deliberately not the same kind of
// thing. The ACTIVE half rewrites a mechanic and runs only while that species
// is the one being played. The PASSIVE half is a plain modifier and pays at
// full strength for ever once the species has been finished, chosen or not.
//
//   never finished        active  --      passive  --
//   finished, not chosen  active   0%     passive 100%
//   the one you are       active 100%     passive 100%
//
// So no matriline is ever wasted and no choice is ever regretted: what a run
// buys is another permanent passive, and what it costs is only the time. The
// actives have to be rewrites and the passives have to be simple, because a
// passive is live in every future run and a rewrite that is always on is not a
// choice at all.
//
// Both halves apply inside trials. A trial suppresses what the lineage BOUGHT
// and keeps what the colony IS -- and inside layer 2 the species is what the
// colony is, so Atta's trials are Atta's trials or the per-species records mean
// nothing.
//
// This file imports nothing. It is data and pure functions on `game`, so
// challenges.js and ants.js can both read it without a cycle. The public
// wrappers that the rest of the game calls live in matriline.js, which owns the
// upgrade tree that scales the passives.

export const GENERIC = "generic";

// what the generic line is called wherever a species name is printed
export const GENERIC_NAME = "Common ants";

// Passive kinds. Each is a plain modifier with one consumer, and the scale from
// the matriline tree lifts the BONUS rather than the whole figure -- so x1.5 at
// scale 2 is x2.0, not x3.0, and an unfinished species is always exactly 1.
export const PASSIVE_KINDS = {
  feedFree: { mult: false, label: "eggs fed without protein" },
  combat: { mult: true, label: "fighting strength" },
  proteinYield: { mult: true, label: "protein from raids" },
  hunt: { mult: true, label: "hunting rate" },
  offlineHours: { mult: false, label: "hours of offline progress" },
  salvage: { mult: true, label: "salvage from a lost raid" }
};

export const SPECIES = [
  {
    id: "atta",
    name: "Atta",
    common: "Leafcutter",
    flavour: "She does not eat what she carries. The colony farms a fungus, and the fungus feeds the colony.",
    activeText: "Foragers bring leaves rather than food, and only the fungus garden turns leaves into food. Gathering more than the garden can turn over wastes the rest, and nurses are what widen it — so food stops being the thing you are short of.",
    passiveName: "Gongylidia",
    passiveText: "The colony knows how to grow a nutrient-rich hyphal tip. A share of eggs are fed without spending protein.",
    passive: { kind: "feedFree", add: 0.25 },
    active: { garden: true }
  },
  {
    id: "solenopsis",
    name: "Solenopsis",
    common: "Fire ant",
    flavour: "Many queens, one nest, and a sting that ends the argument.",
    activeText: "Polygyne: several queens lay at once, so the nest holds half again as many ants and the brood runs wider — but the colony fights at the front and a lost raid costs far more of it.",
    passiveName: "Solenopsin",
    passiveText: "A piperidine alkaloid the line never forgets. Everything in the colony fights harder.",
    passive: { kind: "combat", mult: 1.5 },
    active: { capMult: 1.5, broodAdd: 2, lossMult: 1.7 }
  },
  {
    id: "camponotus",
    name: "Camponotus",
    common: "Carpenter ant",
    flavour: "She carries a bacterium in her gut that makes protein out of waste, and she cuts her chambers from wood.",
    activeText: "Blochmannia recycles nitrogen, so feeding the brood costs half the protein it did. Chambers are cut rather than dug, so each excavator holds half again as many ants, and the founding generation burns twice as slowly.",
    passiveName: "Endosymbiont",
    passiveText: "The gut bacterium stays in the line. Every raid renders more protein.",
    passive: { kind: "proteinYield", mult: 1.5 },
    active: { proteinCostMult: 0.5, excavatorCapMult: 1.5, naniticHalflifeMult: 2 }
  },
  {
    id: "eciton",
    name: "Eciton",
    common: "Army ant",
    flavour: "No nest at all. The colony is the nest, and it moves.",
    activeText: "Nomadic: excavators dig nothing and the column holds what it holds. Something finds you two and a half times as often — but a raid you win is a raid you took something from, and the column comes home larger.",
    passiveName: "Column Discipline",
    passiveText: "The line remembers how to move as one. Soldiers hunt far better between raids.",
    passive: { kind: "hunt", mult: 1.6 },
    active: { nomadic: true, nomadCap: 1400, raidIntervalMult: 0.4, capture: 0.04, huntMult: 2 }
  },
  {
    id: "myrmecocystus",
    name: "Myrmecocystus",
    common: "Honeypot ant",
    flavour: "The store is not a room. It is a row of living ants hanging from the ceiling, swollen with what the colony brought home.",
    activeText: "There is no granary. Food is held in the bodies of the colony, so what you can bank is set by how many ants you have — anything gathered beyond that is lost. Growing the nest is the only way to save.",
    passiveName: "Crop Reserve",
    passiveText: "A social stomach the line never gives up. The colony keeps working for longer while you are away.",
    // 800 per ant is measured: at 200 the colony cannot bank enough for an
    // upgrade at all and stalls at 419 ants; at 2,000 it is not binding. At 800
    // she reaches 2,869 where every other species reaches about 6,600, with the
    // store sitting exactly full the whole time -- a real pressure, and one her
    // own branch relieves.
    passive: { kind: "offlineHours", add: 4 },
    active: { foodCapPerAnt: 800 }
  },
  {
    id: "polyergus",
    name: "Polyergus",
    common: "Amazon ant",
    flavour: "Her mandibles are sabres. They are very good for fighting and no good at all for work, so the work is done by somebody else's daughters.",
    activeText: "Dulosis: the queen lays nothing but soldiers. Every worker in the nest is brood taken from a raid you won, so the only way this colony grows is by winning.",
    passiveName: "Raiding Instinct",
    passiveText: "The line keeps the habit of taking. Even a raid you lose is stripped for far more.",
    passive: { kind: "salvage", mult: 1.6 },
    active: { dulosis: true, capture: 0.10 }
  }
];

const INDEX = {};
for (const s of SPECIES) INDEX[s.id] = s;

export function speciesById(id) {
  return INDEX[id] || null;
}

// Which species this colony is. The generic line is a real answer, not an
// absence -- the per-species trial records key on it, and every clear earned
// before layer 2 existed belongs to it.
export function currentSpecies(game) {
  const m = game.matriline;
  return (m && m.species) || GENERIC;
}

export function playingSpecies(game) {
  const id = currentSpecies(game);
  return id === GENERIC ? null : speciesById(id);
}

export function speciesFinished(game, id) {
  const m = game.matriline;
  return !!m && Array.isArray(m.finished) && m.finished.indexOf(id) >= 0;
}

export function finishedSpecies(game) {
  return SPECIES.filter(s => speciesFinished(game, s.id));
}

// One gate for every active. A species rewrites the game only while it is the
// one being played, so everything that reads an active goes through here and
// there is no second place for it to disagree.
export function activeValue(game, key, fallback) {
  const species = playingSpecies(game);
  if (!species || !species.active) return fallback;
  const value = species.active[key];
  return value === undefined ? fallback : value;
}

export function activeIs(game, key) {
  return !!activeValue(game, key, false);
}

// The passive half, summed across every species finished, with the matriline
// tree's scale lifting the bonus rather than the whole figure. `scale` is
// passed in rather than read, because the tree that sets it lives in
// matriline.js and this file deliberately imports nothing.
export function passiveOf(game, kind, scale) {
  const spec = PASSIVE_KINDS[kind];
  if (!spec) return spec === undefined && false;
  const lift = scale > 0 ? scale : 1;
  if (spec.mult) {
    let total = 1;
    for (const s of SPECIES) {
      if (s.passive.kind !== kind || !speciesFinished(game, s.id)) continue;
      total *= 1 + (s.passive.mult - 1) * lift;
    }
    return total;
  }
  let total = 0;
  for (const s of SPECIES) {
    if (s.passive.kind !== kind || !speciesFinished(game, s.id)) continue;
    total += s.passive.add * lift;
  }
  return total;
}

export function speciesName(id) {
  if (id === GENERIC) return GENERIC_NAME;
  const s = speciesById(id);
  return s ? s.name : id;
}
