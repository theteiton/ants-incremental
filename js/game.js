import {
  CASTES,
  EGG_TIME,
  eggCost,
  emergingCaste,
  EXCAVATOR_OVERFLOW,
  BASE_POPULATION_CAP,
  bigForagerThreshold,
  broodCapacity,
  combatPower,
  DEATH_ORDER,
  EGG_PROTEIN_COST,
  FED_EGG_SPEED,
  LOSS_CAP,
  monsterPower,
  RAID_INTERVAL,
  RAID_WARNING,
  raidRewards,
  raidsUnlocked,
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
  upgradeOwned,
  upgradeUnlocked
} from "./ants.js";

export const SAVE_KEY = "ants_save_v5";
export const LEGACY_SAVE_KEYS = ["ants_save_v4", "ants_save_v3", "ants_save_v2", "ants_save_v1"];
export const SAVE_VERSION = 5;
export const QUEEN_RESERVES = 100;
export const OFFLINE_CAP = 8 * 3600;
export const POINTS_PER_LEVEL = 5;

export const ACHIEVEMENTS = [
  { id: "pop_1", name: "She Is Not Alone", desc: "Reach 1 ant.", points: 1, check: g => population(g) >= 1 },
  { id: "pop_5", name: "The Nanitic Five", desc: "Reach 5 ants.", points: 1, check: g => population(g) >= 5 },
  { id: "pop_10", name: "A Working Nest", desc: "Reach 10 ants.", points: 2, check: g => population(g) >= 10 },
  { id: "pop_25", name: "Diggers Wanted", desc: "Reach 25 ants.", points: 2, check: g => population(g) >= 25 },
  { id: "pop_50", name: "Half a Hundred", desc: "Reach 50 ants.", points: 3, check: g => population(g) >= 50 },
  { id: "pop_100", name: "Century of Ants", desc: "Reach 100 ants.", points: 3, check: g => population(g) >= 100 },
  { id: "pop_250", name: "Serious Colony", desc: "Reach 250 ants.", points: 4, check: g => population(g) >= 250 },
  { id: "pop_500", name: "Mound Builder", desc: "Reach 500 ants.", points: 5, check: g => population(g) >= 500 },
  { id: "pop_1000", name: "Thousand Strong", desc: "Reach 1,000 ants.", points: 6, check: g => population(g) >= 1000 },

  { id: "food_1", name: "First Crumbs", desc: "Gather 100 food in total.", points: 1, check: g => g.stats.foodEarned >= 100 },
  { id: "food_2", name: "Full Larder", desc: "Gather 10,000 food in total.", points: 2, check: g => g.stats.foodEarned >= 1e4 },
  { id: "food_3", name: "Granary", desc: "Gather 1,000,000 food in total.", points: 3, check: g => g.stats.foodEarned >= 1e6 },
  { id: "food_4", name: "Glut", desc: "Gather 100,000,000 food in total.", points: 4, check: g => g.stats.foodEarned >= 1e8 },
  { id: "food_5", name: "Bottomless Nest", desc: "Gather 10,000,000,000 food in total.", points: 5, check: g => g.stats.foodEarned >= 1e10 },

  { id: "egg_1", name: "Brood Tender", desc: "Hatch 10 eggs.", points: 2, check: g => g.stats.eggsHatched >= 10 },
  { id: "egg_2", name: "Endless Laying", desc: "Hatch 100 eggs.", points: 3, check: g => g.stats.eggsHatched >= 100 },
  { id: "egg_3", name: "Queen Unceasing", desc: "Hatch 1,000 eggs.", points: 4, check: g => g.stats.eggsHatched >= 1000 },

  { id: "forager_a", name: "Trail Blazers", desc: "Keep 50 foragers.", points: 2, check: g => g.ants.forager >= 50 },
  { id: "forager_b", name: "Harvest Army", desc: "Keep 250 foragers.", points: 4, check: g => g.ants.forager >= 250 },
  { id: "excavator_a", name: "Tunnel Crew", desc: "Keep 25 excavators.", points: 2, check: g => g.ants.excavator >= 25 },
  { id: "excavator_b", name: "Architects", desc: "Keep 100 excavators.", points: 4, check: g => g.ants.excavator >= 100 },
  { id: "nurse_a", name: "Nursery Shift", desc: "Keep 25 nurses.", points: 2, check: g => g.ants.nurse >= 25 },
  { id: "nurse_b", name: "Brood Guard", desc: "Keep 100 nurses.", points: 4, check: g => g.ants.nurse >= 100 },
  { id: "soldier_a", name: "Standing Army", desc: "Raise your first soldier.", points: 3, check: g => g.ants.soldier >= 1 },

  { id: "upg_1", name: "Adaptation", desc: "Buy 5 upgrades.", points: 2, check: g => g.upgrades.length >= 5 },
  { id: "upg_2", name: "Selective Pressure", desc: "Buy 10 upgrades.", points: 3, check: g => g.upgrades.length >= 10 },
  { id: "upg_3", name: "Perfected Colony", desc: "Buy all 20 upgrades.", points: 5, check: g => g.upgrades.length >= UPGRADES.length }
];

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
    naniticsDied: false,
    queenName: "",
    settings: { exileEnabled: true, hideLocked: false, hideOwned: false, theme: "dark" },
    seen: { upgrades: 0, achievements: 0 },
    stats: { foodEarned: 0, eggsHatched: 0, playtime: 0, exiled: 0 },
    lastSave: Date.now()
  };
}

