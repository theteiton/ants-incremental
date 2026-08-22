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
  eggPrice,
  casteStock,
  NANITIC_LIFESPAN,
  foodPerSecond,
  hatchRate,
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
  raidCountdown as countdownFor,
  raidImminent as imminentFor,
  raidsUnlocked,
  inHiding,
  combatPower,
  huntRate,
  resolveRaid as resolveRaidFor
} from "./raids.js";
import { achievementLevelFor, levelPoints as levelPointsFor, totalTiers } from "./achievements.js";
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
    ants: { nanitic: 0, forager: 0, bigforager: 0, excavator: 0, nurse: 0, soldier: 0 },
    bigForagers: [],
    foragersSinceBig: 0,
    protein: 0,
    raidTimer: RAID_INTERVAL,
    raidsWon: 0,
    raidsLost: 0,
    lastRaid: null,
    emerged: 0,
    nextCaste: "forager",
    upgrades: [],
    achievements: [],
    achievementPoints: 0,
    achievementLevel: 0,
    peakPopulation: 0,
    peakCastes: {},
    peakStrength: 0,
    naniticsDied: false,
    hiding: false,
    queenName: "",
    settings: { exileEnabled: true, hideLocked: false, hideOwned: false, theme: "dark",
      upgradeFilter: "all", upgradeSort: "default", feedBrood: true,
      autoShed: true, autoBuy: true, autoLay: true, autoRatio: true, foodReserve: 0,
      ratios: { forager: 0, excavator: 0, nurse: 5, soldier: 8 } },
    seen: { upgrades: 0, tracks: null },
    runTime: 0,
    run: { peakPopulation: 0, peakCastes: {}, peakStrength: 0 },
    best: { population: 0, jelly: 0, timeTo1000: 0 },
    peakUpgrades: { all: 0, colony: 0, combat: 0 },
    stats: { foodEarned: 0, eggsHatched: 0, playtime: 0, exiled: 0, proteinEarned: 0,
      raidsWonTotal: 0, eggsCancelled: 0 },
    prestige: { royalJelly: 0, royalJellyTotal: 0, flightsTaken: 0, upgrades: [], knownUpgrades: [] },
    lastSave: Date.now()
  };
}

export const game = blankGame();

