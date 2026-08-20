import {
  ACHIEVEMENT_FOOD_PER_LEVEL,
  ACHIEVEMENT_HATCH_PER_LEVEL,
  BASE_BROOD_SLOTS,
  bigForagerOutput,
  peakCasteCount,
  upgradeBranch,
  upgradeCurrency,
  upgradeNeedsRaid,
  broodCapacity,
  CASTES,
  casteCount,
  casteFoodPerSecond,
  EGG_TIME,
  eggCost,
  foodPerSecond,
  incubationTime,
  isUnlocked,
  population,
  populationCap,
  UPGRADES,
  upgradeOwned,
  upgradeUnlocked
} from "./ants.js";
import { combatPerCaste, combatPerSoldier, combatPower, monsterPower, raidRewards } from "./raids.js";
import {
  ACHIEVEMENT_TRACKS,
  MAX_ACHIEVEMENT_LEVEL,
  totalTiers,
  trackNext,
  trackProgress,
  trackTier,
  buyUpgrade,
  canExile,
  exile,
  exileUnlocked,
  game,
  levelPoints,
  markSeen,
  maxExilable,
  POINTS_PER_LEVEL,
  setQueenName,
  setSetting
} from "./game.js";
import { spriteFor } from "./sprites.js";

const SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi"];

export function fmt(n) {
  if (!isFinite(n)) return "0";
  if (n < 0) return "-" + fmt(-n);
  if (n < 10) return (Math.round(n * 10) / 10).toString();
  if (n < 1000) return Math.floor(n).toString();
  let tier = Math.floor(Math.log10(n) / 3);
  let scaled = n / Math.pow(1000, tier);
  if (scaled >= 999.5) {
    tier++;
    scaled /= 1000;
  }
  if (tier >= SUFFIXES.length) return n.toExponential(2);
  const digits = scaled < 10 ? 2 : scaled < 100 ? 1 : 0;
  return scaled.toFixed(digits) + SUFFIXES[tier];
}

export function fmtTime(seconds) {
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours > 0) return hours + "h " + minutes + "m";
  if (minutes > 0) return minutes + "m " + (total % 60) + "s";
  return total + "s";
}

const el = id => document.getElementById(id);

let lastInspected = null;

export function setInspect(entry) {
  lastInspected = entry;
  renderInspector();
}

export function renderInspector() {
  const box = el("inspector");
  if (!box) return;
  const entry = lastInspected;
  if (!entry) {
    el("inspectTitle").textContent = "Point at anything";
    el("inspectBody").textContent =
      "Hover an ant, an upgrade or an achievement and what it does appears here.";
    el("inspectNote").textContent = "";
    return;
  }
  el("inspectTitle").textContent = entry.title || "";
  el("inspectBody").textContent = typeof entry.body === "function" ? entry.body() : entry.body || "";
  const note = typeof entry.note === "function" ? entry.note() : entry.note || "";
  el("inspectNote").textContent = note;
  el("inspectNote").className = entry.warn ? "inspect-note warn" : "inspect-note";
}

export function watch(element, entry) {
  element.addEventListener("mouseenter", () => setInspect(entry));
  element.addEventListener("focus", () => setInspect(entry));
}

export function upgradeLockText(game, upgrade) {
  const parts = [];
  if (upgradeNeedsRaid(game, upgrade)) parts.push("survive your first raid");
  const req = upgrade.req;
  const have = peakCasteCount(game, req.caste);
  if (req.count > 0 && have < req.count) {
    const label = req.caste === "population" ? "ants" : CASTES[req.caste].name.toLowerCase() + "s";
    parts.push("needs " + fmt(req.count) + " " + label + " (you have " + fmt(have) + ")");
  }
  return parts.length ? "Locked: " + parts.join(", and ") : "";
}

// ---------------------------------------------------------------- ants tab
const casteRows = {};
let onColonyChange = () => {};

