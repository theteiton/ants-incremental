import {
  CASTES,
  EGG_TIME,
  eggCost,
  emergingCaste,
  EXCAVATOR_OVERFLOW,
  BASE_POPULATION_CAP,
  bigForagerThreshold,
  broodCapacity,
  upgradeCurrency,
  CASTE_COSTS,
  casteStock,
  NANITIC_LIFESPAN,
  foodPerSecond,
  hatchRate,
  isUnlocked,
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
  combatPower,
  huntRate,
  resolveRaid as resolveRaidFor
} from "./raids.js";
import { achievementLevelFor, levelPoints as levelPointsFor, totalTiers } from "./achievements.js";
import {
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
export { PRESTIGE_UPGRADES, PRESTIGE_UNLOCK, royalJellyEarned, prestigeUpgradeOwned } from "./prestige.js";

export const QUEEN_RESERVES = 100;
export const OFFLINE_CAP = 8 * 3600;

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
    queenName: "",
    settings: { exileEnabled: true, hideLocked: false, hideOwned: false, theme: "dark", upgradeFilter: "all", feedBrood: true },
    seen: { upgrades: 0, tracks: null },
    runTime: 0,
    peakUpgrades: { all: 0, colony: 0, combat: 0 },
    stats: { foodEarned: 0, eggsHatched: 0, playtime: 0, exiled: 0, proteinEarned: 0, raidsWonTotal: 0 },
    prestige: { royalJelly: 0, royalJellyTotal: 0, flightsTaken: 0, upgrades: [] },
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

export function setNextCaste(casteId) {
  if (!CASTES[casteId] || !CASTES[casteId].layable) return false;
  if (!isUnlocked(game, casteId)) return false;
  game.nextCaste = casteId;
  return true;
}

export function broodSpace() {
  return populationCap(game) - population(game) - game.eggs.length;
}

export function broodSlots() {
  const space = broodSpace();
  if (space > 0) return space;
  if (game.nextCaste !== "excavator") return 0;
  let digging = 0;
  for (const egg of game.eggs) if (egg.caste === "excavator") digging++;
  return Math.max(0, EXCAVATOR_OVERFLOW - digging);
}

export function canLay() {
  if (!game.wingsShed) return false;
  if (broodSlots() <= 0) return false;
  const cost = eggCost(game);
  return game[cost.resource] >= cost.amount;
}

export function layEgg() {
  if (!canLay()) return false;
  const cost = eggCost(game);
  game[cost.resource] -= cost.amount;
  const fed = game.settings.feedBrood !== false && game.protein >= EGG_PROTEIN_COST;
  if (fed) game.protein -= EGG_PROTEIN_COST;
  game.eggs.push({ caste: game.nextCaste, progress: 0, fed });
  return true;
}

export function layEggs(count) {
  let laid = 0;
  while (laid < count && layEgg()) laid++;
  return laid;
}

export function affordableEggs() {
  const slots = broodSlots();
  if (slots <= 0) return 0;
  const first = eggCost(game);
  if (first.resource === "reserves") {
    return Math.min(slots, Math.floor(game.reserves / first.amount));
  }
  const curve = CASTE_COSTS[game.nextCaste];
  let budget = game.food;
  let stock = casteStock(game, game.nextCaste);
  let count = 0;
  while (count < slots) {
    const price = curve.base * Math.pow(stock + 1, curve.exponent);
    if (price > budget) break;
    budget -= price;
    stock++;
    count++;
  }
  return count;
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
  return royalJellyEarned(game, population(game));
}

export function doFlight() {
  if (!flightReady()) return 0;
  const earned = flightReward();
  game.prestige.royalJelly += earned;
  game.prestige.royalJellyTotal += earned;
  game.prestige.flightsTaken += 1;

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

  game.peakPopulation = Math.max(game.peakPopulation, population(game));
  for (const id in game.ants) {
    if (game.ants[id] > (game.peakCastes[id] || 0)) game.peakCastes[id] = game.ants[id];
  }
  const strength = combatPower(game);
  if (strength > (game.peakStrength || 0)) game.peakStrength = strength;
  recordUpgradePeaks(game);

  if (raidsUnlocked(game)) {
    const hunted = huntRate(game) * dt;
    game.protein += hunted;
    game.stats.proteinEarned += hunted;
    game.raidTimer -= dt;
    while (game.raidTimer <= 0) {
      resolveRaidFor(game);
      game.raidTimer += RAID_INTERVAL;
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
  for (const id in game.ants) {
    if (game.ants[id] > (game.peakCastes[id] || 0)) game.peakCastes[id] = game.ants[id];
  }
  recountAchievements();

  const elapsed = Math.min(Math.max(0, (Date.now() - game.lastSave) / 1000), OFFLINE_CAP);
  const step = Math.max(1, elapsed / 600);
  for (let done = 0; done < elapsed; done += step) {
    tick(Math.min(step, elapsed - done));
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