export const game = blankGame();

export function shedWings() {
  if (game.wingsShed) return false;
  game.wingsShed = true;
  game.reserves = QUEEN_RESERVES;
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
  const fed = game.protein >= EGG_PROTEIN_COST;
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
  return btoa(unescape(encodeURIComponent(JSON.stringify(game))));
}

export function importSave(text) {
  let data;
  try {
    data = JSON.parse(decodeURIComponent(escape(atob(String(text).trim()))));
  } catch (err) {
    return false;
  }
  if (!data || typeof data !== "object" || !data.ants) return false;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (err) {
    return false;
  }
  load();
  return true;
}

export function hardReset() {
  try {
    localStorage.removeItem(SAVE_KEY);
    for (const key of LEGACY_SAVE_KEYS) localStorage.removeItem(key);
  } catch (err) {
    // a blocked localStorage still resets the in-memory colony below
  }
  Object.assign(game, blankGame());
  return true;
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
  return POINTS_PER_LEVEL * level;
}

export function checkAchievements() {
  let earned = 0;
  for (const achievement of ACHIEVEMENTS) {
    if (game.achievements.indexOf(achievement.id) >= 0) continue;
    if (!achievement.check(game)) continue;
    game.achievements.push(achievement.id);
    earned++;
  }
  if (earned === 0) return earned;
  recountAchievements();
  return earned;
}

function recountAchievements() {
  let points = 0;
  for (const achievement of ACHIEVEMENTS) {
    if (game.achievements.indexOf(achievement.id) >= 0) points += achievement.points;
  }
  game.achievementPoints = points;
  game.achievementLevel = Math.floor(points / POINTS_PER_LEVEL);
}

export function raidCountdown() {
  return Math.max(0, game.raidTimer);
}

export function raidImminent() {
  return raidsUnlocked(game) && game.raidTimer <= RAID_WARNING;
}

function killAnts(toll) {
  const dead = {};
  let remaining = toll;
  for (const caste of DEATH_ORDER) {
    if (remaining <= 0) break;
    const held = game.ants[caste];
    if (held <= 0) continue;
    const taken = Math.min(held, remaining);
    game.ants[caste] -= taken;
    if (caste === "bigforager") game.bigForagers.splice(0, taken);
    dead[caste] = taken;
    remaining -= taken;
  }
  return dead;
}

