import {
  achievementJellyBonus,
  CASTES,
  EGG_TIME,
  eggCost,
  emergingCaste,
  EXCAVATOR_OVERFLOW,
  BASE_POPULATION_CAP,
  bigForagerThreshold,
  broodCapacity,
  broodCount,
  touchBrood,
  NANITIC_GENERATION,
  capPerExcavator,
  foodCap,
  offlineCapSeconds,
  gardenBringing,
  gardenCapacity,
  upgradeCurrency,
  affordableBatch,
  eggBatchCost,
  RESERVE_EGG_COST,
  upgradeLevel,
  upgradeMaxed,
  upgradeMaxLevel,
  levelsOwned,
  nextLevelCost,
  eggPrice,
  casteStock,
  NANITIC_HATCH_SPEED,
  naniticLifespan,
  SOLDIER_RANKS,
  RANK_IDS,
  soldierCount,
  RALLY_COOLDOWN,
  RALLY_DURATION,
  foodPerSecond,
  hatchRate,
  wingYield,
  WING_COUNT,
  WING_STRIP_TIME,
  isUnlocked,
  layableCastes,
  population,
  populationCap,
  UPGRADES,
  upgradeBranch,
  upgradeOwned,
  upgradeUnlocked
} from "./ants.js";
import {
  foodPerProtein,
  EGG_PROTEIN_COST,
  FED_EGG_SPEED,
  RAID_INTERVAL,
  raidInterval,
  raidCountdown as countdownFor,
  raidImminent as imminentFor,
  raidsUnlocked,
  inHiding,
  raidsHalted,
  clearLossStreak,
  combatPower,
  exchangeReady,
  proteinSaleValue,
  proteinPurchaseCost,
  huntRate,
  resolveRaid as resolveRaidFor
} from "./raids.js";
import { achievementLevelFor, levelPoints as levelPointsFor, totalTiers, totalXp,
  xpForLevel } from "./achievements.js";
import {
  activeChallenge,
  challengeActive,
  challengeById,
  challengeMastered,
  challengesUnlocked,
  challengeFailed,
  challengeTarget,
  challengeTargetMet,
  challengeProgress,
  sterileActive,
  callowActive,
  CHALLENGE_TARGET
} from "./challenges.js";
import {
  GENERIC, SPECIES, currentSpecies, speciesById, checkSpeciesFinished,
  matrilineReady, matrilineJellyNeeded, matrilineVisible, matrilineCount,
  haplotypeEarned, haplotype, jellyBanked, jellyKept, inheritedPrestige,
  matrilineUpgradeById, matrilineUpgradeOwned, LINEAGE_COST,
  speciesProteinCostMult, passiveFeedFree, dulosis, gardenActive,
  speciesOverflowsToProtein
} from "./matriline.js";
import { INSTINCTS, instinctById, instinctOwned, instinctPoints, instinctKeptFood
} from "./instincts.js";
import { discoverLibrary } from "./library.js";
import {
  automationUnlocked,
  PRESTIGE_UNLOCK,
  PRESTIGE_UPGRADES,
  prestigeStartingReserves,
  prestigeUpgradeOwned,
  royalJellyEarned
} from "./prestige.js";
import {
  applySave,
  claimSave,
  clearSaves,
  decodeSave,
  encodeSave,
  holdsSave,
  readSave,
  SAVE_VERSION,
  stashSave,
  writeSave
} from "./save.js";

export { claimSave, holdsSave, SAVE_KEY, SAVE_VERSION, LEGACY_SAVE_KEYS, LOCK_KEY } from "./save.js";
export { GENERIC, SPECIES, SPECIES_TARGET, currentSpecies, playingSpecies, speciesById,
  speciesName, speciesFinished, speciesPoints, speciesComplete, speciesTrialLevels,
  speciesFlights, speciesBranch, speciesBranchOwned,
  MATRILINE_UPGRADES, matrilineUpgradeById, matrilineUpgradeOwned, matrilineUpgradesIn,
  matrilineReady, matrilineVisible, matrilineCount, matrilineJellyNeeded,
  matrilineFlights, matrilineTrialLevels, haplotype, haplotypeEarned, jellyBanked,
  lineageComplete, passiveScale, gardenActive, LINEAGE_COST,
  passiveCombat, passiveProtein, passiveHunt, passiveSalvage, passiveFeedFree,
  passiveOfflineHours, dulosis, nomadic } from "./matriline.js";
export { GENERIC_NAME, PASSIVE_KINDS } from "./species.js";
// a real import, not a re-export: speciesRatios is USED below, and a re-export
// creates no local binding
import { speciesRatios } from "./species.js";
export { INSTINCTS, instinctById, instinctOwned, instinctPoints, instinctsSpent, affordableInstincts,
  instinctBaseCap, instinctBrood, instinctCombat, instinctProtein, instinctHatch,
  instinctOfflineHours, instinctKeptFood } from "./instincts.js";
export { speciesTrialLevel } from "./challenges.js";
export { challengeTarget, challengeTargetAmount, targetKind, challengeProgress, TARGET_KINDS,
  challengeFailed, challengeFailKind, FAIL_KINDS,
  callowActive, callowCrowding, masteryNanitic,
  CALLOW_CROWDING, CALLOW_SCALE, CALLOW_TARGET_FOOD,
  BARREN_SCALE, SEALED_SCALE, STERILE_ALLOWANCE, SEALED_TARGET_RATE,
  barrenActive, sealedActive, sterileActive,
  masteryBrood, masteryCap, masteryUpgradeStrength, masteryUpgradeLevels } from "./challenges.js";
export { CHALLENGES, CHALLENGE_MAX_LEVEL, CHALLENGE_REWARD_STEP, CHALLENGE_TARGET,
  TRIAL_GIVES_UP, TRIAL_KEEPS, bestTrialLevel, challengeMastered, masteryFood, masteryOf,
  masterySoldier, siegeActive, siegeThreatScale, siegeThreatScaleAt,
  SIEGE_UNLOCK, SIEGE_INTERVAL, SIEGE_REFERENCE, SIEGE_BASE, SIEGE_LOSS_CAP,
  trialLevelsEver, trialsWithMastery,
  activeChallenge, challengeActive, challengeById, challengeDebuff, challengeDebuffAt,
  challengeLevel, challengeLevelsTotal, challengeReward,
  challengesUnlocked } from "./challenges.js";
export { PRESTIGE_UPGRADES, PRESTIGE_UNLOCK, AUTOMATIONS, royalJellyEarned, prestigeUpgradeOwned, jellyPerHour, automationUnlocked } from "./prestige.js";

export const QUEEN_RESERVES = 100;
// How far back the bottleneck readout looks. A single frame's answer flickers
// between full and not-full every time an egg hatches; a minute of it is what
// the player actually experiences.
export const BOTTLENECK_WINDOW = 60;
export const OFFLINE_CAP = 8 * 3600;

// what the last return from being away was worth, for the summary line
export let lastAway = null;

export function save() {
  return writeSave(game);
}



