// Layer 2 -- the Matriline: the reset, the Haplotype, and the tree.
//
// A haplotype is a set of alleles inherited together, and mitochondrial
// haplotypes are literally how a matriline is traced in real biology -- so it
// is both the accurate word for what passes down a line of queens and the exact
// thematic fit, the way Royal Jelly being 10-HDA is.
//
// This file owns the upgrade tree, so it also owns the scale that lifts every
// species passive. species.js deliberately imports nothing; the wrappers the
// rest of the game calls are here.

import {
  GENERIC, SPECIES, currentSpecies, playingSpecies, speciesById,
  speciesFinished, passiveOf, activeValue, activeIs
} from "./species.js";
import { PRESTIGE_UPGRADES } from "./prestige.js";
import { CHALLENGES, speciesTrialLevel } from "./challenges.js";

// what the whole Royal Lineage costs, which is the cap on what Retained
// Royalty can hand the next matriline -- at most the tree, never a snowball
export const LINEAGE_COST = PRESTIGE_UPGRADES.reduce((n, u) => n + u.cost, 0);

export { GENERIC, GENERIC_NAME, SPECIES, PASSIVE_KINDS, currentSpecies, playingSpecies,
  speciesById, speciesName, speciesFinished, finishedSpecies, activeValue, activeIs } from "./species.js";

// ------------------------------------------------------------------- the gate
//
// Layer 1 gates on 1,000 live ants. This one gates on having finished the
// lineage and banked a total of Royal Jelly -- and every trial level the line
// has ever mastered cuts that total down. Clearing trials is therefore never
// forced and always worth it, which is the shape asked for: the trials are the
// fast road to layer 2 rather than a wall in front of it.
export const MATRILINE_JELLY_BASE = 120;
export const MATRILINE_JELLY_PER_LEVEL = 3;
export const MATRILINE_JELLY_FLOOR = 30;

export function trialLevelsEverAll(game) {
  return (game.stats && game.stats.challengeLevels) || 0;
}

export function matrilineJellyNeeded(game) {
  const cut = trialLevelsEverAll(game) * MATRILINE_JELLY_PER_LEVEL;
  return Math.max(MATRILINE_JELLY_FLOOR, MATRILINE_JELLY_BASE - cut);
}

export function lineageComplete(game) {
  return PRESTIGE_UPGRADES.every(u =>
    game.prestige && Array.isArray(game.prestige.upgrades) &&
    game.prestige.upgrades.indexOf(u.id) >= 0);
}

// The tab shows itself as soon as the lineage is finished, whether or not the
// jelly gate is met. The nuptial flight was once the only gate in the game that
// hid its own existence, and a first run never pushed for it because the whole
// explanation lived inside a tab that could not be opened.
export function matrilineVisible(game) {
  return lineageComplete(game) || matrilineCount(game) > 0;
}

export function matrilineReady(game) {
  if (!lineageComplete(game)) return false;
  return jellyBanked(game) >= matrilineJellyNeeded(game);
}

export function jellyBanked(game) {
  return (game.prestige && game.prestige.royalJellyTotal) || 0;
}

export function matrilineCount(game) {
  return (game.matriline && game.matriline.resets) || 0;
}

export function haplotype(game) {
  return (game.matriline && game.matriline.haplotype) || 0;
}

// ------------------------------------------------------------- what it pays
//
// Paid on what the MATRILINE did rather than on the colony standing, the same
// reason the flight reads live population and not the peak: a figure that
// survives the reset can be collected against twice.
export const HAPLO_SCALE = 4;
export const HAPLO_EXPONENT = 0.7;

export function matrilineFlights(game) {
  return (game.matriline && game.matriline.flights) || 0;
}

export function matrilineTrialLevels(game) {
  return (game.matriline && game.matriline.trialLevels) || 0;
}

export function haplotypeEarned(game) {
  if (!matrilineReady(game) && matrilineCount(game) === 0) return 0;
  const flights = Math.max(1, matrilineFlights(game));
  const raw = HAPLO_SCALE * Math.pow(flights, HAPLO_EXPONENT) *
    (1 + matrilineTrialLevels(game) / 8);
  return Math.max(1, Math.round(raw * 10) / 10);
}

