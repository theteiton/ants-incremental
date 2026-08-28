import {
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
  layableCastes,
  naniticLifespan,
  slotsPerNanitic,
  slotsPerNurse,
  NANITIC_BROOD_SLOTS,
  population,
  populationCap,
  UPGRADES,
  upgradeOwned,
  upgradeUnlocked
} from "./ants.js";
import { combatPerCaste, combatPerSoldier } from "./raids.js";
import { rankOf } from "./ants.js";
import {
  buyUpgrade,
  automationOn,
  automationUnlocked,
  AUTOMATIONS,
  canExile,
  exile,
  exileUnlocked,
  game,
  markSeen,
  maxExilable,
  pendingByCaste,
  setQueenName,
  setSetting
} from "./game.js";
import { spriteFor } from "./sprites.js";

// Runs to 10^63. The ladder used to stop at Qi and fall back to exponential
// halfway through a long run, which reads as a different kind of number
// appearing out of nowhere. A player who prefers the exponential form can ask
// for it in Settings instead of being handed it unannounced.
const SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No",
  "Dc", "UDc", "DDc", "TDc", "QaDc", "QiDc", "SxDc", "SpDc", "OcDc", "NoDc", "Vg"];

// The inverse of fmt(): reads back the same suffixes it writes, so a player can
// type what the game showed them. Also takes plain digits, commas and
// scientific notation. Returns NaN on anything it cannot read, so the caller
// can leave a half-typed value alone rather than treating it as zero.
// the inverse of the list above, so a player can type back anything fmt() wrote
const SUFFIX_VALUE = {};
SUFFIXES.forEach((suffix, tier) => {
  if (suffix) SUFFIX_VALUE[suffix.toLowerCase()] = Math.pow(1000, tier);
});
// longest first, so "qidc" is not read as "qi" with "dc" left over
const SUFFIX_PATTERN = Object.keys(SUFFIX_VALUE)
  .sort((a, b) => b.length - a.length).join("|");

export function parseAmount(text) {
  const clean = String(text).trim().toLowerCase().replace(/[\s,]/g, "");
  if (!clean) return 0;
  const match = clean.match(new RegExp("^(\\d*\\.?\\d+(?:e[+-]?\\d+)?)(" + SUFFIX_PATTERN + ")?$"));
  if (!match) return NaN;
  const value = Number(match[1]);
  if (!isFinite(value)) return NaN;
  return value * (match[2] ? SUFFIX_VALUE[match[2]] : 1);
}

// The shortest suffixed form that reads back as exactly n. fmt() cannot be used
// for a field the player edits: it keeps three significant figures, so
// 9,999,999K comes back as 10.00B -- a different number -- and refusing the
// short form on that ground leaves a ten-digit string in a narrow box.
export function shortAmount(n) {
  if (!isFinite(n) || n < 1000) return String(n);
  for (let tier = SUFFIXES.length - 1; tier > 0; tier--) {
    const scaled = n / Math.pow(1000, tier);
    if (scaled < 1) continue;
    const text = String(scaled) + SUFFIXES[tier];
    if (parseAmount(text) === n) return text;
  }
  return String(n);
}

// A player can ask for the exponential form outright rather than meeting it
// only when the suffixes run out.
export function scientificNotation() {
  return game.settings && game.settings.notation === "scientific";
}