export function buildAnts(onChange) {
  onColonyChange = onChange || onColonyChange;
  const list = el("casteList");
  Object.keys(CASTES).forEach(id => {
    const row = document.createElement("li");
    row.className = "caste-row";

    const exileCell = document.createElement("div");
    exileCell.className = "exile-cell";
    const exileButton = document.createElement("button");
    exileButton.className = "exile-button";
    exileButton.textContent = "Exile";
    exileButton.title = "Send ants of this caste away permanently";
    exileButton.onclick = () => openExileDialog(id);
    exileCell.appendChild(exileButton);

    const art = document.createElement("div");
    art.className = "caste-art";
    art.appendChild(spriteFor(id, 3));

    const body = document.createElement("div");
    body.className = "caste-body";
    body.innerHTML =
      '<span class="caste-name"></span>' +
      '<span class="caste-role"></span>' +
      '<span class="caste-effect"></span>';

    const count = document.createElement("div");
    count.className = "caste-count";

    row.append(exileCell, art, body, count);
    list.appendChild(row);

    watch(row, {
      title: CASTES[id].name,
      body: CASTES[id].role,
      note: () => casteEffectText(id) || "None in the colony yet."
    });
    casteRows[id] = {
      row,
      exileCell,
      exileButton,
      name: body.querySelector(".caste-name"),
      role: body.querySelector(".caste-role"),
      effect: body.querySelector(".caste-effect"),
      count
    };
  });
}

function casteEffectText(id) {
  const held = game.ants[id];
  const fight = combatPerCaste(game, id);
  const armed = held > 0 && fight > 0 ? " · " + fmt(held * fight) + " fighting strength" : "";
  if (id === "excavator") {
    const per = held > 0 ? (populationCap(game) - 30) / held : 0;
    return held > 0 ? "+" + fmt(per * held) + " cap (" + fmt(per) + " each)" + armed : "";
  }
  if (id === "nurse") {
    return held > 0
      ? "+" + fmt(broodCapacity(game) - BASE_BROOD_SLOTS) + " brood slots (" +
        broodCapacity(game) + " tended at once)" + armed
      : "";
  }
  if (id === "soldier") {
    return held > 0
      ? fmt(held * combatPerSoldier(game)) + " fighting strength (" + fmt(combatPerSoldier(game)) + " each)"
      : "";
  }
  if (id === "bigforager") {
    return held > 0
      ? fmt(bigForagerOutput(game)) + "/s total (" + fmt(bigForagerOutput(game) / held) + " each, rising with age)"
      : "";
  }
  const each = casteFoodPerSecond(game, id);
  return held > 0 ? fmt(each * held) + "/s total (" + fmt(each) + " each)" + armed : "";
}

export function renderAnts() {
  Object.keys(CASTES).forEach(id => {
    const ui = casteRows[id];
    const held = game.ants[id];
    ui.row.hidden = held === 0 && (!CASTES[id].layable || !isUnlocked(game, id));
    ui.name.textContent = CASTES[id].name;
    ui.role.textContent = CASTES[id].role;
    ui.effect.textContent = casteEffectText(id);
    ui.count.textContent = fmt(held);

    const allowed = maxExilable(id);
    const show = exileUnlocked() && game.settings.exileEnabled && CASTES[id].layable;
    ui.exileCell.hidden = !show;
    ui.exileButton.disabled = allowed <= 0;
    ui.exileButton.title = allowed > 0
      ? "Exile up to " + fmt(allowed) + " " + CASTES[id].name
      : "None can be exiled without stranding the colony above its cap";
  });
}

// ------------------------------------------------------------ exile dialog
let exileCaste = null;

export function buildExileDialog() {
  el("exileCancel").onclick = closeExileDialog;
  el("exileConfirm").onclick = () => {
    const amount = Number(el("exileAmount").value);
    if (exileCaste && amount > 0) {
      exile(exileCaste, amount);
      onColonyChange();
    }
    closeExileDialog();
  };
  el("exileAmount").oninput = updateExileDialog;
  [1, 10, 100].forEach(n => {
    const button = document.createElement("button");
    button.className = "chip";
    button.textContent = "+" + n;
    button.onclick = () => {
      el("exileAmount").value = String(Math.min(maxExilable(exileCaste), Number(el("exileAmount").value) + n));
      updateExileDialog();
    };
    el("exileQuick").appendChild(button);
  });
  const maxButton = document.createElement("button");
  maxButton.className = "chip";
  maxButton.textContent = "Max";
  maxButton.onclick = () => {
    el("exileAmount").value = String(maxExilable(exileCaste));
    updateExileDialog();
  };
  el("exileQuick").appendChild(maxButton);
}

