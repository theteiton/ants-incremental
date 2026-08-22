import {
  ACHIEVEMENT_FOOD_PER_LEVEL,
  ACHIEVEMENT_HATCH_PER_LEVEL,
  BASE_BROOD_SLOTS,
  bigForagerOutput,
  upgradeCurrency,
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
import { combatPerCaste, combatPerSoldier } from "./raids.js";
import {
  buyUpgrade,
  autoShedUnlocked,
  canExile,
  exile,
  exileUnlocked,
  game,
  markSeen,
  maxExilable,
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

// factors in a formula need their real value, not fmt()'s three significant
// figures — a 1.25 multiplier must never read as 1.3
export function fmtFactor(n) {
  if (!isFinite(n)) return "0";
  if (Math.abs(n) >= 1000) return fmt(n);
  if (n !== 0 && Math.abs(n) < 0.1) return String(Math.round(n * 1000) / 1000);
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
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

    row.append(art, body, count, exileCell);
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
    // the cell stays on every row so the sprites and counts line up; only the
    // button goes for castes that cannot be exiled at all
    ui.exileCell.hidden = !(exileUnlocked() && game.settings.exileEnabled);
    ui.exileButton.hidden = !CASTES[id].layable;
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
// ------------------------------------------------------------ settings tab
export function buildSettings(handlers) {
  el("setExile").onchange = event => {
    setSetting("exileEnabled", event.target.checked);
    handlers.refresh();
  };
  el("setAutoShed").onchange = event => {
    setSetting("autoShed", event.target.checked);
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
  el("setAutoShedRow").hidden = !autoShedUnlocked();
  el("setAutoShed").checked = game.settings.autoShed !== false;
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
  const best = game.best || {};
  el("statBestRun").textContent = fmt(best.population || 0);
  el("statBestJelly").textContent = fmt(best.jelly || 0) + " royal jelly";
  el("statBest1000").textContent = best.timeTo1000 ? fmtTime(best.timeTo1000) : "not yet";
  el("statRaids").textContent =
    fmt((game.stats.raidsWonTotal || 0)) + " won all time (" + game.raidsWon + " this colony)";
  const p = game.prestige || {};
  el("statFlights").textContent = fmt(p.flightsTaken || 0);
  el("statJelly").textContent = fmt(p.royalJellyTotal || 0);
}