// ------------------------------------------------------------- the tree
//
// Three kinds of node. INHERITANCE carries a layer-1 thing through the reset,
// which is what makes a second matriline bearable -- the reset clears the whole
// lineage, so without these every matriline replays four and a half hours of
// content the player has already finished. EXPRESSION lifts every species
// passive at once. A SPECIES branch strengthens one species' active and is the
// third road to finishing it.
export const MATRILINE_UPGRADES = [
  { id: "mat_shed", name: "Inherited Instinct", cost: 2, group: "inheritance",
    desc: "She sheds and strips her wings without being asked, in every colony the line founds.",
    effect: { type: "inherit", prestige: "autoShed" } },
  { id: "mat_buy", name: "Inherited Memory", cost: 4, group: "inheritance",
    desc: "Nest Memory survives the matriline. The colony buys what it can reach and afford.",
    effect: { type: "inherit", prestige: "prestige_9" } },
  { id: "mat_lay", name: "Inherited Brood", cost: 5, group: "inheritance",
    desc: "Brood Instinct survives the matriline. The chambers stay full without being told.",
    effect: { type: "inherit", prestige: "prestige_10" } },
  { id: "mat_ratio", name: "Inherited Orders", cost: 7, group: "inheritance",
    desc: "Standing Orders survives the matriline. The caste balance holds itself.",
    effect: { type: "inherit", prestige: "prestige_11" } },
  { id: "mat_reserve", name: "Inherited Granary", cost: 6, group: "inheritance",
    desc: "Granary Instinct survives the matriline. The food you are saving stays saved.",
    effect: { type: "inherit", prestige: "prestige_12" } },
  { id: "mat_trials", name: "Inherited Hardship", cost: 9, group: "inheritance",
    desc: "The Trials survive the matriline, so a new line can enter one without buying the door again.",
    effect: { type: "inherit", prestige: "prestige_13" } },
  { id: "mat_jelly", name: "Retained Royalty", cost: 10, group: "inheritance",
    desc: "Half the Royal Jelly the line ever banked survives the matriline reset.",
    effect: { type: "keepJelly", share: 0.5 } },

  { id: "mat_express_1", name: "Expression", cost: 8, group: "expression",
    desc: "Every species passive the line has banked pays half again as much.",
    effect: { type: "passiveScale", scale: 1.5 } },
  { id: "mat_express_2", name: "Deeper Expression", cost: 16, group: "expression",
    desc: "Every species passive pays double.",
    effect: { type: "passiveScale", scale: 2 } },
  { id: "mat_express_3", name: "Full Expression", cost: 30, group: "expression",
    desc: "Every species passive pays triple.",
    effect: { type: "passiveScale", scale: 3 } },

  { id: "mat_atta_1", name: "Wider Beds", cost: 4, group: "species", species: "atta",
    desc: "The fungus garden turns over half again as many leaves.",
    effect: { type: "active", key: "gardenMult", mult: 1.5 } },
  { id: "mat_atta_2", name: "Pseudonocardia", cost: 9, group: "species", species: "atta",
    desc: "The antibiotic bacterium keeps the parasite out. The garden turns over twice as much again.",
    effect: { type: "active", key: "gardenMult", mult: 2 } },
  { id: "mat_atta_3", name: "Staphylae", cost: 15, group: "species", species: "atta",
    desc: "Swollen hyphal tips, grown to be eaten. The garden feeds the brood as well: +3 chambers.",
    effect: { type: "active", key: "broodAddNode", add: 3 } },
  { id: "mat_atta_4", name: "Minim Chewers", cost: 22, group: "species", species: "atta",
    desc: "The smallest workers do nothing but chew. Every nurse widens the garden twice as far.",
    effect: { type: "active", key: "gardenNurseMult", mult: 2 } },

  { id: "mat_sol_1", name: "Second Queen", cost: 4, group: "species", species: "solenopsis",
    desc: "Another queen joins the nest. The population cap rises further.",
    effect: { type: "active", key: "capMultAdd", add: 0.5 } },
  { id: "mat_sol_2", name: "Alkaloid Reserve", cost: 9, group: "species", species: "solenopsis",
    desc: "The venom runs deeper. A lost raid costs the colony far less of itself.",
    effect: { type: "active", key: "lossMultScale", mult: 0.6 } },
  { id: "mat_sol_3", name: "Third Queen", cost: 15, group: "species", species: "solenopsis",
    desc: "A third laying queen joins the nest. The population cap rises again.",
    effect: { type: "active", key: "capMultAdd", add: 0.5 } },
  { id: "mat_sol_4", name: "Brood Piles", cost: 22, group: "species", species: "solenopsis",
    desc: "Several queens laying into one chamber. +4 brood slots.",
    effect: { type: "active", key: "broodAddNode", add: 4 } },

  { id: "mat_cam_1", name: "Deeper Galleries", cost: 4, group: "species", species: "camponotus",
    desc: "Chambers cut further into the heartwood. Each excavator holds more still.",
    effect: { type: "active", key: "excavatorCapMultAdd", add: 0.5 } },
  { id: "mat_cam_2", name: "Nitrogen Loop", cost: 9, group: "species", species: "camponotus",
    desc: "The endosymbiont closes the loop. Feeding the brood costs no protein at all.",
    effect: { type: "active", key: "proteinCostMultScale", mult: 0 } },
  { id: "mat_cam_3", name: "Heartwood", cost: 15, group: "species", species: "camponotus",
    desc: "Chambers cut into the dead heart of the trunk. Each excavator holds more again.",
    effect: { type: "active", key: "excavatorCapMultAdd", add: 0.5 } },
  { id: "mat_cam_4", name: "Sclerotised", cost: 22, group: "species", species: "camponotus",
    desc: "A cuticle that does not give. The founding generation fades three times more slowly still.",
    effect: { type: "active", key: "naniticHalflifeNode", mult: 3 } },

  { id: "mat_eci_1", name: "Longer Column", cost: 4, group: "species", species: "eciton",
    desc: "The column carries more. The nomadic cap rises by half.",
    effect: { type: "active", key: "nomadCapMult", mult: 1.5 } },
  { id: "mat_eci_2", name: "Brood Carriers", cost: 9, group: "species", species: "eciton",
    desc: "The column carries what it takes. A raid you win captures twice as much.",
    effect: { type: "active", key: "captureMult", mult: 2 } },
  { id: "mat_eci_3", name: "Bivouac", cost: 15, group: "species", species: "eciton",
    desc: "The colony builds its own walls out of itself and rests. The column holds more again.",
    effect: { type: "active", key: "nomadCapMult", mult: 1.6 } },
  { id: "mat_eci_4", name: "Swarm Front", cost: 22, group: "species", species: "eciton",
    desc: "The front runs ahead of the column. Something finds you more often still.",
    effect: { type: "active", key: "raidIntervalNode", mult: 0.7 } },

  { id: "mat_myr_1", name: "Fuller Repletes", cost: 4, group: "species", species: "myrmecocystus",
    desc: "Each replete hangs heavier. The colony holds half again as much food per ant.",
    effect: { type: "active", key: "foodCapMult", mult: 1.5 } },
  { id: "mat_myr_2", name: "Deep Cellar", cost: 9, group: "species", species: "myrmecocystus",
    desc: "A chamber given over entirely to the hanging. Triple what the colony can hold.",
    effect: { type: "active", key: "foodCapMult", mult: 3 } },
  { id: "mat_myr_3", name: "Living Granary", cost: 15, group: "species", species: "myrmecocystus",
    desc: "Every ant in the nest hangs a little heavier. Double again what the colony can hold.",
    effect: { type: "active", key: "foodCapMult", mult: 2 } },
  { id: "mat_myr_4", name: "Overflow", cost: 22, group: "species", species: "myrmecocystus",
    desc: "What will not fit is rendered rather than lost. Food gathered above the store becomes protein.",
    effect: { type: "active", key: "overflowProtein", mult: 1 } },

  { id: "mat_pol_1", name: "Sabre Mandibles", cost: 4, group: "species", species: "polyergus",
    desc: "The raid takes more brood home. Captures rise by half.",
    effect: { type: "active", key: "captureMult", mult: 1.5 } },
  { id: "mat_pol_2", name: "Propaganda Pheromone", cost: 9, group: "species", species: "polyergus",
    desc: "The defenders scatter rather than fight. Captures double again.",
    effect: { type: "active", key: "captureMult", mult: 2 } },
  { id: "mat_pol_3", name: "Scouts", cost: 15, group: "species", species: "polyergus",
    desc: "She finds the next nest before the last one is cold. Raids come sooner.",
    effect: { type: "active", key: "raidIntervalNode", mult: 0.8 } },
  // 1.5 rather than 2, and Scouts at 0.8 rather than 0.7. The two compound --
  // more raids times more diggers per raid times a cap-per-excavator that is
  // itself upgraded -- and measured at 2 and 0.7 a fully mastered Polyergus
  // reached 157,696 ants against about 24,000 for every other species. Her
  // growth is still linear in raids won, which is her identity; the slope is
  // what needed cutting.
  { id: "mat_pol_4", name: "Callow Raid", cost: 22, group: "species", species: "polyergus",
    desc: "She takes the diggers as well as the workers, so the nest itself keeps growing.",
    effect: { type: "active", key: "captureDiggerMult", mult: 1.5 } }
];