function openExileDialog(casteId) {
  if (!canExile(casteId)) return;
  exileCaste = casteId;
  el("exileAmount").value = "1";
  el("exileAmount").max = String(maxExilable(casteId));
  updateExileDialog();
  el("exileModal").hidden = false;
}

function closeExileDialog() {
  exileCaste = null;
  el("exileModal").hidden = true;
}

function updateExileDialog() {
  if (!exileCaste) return;
  const allowed = maxExilable(exileCaste);
  const input = el("exileAmount");
  let amount = Math.floor(Number(input.value) || 0);
  amount = Math.max(0, Math.min(allowed, amount));
  input.value = String(amount);

  el("exileTitle").textContent = "Exile " + CASTES[exileCaste].name;
  const capNow = populationCap(game);
  const capAfter = exileCaste === "excavator" && game.ants.excavator > 0
    ? capNow - amount * ((capNow - 30) / game.ants.excavator)
    : capNow;
  el("exileDetail").textContent =
    "Send " + fmt(amount) + " of " + fmt(game.ants[exileCaste]) + " away. They leave for good and refund nothing." +
    (capAfter !== capNow ? " Population cap " + fmt(capNow) + " to " + fmt(capAfter) + "." : "") +
    " The next " + CASTES[exileCaste].name.toLowerCase() + " egg gets cheaper.";
  el("exileConfirm").disabled = amount <= 0;
}

// ------------------------------------------------------------ upgrades tab
const upgradeCards = {};

function previewUpgrade(upgrade) {
  const probe = Object.assign({}, game, { upgrades: game.upgrades.concat([upgrade.id]) });
  const type = upgrade.effect.type;
  if (type === "excavatorCap") {
    return "Cap " + fmt(populationCap(game)) + " to " + fmt(populationCap(probe));
  }
  if (type === "soldierPower" || type === "combatForager" ||
      type === "combatExcavator" || type === "combatNurse") {
    return "Fighting strength " + fmt(combatPower(game)) + " to " + fmt(combatPower(probe));
  }
  if (type === "proteinYield") {
    const power = monsterPower(game);
    return "Raid protein " + fmt(raidRewards(game, power).protein) +
      " to " + fmt(raidRewards(probe, power).protein);
  }
  if (type === "broodSlots" || type === "nurseSlots") {
    if (type === "nurseSlots" && game.ants.nurse === 0) return "Needs nurses to matter";
    return "Brood " + broodCapacity(game) + " to " + broodCapacity(probe) + " eggs at once";
  }
  if (upgrade.effect.type === "casteFood") {
    const caste = upgrade.effect.caste;
    if (game.ants[caste] === 0) {
      return "Does nothing while you have no " + CASTES[caste].name.toLowerCase() + "s.";
    }
  }
  const before = foodPerSecond(game);
  const after = foodPerSecond(probe);
  if (before <= 0) return "No effect until you have that caste";
  const gain = ((after / before - 1) * 100).toFixed(0);
  return fmt(before) + "/s to " + fmt(after) + "/s (+" + gain + "% overall)";
}

const BRANCHES = [
  { id: "all", name: "All" },
  { id: "colony", name: "Colony" },
  { id: "combat", name: "Combat" }
];