function blankGame() {
  return {
    version: SAVE_VERSION,
    wingsShed: false,
    reserves: 0,
    food: 0,
    eggs: [],
    ants: { nanitic: 0, forager: 0, bigforager: 0, excavator: 0, nurse: 0, soldier: 0,
      major: 0, supermajor: 0, guard: 0 },
    bigForagers: [],
    foragersSinceBig: 0,
    protein: 0,
    raidTimer: RAID_INTERVAL,
    raidsWon: 0,
    raidsLost: 0,
    lossStreak: 0,
    lastRaid: null,
    monster: null,
    emerged: 0,
    nextCaste: "forager",
    upgrades: {},
    achievements: [],
    achievementPoints: 0,
    achievementXp: 0,
    achievementLevel: 0,
    // A level, once reached, is never taken back. Tiers pay food and hatch
    // bonuses, so a change to the ladders or to the XP curve must never cost a
    // live colony what it had already earned -- this is the guarantee, and it
    // makes any future reshaping safe by construction.
    peakAchievementLevel: 0,
    peakPopulation: 0,
    peakCastes: {},
    peakStrength: 0,
    naniticsDied: false,
    hiding: false,
    rallyTime: 0,
    rallyCooldown: 0,
    challenge: null,
    // per species now: challenges[speciesId][trialId]. Everything cleared
    // before layer 2 existed belongs to the generic line, which migrate() does.
    challenges: {},
    matriline: { haplotype: 0, haplotypeTotal: 0, resets: 0, species: null,
      finished: [], upgrades: [], flights: 0, trialLevels: 0 },
    wings: 0,
    wingStrip: 0,
    queenName: "",
    settings: { exileEnabled: true, hideLocked: false, hideOwned: false, theme: "dark",
      upgradeFilter: "all", upgradeSort: "default", feedBrood: true,
      autoShed: true, autoBuy: true, autoLay: true, autoRatio: true, foodReserve: 0,
      stickyInspector: false, awayReport: true, tutorial: true,
      broodScope: "waiting", broodDirection: "back", layAmount: 10,
      notation: "suffix", raidDifficulty: "sheltered",
      ratios: { forager: 0, excavator: 0, nurse: 5, soldier: 8 } },
    seen: { upgrades: 0, tracks: null, library: 0, updates: "" },
    library: {},
    // what achievement tiers have been spent on. Spending never lowers the
    // level: the level is computed from XP and nothing here touches XP.
    instincts: [],
    runTime: 0,
    run: { peakPopulation: 0, peakCastes: {}, peakStrength: 0, foodEarned: 0, broodFull: 0 },
    best: { population: 0, jelly: 0, timeTo1000: 0 },
    peakUpgrades: { all: 0, colony: 0, combat: 0, deepest: 0 },
    stats: { foodEarned: 0, eggsHatched: 0, playtime: 0, exiled: 0, proteinEarned: 0,
      raidsWonTotal: 0, eggsCancelled: 0, challengeLevels: 0, bestTrial: {},
      trained: 0, trainingDeaths: 0, speciesFlights: {}, awayReturns: 0,
      flightsEver: 0, jellyEver: 0 },
    prestige: { royalJelly: 0, royalJellyTotal: 0, flightsTaken: 0, upgrades: [] },
    lastSave: Date.now()
  };
}

export const game = blankGame();

export function shedWings() {
  if (game.wingsShed) return false;
  game.wingsShed = true;
  game.reserves = QUEEN_RESERVES + prestigeStartingReserves(game);
  game.wings = WING_COUNT;
  return true;
}

// one source of truth for how long an egg still needs, because the founding
// four develop at double speed and a fed egg at double again -- the summary
// line and the brood window both read this rather than recomputing it
export function eggSecondsLeft(egg, queuePosition) {
  const founding = emergingCaste(game, egg, queuePosition) === "nanitic";
  const rate = hatchRate(game) * (egg.fed ? FED_EGG_SPEED : 1) *
    (founding ? NANITIC_HATCH_SPEED : 1);
  return Math.max(0, (EGG_TIME - egg.progress) / rate);
}

export function stripReady() {
  return game.wingsShed && (game.wings || 0) > 0 && (game.wingStrip || 0) <= 0;
}

export function stripWing() {
  if (!stripReady()) return false;
  game.wings -= 1;
  game.wingStrip = WING_STRIP_TIME;
  return true;
}

export function rallyReady() {
  return game.wingsShed && (game.rallyTime || 0) <= 0 && (game.rallyCooldown || 0) <= 0;
}

export function startRally() {
  if (!rallyReady()) return false;
  game.rallyTime = RALLY_DURATION;
  return true;
}

// every automation is gated the same way: unlocked by prestige, then switchable
export function autoShedUnlocked() {
  // Inherited Instinct carries it through a matriline reset. autoShed is the
  // one automation with no adaptation id of its own -- it reads flightsTaken --
  // so it cannot be handed back by re-granting an id like the others are.
  return automationUnlocked(game, "autoShed") ||
    inheritedPrestige(game).indexOf("autoShed") >= 0;
}

export function automationOn(key) {
  // Sterile is about which few adaptations the colony holds, and Nest Memory
  // spends the whole allowance on whatever is cheapest the moment it can --
  // measured, both of an allowance of two on nanitic_food, worth nothing two
  // hours in, and nothing gives a level back. The trial was decided by whether
  // the player thought to switch it off, which is not a decision it announced.
  if (key === "autoBuy" && sterileActive(game)) return false;
  return automationUnlocked(game, key) && game.settings[key] !== false;
}

export function autoShedOn() {
  return automationOn("autoShed");
}

// Standing Orders picks the caste furthest below the share you asked for, and
// digs first when the nest is running out of room -- a colony that cannot grow
// is the one case where a ratio is the wrong answer.
export function managedCaste() {
  const cap = populationCap(game);
  const pop = population(game);
  // ...and never where digging cannot help. Under Sealed Nest the nest is
  // permanently tight, so this was true every tick and Standing Orders spent
  // the whole trial laying diggers that widened nothing.
  if (cap - pop < Math.max(8, pop * 0.12) && isUnlocked(game, "excavator") &&
      capPerExcavator(game) > 0) return "excavator";
  const ratios = game.settings.ratios || {};
  let want = null;
  let worst = 0;
  for (const id of layableCastes(game)) {
    const target = (ratios[id] || 0) / 100;
    if (target <= 0 || !isUnlocked(game, id)) continue;
    const deficit = target - casteStock(game, id) / Math.max(1, pop);
    if (deficit > worst) { worst = deficit; want = id; }
  }
  // with every share met the surplus goes to food, not to whatever caste
  // happened to be chosen last -- otherwise the ratios overshoot badly
  return want || layableCastes(game)[0] || "forager";
}

// what the automation will lay next, which is not necessarily what the player
// has selected: Standing Orders decides for itself and leaves game.nextCaste
// alone, so laying by hand still works while it runs
// how much food laying will not touch. Without it the automation spends down
// to the next egg price every tick, which caps banked food at one egg and puts
// every dearer upgrade out of reach.
export function foodReserve() {
  if (!automationUnlocked(game, "foodReserve")) return 0;
  return Math.max(0, game.settings.foodReserve || 0);
}