const UPGRADE_INDEX = {};
for (const u of MATRILINE_UPGRADES) UPGRADE_INDEX[u.id] = u;

export function matrilineUpgradeById(id) {
  return UPGRADE_INDEX[id] || null;
}

export function matrilineUpgradeOwned(game, id) {
  const m = game.matriline;
  return !!m && Array.isArray(m.upgrades) && m.upgrades.indexOf(id) >= 0;
}

export function matrilineUpgradesIn(group) {
  return MATRILINE_UPGRADES.filter(u => u.group === group);
}

export function speciesBranch(id) {
  return MATRILINE_UPGRADES.filter(u => u.species === id);
}

// ------------------------------------------------------- reading the tree

export function passiveScale(game) {
  let scale = 1;
  for (const u of MATRILINE_UPGRADES) {
    if (u.effect.type !== "passiveScale" || !matrilineUpgradeOwned(game, u.id)) continue;
    scale = Math.max(scale, u.effect.scale);
  }
  return scale;
}

// What a species branch does to one of its OWN active figures. The species
// check is load-bearing, not decoration: without it Second Queen (Solenopsis,
// capMultAdd +0.5) raised the cap of whatever species you were actually
// playing, and Eciton and Polyergus share the captureMult key outright, so each
// one's branch silently bought the other's. Measured, a fully mastered Eciton
// column held 3,150 against a nomadic cap of 2,100.
function branchApplies(game, upgrade) {
  if (upgrade.effect.type !== "active") return false;
  if (!matrilineUpgradeOwned(game, upgrade.id)) return false;
  return upgrade.species === currentSpecies(game);
}

