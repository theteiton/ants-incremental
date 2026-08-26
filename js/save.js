import { RAID_INTERVAL } from "./raids.js";

export const SAVE_KEY = "ants_save_v7";
export const LEGACY_SAVE_KEYS = ["ants_save_v6", "ants_save_v5", "ants_save_v4", "ants_save_v3", "ants_save_v2", "ants_save_v1"];
export const SAVE_VERSION = 7;
export const LOCK_KEY = "ants_lock";

// the tab the player most recently opened owns the save; older tabs go quiet
// rather than overwriting it when they close
const sessionId = String(Date.now()) + "." + Math.random().toString(36).slice(2);

export function claimSave() {
  try {
    localStorage.setItem(LOCK_KEY, sessionId);
  } catch (err) {
    return false;
  }
  return true;
}

export function holdsSave() {
  try {
    const owner = localStorage.getItem(LOCK_KEY);
    return owner === null || owner === sessionId;
  } catch (err) {
    return true;
  }
}

// which line each retired upgrade id became a level of
const LEGACY_UPGRADE_LINES = {
  nanitic_1: "nanitic_food", nanitic_2: "nanitic_food",
  nanitic_3: "nanitic_vigour", nanitic_4: "nanitic_vigour",
  forager_1: "forager", forager_2: "forager", forager_3: "forager",
  forager_4: "forager", forager_5: "forager", forager_6: "forager",
  excavator_1: "excavator", excavator_2: "excavator",
  excavator_3: "excavator", excavator_4: "excavator",
  nurse_1: "nurse", nurse_2: "nurse", nurse_3: "nurse", nurse_4: "nurse",
  colony_1: "colony", colony_2: "colony", colony_3: "colony",
  combat_1: "combat_forager", combat_2: "combat_excavator", combat_3: "combat_nurse",
  protein_1: "soldier_power", protein_3: "soldier_power",
  protein_2: "protein_yield", protein_4: "protein_yield",
  protein_5: "brood_slots"
};

export function migrate(data) {
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
  if (data.version === 5) {
    data.prestige = { royalJelly: 0, royalJellyTotal: 0, flightsTaken: 0, upgrades: [],
    };
    data.runTime = typeof data.stats === "object" && data.stats ? data.stats.playtime || 0 : 0;
    data.peakUpgrades = { all: 0, colony: 0, combat: 0 };
    if (data.stats) data.stats.raidsWonTotal = data.raidsWon || 0;
    // an existing colony keeps the gates it has already earned
    data.best = { population: data.peakPopulation || 0, jelly: 0, timeTo1000: 0 };
    data.run = {
      peakPopulation: data.peakPopulation || 0,
      peakCastes: Object.assign({}, data.peakCastes || {}),
      peakStrength: data.peakStrength || 0
    };
    data.version = 6;
  }
  if (data.version === 6) {
    // The 29 one-shot upgrades became 12 lines with levels. Every old id maps to
    // a rung of its line, so a colony keeps exactly what it bought: owning
    // forager_1 and forager_2 is Foraging at level 2. Ids are counted rather
    // than positioned, because a save can hold a later rung without an earlier
    // one only if the game once allowed it, and levels are cumulative anyway.
    const owned = Array.isArray(data.upgrades) ? data.upgrades : [];
    const levels = {};
    for (const id of owned) {
      const line = LEGACY_UPGRADE_LINES[id];
      if (line) levels[line] = (levels[line] || 0) + 1;
    }
    data.upgrades = levels;
    // peakUpgrades already counted one-shot upgrades, which is the same number
    // as levels held -- 29 of them either way -- so it carries over untouched.
    data.lossStreak = 0;
    data.version = 7;
  }
  return data;
}

export function readSave() {
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

export function writeSave(game) {
  if (!holdsSave()) return false;
  game.lastSave = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
  } catch (err) {
    return false;
  }
  return true;
}

export function clearSaves() {
  try {
    localStorage.removeItem(SAVE_KEY);
    for (const key of LEGACY_SAVE_KEYS) localStorage.removeItem(key);
  } catch (err) {
    // a blocked localStorage still lets the caller reset the colony in memory
  }
}

export function encodeSave(game) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(game))));
}

export function decodeSave(text) {
  try {
    const data = JSON.parse(decodeURIComponent(escape(atob(String(text).trim()))));
    if (!data || typeof data !== "object" || !data.ants) return null;
    return data;
  } catch (err) {
    return null;
  }
}

export function stashSave(data) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (err) {
    return false;
  }
  return true;
}

// merges a loaded save onto a blank colony, filling in anything the save predates
export function applySave(game, fresh, data) {
  Object.assign(game, fresh, data);
  game.ants = Object.assign(fresh.ants, data.ants);
  game.stats = Object.assign(fresh.stats, data.stats);
  game.settings = Object.assign(fresh.settings, data.settings);
  const seen = data.seen || {};
  game.seen = { upgrades: seen.upgrades || 0, tracks: seen.tracks || null };
  game.bigForagers = Array.isArray(data.bigForagers) ? data.bigForagers : [];
  game.eggs = Array.isArray(data.eggs) ? data.eggs : [];
  // an array here is a save that predates lines; migrate() has already turned
  // it into a level map, so anything still array-shaped is corrupt and drops
  game.upgrades = data.upgrades && !Array.isArray(data.upgrades)
    ? Object.assign({}, data.upgrades) : {};
  game.achievements = Array.isArray(data.achievements) ? data.achievements : [];
  game.protein = data.protein || 0;
  game.raidTimer = typeof data.raidTimer === "number" ? data.raidTimer : RAID_INTERVAL;
  game.foragersSinceBig = data.foragersSinceBig || 0;
  game.rallyTime = data.rallyTime || 0;
  game.rallyCooldown = data.rallyCooldown || 0;
  game.challenge = data.challenge || null;
  game.challenges = Object.assign({}, data.challenges || {});
  game.wings = data.wings || 0;
  game.wingStrip = data.wingStrip || 0;
  game.peakCastes = Object.assign({}, data.peakCastes || {});
  game.runTime = typeof data.runTime === "number" ? data.runTime : (data.stats && data.stats.playtime) || 0;
  game.peakUpgrades = Object.assign({ all: 0, colony: 0, combat: 0 }, data.peakUpgrades || {});
  game.best = Object.assign({ population: 0, jelly: 0, timeTo1000: 0 }, data.best || {});
  const savedRun = data.run;
  game.run = savedRun && typeof savedRun === "object"
    ? { peakPopulation: savedRun.peakPopulation || 0,
        peakCastes: Object.assign({}, savedRun.peakCastes || {}),
        peakStrength: savedRun.peakStrength || 0 }
    // a save written before the split earned its gates already; keep them
    : { peakPopulation: data.peakPopulation || 0,
        peakCastes: Object.assign({}, data.peakCastes || {}),
        peakStrength: data.peakStrength || 0 };
  const savedPrestige = data.prestige || {};
  game.prestige = {
    royalJelly: savedPrestige.royalJelly || 0,
    royalJellyTotal: savedPrestige.royalJellyTotal || 0,
    flightsTaken: savedPrestige.flightsTaken || 0,
    upgrades: Array.isArray(savedPrestige.upgrades) ? savedPrestige.upgrades : []
  };
  game.version = SAVE_VERSION;
  return game;
}