export function buildUpgrades(onChange) {
  const filters = el("upgradeFilters");
  BRANCHES.forEach(branch => {
    const button = document.createElement("button");
    button.textContent = branch.name;
    button.dataset.branch = branch.id;
    button.onclick = () => {
      setSetting("upgradeFilter", branch.id);
      renderUpgrades();
    };
    filters.appendChild(button);
  });
  const list = el("upgradeList");
  UPGRADES.forEach(upgrade => {
    const card = document.createElement("button");
    card.className = "upgrade";
    card.innerHTML =
      '<span class="upgrade-head"><b></b><span class="upgrade-cost"></span></span>' +
      '<span class="upgrade-desc"></span>' +
      '<span class="upgrade-effect"></span>' +
      '<span class="upgrade-lock"></span>';
    card.querySelector("b").textContent = upgrade.name;
    card.querySelector(".upgrade-desc").textContent = upgrade.desc;
    card.onclick = () => {
      if (buyUpgrade(upgrade.id)) (onChange || onColonyChange)();
    };
    watch(card, {
      title: upgrade.name,
      body: upgrade.desc,
      note: () => {
        if (upgradeOwned(game, upgrade)) return "Already bought.";
        const locked = upgradeLockText(game, upgrade);
        if (locked) return locked;
        return "Costs " + fmt(upgrade.cost) + " " + upgradeCurrency(upgrade) + ". " + previewUpgrade(upgrade);
      },
      warn: false
    });
    upgradeCards[upgrade.id] = {
      card,
      cost: card.querySelector(".upgrade-cost"),
      effect: card.querySelector(".upgrade-effect"),
      lock: card.querySelector(".upgrade-lock")
    };
    list.appendChild(card);
  });
  el("hideLocked").onchange = event => {
    setSetting("hideLocked", event.target.checked);
    renderUpgrades();
  };
  el("hideOwned").onchange = event => {
    setSetting("hideOwned", event.target.checked);
    renderUpgrades();
  };
}

export function renderUpgrades() {
  let owned = 0;
  let locked = 0;
  UPGRADES.forEach(upgrade => {
    const ui = upgradeCards[upgrade.id];
    const isOwned = upgradeOwned(game, upgrade);
    const isOpen = upgradeUnlocked(game, upgrade);
    if (isOwned) owned++;
    if (!isOpen) locked++;

    const branch = upgradeBranch(upgrade);
    const filter = game.settings.upgradeFilter || "all";
    ui.card.classList.toggle("combat", branch === "combat");
    ui.card.classList.toggle("colony", branch === "colony");
    ui.card.hidden = (!isOpen && game.settings.hideLocked) ||
      (isOwned && game.settings.hideOwned) ||
      (filter !== "all" && branch !== filter);
    ui.card.classList.toggle("owned", isOwned);
    ui.card.classList.toggle("locked", !isOpen);
    const currency = upgradeCurrency(upgrade);
    ui.card.disabled = isOwned || !isOpen || game[currency] < upgrade.cost;
    ui.cost.textContent = isOwned ? "owned" : fmt(upgrade.cost) + " " + currency;
    ui.cost.classList.toggle("affordable", !isOwned && isOpen && game[currency] >= upgrade.cost);
    ui.cost.classList.toggle("owned-tag", isOwned);

    ui.lock.textContent = isOwned ? "" : upgradeLockText(game, upgrade);
    ui.effect.textContent = isOwned || !isOpen ? "" : previewUpgrade(upgrade);
  });
  el("upgradeTally").textContent = owned + " / " + UPGRADES.length + " bought";
  el("upgradeLocked").textContent = locked > 0 ? locked + " still locked" : "all unlocked";
  el("hideLocked").checked = !!game.settings.hideLocked;
  el("hideOwned").checked = !!game.settings.hideOwned;
  const filter = game.settings.upgradeFilter || "all";
  for (const button of el("upgradeFilters").children) {
    button.classList.toggle("active", button.dataset.branch === filter);
  }
  markSeen("upgrades", affordableUpgrades());
}

export function affordableUpgrades() {
  let ready = 0;
  for (const upgrade of UPGRADES) {
    if (upgradeOwned(game, upgrade) || !upgradeUnlocked(game, upgrade)) continue;
    if (game[upgradeCurrency(upgrade)] >= upgrade.cost) ready++;
  }
  return ready;
}

export function upgradeBadge() {
  return Math.max(0, affordableUpgrades() - (game.seen.upgrades || 0));
}

export function achievementBadge() {
  return Math.max(0, totalTiers(game) - (game.seen.achievements || 0));
}

// -------------------------------------------------------- achievements tab
const trackRows = {};