function activeMult(game, key) {
  let total = 1;
  for (const u of MATRILINE_UPGRADES) {
    if (u.effect.key !== key || !branchApplies(game, u)) continue;
    if (u.effect.mult !== undefined) total *= u.effect.mult;
  }
  return total;
}

function activeAdd(game, key) {
  let total = 0;
  for (const u of MATRILINE_UPGRADES) {
    if (u.effect.key !== key || !branchApplies(game, u)) continue;
    if (u.effect.add !== undefined) total += u.effect.add;
  }
  return total;
}

export function inheritedPrestige(game) {
  const keep = [];
  for (const u of MATRILINE_UPGRADES) {
    if (u.effect.type !== "inherit" || !matrilineUpgradeOwned(game, u.id)) continue;
    keep.push(u.effect.prestige);
  }
  return keep;
}

export function jellyKept(game) {
  let share = 0;
  for (const u of MATRILINE_UPGRADES) {
    if (u.effect.type !== "keepJelly" || !matrilineUpgradeOwned(game, u.id)) continue;
    share = Math.max(share, u.effect.share);
  }
  return share;
}

// ------------------------------------------------------ the passive wrappers
//
// Everything outside this file reads a passive through one of these, so the
// scale is applied in exactly one place.
export function passiveFeedFree(game) {
  return Math.min(1, passiveOf(game, "feedFree", passiveScale(game)));
}

export function passiveCombat(game) {
  return passiveOf(game, "combat", passiveScale(game));
}

export function passiveProtein(game) {
  return passiveOf(game, "proteinYield", passiveScale(game));
}

export function passiveHunt(game) {
  return passiveOf(game, "hunt", passiveScale(game));
}

export function passiveOfflineHours(game) {
  return passiveOf(game, "offlineHours", passiveScale(game));
}

export function passiveSalvage(game) {
  return passiveOf(game, "salvage", passiveScale(game));
}

// ------------------------------------------------------- the active wrappers

export function gardenActive(game) {
  return activeIs(game, "garden");
}

