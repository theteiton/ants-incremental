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
  CHALLENGE_TARGET
} from "./challenges.js";
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
export { challengeTarget, targetKind, challengeProgress, TARGET_KINDS,
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
    challenges: {},
    wings: 0,
    wingStrip: 0,
    queenName: "",
    settings: { exileEnabled: true, hideLocked: false, hideOwned: false, theme: "dark",
      upgradeFilter: "all", upgradeSort: "default", feedBrood: true,
      autoShed: true, autoBuy: true, autoLay: true, autoRatio: true, foodReserve: 0,
      stickyInspector: true,
      broodScope: "waiting", broodDirection: "back", layAmount: 10,
      notation: "suffix", raidDifficulty: "sheltered",
      ratios: { forager: 0, excavator: 0, nurse: 5, soldier: 8 } },
    seen: { upgrades: 0, tracks: null, library: 0, updates: "" },
    library: {},
    runTime: 0,
    run: { peakPopulation: 0, peakCastes: {}, peakStrength: 0, foodEarned: 0 },
    best: { population: 0, jelly: 0, timeTo1000: 0 },
    peakUpgrades: { all: 0, colony: 0, combat: 0, deepest: 0 },
    stats: { foodEarned: 0, eggsHatched: 0, playtime: 0, exiled: 0, proteinEarned: 0,
      raidsWonTotal: 0, eggsCancelled: 0, challengeLevels: 0, bestTrial: {},
      trained: 0, trainingDeaths: 0 },
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
  return automationUnlocked(game, "autoShed");
}

export function automationOn(key) {
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
  if (cap - pop < Math.max(8, pop * 0.12) && isUnlocked(game, "excavator")) return "excavator";
  const ratios = game.settings.ratios || {};
  let want = null;
  let worst = 0;
  for (const id of layableCastes()) {
    const target = (ratios[id] || 0) / 100;
    if (target <= 0 || !isUnlocked(game, id)) continue;
    const deficit = target - casteStock(game, id) / Math.max(1, pop);
    if (deficit > worst) { worst = deficit; want = id; }
  }
  // with every share met the surplus goes to food, not to whatever caste
  // happened to be chosen last -- otherwise the ratios overshoot badly
  return want || "forager";
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
  return isUnlocked(game, caste) ? caste : "forager";
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
  let digging = 0;
  for (const egg of game.eggs) if (egg.caste === "excavator") digging++;
  // a colony that tended three eggs could only ever dig three chambers out,
  // however many nurses it had; the brood is the real limit
  return Math.max(0, Math.max(EXCAVATOR_OVERFLOW, broodCapacity(game)) - digging);
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
    ? RESERVE_EGG_COST : eggPrice(caste, stock + 1);
  if (game[resource] < amount) return false;
  game[resource] -= amount;
  const fed = game.settings.feedBrood !== false && game.protein >= EGG_PROTEIN_COST;
  if (fed) game.protein -= EGG_PROTEIN_COST;
  game.eggs.push({ caste, progress: 0, fed });
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
  return affordableBatch(caste, casteStock(game, caste), game.food, slots);
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
  game.stats.eggsCancelled = (game.stats.eggsCancelled || 0) + taken;
  return taken;
}

// what each caste has coming, read off the queue rather than stored -- the
// emerging caste depends on queue position while the founders are still nanitic
export function pendingByCaste() {
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
  game.best.jelly = Math.max(game.best.jelly || 0, earned);

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
    challenges: game.challenges
  };
  Object.assign(game, blankGame());
  Object.assign(game, surviving, extra || {});
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
  const cleared = Object.assign({}, game.challenges);
  cleared[id] = (cleared[id] || 0) + 1;
  game.challenges = cleared;
  game.stats.challengeLevels = (game.stats.challengeLevels || 0) + 1;
  const best = Object.assign({}, game.stats.bestTrial || {});
  best[id] = Math.max(best[id] || 0, cleared[id]);
  game.stats.bestTrial = best;
  refoundColony({ challenge: null });
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

  if (!isUnlocked(game, game.nextCaste)) game.nextCaste = "forager";
  checkAchievements();
  discoverLibrary(game);
}


export function load() {
  const data = readSave();
  if (!data) return 0;

  applySave(game, blankGame(), data);
  game.peakPopulation = Math.max(data.peakPopulation || 0, population(game));
  game.run.peakPopulation = Math.max(game.run.peakPopulation || 0, population(game));
  for (const id in game.ants) {
    if (game.ants[id] > (game.peakCastes[id] || 0)) game.peakCastes[id] = game.ants[id];
  }
  recountAchievements();

  const elapsed = Math.min(Math.max(0, (Date.now() - game.lastSave) / 1000), OFFLINE_CAP);
  const before = { food: game.stats.foodEarned, protein: game.stats.proteinEarned,
    hatched: game.stats.eggsHatched, won: game.raidsWon, lost: game.raidsLost };
  const step = Math.max(1, elapsed / 600);
  for (let done = 0; done < elapsed; done += step) {
    tick(Math.min(step, elapsed - done));
  }
  if (elapsed >= 60) {
    lastAway = { seconds: elapsed,
      food: game.stats.foodEarned - before.food,
      protein: game.stats.proteinEarned - before.protein,
      hatched: game.stats.eggsHatched - before.hatched,
      won: game.raidsWon - before.won, lost: game.raidsLost - before.lost };
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
