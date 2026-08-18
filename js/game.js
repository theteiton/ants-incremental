import {
  CASTES,
  EGG_TIME,
  eggCost,
  emergingCaste,
  foodPerSecond,
  hatchRate,
  isUnlocked,
  population,
  populationCap
} from "./ants.js";

export const SAVE_KEY = "ants_save_v1";
export const SAVE_VERSION = 1;
export const QUEEN_RESERVES = 100;
export const OFFLINE_CAP = 8 * 3600;

function blankGame() {
  return {
    version: SAVE_VERSION,
    wingsShed: false,
    reserves: 0,
    food: 0,
    eggs: [],
    ants: { nanitic: 0, forager: 0, excavator: 0, nurse: 0, soldier: 0 },
    emerged: 0,
    nextCaste: "forager",
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

export function canLay() {
  if (!game.wingsShed) return false;
  if (broodSpace() <= 0) return false;
  const cost = eggCost(game);
  return game[cost.resource] >= cost.amount;
}

export function layEgg() {
  if (!canLay()) return false;
  const cost = eggCost(game);
  game[cost.resource] -= cost.amount;
  game.eggs.push({ caste: game.nextCaste, progress: 0 });
  return true;
}

export function tick(dt) {
  if (!isFinite(dt) || dt <= 0) return;
  game.food += foodPerSecond(game) * dt;
  const rate = hatchRate(game);
  for (let i = game.eggs.length - 1; i >= 0; i--) {
    const egg = game.eggs[i];
    egg.progress += rate * dt;
    if (egg.progress >= EGG_TIME) {
      game.ants[emergingCaste(game, egg)]++;
      game.emerged++;
      game.eggs.splice(i, 1);
    }
  }
  if (!isUnlocked(game, game.nextCaste)) game.nextCaste = "forager";
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
  if (data.version === SAVE_VERSION) return data;
  data.version = SAVE_VERSION;
  return data;
}

export function load() {
  let raw = null;
  try {
    raw = localStorage.getItem(SAVE_KEY);
  } catch (err) {
    raw = null;
  }
  if (!raw) return 0;

  let data;
  try {
    data = migrate(JSON.parse(raw));
  } catch (err) {
    return 0;
  }

  const fresh = blankGame();
  Object.assign(game, fresh, data);
  game.ants = Object.assign(fresh.ants, data.ants);
  game.eggs = Array.isArray(data.eggs) ? data.eggs : [];

  const elapsed = Math.min(Math.max(0, (Date.now() - game.lastSave) / 1000), OFFLINE_CAP);
  const step = Math.max(1, elapsed / 600);
  for (let done = 0; done < elapsed; done += step) {
    tick(Math.min(step, elapsed - done));
  }
  return elapsed;
}