export function gardenMultiplier(game) {
  return activeMult(game, "gardenMult");
}

export function speciesCapMult(game) {
  return activeValue(game, "capMult", 1) + activeAdd(game, "capMultAdd");
}

export function speciesBroodAdd(game) {
  return activeValue(game, "broodAdd", 0) + activeAdd(game, "broodAddNode");
}

export function gardenNurseMultiplier(game) {
  return activeMult(game, "gardenNurseMult");
}

export function speciesOverflowsToProtein(game) {
  return MATRILINE_UPGRADES.some(u => u.effect.key === "overflowProtein" &&
    u.species === currentSpecies(game) && matrilineUpgradeOwned(game, u.id));
}

export function speciesCaptureDiggerMult(game) {
  return activeMult(game, "captureDiggerMult");
}

export function speciesLossMult(game) {
  return activeValue(game, "lossMult", 1) * activeMult(game, "lossMultScale");
}

export function speciesProteinCostMult(game) {
  return activeValue(game, "proteinCostMult", 1) * activeMult(game, "proteinCostMultScale");
}

export function speciesExcavatorCapMult(game) {
  const base = activeValue(game, "excavatorCapMult", 1);
  return base === 1 ? 1 : base + activeAdd(game, "excavatorCapMultAdd");
}

export function speciesNaniticHalflifeMult(game) {
  return activeValue(game, "naniticHalflifeMult", 1) * activeMult(game, "naniticHalflifeNode");
}

export function nomadic(game) {
  return activeIs(game, "nomadic");
}

export function nomadCap(game) {
  return activeValue(game, "nomadCap", 0) * activeMult(game, "nomadCapMult");
}

export function speciesRaidIntervalMult(game) {
  return activeValue(game, "raidIntervalMult", 1) * activeMult(game, "raidIntervalNode");
}

export function speciesCapture(game) {
  return activeValue(game, "capture", 0) * activeMult(game, "captureMult");
}

export function speciesHuntMult(game) {
  return activeValue(game, "huntMult", 1);
}

export function dulosis(game) {
  return activeIs(game, "dulosis");
}

export function speciesFoodCapPerAnt(game) {
  const per = activeValue(game, "foodCapPerAnt", 0);
  return per > 0 ? per * activeMult(game, "foodCapMult") : 0;
}

// ------------------------------------------------- finishing a species
//
// Three roads to it, because a player who dislikes one of them should not be
// stuck. Trials are the fast road and the recommended one; flights are the
// patient one; the species' own branch is the one you buy. The branch is capped
// so it can never be the whole answer -- a species has to be PLAYED.
export const SPECIES_TARGET = 20;
export const POINTS_PER_TRIAL_LEVEL = 2;
export const POINTS_PER_FLIGHT = 1;
export const POINTS_PER_BRANCH_NODE = 4;

export function speciesFlights(game, id) {
  const all = (game.stats && game.stats.speciesFlights) || {};
  return all[id] || 0;
}

export function speciesTrialLevels(game, id) {
  let total = 0;
  for (const challenge of CHALLENGES) total += speciesTrialLevel(game, challenge.id, id);
  return total;
}

export function speciesBranchOwned(game, id) {
  return speciesBranch(id).filter(u => matrilineUpgradeOwned(game, u.id)).length;
}

export function speciesPoints(game, id) {
  // capped at two nodes however many a branch holds, so buying a tree can never
  // be most of the answer -- a species has to be PLAYED
  const branch = Math.min(speciesBranchOwned(game, id), 2);
  return speciesTrialLevels(game, id) * POINTS_PER_TRIAL_LEVEL +
    speciesFlights(game, id) * POINTS_PER_FLIGHT +
    branch * POINTS_PER_BRANCH_NODE;
}

export function speciesComplete(game, id) {
  return speciesPoints(game, id) >= SPECIES_TARGET;
}

// walked once a frame; a species only ever moves forward
export function checkSpeciesFinished(game) {
  const m = game.matriline;
  if (!m) return 0;
  if (!Array.isArray(m.finished)) m.finished = [];
  let found = 0;
  for (const s of SPECIES) {
    if (m.finished.indexOf(s.id) >= 0) continue;
    if (!speciesComplete(game, s.id)) continue;
    m.finished.push(s.id);
    found++;
  }
  return found;
}