export function autoCaste() {
  const caste = automationOn("autoRatio") ? managedCaste() : game.nextCaste;
  const fallback = layableCastes(game)[0] || "forager";
  if (!isUnlocked(game, caste)) return fallback;
  // under dulosis the queen lays nothing but soldiers, so a stale selection
  // has to fall through to what she can actually lay
  return layableCastes(game).indexOf(caste) >= 0 ? caste : fallback;
}

function runAutomation() {
  if (automationOn("autoBuy")) {
    // every unlocked adaptation it can afford, not only ones owned before.
    // This runs ahead of laying on purpose: upgrades get first claim on the
    // food, or laying spends the colony down below their price every tick.
    for (const upgrade of UPGRADES) buyUpgradeLevels(upgrade.id);
  }
  if (!automationOn("autoLay")) return;
  const caste = autoCaste();
  const reserve = foodReserve();
  // top up the tended slots only: filling the queue would bury whatever the
  // player lays by hand, which is the problem destroying eggs exists to undo
  let guard = 0;
  while (game.eggs.length < broodCapacity(game) && guard++ < 64) {
    const cost = eggCost(game, caste);
    if (cost.resource === "food" && game.food - cost.amount < reserve) break;
    if (!layEgg(caste)) break;
  }
}

export function setNextCaste(casteId) {
  if (!CASTES[casteId] || !CASTES[casteId].layable) return false;
  if (layableCastes(game).indexOf(casteId) < 0) return false;
  if (!isUnlocked(game, casteId)) return false;
  game.nextCaste = casteId;
  return true;
}

export function broodSpace() {
  return populationCap(game) - population(game) - game.eggs.length;
}

export function broodSlots(casteId) {
  const space = broodSpace();
  if (space > 0) return space;
  if ((casteId || game.nextCaste) !== "excavator") return 0;
  // She is allowed past the cap only because digging raises it, so the
  // exemption closes behind itself. Sealed Nest sets that gain to nothing and
  // it never closed: measured, 1,631 ants against a cap of 30, every one of
  // them an excavator producing no food in a trial scored on a food rate.
  if (capPerExcavator(game) <= 0) return 0;
  let digging = 0;
  for (const egg of game.eggs) if (egg.caste === "excavator") digging++;
  // a colony that tended three eggs could only ever dig three chambers out,
  // however many nurses it had; the brood is the real limit
  return Math.max(0, Math.max(EXCAVATOR_OVERFLOW, broodCapacity(game)) - digging);
}

// What the colony is actually short of, in the order the constraints bind. A
// multiplier on a fraction f of the work is worth at most 1/(1-f) overall, so an
// upgrade aimed anywhere but the binding constraint buys almost nothing -- which
// is why the "+150%" forager line delivers about +44%, and why the first ten
// minutes of a run cannot be bought out of at any price.
// Sampled straight after the brood has been topped up and BEFORE anything
// hatches, which is the only moment the brood is as full as it is going to get
// -- read after the hatch loop it is always one egg short and never reports as
// bound at all. Brood-bound means the chambers are full, the cap has room, and
// the colony can pay for another egg: full chambers with an empty bank is being
// short of food, not short of chambers.
function sampleBottleneck(dt) {
  const run = game.run || (game.run = {});
  const cost = eggCost(game, autoCaste());
  const bound = game.eggs.length >= broodCapacity(game) &&
    broodSpace() > 0 && game[cost.resource] >= cost.amount ? 1 : 0;
  const weight = Math.min(1, dt / BOTTLENECK_WINDOW);
  run.broodFull = (run.broodFull || 0) * (1 - weight) + bound * weight;
}

// The opening asks a player to read seven tabs before it has told them to do
// anything. A playtester put it plainly: overwhelming as soon as the wings come
// off. This names the ONE thing to do next, and only through the opening -- past
// soldiers the milestone line and the bottleneck line take over, and it retires
// itself rather than becoming furniture.
//
// It is state-driven rather than a script, so it survives a reload, an import
// and any order the player does things in.
export const TUTORIAL_STEPS = [
  { id: "shed",
    when: () => !game.wingsShed,
    text: "She has landed and mated, and she will never fly again. Shedding her wings is the only thing she can do — and the 100 reserves it frees are the only ones she will ever have." },
  { id: "lay",
    when: () => game.emerged === 0 && game.eggs.length === 0,
    text: "Lay an egg. Each costs 20 reserves, so there are five in her — and the first four hatch as nanitics whatever caste you choose. That is how you get them; they cannot be laid on purpose.",
    act: () => layEgg(game.nextCaste), label: "Lay an egg" },
  { id: "strip",
    when: () => game.wings > 0 && game.stats.foodEarned < 200,
    text: "Strip a wing. It yields 80 food over ten seconds, and until the first workers emerge it is the only food there is.",
    act: () => stripWing(), label: "Strip a wing" },
  { id: "wait",
    when: () => game.emerged > 0 && population(game) < 8,
    text: "The founders work at six times a forager and fade by half every twenty minutes. The opening is a race to raise real workers before they are spent." },
  { id: "excavator",
    when: () => population(game) >= 8 && !isUnlocked(game, "excavator"),
    text: "Keep laying. Excavators unlock at 16 ants, and they are what raises the cap you are about to hit." },
  { id: "upgrades",
    when: () => isUnlocked(game, "excavator") && levelsOwned(game, null) === 0,
    text: "The Upgrades tab has something you can afford. Every one of them shows what it does to your rates right now, so you can see which is worth it." },
  { id: "nurse",
    when: () => population(game) >= 40 && !isUnlocked(game, "nurse"),
    text: "Only a few eggs develop at once and the rest queue. Nurses widen that, and they unlock at 64 ants." },
  { id: "soldier",
    when: () => population(game) >= 200 && !isUnlocked(game, "soldier"),
    text: "Something starts attacking at 256 ants. Soldiers unlock there too — lose your last one and the nest goes to ground rather than dying, but it halves your food until an army stands again." }
];

// Past the opening the assistant keeps going, but it stops explaining and starts
// pointing: the next single thing worth doing, and where that thing is one safe
// click it offers to make it. Nothing here is irreversible -- exiling, destroying
// eggs, flying and resetting a matriline are all left to the player, because an
// assistant that does those is the automated mistake the game refuses to make.
export const ASSISTANT_STEPS = [
  { id: "strip_more",
    when: () => stripReady() && game.wings > 0,
    text: () => "There is still a wing to strip \u2014 80 food over ten seconds.",
    act: () => stripWing(), label: "Strip a wing" },
  { id: "rally",
    when: () => rallyReady() && population(game) >= 20,
    text: () => "The foragers can be rallied: triple food for thirty seconds, then a rest.",
    act: () => startRally(), label: "Rally them" },
  { id: "buy",
    when: () => bestAffordableUpgrade() !== null,
    text: () => {
      const line = bestAffordableUpgrade();
      return "You can afford " + line.name + ", and it is the best value on the board right now.";
    },
    act: () => { const line = bestAffordableUpgrade(); return line ? buyUpgrade(line.id) : false; },
    label: () => {
      const line = bestAffordableUpgrade();
      return line ? "Buy " + line.name : "Buy it";
    } },
  { id: "dig",
    when: () => broodSpace() <= 0 && capPerExcavator(game) > 0 && isUnlocked(game, "excavator"),
    text: () => "The nest is full. Only excavators can be laid now, and each one digs the room for more.",
    act: () => layEgg("excavator"), label: "Lay an excavator" },
  { id: "lay_on",
    when: () => canLay(autoCaste()) && game.eggs.length < broodCapacity(game),
    text: () => "There is room in the brood and food for another egg.",
    act: () => layEgg(autoCaste()), label: () => "Lay a " + (CASTES[autoCaste()] || {}).name },
  { id: "flight",
    when: () => flightReady(),
    text: () => "She can take the nuptial flight whenever you are ready. The colony begins again, " +
      "and what it keeps is on the Nuptial tab.",
    act: null },
  { id: "matriline",
    when: () => matrilineReady(game) && currentSpecies(game) === GENERIC,
    text: () => "The Matriline is open. Beginning one commits the line to a species for the whole run.",
    act: null }
];