export function fmt(n) {
  if (!isFinite(n)) return "0";
  if (n < 0) return "-" + fmt(-n);
  if (n < 10) return (Math.round(n * 10) / 10).toString();
  if (scientificNotation() && n >= 1000) return n.toExponential(2);
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

// A note is plain text built by whoever owns the thing being inspected. Rather
// than teach every caller about markup, the renderer reads the ALL-CAPS section
// headers it already writes and tones the lines beneath them: what it costs you
// reads as a cost, what you get reads as a gain.
const NOTE_TONES = {
  "WHILE IT RUNS": "cost",
  "WHAT IT TAKES": "cost",
  "WHAT COMES WITH YOU": "keep",
  "TO CLEAR IT": "goal",
  "IF YOU CLEAR IT": "reward",
  "WHAT CLEARING PAYS": "reward",
  "NEXT": "goal"
};

function isHeading(line) {
  const bare = line.trim();
  return bare.length > 0 && bare === bare.toUpperCase() && /[A-Z]/.test(bare);
}

// pooled: the inspector redraws every frame, and rebuilding nodes under the
// cursor is what broke clicking on the upgrade cards
function paintNote(box, text) {
  const lines = String(text || "").split("\n").filter(line => line.trim() !== "");
  while (box.children.length > lines.length) box.removeChild(box.lastChild);
  while (box.children.length < lines.length) {
    const line = document.createElement("span");
    line.className = "note-line";
    box.appendChild(line);
  }
  let tone = "plain";
  lines.forEach((raw, i) => {
    const node = box.children[i];
    const head = isHeading(raw);
    if (head) tone = NOTE_TONES[raw.trim()] || "plain";
    node.textContent = raw;
    node.className = "note-line" + (head ? " note-head" : "") + " note-" + tone;
  });
}

export function setInspect(entry) {
  lastInspected = entry;
  renderInspector();
}

export function renderInspector() {
  const box = el("inspector");
  if (!box) return;
  const entry = lastInspected;
  if (!entry) {
    const blankHint = el("inspectHint");
    if (blankHint) blankHint.hidden = true;
    el("inspectTitle").textContent = "Point at anything";
    el("inspectBody").textContent =
      "Hover an ant, an upgrade or an achievement and what it does appears here.";
    el("inspectNote").textContent = "";
    return;
  }
  el("inspectTitle").textContent = entry.title || "";
  el("inspectBody").textContent = typeof entry.body === "function" ? entry.body() : entry.body || "";
  const note = typeof entry.note === "function" ? entry.note() : entry.note || "";
  lastNoteText = note;
  paintNote(el("inspectNote"), note);
  el("inspectNote").className = entry.warn ? "inspect-note warn" : "inspect-note";
  // tied to the inspector rather than the frame loop, so the hint appears the
  // instant something is pointed at
  const hint = el("inspectHint");
  if (hint) hint.hidden = false;
}

// The note as WRITTEN, not as rendered. paintNote splits it into one span per
// line, so reading the container back with textContent returns every line run
// together with nothing between them -- which is exactly how the full-size
// view lost all of its line breaks.
let lastNoteText = "";

export function currentNote() {
  return lastNoteText;
}

export { paintNote };

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
    // nanitics cannot be exiled -- they leave on their own, so the cell that
    // would hold their exile button counts down to it instead
    const lifespan = document.createElement("span");
    lifespan.className = "caste-lifespan";
    exileCell.appendChild(lifespan);

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
    count.innerHTML = '<b class="caste-held"></b><span class="caste-pending"></span>';

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
      lifespan,
      held: count.querySelector(".caste-held"),
      pending: count.querySelector(".caste-pending")
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
  if (id === "nanitic") {
    if (held <= 0) return "";
    const each = casteFoodPerSecond(game, id);
    return fmt(each * held) + "/s total (" + fmt(each) + " each, fading) · +" +
      fmt(held * slotsPerNanitic(game)) + " brood slots";
  }
  if (id === "nurse") {
    // only what the nurses themselves add -- the base, the upgrades, the
    // lineage and the founders all feed broodCapacity too, and reading the
    // total here credited nurses with the nanitics' slots
    return held > 0
      ? "+" + fmt(slotsPerNurse(game) * held) + " brood slots (" +
        broodCapacity(game) + " tended at once)" + armed
      : "";
  }
  if (rankOf(id)) {
    if (held <= 0) return "";
    const each = combatPerCaste(game, id);
    const rank = rankOf(id);
    return fmt(held * each) + " fighting strength (" + fmt(each) + " each)" +
      (rank.hunt > 0 ? " · hunts at " + fmt(rank.hunt * 100) + "%" : " · never hunts");
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
  const pending = pendingByCaste();
  Object.keys(CASTES).forEach(id => {
    const ui = casteRows[id];
    const held = game.ants[id];
    const coming = pending[id] || 0;
    ui.row.hidden = held === 0 && coming === 0 && (!CASTES[id].layable || !isUnlocked(game, id));
    ui.name.textContent = CASTES[id].name;
    ui.role.textContent = CASTES[id].role;
    ui.effect.textContent = casteEffectText(id);
    ui.held.textContent = fmt(held);
    ui.pending.textContent = coming > 0 ? "+" + fmt(coming) + " pending" : "";

    // the founders can outlive their own lifespan once Long Burning is held, and
    // fmtTime(Infinity) is not a thing anyone wants to read
    const span = id === "nanitic" && held > 0 ? naniticLifespan(game) : 0;
    const dying = isFinite(span) ? Math.max(0, span - (game.runTime || 0)) : Infinity;
    ui.lifespan.hidden = !(dying > 0);
    ui.lifespan.textContent = !isFinite(dying) ? "no longer ages"
      : dying > 0 ? fmtTime(dying) + " left" : "";

    const allowed = maxExilable(id);
    // the cell stays on every row so the sprites and counts line up; only the
    // button goes for castes that cannot be exiled at all, and the nanitics'
    // countdown keeps the cell whether exiling is on or not
    ui.exileCell.hidden = !(exileUnlocked() && game.settings.exileEnabled) && dying <= 0;
    ui.exileButton.hidden = !CASTES[id].layable ||
      !(exileUnlocked() && game.settings.exileEnabled);
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

  el("setTheme").onchange = event => {
    setSetting("theme", event.target.value);
    handlers.applyTheme();
  };
  el("setNotation").onchange = event => {
    setSetting("notation", event.target.value);
    handlers.refresh();
  };
  // The panel following the scroll is what makes hover-to-inspect work without
  // moving the mouse, but it also means a panel that never leaves the screen.
  // Asked for as a choice rather than a default either way.
  el("setStickyInspector").onchange = event => {
    setSetting("stickyInspector", event.target.checked);
    handlers.applyLayout();
  };
  el("setQueenName").oninput = event => {
    setQueenName(event.target.value);
    handlers.refresh();
  };
  buildAutomation(handlers);
  el("btnExport").onclick = handlers.exportSave;
  el("btnImport").onclick = handlers.importSave;
  el("btnReset").onclick = handlers.reset;
}

const automationRows = {};
const ratioRows = {};

function buildAutomation(handlers) {
  AUTOMATIONS.filter(entry => !entry.inBrood).forEach(entry => {
    const row = document.createElement("label");
    row.className = "toggle row-toggle";
    const box = document.createElement("input");
    box.type = "checkbox";
    box.onchange = event => {
      setSetting(entry.key, event.target.checked);
      handlers.refresh();
    };
    const text = document.createElement("span");
    row.append(box, text);
    watch(row, { title: entry.name, body: entry.note,
      note: () => automationOn(entry.key) ? "Running." : "Switched off — you are doing this by hand." });
    automationRows[entry.key] = { row, box, text };
    el("automationList").appendChild(row);
  });

  layableCastes().forEach(id => {
    const field = document.createElement("label");
    field.className = "ratio-field";
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.max = "100";
    input.oninput = () => {
      const ratios = Object.assign({}, game.settings.ratios);
      ratios[id] = Math.max(0, Math.min(100, Math.floor(Number(input.value) || 0)));
      setSetting("ratios", ratios);
      handlers.refresh();
    };
    const label = document.createElement("span");
    label.textContent = CASTES[id].name + " %";
    field.append(input, label);
    ratioRows[id] = { field, input };
    el("ratioList").appendChild(field);
  });
}

function renderAutomation() {
  let any = false;
  AUTOMATIONS.filter(entry => !entry.inBrood).forEach(entry => {
    const ui = automationRows[entry.key];
    const unlocked = automationUnlocked(game, entry.key);
    ui.row.hidden = !unlocked;
    if (unlocked) any = true;
    ui.box.checked = game.settings[entry.key] !== false;
    ui.text.textContent = entry.name + " — " + entry.note;
  });
  el("automationSection").hidden = !any;
  el("ratioRow").hidden = !automationUnlocked(game, "autoRatio");
  const ratios = game.settings.ratios || {};
  layableCastes().forEach(id => {
    const ui = ratioRows[id];
    if (document.activeElement !== ui.input) ui.input.value = String(ratios[id] || 0);
    ui.field.classList.toggle("locked", !isUnlocked(game, id));
  });
}

export function renderSettings() {
  renderAutomation();
  el("setExile").checked = !!game.settings.exileEnabled;
  el("setTheme").value = game.settings.theme || "dark";
  el("setNotation").value = game.settings.notation || "suffix";
  const sticky = game.settings.stickyInspector !== false;
  el("setStickyInspector").checked = sticky;
  el("stickyInspectorNote").textContent = sticky
    ? "It follows you down the page, so what you point at is always readable without scrolling. Press E to open it full size."
    : "It stays put in the column. Scrolling away from it means scrolling back to read it — press E to open it full size instead.";
  if (document.activeElement !== el("setQueenName")) el("setQueenName").value = game.queenName || "";
  el("exileStatus").textContent = exileUnlocked()
    ? "Unlocked — exile controls appear on the Ants tab."
    : "Locked until your first forager emerges.";
  el("statRunTime").textContent = fmtTime(game.runTime || 0);
  el("statPlaytime").textContent = fmtTime(game.stats.playtime);
  el("statHatched").textContent = fmt(game.stats.eggsHatched);
  el("statExiled").textContent = fmt(game.stats.exiled);
  el("statCancelled").textContent = fmt(game.stats.eggsCancelled || 0);
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