export function buildAchievements() {
  const list = el("achievementList");
  ACHIEVEMENT_TRACKS.forEach(track => {
    const row = document.createElement("li");
    row.className = "track";
    row.innerHTML =
      '<span class="track-head"><b></b><span class="track-tier"></span></span>' +
      '<span class="bar"><i></i></span>' +
      '<span class="track-next"></span>';
    row.querySelector("b").textContent = track.name;
    watch(row, {
      title: track.name,
      body: track.desc,
      note: () => {
        const next = trackNext(game, track);
        const tier = trackTier(game, track);
        if (next === null) return "Every tier earned — " + tier + " points from this one.";
        return "Tier " + (tier + 1) + " at " + fmt(next) + " " + track.unit +
          " — you have " + fmt(track.value(game)) + ".";
      }
    });
    trackRows[track.id] = {
      row,
      tier: row.querySelector(".track-tier"),
      bar: row.querySelector(".bar i"),
      next: row.querySelector(".track-next")
    };
    list.appendChild(row);
  });
}

export function renderAchievements() {
  ACHIEVEMENT_TRACKS.forEach(track => {
    const ui = trackRows[track.id];
    const tier = trackTier(game, track);
    const next = trackNext(game, track);
    ui.row.classList.toggle("maxed", next === null);
    ui.tier.textContent = "tier " + tier + " / " + track.thresholds.length;
    ui.bar.style.width = (trackProgress(game, track) * 100).toFixed(1) + "%";
    ui.next.textContent = next === null
      ? "Every tier earned."
      : "Next at " + fmt(next) + " " + track.unit + " (you have " + fmt(track.value(game)) + ")";
  });

  const points = totalTiers(game);
  const level = Math.min(MAX_ACHIEVEMENT_LEVEL, Math.floor(points / POINTS_PER_LEVEL));
  const capped = level >= MAX_ACHIEVEMENT_LEVEL;
  el("achievementLevel").textContent = "Level " + level + (capped ? " (max)" : "");
  el("achievementPoints").textContent = capped
    ? points + " tiers earned across " + ACHIEVEMENT_TRACKS.length + " tracks"
    : points + " tiers earned — " + Math.max(0, levelPoints(level + 1) - points) + " to the next level";
  el("achievementBonus").textContent =
    "+" + Math.round(ACHIEVEMENT_FOOD_PER_LEVEL * level * 100) + "% food, +" +
    Math.round(ACHIEVEMENT_HATCH_PER_LEVEL * level * 100) + "% hatch speed";
  const progress = capped ? 1 : (points - levelPoints(level)) / POINTS_PER_LEVEL;
  el("achievementBar").style.width = Math.min(100, progress * 100).toFixed(1) + "%";
  markSeen("achievements", points);
}

// ------------------------------------------------------------ settings tab
export function buildSettings(handlers) {
  el("setExile").onchange = event => {
    setSetting("exileEnabled", event.target.checked);
    handlers.refresh();
  };
  el("setTheme").onchange = event => {
    setSetting("theme", event.target.value);
    handlers.applyTheme();
  };
  el("setQueenName").oninput = event => {
    setQueenName(event.target.value);
    handlers.refresh();
  };
  el("btnExport").onclick = handlers.exportSave;
  el("btnImport").onclick = handlers.importSave;
  el("btnReset").onclick = handlers.reset;
}

export function renderSettings() {
  el("setExile").checked = !!game.settings.exileEnabled;
  el("setTheme").value = game.settings.theme || "dark";
  if (document.activeElement !== el("setQueenName")) el("setQueenName").value = game.queenName || "";
  el("exileStatus").textContent = exileUnlocked()
    ? "Unlocked — exile controls appear on the Ants tab."
    : "Locked until your first forager emerges.";
  el("statPlaytime").textContent = fmtTime(game.stats.playtime);
  el("statHatched").textContent = fmt(game.stats.eggsHatched);
  el("statExiled").textContent = fmt(game.stats.exiled);
  el("statFood").textContent = fmt(game.stats.foodEarned);
  el("statPeak").textContent = fmt(Math.max(game.peakPopulation, population(game)));
  el("statRaids").textContent = game.raidsWon + " won / " + game.raidsLost + " lost";
}