// the affordable upgrade with the most gain per unit of cost, which is what the
// suggestion is worth only if it is honest
function bestAffordableUpgrade() {
  let best = null;
  const rate = foodPerSecond(game);
  for (const line of UPGRADES) {
    if (upgradeMaxed(game, line) || !upgradeUnlocked(game, line)) continue;
    const cost = nextLevelCost(game, line);
    if (!cost || game.food < cost.food || game.protein < cost.protein) continue;
    const levels = Object.assign({}, game.upgrades);
    levels[line.id] = upgradeLevel(game, line) + 1;
    const probe = Object.assign({}, game, { upgrades: levels });
    const gain = (foodPerSecond(probe) - rate) +
      (populationCap(probe) - populationCap(game)) * 0.5 +
      (broodCapacity(probe) - broodCapacity(game)) * 20;
    const price = Math.max(1, cost.food + cost.protein * 1000);
    if (gain > 0 && (!best || gain / price > best.value)) best = { line, value: gain / price };
  }
  return best ? best.line : null;
}

export function tutorialStep() {
  if (game.settings.tutorial === false) return null;
  // the opening explains; after it the assistant points
  if (!isUnlocked(game, "soldier")) {
    for (const step of TUTORIAL_STEPS) {
      if (!step.when()) continue;
      return { id: step.id, text: step.text, act: step.act || null,
        label: step.act ? step.label : null };
    }
    return null;
  }
  for (const step of ASSISTANT_STEPS) {
    if (!step.when()) continue;
    return {
      id: step.id,
      text: typeof step.text === "function" ? step.text() : step.text,
      act: step.act || null,
      label: step.act ? (typeof step.label === "function" ? step.label() : step.label) : null
    };
  }
  return null;
}

export function doAssistantStep() {
  const step = tutorialStep();
  if (!step || !step.act) return false;
  return !!step.act();
}

export function dismissTutorial() {
  game.settings.tutorial = false;
  return true;
}

export function colonyBottleneck() {
  if (!game.wingsShed || game.emerged === 0) return null;
  const run = game.run || {};
  const full = Math.round(Math.min(1, run.broodFull || 0) * 100);
  // The cap and the space are read several times below and autoCaste() walks
  // every layable caste, so both are computed once. This runs every frame and
  // was the most expensive single call in the game at 22.8us; the answers are
  // the same, they are just not asked for five times over.
  const space = broodSpace();
  if (space <= 0) {
    const cap = populationCap(game);
    if (capPerExcavator(game) > 0) {
      return { key: "cap", text: "The nest is full — " + population(game) + " ants in a cap of " +
        cap + ". Only excavators can be laid until it is widened." };
    }
    return { key: "sealed", text: "The nest is full at " + cap +
      " and nothing here widens it. What the ants you have produce is the whole game." };
  }
  // Atta's whole shape, said out loud. Foragers bringing back more leaves than
  // the garden can turn over is the binding constraint and nothing else can be
  // read from the food rate, which just looks low.
  if (gardenActive(game)) {
    const bringing = gardenBringing(game);
    const capacity = gardenCapacity(game);
    if (bringing > capacity) {
      return { key: "garden", text: "Garden-bound — the foragers bring back " +
        (bringing / Math.max(1, capacity)).toFixed(1) + " times more leaves than the fungus " +
        "can turn over, and the rest rots. Nurses widen the garden; more foragers do not." };
    }
  }
  // only now is the caste needed, and choosing it is the expensive part
  const cost = eggCost(game, autoCaste());
  if (full >= 60) {
    return { key: "brood", text: "Brood-bound — the chambers have been full " + full +
      "% of the last minute. More of them, from nurses or the founders while they last, " +
      "grows the colony faster than more food does." };
  }
  if (game[cost.resource] < cost.amount) {
    return { key: "food", text: "Food-bound — the brood has room and the next egg costs " +
      fmtAmount(cost.amount) + " " + cost.resource + ". Anything that raises the food rate pays here." };
  }
  return { key: "none", text: "Nothing is holding the colony back — there is room in the " +
    "brood and food for the next egg. Whatever you lay now is what you get." };
}

function fmtAmount(n) {
  return n >= 1000 ? Math.round(n).toLocaleString("en-US") : n.toFixed(0);
}

export function canLay(casteId) {
  const caste = casteId || game.nextCaste;
  if (!game.wingsShed) return false;
  if (broodSlots(caste) <= 0) return false;
  const cost = eggCost(game, caste);
  return game[cost.resource] >= cost.amount;
}

// Lays one egg against a stock the caller already knows. The price depends only
// on how many of that caste exist, so a caller adding a run of them can count
// upwards itself instead of asking the brood to recount.
function layOne(caste, stock) {
  const resource = game.emerged === 0 ? "reserves" : "food";
  const amount = game.emerged === 0
    ? RESERVE_EGG_COST : eggPrice(caste, stock + 1, game);
  if (game[resource] < amount) return false;
  game[resource] -= amount;
  // Camponotus recycles nitrogen so an egg costs less protein, and Atta's
  // Gongylidia feeds a share of them for nothing at all.
  const proteinCost = EGG_PROTEIN_COST * speciesProteinCostMult(game);
  // only roll when a species has actually banked the passive: an unconditional
  // Math.random() per egg walks the shared stream and moves every big-forager
  // roll in the game with it
  const freeShare = passiveFeedFree(game);
  const free = freeShare > 0 && Math.random() < freeShare;
  const fed = game.settings.feedBrood !== false && (free || game.protein >= proteinCost);
  if (fed && !free) game.protein -= proteinCost;
  game.eggs.push({ caste, progress: 0, fed });
  touchBrood();
  return true;
}

export function layEgg(casteId) {
  const caste = casteId || game.nextCaste;
  if (!canLay(caste)) return false;
  return layOne(caste, casteStock(game, caste));
}