export function shedWings() {
  if (game.wingsShed) return false;
  game.wingsShed = true;
  game.reserves = QUEEN_RESERVES + prestigeStartingReserves(game);
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
    for (const id of game.prestige.knownUpgrades || []) buyUpgrade(id);
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

export function layEgg(casteId) {
  const caste = casteId || game.nextCaste;
  if (!canLay(caste)) return false;
  const cost = eggCost(game, caste);
  game[cost.resource] -= cost.amount;
  const fed = game.settings.feedBrood !== false && game.protein >= EGG_PROTEIN_COST;
  if (fed) game.protein -= EGG_PROTEIN_COST;
  game.eggs.push({ caste, progress: 0, fed });
  return true;
}

export function layEggs(count, casteId) {
  let laid = 0;
  while (laid < count && layEgg(casteId)) laid++;
  return laid;
}

export function affordableEggs() {
  const slots = broodSlots();
  if (slots <= 0) return 0;
  const first = eggCost(game);
  if (first.resource === "reserves") {
    return Math.min(slots, Math.floor(game.reserves / first.amount));
  }
  let budget = game.food;
  let stock = casteStock(game, game.nextCaste);
  let count = 0;
  while (count < slots) {
    const price = eggPrice(game.nextCaste, stock + 1);
    if (price > budget) break;
    budget -= price;
    stock++;
    count++;
  }
  return count;
}

// The brood is strict FIFO, so a misclick of "lay max" can bury a caste you
// actually wanted behind hundreds of eggs. Destroying takes from the back of
// the queue -- the newest and least developed -- so the egg about to hatch is
// never the one that dies. Nothing is refunded, the same as exiling.
export function maxCancellable() {
  return game.eggs.length;
}

export function cancelEggs(count) {
  const taken = Math.min(Math.floor(count), maxCancellable());
  if (!(taken > 0)) return 0;
  game.eggs.splice(game.eggs.length - taken, taken);
  game.stats.eggsCancelled = (game.stats.eggsCancelled || 0) + taken;
  return taken;
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

export function flightReady() {
  return population(game) >= PRESTIGE_UNLOCK;
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

  // Values that survive the flight
  const surviving = {
    prestige: game.prestige,
    achievements: game.achievements,
    achievementPoints: game.achievementPoints,
    achievementLevel: game.achievementLevel,
    peakPopulation: game.peakPopulation,
    peakCastes: game.peakCastes,
    peakStrength: game.peakStrength,
    peakUpgrades: game.peakUpgrades,
    best: game.best,
    stats: game.stats,
    settings: game.settings,
    seen: game.seen,
    queenName: game.queenName
  };

  Object.assign(game, blankGame());
  Object.assign(game, surviving);
  return earned;
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

function recordUpgradePeaks(game) {
  const peaks = game.peakUpgrades || (game.peakUpgrades = { all: 0, colony: 0, combat: 0 });
  let colony = 0;
  let combat = 0;
  for (const id of game.upgrades) {
    const upgrade = UPGRADES.find(u => u.id === id);
    if (!upgrade) continue;
    if (upgradeBranch(upgrade) === "combat") combat++;
    else colony++;
  }
  peaks.all = Math.max(peaks.all || 0, colony + combat);
  peaks.colony = Math.max(peaks.colony || 0, colony);
  peaks.combat = Math.max(peaks.combat || 0, combat);
}

export function buyUpgrade(id) {
  const upgrade = UPGRADES.find(u => u.id === id);
  if (!upgrade) return false;
  if (upgradeOwned(game, upgrade) || !upgradeUnlocked(game, upgrade)) return false;
  const currency = upgradeCurrency(upgrade);
  if (game[currency] < upgrade.cost) return false;
  game[currency] -= upgrade.cost;
  game.upgrades.push(upgrade.id);
  const known = game.prestige.knownUpgrades || (game.prestige.knownUpgrades = []);
  if (known.indexOf(upgrade.id) < 0) known.push(upgrade.id);
  return true;
}

export function levelPoints(level) {
  return levelPointsFor(level);
}

export function checkAchievements() {
  const before = game.achievementPoints;
  recountAchievements();
  return game.achievementPoints - before;
}

function recountAchievements() {
  game.achievementPoints = totalTiers(game);
  game.achievementLevel = achievementLevelFor(game.achievementPoints);
}

function rollBigForager() {
  const threshold = bigForagerThreshold(game);
  if (game.foragersSinceBig + 1 >= threshold) return true;
  return Math.random() < (game.foragersSinceBig + 1) / threshold;
}

export function tick(dt) {
  if (!isFinite(dt) || dt <= 0) return;
  const earned = foodPerSecond(game) * dt;
  game.food += earned;
  game.stats.foodEarned += earned;
  game.stats.playtime += dt;
  game.runTime = (game.runTime || 0) + dt;

  if (!game.wingsShed && autoShedOn()) shedWings();
  runAutomation();

  const rate = hatchRate(game);
  const tended = broodCapacity(game);
  for (let i = game.eggs.length - 1; i >= 0; i--) {
    const egg = game.eggs[i];
    if (i >= tended) continue;
    egg.progress += rate * dt * (egg.fed ? FED_EGG_SPEED : 1);
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

  if (!game.naniticsDied && game.runTime >= NANITIC_LIFESPAN && game.ants.nanitic > 0) {
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
  const strength = combatPower(game);
  if (strength > (game.peakStrength || 0)) game.peakStrength = strength;
  if (strength > (run.peakStrength || 0)) run.peakStrength = strength;
  recordUpgradePeaks(game);
  const best = game.best || (game.best = { population: 0, jelly: 0, timeTo1000: 0 });
  best.population = Math.max(best.population || 0, pop);
  if (!best.timeTo1000 && pop >= 1000) best.timeTo1000 = game.runTime;

  game.hiding = inHiding(game);
  if (raidsUnlocked(game)) {
    const hunted = huntRate(game) * dt;
    game.protein += hunted;
    game.stats.proteinEarned += hunted;
    if (game.hiding) {
      // nothing finds the nest while it is shut; the next attack waits for an army
      game.raidTimer = RAID_INTERVAL;
    } else {
      game.raidTimer -= dt;
      while (game.raidTimer <= 0) {
        resolveRaidFor(game);
        game.raidTimer += RAID_INTERVAL;
      }
    }
  }

  if (!isUnlocked(game, game.nextCaste)) game.nextCaste = "forager";
  checkAchievements();
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