export function resolveRaid() {
  const power = monsterPower(game);
  const defence = combatPower(game);
  const won = defence >= power;
  const reward = raidRewards(game, power);

  if (won) {
    game.protein += reward.protein;
    game.food += reward.food;
    game.stats.foodEarned += reward.food;
    game.raidsWon++;
    game.lastRaid = { won: true, power, protein: reward.protein, food: reward.food, dead: {} };
    return game.lastRaid;
  }

  const shortfall = Math.min(1, (power - defence) / power);
  const toll = Math.max(1, Math.floor(population(game) * LOSS_CAP * shortfall));
  const dead = killAnts(toll);
  const salvage = Math.round(reward.protein * (defence / power));
  game.protein += salvage;
  game.raidsLost++;
  game.lastRaid = { won: false, power, protein: salvage, food: 0, dead };
  return game.lastRaid;
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

  if (!game.naniticsDied && game.stats.playtime >= NANITIC_LIFESPAN && game.ants.nanitic > 0) {
    game.ants.nanitic = 0;
    game.naniticsDied = true;
  }

  game.peakPopulation = Math.max(game.peakPopulation, population(game));

  if (raidsUnlocked(game)) {
    game.raidTimer -= dt;
    while (game.raidTimer <= 0) {
      resolveRaid();
      game.raidTimer += RAID_INTERVAL;
    }
  }

  if (!isUnlocked(game, game.nextCaste)) game.nextCaste = "forager";
  checkAchievements();
}

export function save() {
  game.lastSave = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
  } catch (err) {
    return false;
  }
  return true;
}

function migrate(data) {
  if (data.version === 1) {
    data.upgrades = [];
    data.achievements = [];
    data.achievementPoints = 0;
    data.achievementLevel = 0;
    data.stats = {
      foodEarned: typeof data.food === "number" ? data.food : 0,
      eggsHatched: typeof data.emerged === "number" ? data.emerged : 0,
      playtime: 0
    };
    data.version = 2;
  }
  if (data.version === 2) {
    data.peakPopulation = 0;
    data.naniticsDied = false;
    data.settings = { exileEnabled: true, hideLocked: false };
    if (data.stats) data.stats.exiled = 0;
    data.version = 3;
  }
  if (data.version === 3) {
    data.queenName = "";
    data.settings = Object.assign({ exileEnabled: true, hideLocked: false }, data.settings, {
      hideOwned: false,
      theme: "dark"
    });
    data.seen = { upgrades: 0, achievements: 0 };
    data.bigForagers = [];
    data.foragersSinceBig = 0;
    if (data.ants) data.ants.bigforager = 0;
    data.version = 4;
  }
  if (data.version === 4) {
    data.protein = 0;
    data.raidTimer = RAID_INTERVAL;
    data.raidsWon = 0;
    data.raidsLost = 0;
    data.lastRaid = null;
    data.version = 5;
  }
  return data;
}

function readSave() {
  const keys = [SAVE_KEY].concat(LEGACY_SAVE_KEYS);
  for (const key of keys) {
    let raw = null;
    try {
      raw = localStorage.getItem(key);
    } catch (err) {
      return null;
    }
    if (!raw) continue;
    try {
      return migrate(JSON.parse(raw));
    } catch (err) {
      return null;
    }
  }
  return null;
}

export function load() {
  const data = readSave();
  if (!data) return 0;

  const fresh = blankGame();
  Object.assign(game, fresh, data);
  game.ants = Object.assign(fresh.ants, data.ants);
  game.stats = Object.assign(fresh.stats, data.stats);
  game.settings = Object.assign(fresh.settings, data.settings);
  game.seen = Object.assign(fresh.seen, data.seen);
  game.bigForagers = Array.isArray(data.bigForagers) ? data.bigForagers : [];
  game.protein = data.protein || 0;
  game.raidTimer = typeof data.raidTimer === "number" ? data.raidTimer : RAID_INTERVAL;
  game.foragersSinceBig = data.foragersSinceBig || 0;
  game.peakPopulation = Math.max(data.peakPopulation || 0, population(game));
  game.eggs = Array.isArray(data.eggs) ? data.eggs : [];
  game.upgrades = Array.isArray(data.upgrades) ? data.upgrades : [];
  game.achievements = Array.isArray(data.achievements) ? data.achievements : [];
  game.version = SAVE_VERSION;
  recountAchievements();

  const elapsed = Math.min(Math.max(0, (Date.now() - game.lastSave) / 1000), OFFLINE_CAP);
  const step = Math.max(1, elapsed / 600);
  for (let done = 0; done < elapsed; done += step) {
    tick(Math.min(step, elapsed - done));
  }
  return elapsed;
}