// Stock and chamber space only change because THIS loop is adding eggs, so both
// are counted locally. Calling layEgg() per egg re-walked the whole brood twice
// every time, which made laying quadratic: 60,000 eggs took 5.2 seconds and
// 187,000 froze the tab outright.
export function layEggs(count, casteId) {
  const caste = casteId || game.nextCaste;
  if (!game.wingsShed) return 0;
  let space = broodSlots(caste);
  let stock = casteStock(game, caste);
  let laid = 0;
  while (laid < count && space > 0 && layOne(caste, stock)) {
    stock++;
    space--;
    laid++;
  }
  return laid;
}

export function affordableEggs(casteId) {
  const caste = casteId || game.nextCaste;
  const slots = broodSlots(caste);
  if (slots <= 0) return 0;
  if (game.emerged === 0) {
    return Math.min(slots, Math.floor(game.reserves / RESERVE_EGG_COST));
  }
  return affordableBatch(caste, casteStock(game, caste), game.food, slots, game);
}

// The brood is strict FIFO, so a misclick of "lay max" can bury a caste you
// actually wanted behind hundreds of eggs. Destroying takes from the back of
// the queue -- the newest and least developed -- so the egg about to hatch is
// never the one that dies. Nothing is refunded, the same as exiling.
// One function mutates the brood. "Destroy the last n" is a range like any
// other, so the details window and every other caller go through here rather
// than splicing game.eggs themselves.
export function destroyEggRange(from, to) {
  const start = Math.max(0, Math.floor(from));
  const end = Math.min(game.eggs.length - 1, Math.floor(to));
  const taken = end - start + 1;
  if (!(taken > 0)) return 0;
  game.eggs.splice(start, taken);
  touchBrood();
  game.stats.eggsCancelled = (game.stats.eggsCancelled || 0) + taken;
  return taken;
}

// what each caste has coming, read off the queue rather than stored -- the
// emerging caste depends on queue position while the founders are still nanitic
// Move a batch to the front of the waiting queue. The brood is strict FIFO, so
// a player who laid a thousand foragers had to wait for all of them before a
// nurse could develop -- and the only way out was destroying eggs, which refunds
// nothing. This is the way out that costs nothing.
//
// It moves to the front of the WAITING part, never ahead of an egg already being
// tended: those have incubation paid into them and reordering them would throw
// that away, which is the thing this exists to avoid.
export function promoteEggRange(from, to) {
  const start = Math.max(0, Math.floor(from));
  const end = Math.min(game.eggs.length - 1, Math.floor(to));
  const taken = end - start + 1;
  if (!(taken > 0)) return 0;
  const tended = Math.min(broodCapacity(game), game.eggs.length);
  if (start <= tended) return 0;              // already at the front, or tended
  const moved = game.eggs.slice(start, end + 1);
  const rest = game.eggs.slice(0, start).concat(game.eggs.slice(end + 1));
  game.eggs = rest.slice(0, tended).concat(moved, rest.slice(tended));
  touchBrood();
  return taken;
}

export function pendingByCaste() {
  // emergingCaste only differs from the laid caste while the founding four are
  // still emerging, and inside the Nanitic Line. Past that it is the laid caste
  // exactly, which the brood tally already has counted -- so an established
  // colony does not walk its queue again. Measured at 208,000 eggs this call
  // alone cost 4.25ms a frame.
  if (game.emerged >= NANITIC_GENERATION && !callowActive(game)) {
    const out = {};
    for (const caste of Object.keys(CASTES)) {
      const n = broodCount(game, caste);
      if (n > 0) out[caste] = n;
    }
    return out;
  }
  const out = {};
  for (let i = 0; i < game.eggs.length; i++) {
    const caste = emergingCaste(game, game.eggs[i], i);
    out[caste] = (out[caste] || 0) + 1;
  }
  return out;
}

export { EXCHANGE_RETURN, exchangeReady, proteinSaleValue, proteinPurchaseCost,
  foodPerProtein } from "./raids.js";

// The colony renders what it has killed down into something the brood can eat,
// or feeds food to the hunters to bring more back. Both directions lose a cut.
//
// Neither counts toward stats.foodEarned or stats.proteinEarned: those are
// lifetime "gathered" totals feeding the achievement ladders, and traded
// resources were not gathered. Crediting them let a player cycle food through
// protein and back to farm the Food gathered track -- losing 36% of the food
// each pass but banking 64% of it as newly earned, which is a tier for nothing.
export function sellProtein(amount) {
  const n = Math.min(Math.floor(amount), Math.floor(game.protein));
  if (!(n > 0) || !exchangeReady(game)) return 0;
  const food = proteinSaleValue(game, n);
  game.protein -= n;
  game.food += food;
  return n;
}

export function buyProtein(amount) {
  const n = Math.floor(amount);
  if (!(n > 0) || !exchangeReady(game)) return 0;
  const cost = proteinPurchaseCost(game, n);
  if (!(cost <= game.food)) return 0;
  game.food -= cost;
  game.protein += n;
  return n;
}

export function affordableProtein() {
  if (!exchangeReady(game)) return 0;
  return Math.floor(game.food / proteinPurchaseCost(game, 1));
}

export function proteinUnlocked() {
  return game.protein > 0 || game.raidsWon > 0 || game.raidsLost > 0;
}

export function feedableEggs() {
  if (game.settings.feedBrood === false) return 0;
  return Math.floor(game.protein / EGG_PROTEIN_COST);
}

export function exileUnlocked() {
  return game.ants.forager > 0 || game.stats.exiled > 0;
}

export function canExile(casteId) {
  return game.settings.exileEnabled && exileUnlocked() && CASTES[casteId].layable;
}

export function maxExilable(casteId) {
  if (!canExile(casteId)) return 0;
  const held = game.ants[casteId];
  if (casteId !== "excavator") return held;
  const perExcavator = (populationCap(game) - BASE_POPULATION_CAP) / Math.max(1, game.ants.excavator);
  const slack = populationCap(game) - population(game) - game.eggs.length;
  if (perExcavator <= 1) return held;
  return Math.max(0, Math.min(held, Math.floor(slack / (perExcavator - 1))));
}

export function exile(casteId, count) {
  const allowed = Math.min(Math.floor(count), maxExilable(casteId));
  if (!(allowed > 0)) return 0;
  game.ants[casteId] -= allowed;
  game.stats.exiled += allowed;
  return allowed;
}

// Training a soldier into the next grade. It is bought with protein and it can
// kill her: the colony force-feeds an adult past what her moult was built for,
// and not all of them survive it. Rolled per ant so a small batch is a real
// gamble rather than a rounded average.
export function trainCost(index) {
  const rank = SOLDIER_RANKS[index + 1];
  return rank ? rank.cost : 0;
}

export function trainLossChance(index) {
  const rank = SOLDIER_RANKS[index + 1];
  return rank ? rank.loss : 0;
}

export function trainableCount(index) {
  const from = SOLDIER_RANKS[index];
  const to = SOLDIER_RANKS[index + 1];
  if (!from || !to) return 0;
  return Math.min(game.ants[from.id] || 0, Math.floor(game.protein / to.cost));
}

export function trainSoldiers(index, count) {
  const from = SOLDIER_RANKS[index];
  const to = SOLDIER_RANKS[index + 1];
  if (!from || !to) return null;
  const n = Math.min(Math.floor(count), trainableCount(index));
  if (!(n > 0)) return null;
  game.protein -= n * to.cost;
  game.ants[from.id] -= n;
  let lost = 0;
  for (let i = 0; i < n; i++) if (Math.random() < to.loss) lost++;
  game.ants[to.id] = (game.ants[to.id] || 0) + (n - lost);
  game.stats.trainingDeaths = (game.stats.trainingDeaths || 0) + lost;
  game.stats.trained = (game.stats.trained || 0) + (n - lost);
  return { trained: n - lost, lost, spent: n * to.cost };
}

export function setQueenName(name) {
  game.queenName = String(name || "").slice(0, 24);
  return game.queenName;
}

export function queenTitle() {
  return game.queenName ? "Queen " + game.queenName : "The queen";
}

// the report is shown once per return; the frame loop must not reopen it
export function markAwaySeen() {
  if (lastAway) lastAway.seen = true;
}

export function markSeen(key, count) {
  game.seen[key] = count;
}

export function setSetting(key, value) {
  game.settings[key] = value;
  return game.settings[key];
}

export function exportSave() {
  save();
  return encodeSave(game);
}

export function importSave(text) {
  const data = decodeSave(text);
  if (!data) return false;
  if (!stashSave(data)) return false;
  load();
  return true;
}

export function hardReset() {
  clearSaves();
  Object.assign(game, blankGame());
  touchBrood();
  return true;
}

// No flying out of a trial. doFlight() refounds the colony, which would clear
// game.challenge as a side effect -- so a colony that pushed past 1,000 inside
// a trial could leave it through the Nuptial tab and be paid jelly for it.
export function flightReady() {
  return !challengeActive(game) && population(game) >= PRESTIGE_UNLOCK;
}

export function flightReward() {
  return royalJellyEarned(game, population(game), achievementJellyBonus(game));
}

export function doFlight() {
  if (!flightReady()) return 0;
  const earned = flightReward();
  // keep the running totals clean: the payout carries one decimal now
  game.prestige.royalJelly = Math.round((game.prestige.royalJelly + earned) * 100) / 100;
  game.prestige.royalJellyTotal = Math.round((game.prestige.royalJellyTotal + earned) * 100) / 100;
  game.prestige.flightsTaken += 1;
  // Lifetime totals the achievement tracks read instead of the resettable
  // fields. A matriline reset zeroes flightsTaken and royalJellyTotal, and
  // measured that cost 25 tiers -- 8 from the flights track and 17 from royal
  // jelly -- which also shrinks the pool the Instincts are bought from. A track
  // must never lose a tier because a layer above it reset.
  game.stats.flightsEver = (game.stats.flightsEver || 0) + 1;
  game.stats.jellyEver = Math.round(((game.stats.jellyEver || 0) + earned) * 100) / 100;
  game.best.jelly = Math.max(game.best.jelly || 0, earned);
  // both counters feed layer 2: the matriline's own total is what Haplotype is
  // paid on, and the per-species total is one of the three roads to finishing a
  // species. The per-species one is a lifetime stat, so a species half-finished
  // in one matriline keeps its progress into the next.
  const m = game.matriline || (game.matriline = { flights: 0 });
  m.flights = (m.flights || 0) + 1;
  const flown = Object.assign({}, game.stats.speciesFlights || {});
  const line = currentSpecies(game);
  flown[line] = (flown[line] || 0) + 1;
  game.stats.speciesFlights = flown;

  refoundColony();
  return earned;
}

// Everything that outlives a colony. A nuptial flight, entering a trial and
// leaving one all found a new colony and keep exactly this much.
function refoundColony(extra) {
  const surviving = {
    prestige: game.prestige,
    achievements: game.achievements,
    achievementPoints: game.achievementPoints,
    achievementXp: game.achievementXp,
    achievementLevel: game.achievementLevel,
    peakAchievementLevel: game.peakAchievementLevel,
    peakPopulation: game.peakPopulation,
    peakCastes: game.peakCastes,
    peakStrength: game.peakStrength,
    peakUpgrades: game.peakUpgrades,
    best: game.best,
    stats: game.stats,
    settings: game.settings,
    seen: game.seen,
    library: game.library,
    queenName: game.queenName,
    challenges: game.challenges,
    instincts: game.instincts,
    // The matriline outlives every colony AND every flight -- it is the layer
    // above them. Without this the reset wiped the species it had just
    // committed to, along with the whole tree that paid for the inheritance.
    matriline: game.matriline
  };
  const keptFood = (game.food || 0) * instinctKeptFood(game);
  Object.assign(game, blankGame());
  Object.assign(game, surviving, extra || {});
  touchBrood();
  // Living Memory: a daughter leaves with a full crop. Applied after the wipe
  // rather than carried in `surviving`, because it is a share of what was
  // standing and not a field that persists.
  game.food = keptFood;
}

export function enterChallenge(id) {
  if (!challengesUnlocked(game) || game.challenge) return false;
  const challenge = challengeById(id);
  if (!challenge || !challenge.open || challengeMastered(game, id)) return false;
  refoundColony({ challenge: id });
  return true;
}

export function abandonChallenge() {
  if (!game.challenge) return false;
  refoundColony({ challenge: null });
  return true;
}

// the target is met but the level is not banked until the player says so --
// a colony that dissolved itself the moment it hit 600 would be a nasty
// surprise in the middle of a run
// every figure a trial might be measured against, gathered in one place
function challengeValues() {
  return { population: population(game), foodRate: foodPerSecond(game),
    runFood: (game.run && game.run.foodEarned) || 0 };
}

export function challengeMet() {
  return challengeTargetMet(game, challengeValues());
}

// how far along this trial's own measure the colony is
export function challengeCount() {
  return challengeProgress(game, challengeValues());
}

export function completeChallenge() {
  if (!challengeMet()) return false;
  const id = activeChallenge(game).id;
  const line = currentSpecies(game);
  const cleared = Object.assign({}, game.challenges);
  const mine = Object.assign({}, cleared[line] || {});
  mine[id] = (mine[id] || 0) + 1;
  cleared[line] = mine;
  game.challenges = cleared;
  // the lifetime count stays global: the achievement track reads it, and a
  // track must never lose a tier because the line changed species
  game.stats.challengeLevels = (game.stats.challengeLevels || 0) + 1;
  const best = Object.assign({}, game.stats.bestTrial || {});
  const bestMine = Object.assign({}, best[line] || {});
  bestMine[id] = Math.max(bestMine[id] || 0, mine[id]);
  best[line] = bestMine;
  game.stats.bestTrial = best;
  const m = game.matriline || (game.matriline = { trialLevels: 0 });
  m.trialLevels = (m.trialLevels || 0) + 1;
  refoundColony({ challenge: null });
  return true;
}

// ------------------------------------------------------------- layer 2
//
// The matriline reset clears everything layer 1 gave the line -- the jelly, the
// whole lineage, the lot -- and hands back only what the matriline tree has
// bought the right to inherit. That is what makes the tree's first purchases
// worth making: without them a second matriline replays four and a half hours
// of content the player has already finished.
export function doMatrilineReset(speciesId) {
  if (!matrilineReady(game)) return 0;
  const earned = haplotypeEarned(game);
  // Retained Royalty keeps a share of the JELLY IN HAND, uncapped. It used to
  // be capped at the price of the lineage, which meant a player who had banked
  // 160,000 kept 43 of it -- an insulting number for a node costing ten
  // haplotype. What must not carry is royalJellyTotal: that is the figure the
  // next matriline's gate is measured against, so it resets to nothing and the
  // gate is genuinely re-earned. The achievement track reads stats.jellyEver
  // instead, so zeroing it costs no tiers.
  const keep = Math.round((game.prestige.royalJelly || 0) * jellyKept(game) * 10) / 10;
  const inherited = inheritedPrestige(game);
  const m = game.matriline;

  m.haplotype = Math.round((m.haplotype + earned) * 100) / 100;
  m.haplotypeTotal = Math.round((m.haplotypeTotal + earned) * 100) / 100;
  m.resets += 1;
  m.species = speciesById(speciesId) ? speciesId : null;
  m.flights = 0;
  m.trialLevels = 0;

  refoundColony({ challenge: null });
  // A species whose optimum shares differ from the generic ones says so, and
  // committing to her is where they are set -- the automation would otherwise
  // go on laying to a default measured for a different animal.
  const ratios = speciesRatios(m.species);
  if (ratios) game.settings.ratios = ratios;
  game.prestige = {
    royalJelly: keep,
    royalJellyTotal: 0,
    flightsTaken: 0,
    upgrades: inherited.filter(id => id !== "autoShed")
  };
  return earned;
}

export function buyInstinct(id) {
  const instinct = instinctById(id);
  if (!instinct || instinctOwned(game, id)) return false;
  if (instinctPoints(game) < instinct.cost) return false;
  game.instincts = (game.instincts || []).concat([id]);
  return true;
}

export function buyMatrilineUpgrade(id) {
  const upgrade = matrilineUpgradeById(id);
  if (!upgrade || matrilineUpgradeOwned(game, id)) return false;
  const m = game.matriline;
  if (!m || m.haplotype < upgrade.cost) return false;
  m.haplotype = Math.round((m.haplotype - upgrade.cost) * 100) / 100;
  m.upgrades = m.upgrades.concat([id]);
  return true;
}

export function buyPrestigeUpgrade(id) {
  const upgrade = PRESTIGE_UPGRADES.find(u => u.id === id);
  if (!upgrade) return false;
  if (prestigeUpgradeOwned(game, upgrade)) return false;
  if (game.prestige.royalJelly < upgrade.cost) return false;
  game.prestige.royalJelly -= upgrade.cost;
  game.prestige.upgrades.push(upgrade.id);
  return true;
}

// Levels, not lines. The three upgrade achievement tracks read these, and
// counting lines would have dropped their tops from 29 to 12 -- taking tiers,
// and with them achievement levels, off every save that already passed them.
function recordUpgradePeaks(game) {
  const peaks = game.peakUpgrades || (game.peakUpgrades = { all: 0, colony: 0, combat: 0 });
  const colony = levelsOwned(game, "colony");
  const combat = levelsOwned(game, "combat");
  let deepest = 0;
  for (const line of UPGRADES) deepest = Math.max(deepest, upgradeLevel(game, line));
  peaks.deepest = Math.max(peaks.deepest || 0, deepest);
  peaks.all = Math.max(peaks.all || 0, colony + combat);
  peaks.colony = Math.max(peaks.colony || 0, colony);
  peaks.combat = Math.max(peaks.combat || 0, combat);
}

// Buys ONE level. An extended level can cost food and protein at once, so the
// cost is a pair rather than an amount in a single currency.
export function buyUpgrade(id) {
  const line = UPGRADES.find(u => u.id === id);
  if (!line) return false;
  if (upgradeMaxed(game, line) || !upgradeUnlocked(game, line)) return false;
  const cost = nextLevelCost(game, line);
  if (!cost) return false;
  if (game.food < cost.food || game.protein < cost.protein) return false;
  game.food -= cost.food;
  game.protein -= cost.protein;
  game.upgrades = Object.assign({}, game.upgrades);
  game.upgrades[line.id] = upgradeLevel(game, line) + 1;
  return true;
}

// buys every level it can still reach and afford, which is what Nest Memory
// needs now that a line has more than one rung
export function buyUpgradeLevels(id) {
  let bought = 0;
  while (buyUpgrade(id)) bought++;
  return bought;
}

export function levelPoints(level) {
  return levelPointsFor(level);
}

export function checkAchievements() {
  const before = game.achievementPoints;
  recountAchievements();
  return game.achievementPoints - before;
}

export { totalXp, xpForLevel } from "./achievements.js";

function recountAchievements() {
  game.achievementPoints = totalTiers(game);
  game.achievementXp = totalXp(game);
  const earned = achievementLevelFor(game.achievementXp);
  // seeded from the saved level as well, so a colony that reached a level under
  // the old flat scoring keeps it without needing a migration
  game.peakAchievementLevel = Math.max(
    game.peakAchievementLevel || 0, game.achievementLevel || 0, earned);
  game.achievementLevel = game.peakAchievementLevel;
}

function rollBigForager() {
  const threshold = bigForagerThreshold(game);
  if (game.foragersSinceBig + 1 >= threshold) return true;
  return Math.random() < (game.foragersSinceBig + 1) / threshold;
}

export function tick(dt) {
  if (!isFinite(dt) || dt <= 0) return;
  // A wing pays only for as long as it lasts. An offline chunk can be far
  // longer than the strip -- at an eight hour absence the step is 48s against
  // a 10s strip -- and would otherwise pay out several times over.
  const wingRate = wingYield(game);
  const wingSeconds = Math.min(dt, game.wingStrip || 0);
  const earned = (foodPerSecond(game) - wingRate) * dt + wingRate * wingSeconds;
  game.food += earned;
  game.stats.foodEarned += earned;
  // Myrmecocystus holds its store in the bodies of living ants. What the colony
  // gathered it gathered -- the ladders count it -- but what it cannot hang up
  // it loses, so growing the nest is the only way to save.
  const holds = foodCap(game);
  if (holds > 0 && game.food > holds) {
    const spill = game.food - holds;
    game.food = holds;
    // Overflow renders what will not fit rather than losing it, at the rate the
    // colony currently earns — the same rate the rendering pit trades at, so
    // there is no loop to run between the two.
    if (speciesOverflowsToProtein(game)) {
      const rendered = spill / Math.max(1, foodPerProtein(game));
      game.protein += rendered;
      game.stats.proteinEarned = (game.stats.proteinEarned || 0) + rendered;
    }
  }
  // what THIS colony has gathered, which resets with it -- a trial that is
  // about sustaining output cannot be measured on a lifetime total
  if (game.run) game.run.foodEarned = (game.run.foodEarned || 0) + earned;
  game.stats.playtime += dt;
  game.runTime = (game.runTime || 0) + dt;

  if (game.wingStrip > 0) game.wingStrip = Math.max(0, game.wingStrip - dt);

  // the cooldown only starts once the rally is over, so the cycle is
  // RALLY_DURATION boosted then RALLY_COOLDOWN waiting
  if (game.rallyTime > 0) {
    game.rallyTime = Math.max(0, game.rallyTime - dt);
    if (game.rallyTime === 0) game.rallyCooldown = RALLY_COOLDOWN;
  } else if (game.rallyCooldown > 0) {
    game.rallyCooldown = Math.max(0, game.rallyCooldown - dt);
  }

  if (!game.wingsShed && autoShedOn()) shedWings();
  // ...and strips them too. A player reported the instinct as broken because
  // she shed on landing and then sat there with four wings to click by hand --
  // two different acts, both called "wings", one automated. Four clicks on a
  // ten-second timer is a chore rather than a decision once you have flown
  // before, which is exactly what the flight is meant to sell.
  if (autoShedOn() && stripReady()) stripWing();
  runAutomation();
  sampleBottleneck(dt);

  const rate = hatchRate(game);
  const tended = broodCapacity(game);
  // only the tended slots develop, so only they are walked -- scanning a
  // 187,000-egg queue every tick to skip all but the first 1,600 was wasted work
  for (let i = Math.min(tended, game.eggs.length) - 1; i >= 0; i--) {
    const egg = game.eggs[i];
    const founding = emergingCaste(game, egg, i) === "nanitic";
    egg.progress += rate * dt * (egg.fed ? FED_EGG_SPEED : 1) *
      (founding ? NANITIC_HATCH_SPEED : 1);
    if (egg.progress >= EGG_TIME) {
      const caste = emergingCaste(game, egg);
      if (caste === "forager" && rollBigForager()) {
        game.ants.bigforager++;
        game.bigForagers.push(game.stats.playtime);
        game.foragersSinceBig = 0;
      } else {
        game.ants[caste]++;
        if (caste === "forager") game.foragersSinceBig++;
      }
      game.emerged++;
      game.stats.eggsHatched++;
      game.eggs.splice(i, 1);
      touchBrood();
    }
  }

  if (!game.naniticsDied && game.runTime >= naniticLifespan(game) && game.ants.nanitic > 0) {
    game.ants.nanitic = 0;
    game.naniticsDied = true;
  }

  const pop = population(game);
  const run = game.run || (game.run = { peakPopulation: 0, peakCastes: {}, peakStrength: 0 });
  game.peakPopulation = Math.max(game.peakPopulation, pop);
  run.peakPopulation = Math.max(run.peakPopulation || 0, pop);
  for (const id in game.ants) {
    if (game.ants[id] > (game.peakCastes[id] || 0)) game.peakCastes[id] = game.ants[id];
    if (game.ants[id] > (run.peakCastes[id] || 0)) run.peakCastes[id] = game.ants[id];
  }
  // Every rank counts as a soldier. Recording only the base rank would let a
  // promotion look like a loss, re-locking Combat upgrades gated on soldiers.
  const soldiers = soldierCount(game);
  if (soldiers > (game.peakCastes.soldier || 0)) game.peakCastes.soldier = soldiers;
  if (soldiers > (run.peakCastes.soldier || 0)) run.peakCastes.soldier = soldiers;
  const strength = combatPower(game);
  if (strength > (game.peakStrength || 0)) game.peakStrength = strength;
  if (strength > (run.peakStrength || 0)) run.peakStrength = strength;
  recordUpgradePeaks(game);
  const best = game.best || (game.best = { population: 0, jelly: 0, timeTo1000: 0 });
  best.population = Math.max(best.population || 0, pop);
  if (!best.timeTo1000 && pop >= 1000) best.timeTo1000 = game.runTime;

  clearLossStreak(game);
  game.hiding = inHiding(game);
  // The interval belongs to the trial, and a colony can be holding a longer
  // one: entering a trial refounds the colony, which starts the clock at the
  // ordinary six minutes, and a save can predate the trial entirely. Without
  // this the first attack of a ninety-second siege arrived six minutes late --
  // only the raids after it used the trial's clock.
  const interval = raidInterval(game);
  if (game.raidTimer > interval) game.raidTimer = interval;
  if (raidsHalted(game)) {
    // the trial is lost; the attacks stop and the colony waits to be abandoned
    game.raidTimer = raidInterval(game);
  } else if (raidsUnlocked(game)) {
    const hunted = huntRate(game) * dt;
    game.protein += hunted;
    game.stats.proteinEarned += hunted;
    if (game.hiding) {
      // nothing finds the nest while it is shut; the next attack waits for an army
      game.raidTimer = raidInterval(game);
    } else {
      game.raidTimer -= dt;
      let guard = 0;
      while (game.raidTimer <= 0 && guard++ < 512) {
        resolveRaidFor(game);
        game.raidTimer += raidInterval(game);
      }
    }
  }

  if (!isUnlocked(game, game.nextCaste) || layableCastes(game).indexOf(game.nextCaste) < 0) {
    game.nextCaste = layableCastes(game)[0] || "forager";
  }
  checkAchievements();
  checkSpeciesFinished(game);
  discoverLibrary(game);
}


export function load() {
  const data = readSave();
  if (!data) return 0;

  applySave(game, blankGame(), data);
  touchBrood();
  game.peakPopulation = Math.max(data.peakPopulation || 0, population(game));
  game.run.peakPopulation = Math.max(game.run.peakPopulation || 0, population(game));
  for (const id in game.ants) {
    if (game.ants[id] > (game.peakCastes[id] || 0)) game.peakCastes[id] = game.ants[id];
  }
  recountAchievements();

  // What the clock says, and what the colony was actually paid for. The report
  // needs both: away for thirty hours against an eight hour cap means
  // twenty-two hours the colony did not work, and the old one-line note said
  // "while you were away -- 8h" and never mentioned it.
  const cap = offlineCapSeconds(game);
  const requested = Math.max(0, (Date.now() - game.lastSave) / 1000);
  const elapsed = Math.min(requested, cap);
  const before = { food: game.stats.foodEarned, protein: game.stats.proteinEarned,
    hatched: game.stats.eggsHatched, won: game.raidsWon, lost: game.raidsLost,
    population: population(game), jelly: (game.prestige && game.prestige.royalJelly) || 0 };
  const step = Math.max(1, elapsed / 600);
  for (let done = 0; done < elapsed; done += step) {
    tick(Math.min(step, elapsed - done));
  }
  if (elapsed >= 60) {
    // a persisted count, so the library can say whether this colony has ever
    // actually come back to a working nest rather than guessing from playtime
    game.stats.awayReturns = (game.stats.awayReturns || 0) + 1;
    lastAway = { seconds: elapsed, requested, cap, capped: requested > cap + 1,
      food: game.stats.foodEarned - before.food,
      protein: game.stats.proteinEarned - before.protein,
      hatched: game.stats.eggsHatched - before.hatched,
      won: game.raidsWon - before.won, lost: game.raidsLost - before.lost,
      popBefore: before.population, popAfter: population(game),
      hiding: !!game.hiding, seen: false };
  }
  return elapsed;
}

export function raidCountdown() {
  return countdownFor(game);
}

export function raidImminent() {
  return imminentFor(game);
}

export function resolveRaid() {
  return resolveRaidFor(game);
}
