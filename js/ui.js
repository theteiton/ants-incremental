import {
  broodCapacity,
  CASTES,
  EGG_TIME,
  emergingCaste,
  SOLDIER_RANKS,
  RANK_IDS,
  rankOf,
  soldierCount,
  linesWithMastery,
  incubationTime,
  naniticLifespan,
  nextEggCaste,
  NANITIC_GENERATION,
  eggCost,
  foodPerSecond,
  isUnlocked,
  layableCastes,
  population,
  populationCap,
  rallyActive,
  RALLY_COOLDOWN,
  RALLY_DURATION,
  RALLY_MULT,
  runPeakCount,
  wingYield,
  WING_FOOD,
  WING_STRIP_TIME
} from "./ants.js";
import { combatPerCaste, combatPower, hunting, huntRate, inHiding, HIDING_LOSS_STREAK,
  monsterPower, proteinPerSecond, raidsSeen, raidsUnlocked, RAID_WARNING,
  combatPerRank, huntingSoldiers, VETERAN_SHARE, WIN_LOSS_SHARE,
  currentMonster, monsterById, RAID_DIFFICULTIES, raidDifficulty,
  raidDifficultyUnlocked } from "./raids.js";
import {
  affordableEggs,
  affordableProtein,
  autoCaste,
  trainSoldiers,
  trainCost,
  trainLossChance,
  trainableCount,
  buyProtein,
  sellProtein,
  exchangeReady,
  proteinSaleValue,
  proteinPurchaseCost,
  foodPerProtein,
  EXCHANGE_RETURN,
  foodReserve,
  automationOn,
  automationUnlocked,
  broodSlots,
  destroyEggRange,
  promoteEggRange,
  broodSpace,
  colonyBottleneck,
  tutorialStep,
  dismissTutorial,
  doAssistantStep,
  markAwaySeen,
  GENERIC,
  SPECIES,
  SPECIES_TARGET,
  MATRILINE_UPGRADES,
  currentSpecies,
  speciesName,
  speciesFinished,
  speciesPoints,
  speciesTrialLevels,
  speciesFlights,
  speciesBranch,
  speciesBranchOwned,
  matrilineUpgradeOwned,
  buyMatrilineUpgrade,
  buyInstinct,
  affordableInstincts,
  doMatrilineReset,
  matrilineReady,
  matrilineVisible,
  matrilineCount,
  matrilineJellyNeeded,
  matrilineFlights,
  matrilineTrialLevels,
  haplotype,
  haplotypeEarned,
  jellyBanked,
  lineageComplete,
  buyPrestigeUpgrade,
  canLay,
  doFlight,
  eggSecondsLeft,
  exportSave,
  game,
  hardReset,
  importSave,
  claimSave,
  lastAway,
  feedableEggs,
  holdsSave,
  layEggs,
  load,
  PRESTIGE_UNLOCK,
  flightGate,
  PRESTIGE_UPGRADES,
  prestigeUpgradeOwned,
  proteinUnlocked,
  flightReady,
  jellyPerHour,
  flightReward,
  setSetting,
  markSeen,
  OFFLINE_CAP,
  queenTitle,
  QUEEN_RESERVES,
  abandonChallenge,
  CHALLENGES,
  CHALLENGE_MAX_LEVEL,
  CHALLENGE_REWARD_STEP,
  bestTrialLevel,
  masteryFood,
  masterySoldier,
  CHALLENGE_TARGET,
  BARREN_SCALE,
  SEALED_SCALE,
  STERILE_ALLOWANCE,
  CALLOW_CROWDING,
  CALLOW_SCALE,
  callowCrowding,
  challengeTarget,
  challengeTargetAmount,
  targetKind,
  challengeCount,
  challengeFailed,
  challengeFailKind,
  siegeThreatScale,
  siegeThreatScaleAt,
  SIEGE_UNLOCK,
  SIEGE_INTERVAL,
  SIEGE_LOSS_CAP,
  TRIAL_GIVES_UP,
  TRIAL_KEEPS,
  activeChallenge,
  challengeDebuff,
  challengeDebuffAt,
  challengeLevel,
  challengeLevelsTotal,
  challengeMastered,
  challengeMet,
  challengeReward,
  challengesUnlocked,
  completeChallenge,
  enterChallenge,
  raidCountdown,
  rallyReady,
  save,
  setNextCaste,
  shedWings,
  startRally,
  stripReady,
  stripWing,
  tick
} from "./game.js";
import {
  buildAnts,
  buildExileDialog,
  buildSettings,
  fmt,
  fmtTime,
  parseAmount,
  paintNote,
  currentNote,
  shortAmount,
  renderAnts,
  renderInspector,
  renderSettings,
  setInspect,
  setText,
  setClass,
  setWidth,
  watch
} from "./panels.js";
import {
  affordableUpgrades,
  buildUpgrades,
  formulaSummary,
  renderUpgrades,
  upgradeBadge
} from "./upgrades.js";
import {
  buildAchievements,
  newTrackCount,
  renderAchievements,
  renderInstincts,
  setInstinctBuyer,
  seedSeenTracks
} from "./achievements.js";
import { drawSprite, spriteFor } from "./sprites.js";
import { LIBRARY, LIBRARY_GROUPS, entryState, libraryCounts, libraryUnlocked,
  libraryUnread, UPDATES, latestVersion, updatesUnread } from "./library.js";

const el = id => document.getElementById(id);
const TABS = ["ants", "upgrades", "combat", "achievements", "prestige", "matriline", "challenges", "library", "settings"];
let activeTab = "ants";
const casteButtons = {};


function selectTab(name) {
  activeTab = name;
  TABS.forEach(tab => {
    el("tab-" + tab).hidden = tab !== name;
    el("tabButton-" + tab).classList.toggle("active", tab === name);
  });
  render();
}

function buildTabs() {
  TABS.forEach(tab => {
    el("tabButton-" + tab).onclick = () => selectTab(tab);
  });
}

function buildCasteChoice() {
  const box = el("casteChoice");
  layableCastes().forEach(id => {
    const button = document.createElement("button");
    button.className = "caste-choice";
    button.onclick = () => {
      setNextCaste(id);
      render();
    };
    casteButtons[id] = button;
    box.appendChild(button);
  });
}

function layAmount() {
  return Math.max(1, Math.floor(game.settings.layAmount || 10));
}

function pendingCaste() {
  return nextEggCaste(game);
}

function applyTheme() {
  document.documentElement.setAttribute("data-theme", game.settings.theme || "dark");
}

// Whether the inspector follows the scroll. Same pattern as the theme: one
// attribute on the root, and the CSS decides what it means.
function applyLayout() {
  document.documentElement.setAttribute("data-inspector",
    game.settings.stickyInspector === false ? "static" : "sticky");
}

function renderQueen() {
  if (!game.wingsShed) {
    el("queenTitle").textContent = queenTitle();
    el("queenText").textContent =
      "She has landed and will never fly again. Shedding her wings frees " +
      QUEEN_RESERVES + " units of body reserves — all she will ever have.";
    el("btnShed").hidden = false;
    return;
  }
  el("btnShed").hidden = true;
  el("queenTitle").textContent = queenTitle();
  if (game.emerged === 0) {
    el("queenText").textContent =
      "Her wing muscles are being metabolised into eggs. The first " + NANITIC_GENERATION +
      " workers will emerge as undersized nanitics whatever caste is chosen — nothing else will feed this brood.";
  } else if (game.ants.nanitic > 0) {
    const span = naniticLifespan(game);
    const left = Math.max(0, span - (game.runTime || 0));
    el("queenText").textContent =
      "The first workers have emerged. Her reserves no longer matter; the colony feeds her now. " +
      (isFinite(span)
        // Long Burning: cleared once, the founders never age out again
        ? "The founding nanitics die of old age in " + fmtTime(left) + "."
        : "The founding nanitics will not die of old age — this line has burned before.");
  } else if (game.naniticsDied) {
    el("queenText").textContent =
      "The founding nanitics have died of old age. The colony they raised carries on without them.";
  } else {
    el("queenText").textContent =
      "The first workers have emerged. Her reserves no longer matter; the colony feeds her now.";
  }
}

// The gates are the shape of the early game, and the flight was the only one
// that never announced itself: its whole explanation lived inside a tab that
// stayed hidden until you had already met it.
const MILESTONES = [
  { at: CASTES.excavator.unlockAt,
    text: "Excavators, who dig new chambers and raise the population cap." },
  { at: CASTES.nurse.unlockAt,
    text: "Nurses, who tend the brood so more eggs develop at once." },
  { at: CASTES.soldier.unlockAt,
    text: "Soldiers — and the first monster at the gate." },
  { at: PRESTIGE_UNLOCK,
    text: "the Nuptial Flight: she takes wing, and the colony begins again on Royal Jelly." }
];

// The four wings are the only thing to do before the first nanitics emerge, and
// nothing is buyable in that window -- the nanitic upgrades gate on nanitic
// count -- so the food banks and pays out the moment they hatch.
function renderWings() {
  const row = el("wingRow");
  const left = game.wings || 0;
  const stripping = (game.wingStrip || 0) > 0;
  row.hidden = !game.wingsShed || (left <= 0 && !stripping);
  if (row.hidden) return;
  el("btnStripWing").disabled = !stripReady();
  el("btnStripWing").textContent = left > 0 ? "Strip a wing" : "Stripping";
  const bar = el("wingBar");
  bar.hidden = !stripping;
  if (stripping) {
    bar.querySelector("i").style.width =
      (100 - (game.wingStrip / WING_STRIP_TIME) * 100).toFixed(1) + "%";
  }
  el("wingState").textContent = stripping
    ? fmt(wingYield(game)) + " food/s, " + Math.ceil(game.wingStrip) + "s left" +
      (left > 0 ? " · " + left + " still folded" : " · the last one")
    : left + (left === 1 ? " wing left" : " wings left") + " — " +
      fmt(WING_FOOD) + " food each, over " + WING_STRIP_TIME + "s.";
}

// What the colony is growing towards, all the way up rather than stopping at
// the flight. It used to end at 1,000 ants and say deeper milestones were being
// built for the beta, which stopped being true two layers ago.
function milestoneText() {
  // reads the run high-water mark, the same figure the gates themselves read,
  // so a lost raid never walks the milestone backwards
  const reach = runPeakCount(game, "population");
  const gate = flightGate(game);
  const next = MILESTONES
    .map(m => m.at === PRESTIGE_UNLOCK ? { at: gate, text: m.text } : m)
    .find(milestone => reach < milestone.at);
  if (next) {
    return "Next milestone at " + fmt(next.at) + " ants — " + next.text +
      " " + fmt(reach) + " so far, " + fmt(next.at - reach) + " to go.";
  }
  const lineage = PRESTIGE_UPGRADES.filter(u => prestigeUpgradeOwned(game, u)).length;
  if (lineage < PRESTIGE_UPGRADES.length) {
    return "The flight is open. Next is the Royal Lineage — " + lineage + " of " +
      PRESTIGE_UPGRADES.length + " adaptations bought, and the last of them opens the Trials.";
  }
  if (!matrilineVisible(game) || !matrilineReady(game)) {
    const need = matrilineJellyNeeded(game);
    const have = jellyBanked(game);
    return "The lineage is complete. Next is the Matriline, at " + fmt(need) +
      " Royal Jelly gathered in all — " + fmt(have) + " so far. Every trial level the line " +
      "masters takes three off that figure.";
  }
  const line = currentSpecies(game);
  if (line === GENERIC) {
    return "The Matriline is open. Begin one, and the line commits to a species for the whole run.";
  }
  const done = SPECIES.filter(s => speciesFinished(game, s.id)).length;
  const points = speciesPoints(game, line);
  if (points < SPECIES_TARGET) {
    return "This line is " + speciesName(line) + " — " + points + " of " + SPECIES_TARGET +
      " points towards finishing her, and " + done + " of " + SPECIES.length +
      " species finished. A trial level as her is worth two, a flight one.";
  }
  if (done < SPECIES.length) {
    return speciesName(line) + " is finished — " + done + " of " + SPECIES.length +
      " species banked. Begin another matriline to commit to the next one.";
  }
  return "Every species is finished and every milestone this line has is behind her. " +
    "Deeper layers are being built for the beta.";
}

function renderMilestone() {
  const box = el("queenMilestone");
  box.hidden = !game.wingsShed;
  if (box.hidden) return;
  setText(box, milestoneText());
}

function renderRally() {
  const state = el("rallyState");
  el("btnRally").disabled = !rallyReady();
  state.classList.toggle("live", rallyActive(game));
  if (rallyActive(game)) {
    state.textContent = "Her call is out — ×" + RALLY_MULT + " forager food for another " +
      Math.ceil(game.rallyTime) + "s, the colony on " + fmt(foodPerSecond(game)) + "/s.";
  } else if (game.rallyCooldown > 0) {
    state.textContent = "The foragers are resting. She can call again in " +
      Math.ceil(game.rallyCooldown) + "s.";
  } else {
    state.textContent = "She can drive them onto the trails: ×" + RALLY_MULT +
      " forager food for " + RALLY_DURATION + "s, then " + RALLY_COOLDOWN + "s to recover.";
  }
}

function renderBrood() {
  el("broodPanel").hidden = !game.wingsShed;
  if (!game.wingsShed) return;

  const space = broodSpace();
  const emerging = pendingCaste();
  if (space > 0) {
    const cost = eggCost(game);
    el("eggCost").textContent = "A " + CASTES[emerging].name.toLowerCase() + " egg costs " +
      fmt(cost.amount) + " " + cost.resource + ". Chamber space: " + fmt(space) + ".";
  } else if (isUnlocked(game, "excavator")) {
    // at the cap an excavator is the only egg that can be laid, so it is the
    // excavator's price that matters -- saying only that they are the option
    // left the player with no idea what it costs or how many would fit
    const dig = eggCost(game, "excavator");
    el("eggCost").textContent = "The nest is full at " + fmt(populationCap(game)) +
      ". Only excavators can be laid now — they dig their own chambers. One costs " +
      fmt(dig.amount) + " " + dig.resource + ", and " + fmt(broodSlots("excavator")) +
      " can be dug out at once.";
  } else {
    el("eggCost").textContent = "The nest is full at " + fmt(populationCap(game)) +
      ". Nothing more can be laid until there is room.";
  }

  const ready = canLay();
  el("btnLay").disabled = !ready;
  el("btnLay").textContent = "Lay an egg (" + CASTES[emerging].name + ")";
  // the batch button lays whatever the field says, so a player laying hundreds
  // is not clicking a fixed x10 over and over
  const batch = layAmount();
  el("btnLayBatch").disabled = !ready || batch <= 0;
  el("btnLayBatch").textContent = "Lay ×" + fmt(batch);
  if (document.activeElement !== el("layAmount")) {
    el("layAmount").value = shortAmount(batch);
  }
  el("btnLayMax").disabled = !ready;
  el("btnLayMax").textContent = "Lay max (" + fmt(affordableEggs()) + ")";

  layableCastes().forEach(id => {
    const button = casteButtons[id];
    const unlocked = isUnlocked(game, id);
    button.disabled = !unlocked;
    button.classList.toggle("selected", game.nextCaste === id);
    setText(button, unlocked
      ? CASTES[id].name
      : CASTES[id].name + " — " + CASTES[id].unlockAt + " ants");
  });

  const autoRow = el("autoLayRow");
  autoRow.hidden = !automationUnlocked(game, "autoLay");
  if (!autoRow.hidden) {
    const on = automationOn("autoLay");
    el("autoLay").checked = on;
    el("autoLayLabel").textContent = on
      ? "Laying automatically — " + CASTES[autoCaste()].name.toLowerCase() +
        " eggs into every free slot" +
        (automationOn("autoRatio") ? ", chosen by your caste balance" : "")
      : "Lay eggs automatically — off, so food banks for upgrades";
  }

  const reserveRow = el("foodReserveRow");
  reserveRow.hidden = !automationUnlocked(game, "foodReserve");
  if (!reserveRow.hidden && document.activeElement !== el("foodReserve")) {
    // settles to the canonical short form once the player leaves the field:
    // 1000k becomes 1M. shortAmount() never rounds, so nothing drifts.
    el("foodReserve").value = shortAmount(foodReserve());
  }

  const feedRow = el("feedBroodRow");
  feedRow.hidden = !proteinUnlocked();
  if (!feedRow.hidden) {
    const on = game.settings.feedBrood !== false;
    el("feedBrood").checked = on;
    el("feedBroodLabel").textContent = on
      ? "Feed the brood protein — " + fmt(feedableEggs()) + " eggs can hatch twice as fast"
      : "Feed the brood protein — off, eggs cost food only";
  }

  const eggs = game.eggs;
  const slots = broodCapacity(game);
  const tended = Math.min(eggs.length, slots);
  const waiting = Math.max(0, eggs.length - slots);
  const period = incubationTime(game);

  if (eggs.length === 0) {
    el("eggSummary").textContent =
      "No eggs in the brood chamber. " + slots + " can be tended at once.";
  } else {
    let soonest = Infinity;
    for (let i = 0; i < tended; i++) soonest = Math.min(soonest, eggSecondsLeft(eggs[i], i));
    el("eggSummary").textContent =
      tended + " of " + slots + " brood slots working — next hatches in " +
      soonest.toFixed(1) + "s" +
      (waiting > 0 ? ", " + fmt(waiting) + " waiting for a slot" : "");
  }
  const detailsButton = el("btnBroodDetails");
  detailsButton.hidden = eggs.length === 0;
  setText(detailsButton, "See details (" + fmt(eggs.length) + " eggs" +
    (waiting > 0 ? ", " + fmt(waiting) + " waiting)" : ")"));
  if (!el("broodModal").hidden) updateBroodDialog();

  renderSlots(eggs, slots, tended);
  renderRally();
}

const SLOT_LIMIT = 5;
function renderSlots(eggs, slots, tended) {
  const box = el("eggSlots");
  const shown = Math.min(slots, SLOT_LIMIT);
  while (box.children.length < shown) {
    const row = document.createElement("div");
    row.className = "slot";
    row.innerHTML = '<span class="slot-caste"></span><span class="bar"><i></i></span>';
    box.appendChild(row);
  }
  while (box.children.length > shown) box.removeChild(box.lastChild);

  for (let i = 0; i < shown; i++) {
    const row = box.children[i];
    const egg = i < tended ? eggs[i] : null;
    row.classList.toggle("empty", !egg);
    row.querySelector(".slot-caste").textContent = egg
      ? CASTES[emergingCaste(game, egg, i)].name + (egg.fed ? " ·fed" : "")
      : "empty";
    row.querySelector(".bar i").style.width =
      egg ? Math.min(100, (egg.progress / EGG_TIME) * 100).toFixed(1) + "%" : "0%";
  }
  el("slotOverflow").hidden = slots <= SLOT_LIMIT;
  el("slotOverflow").textContent = slots > SLOT_LIMIT
    ? "and " + fmt(slots - SLOT_LIMIT) + " more slots working out of sight"
    : "";
  renderBottleneck();
}

// What the colony is short of, said out loud. It is the one thing the game
// always knew and never told anyone: an upgrade aimed anywhere but the binding
// constraint is a multiplier on a fraction, and buys almost nothing.
function renderBottleneck() {
  const box = el("broodBottleneck");
  const state = colonyBottleneck();
  box.hidden = !state;
  if (!state) return;
  box.textContent = state.text;
  for (const key of ["cap", "sealed", "garden", "brood", "food", "none"]) {
    box.classList.toggle("is-" + key, state.key === key);
  }
}

// Three numbers in the stats bar are all a player needs while a fight is
// coming: what they field, what is coming, and how long they have.
function renderCombatBar() {
  const active = raidsUnlocked(game);
  const hidden = inHiding(game);
  const left = raidCountdown(game);
  const defence = combatPower(game);
  const threat = monsterPower(game);
  const soon = active && !hidden && left <= RAID_WARNING;
  el("combatGroup").hidden = !active;
  if (!active) return;
  el("valFighters").textContent = fmt(defence);
  el("valThreat").textContent = fmt(threat);
  el("valRaidIn").textContent = challengeFailed(game) ? "trial lost"
    : hidden ? "gone to ground" : fmtTime(left);
  el("readoutFighters").classList.toggle("losing", defence < threat);
  el("readoutRaidIn").classList.toggle("imminent", soon);
}

// Nothing in the game said which castes were fighting or for how much. The
// rows are pooled and updated in place, never rebuilt.
function renderFighters() {
  const list = el("combatList");
  const rows = [];
  for (const id of Object.keys(CASTES)) {
    const each = combatPerCaste(game, id);
    const held = game.ants[id];
    if (each <= 0 || held <= 0) continue;
    rows.push({ name: CASTES[id].name, held, each, total: held * each });
  }
  rows.sort((a, b) => b.total - a.total);
  while (list.children.length > rows.length) list.removeChild(list.lastChild);
  while (list.children.length < rows.length) {
    const li = document.createElement("li");
    li.className = "fighter-row";
    li.innerHTML = "<b></b><span></span><i></i>";
    list.appendChild(li);
  }
  rows.forEach((r, i) => {
    const li = list.children[i];
    li.querySelector("b").textContent = r.name;
    li.querySelector("span").textContent = fmt(r.held) + " × " + fmt(r.each) + " each";
    li.querySelector("i").textContent = fmt(r.total);
  });
  const none = el("combatNone");
  none.hidden = rows.length > 0;
  if (rows.length === 0) {
    none.textContent = "Nothing in the colony can fight. Soldiers fight from birth; " +
      "every other caste needs the Combat adaptations before it will stand.";
  }
}

function exchangeAmount() {
  const n = parseAmount(el("exchangeAmount").value);
  return isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function renderExchange() {
  const panel = el("exchangePanel");
  panel.hidden = !exchangeReady(game);
  if (panel.hidden) return;
  const rate = foodPerProtein(game);
  el("exchangeRate").textContent =
    "One protein is worth " + fmt(rate) + " food at what the colony earns right now. " +
    "The pit keeps a cut both ways — you get " + Math.round(EXCHANGE_RETURN * 100) +
    "% of that trading either direction, so there is nothing to be made going round in a circle.";
  const n = exchangeAmount();
  const canSell = n > 0 && n <= Math.floor(game.protein);
  const cost = n > 0 ? proteinPurchaseCost(game, n) : 0;
  const canBuy = n > 0 && cost <= game.food;
  el("btnSellProtein").disabled = !canSell;
  el("btnBuyProtein").disabled = !canBuy;
  el("exchangePreview").textContent = n <= 0
    ? "Type how much protein to trade."
    : fmt(n) + " protein sells for " + fmt(proteinSaleValue(game, n)) + " food" +
      (canSell ? "" : " (you have " + fmt(game.protein) + ")") +
      " · buying " + fmt(n) + " costs " + fmt(cost) + " food" +
      (canBuy ? "" : " (you can afford " + fmt(affordableProtein()) + ")");
}

// Combat became three things -- the fight, the army, and the pit -- so it takes
// the same sub-tab shape Upgrades, Achievements and Settings already use rather
// than growing into one long column.
const COMBAT_TABS = [
  { id: "overview", name: "Overview" },
  { id: "units", name: "Units" },
  { id: "trade", name: "Trade" }
];
let combatTab = "overview";

function selectCombatTab(name) {
  combatTab = name;
  COMBAT_TABS.forEach(tab => {
    el("combatPanel-" + tab.id).hidden = tab.id !== name;
  });
  for (const button of el("combatTabs").children) {
    button.classList.toggle("active", button.dataset.tab === name);
  }
  render();
}

function buildCombatTabs() {
  COMBAT_TABS.forEach(tab => {
    const button = document.createElement("button");
    button.textContent = tab.name;
    button.dataset.tab = tab.id;
    button.onclick = () => selectCombatTab(tab.id);
    el("combatTabs").appendChild(button);
  });
  selectCombatTab("overview");
}

// The Units menu is bought with a trial, not with a resource: Endless Siege
// demands soldiers, so surviving it is what teaches the colony to make better
// ones. Until then the menu says so plainly rather than being hidden.
function unitsUnlocked() {
  return bestTrialLevel(game, "siege") > 0;
}

const rankRows = {};

function buildRanks() {
  const list = el("rankList");
  SOLDIER_RANKS.forEach((rank, index) => {
    const row = document.createElement("div");
    row.className = "rank-row";

    const art = document.createElement("div");
    art.className = "caste-art";
    art.appendChild(spriteFor(rank.id, 3));

    const body = document.createElement("div");
    body.innerHTML = '<span class="rank-name"></span><span class="rank-role"></span>' +
      '<span class="rank-stat"></span>';

    const count = document.createElement("div");
    count.className = "rank-count";

    const train = document.createElement("div");
    train.className = "rank-train";
    const button = document.createElement("button");
    const note = document.createElement("span");
    note.className = "dim";
    train.append(button, note);
    // the promotion this row offers is INTO the next rank, so the last row has none
    button.onclick = () => {
      const result = trainSoldiers(index, trainAmount());
      if (result) lastTraining = Object.assign({ rank: SOLDIER_RANKS[index + 1].id }, result);
      render();
    };

    row.append(art, body, count, train);
    watch(row, {
      title: CASTES[rank.id].name,
      body: CASTES[rank.id].role,
      note: () => rankNote(rank, index)
    });
    rankRows[rank.id] = { row, button, note,
      name: body.querySelector(".rank-name"),
      role: body.querySelector(".rank-role"),
      stat: body.querySelector(".rank-stat"),
      count };
    list.appendChild(row);
  });
}

function rankNote(rank, index) {
  const held = game.ants[rank.id] || 0;
  const lines = [fmt(held) + " in the colony, " + fmt(combatPerRank(game, rank.id)) +
    " strength each — " + fmt(held * combatPerRank(game, rank.id)) + " in total."];
  lines.push(rank.hunt > 0
    ? "Hunts at " + fmt(rank.hunt * 100) + "% of a plain soldier's rate."
    : "Never hunts. She holds the tunnel and nothing else.");
  const next = SOLDIER_RANKS[index + 1];
  if (!next) {
    lines.push("", "The highest grade there is. Nothing promotes out of here.");
    return lines.join("\n");
  }
  lines.push("", "TRAINING INTO " + CASTES[next.id].name.toUpperCase(),
    "  · " + fmt(next.cost) + " protein each",
    "  · " + Math.round(next.loss * 100) + "% of them do not survive it",
    "  · " + fmt(next.power) + "× a plain soldier at the gate, hunting at " +
      (next.hunt > 0 ? fmt(next.hunt * 100) + "%" : "nothing"),
    "  · you can afford to train " + fmt(trainableCount(index)) + " right now");
  return lines.join("\n");
}

function trainAmount() {
  const n = parseAmount(el("trainAmount").value);
  return isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

let lastTraining = null;

function renderUnits() {
  const open = unitsUnlocked();
  el("unitsLocked").hidden = open;
  el("unitsBody").hidden = !open;
  if (!open) {
    el("unitsLocked").textContent =
      "Locked. The colony has never had to make a better soldier, so it does not know how. " +
      "Clear one level of Endless Siege on the Trials tab and this opens — the trial that " +
      "demands soldiers is the one that teaches them.";
    return;
  }
  el("unitsIntro").textContent =
    "Every grade fights harder and hunts worse. An army of nothing but guards fields enormous " +
    "strength and brings home no protein at all, which is the protein that trained it. " +
    "Surviving a raid promotes " + Math.round(VETERAN_SHARE * 100) + "% of the rank and file into " +
    "Majors on its own; everything above that is bought here, and paid for in ants.";

  const n = trainAmount();
  SOLDIER_RANKS.forEach((rank, index) => {
    const ui = rankRows[rank.id];
    const held = game.ants[rank.id] || 0;
    const next = SOLDIER_RANKS[index + 1];
    setText(ui.name, CASTES[rank.id].name);
    setText(ui.role, CASTES[rank.id].role);
    setText(ui.stat, fmt(combatPerRank(game, rank.id)) + " each" +
      (rank.hunt > 0 ? " · hunts at " + fmt(rank.hunt * 100) + "%" : " · never hunts"));
    setText(ui.count, fmt(held));
    ui.row.classList.toggle("locked", held <= 0);

    ui.button.hidden = !next;
    ui.note.hidden = !next;
    if (!next) return;
    const can = Math.min(n, trainableCount(index));
    ui.button.disabled = can <= 0;
    setText(ui.button, "Train " + fmt(can) + " → " + CASTES[next.id].name);
    setText(ui.note, fmt(next.cost) + " protein each · " +
      Math.round(next.loss * 100) + "% die");
  });

  const record = [];
  if (lastTraining) {
    record.push("Last training: " + fmt(lastTraining.trained) + " became " +
      CASTES[lastTraining.rank].name + "s" +
      (lastTraining.lost > 0 ? ", " + fmt(lastTraining.lost) + " did not survive it" : ", none lost") +
      " — " + fmt(lastTraining.spent) + " protein.");
  }
  record.push(fmt(game.stats.trained || 0) + " promoted in this matriline, " +
    fmt(game.stats.trainingDeaths || 0) + " lost to it.");
  el("trainRecord").textContent = record.join(" ");
  el("trainNote").textContent = "Protein banked: " + fmt(game.protein) +
    ". Hunting brings home " + fmt(huntRate(game)) + "/s from " +
    fmt(huntingSoldiers(game)) + " effective hunters of " + fmt(soldierCount(game)) + " bodies.";
}

// The library is written once and updated in place, like every other list that
// redraws each frame -- rebuilding nodes under the cursor is what broke clicking
// on the upgrade cards.
const libraryRows = {};

function buildLibrary() {
  const list = el("libraryList");
  LIBRARY_GROUPS.forEach(group => {
    const section = document.createElement("section");
    section.className = "library-group";
    const head = document.createElement("h2");
    head.textContent = group.name;
    section.appendChild(head);
    LIBRARY.filter(entry => entry.group === group.id).forEach(entry => {
      const row = document.createElement("div");
      row.className = "library-entry";
      row.innerHTML = '<b></b><span class="library-text"></span>' +
        '<span class="library-more" hidden></span>';
      row.querySelector("b").textContent = entry.term;
      watch(row, { title: entry.term, body: entry.short,
        note: () => entryState(game, entry) >= 2
          ? entry.full
          : "The colony knows of this but has not done it yet. Do it once and it is written up in full." });
      libraryRows[entry.id] = { row, section,
        text: row.querySelector(".library-text"),
        more: row.querySelector(".library-more") };
      section.appendChild(row);
    });
    list.appendChild(section);
  });
}

// Library holds two things you read rather than press: what the words mean, and
// what has changed since you were last here.
// One page per category rather than one scroll through all of them. At 38
// entries the single list already needed scrolling to reach the group you
// wanted, and it only grows.
const LIBRARY_TABS = LIBRARY_GROUPS.map(g => ({ id: g.id, name: g.name }))
  .concat([{ id: "updates", name: "What changed" }]);
let libraryTab = LIBRARY_TABS[0].id;

function selectLibraryTab(name) {
  libraryTab = name;
  el("libraryPanel-terms").hidden = name === "updates";
  el("libraryPanel-updates").hidden = name !== "updates";
  for (const button of el("libraryTabs").children) {
    button.classList.toggle("active", button.dataset.tab === name);
  }
  if (name === "updates") markSeen("updates", latestVersion());
  render();
}

// Sub-tab bars were plain buttons, so there was nowhere for a dot to go -- and
// a player had no way to see that a track had moved or that an instinct had
// become affordable without opening each page.
function markSubTab(bar, id, count) {
  const node = el(bar);
  if (!node) return;
  for (const button of node.children) {
    if (button.dataset.tab !== id) continue;
    const badge = button.children[0];
    if (!badge) continue;
    badge.hidden = !(count > 0);
    setText(badge, count > 0 ? (count > 99 ? "99+" : String(count)) : "");
  }
}

function buildLibraryTabs() {
  LIBRARY_TABS.forEach(tab => {
    const button = document.createElement("button");
    button.textContent = tab.name;
    button.dataset.tab = tab.id;
    button.onclick = () => selectLibraryTab(tab.id);
    el("libraryTabs").appendChild(button);
  });
  selectLibraryTab(LIBRARY_TABS[0].id);
}

function buildUpdates() {
  const list = el("updatesList");
  UPDATES.forEach((entry, index) => {
    const box = document.createElement("section");
    box.className = "update" + (index === 0 ? " newest" : "");
    const head = document.createElement("div");
    head.className = "update-head";
    head.innerHTML = '<b></b><span class="update-version"></span>';
    head.querySelector("b").textContent = entry.name;
    head.querySelector(".update-version").textContent = entry.version;
    box.appendChild(head);
    const changes = document.createElement("ul");
    changes.className = "update-changes";
    entry.changes.forEach(line => {
      const item = document.createElement("li");
      item.textContent = line;
      changes.appendChild(item);
    });
    box.appendChild(changes);
    list.appendChild(box);
  });
}

function renderUpdates() {
  el("updatesIntro").textContent =
    "What has changed, newest first. The colony you are running is on " +
    latestVersion() + ".";
}

function renderLibrary() {
  const counts = libraryCounts(game);
  el("libraryTally").textContent = counts.known + " of " + counts.total + " entries";
  el("libraryHint").textContent = counts.expanded + " written up in full" +
    (counts.known > counts.expanded
      ? " — the rest fill in as the colony does them" : "");
  LIBRARY_GROUPS.forEach(group => {
    let shown = 0;
    const onThisPage = group.id === libraryTab;
    LIBRARY.filter(e => e.group === group.id).forEach(entry => {
      const ui = libraryRows[entry.id];
      const at = entryState(game, entry);
      ui.row.hidden = at < 1 || !onThisPage;
      if (at >= 1) shown++;
      ui.row.classList.toggle("full", at >= 2);
      setText(ui.text, entry.short);
      ui.more.hidden = at < 2;
      if (at >= 2) setText(ui.more, entry.full);
    });
    const any = LIBRARY.find(e => e.group === group.id);
    if (any) libraryRows[any.id].section.hidden = shown === 0 || !onThisPage;
  });
  // a page with nothing discovered on it yet says so, rather than being blank
  const here = LIBRARY.filter(e => e.group === libraryTab && entryState(game, e) >= 1).length;
  el("libraryEmpty").hidden = here > 0;
}

// Opt-in difficulty rather than a nerf: what clearing a trial pays is earned,
// so the ceiling comes off by choice instead of the reward coming down.
function buildRaidDifficulty() {
  const select = el("setRaidDifficulty");
  RAID_DIFFICULTIES.forEach(level => {
    const option = document.createElement("option");
    option.value = level.id;
    option.textContent = level.name;
    select.appendChild(option);
  });
  select.onchange = event => {
    setSetting("raidDifficulty", event.target.value);
    render();
  };
}

function renderRaidDifficulty() {
  const row = el("raidDifficultyRow");
  row.hidden = !raidDifficultyUnlocked(game);
  if (row.hidden) return;
  const level = raidDifficulty(game);
  el("setRaidDifficulty").value = level.id;
  el("raidDifficultyNote").textContent = level.note;
}

function renderRaid() {
  const active = raidsUnlocked(game);
  el("tabButton-combat").hidden = !active;
  if (!active || activeTab !== "combat") return;
  renderUnits();
  renderExchange();
  renderRaidDifficulty();
  el("tradeLocked").hidden = !el("exchangePanel").hidden;
  if (!el("tradeLocked").hidden) {
    el("tradeLocked").textContent =
      "The rendering pit opens once the colony is hunting and raiding — it prices protein " +
      "against what the colony earns right now, and with nothing coming in there is no price.";
  }
  if (combatTab !== "overview") return;

  el("combatTally").textContent = fmt(game.raidsWon || 0) +
    ((game.raidsWon || 0) === 1 ? " raid won" : " raids won");
  el("combatRecord").textContent = (game.raidsLost || 0) > 0
    ? fmt(game.raidsLost) + " lost" : "none lost";

  const hidden = inHiding(game);
  const left = raidCountdown(game);
  const defence = combatPower(game);
  const threat = monsterPower(game);
  el("raidDefence").textContent = fmt(defence);
  el("raidThreat").textContent = fmt(threat);
  el("raidDefence").classList.toggle("losing", defence < threat);

  // the nest used to be attacked by a number
  const coming = currentMonster(game);
  el("raidMonsterName").textContent = hidden ? "Next attacker" : coming.name;
  el("raidMonsterNote").hidden = hidden;
  el("raidMonsterNote").textContent = coming.note;

  const soon = !hidden && left <= RAID_WARNING;
  el("tab-combat").classList.toggle("imminent", soon);
  el("tab-combat").classList.toggle("hiding", hidden);
  // a lost trial is not waiting for anything; the timer is frozen, so saying
  // "next attack in 1m 30s" for ever would be a straight lie
  const lostRun = challengeFailed(game);
  const beaten = hidden && game.ants.soldier > 0;
  el("raidCountdown").textContent = lostRun
    ? "The siege is over. The line broke and the trial is lost — nothing more is coming. " +
      "Give it up on the Trials tab to found a fresh colony."
    : hidden
    ? beaten
      ? "The nest is shut. After " + HIDING_LOSS_STREAK +
        " straight defeats the colony has gone to ground — nothing is coming while it stays that way."
      : "The nest is shut. With no soldiers left the colony has gone to ground — nothing is coming while it stays that way."
    : soon
      ? "Something is coming — " + Math.ceil(left) + "s"
      : "Next attack in " + fmtTime(left) + ".";

  const out = hunting(game);
  el("raidHunt").hidden = game.ants.soldier === 0;
  el("raidHunt").textContent = out
    ? "Your soldiers are out hunting — +" + fmt(huntRate(game)) + " protein a second."
    : "Your soldiers are back at the nest for the fight.";

  const notice = el("raidNotice");
  const armed = (game.upgrades && game.upgrades.combat_forager || 0) > 0;
  notice.hidden = raidsSeen(game) === 0 || armed;
  if (!notice.hidden) {
    notice.textContent =
      "The colony has been attacked. Workers cannot fight until you teach them how — " +
      "the Combat upgrades on the Upgrades tab arm your foragers, diggers and nurses. " +
      "Soldiers hunt between attacks and come home when one is close.";
  }

  if (lostRun) {
    el("raidReport").textContent =
      "The colony still stands, but the trial does not. Nothing it does now counts towards it.";
    return;
  }
  if (hidden) {
    el("raidReport").textContent = beaten
      ? "Foraging is half what it was — the workers keep to cover and will not range far. " +
        "Raise an army that can hold " + fmt(threat) + " and the nest opens again; " +
        "you field " + fmt(defence) + " now."
      : "Foraging is half what it was — the workers keep to cover and will not range far. " +
        "Lay a soldier and the colony opens up again; the next attack is a full six minutes away. " +
        "Foragers, excavators and nurses can be armed by the Combat adaptations and they do fight — " +
        "but only a soldier keeps the nest open. With none of them the colony shuts regardless of " +
        "how much strength the rest of it has.";
    return;
  }

  const last = game.lastRaid;
  if (!last) {
    el("raidReport").textContent = defence >= threat
      ? "Your soldiers can hold this one."
      : "Your soldiers cannot hold this one. Lay more, or the colony will lose ants.";
    return;
  }
  if (last.won) {
    const fallen = Object.keys(last.dead || {})
      .map(c => fmt(last.dead[c]) + " " + CASTES[c].name.toLowerCase()).join(", ");
    const risen = Object.keys(last.promoted || {})
      .map(c => fmt(last.promoted[c]) + " " + CASTES[c].name.toLowerCase()).join(", ");
    const killed = last.monster ? "The " + monsterById(last.monster).name : "The last attacker";
    el("raidReport").textContent =
      killed + " was killed and stripped: +" + fmt(last.protein) +
      " protein, +" + fmt(last.food) + " food." +
      (fallen ? " It cost " + fallen + "." : " Nothing was lost holding it.") +
      (risen ? " " + risen + " came out of it promoted." : "");
  } else {
    const toll = Object.keys(last.dead).map(c => fmt(last.dead[c]) + " " + CASTES[c].name.toLowerCase()).join(", ");
    const broke = last.monster ? "The " + monsterById(last.monster).name : "The last attacker";
    el("raidReport").textContent =
      broke + " broke through. Lost " + (toll || "nothing") +
      ". Salvaged " + fmt(last.protein) + " protein.";
  }
}

function prestigeUnlocked(game) {
  const p = game.prestige || {};
  return Math.max(game.peakPopulation || 0, population(game)) >= PRESTIGE_UNLOCK ||
    (p.flightsTaken || 0) > 0 || (p.royalJellyTotal || 0) > 0;
}

function affordablePrestigeUpgrades() {
  const p = game.prestige || { royalJelly: 0 };
  let ready = 0;
  for (const upgrade of PRESTIGE_UPGRADES) {
    if (!prestigeUpgradeOwned(game, upgrade) && p.royalJelly >= upgrade.cost) ready++;
  }
  return ready;
}

// A small ant stands in the box and says the next thing worth doing. Where that
// thing is one safe click she offers to make it -- a shortcut for a click you
// were going to make, never an action taken on your behalf, and never anything
// irreversible.
let assistantAnt = null;

function renderTutorial() {
  const step = tutorialStep();
  el("tutorialBox").hidden = !step;
  if (!step) return;
  if (!assistantAnt) {
    assistantAnt = spriteFor("forager", 2);
    el("tutorialAnt").appendChild(assistantAnt);
  }
  setText(el("tutorialText"), step.text);
  const button = el("tutorialDo");
  button.hidden = !step.act;
  if (step.act) setText(button, step.label);
}

function renderAway() {
  const away = lastAway;
  const box = el("awayNote");
  box.hidden = !away;
  if (!away) return;
  // shown once, on the first frame after loading
  openAwayReport(away);
  const bits = ["+" + fmt(away.food) + " food"];
  if (away.protein > 0.5) bits.push("+" + fmt(away.protein) + " protein");
  if (away.hatched > 0) bits.push(fmt(away.hatched) + " hatched");
  if (away.won > 0) bits.push(away.won + " raids won");
  if (away.lost > 0) bits.push(away.lost + " lost");
  box.textContent = "While you were away — " + fmtTime(away.seconds) + ": " + bits.join(", ") + ".";
}

// Every factor on its own line under the total it feeds, named by its kind --
// upgrades, achievements, trials, lineage -- with the individual sources
// nested underneath. Short labels keep the columns narrow enough for three.
//
// Pooled and updated in place, never rebuilt: this redraws every frame while
// Settings is open, and a node detached mid-click never receives it. Expanding
// binds to mousedown for the same reason.
const openFactors = new Set();

function renderFormulas() {
  const box = el("formulaList");
  const rows = formulaSummary(game);
  while (box.children.length > rows.length) box.removeChild(box.lastChild);
  while (box.children.length < rows.length) {
    const row = document.createElement("div");
    row.className = "formula-row";
    row.innerHTML = '<div class="formula-head"><b></b><span class="formula-total"></span></div>' +
      '<div class="formula-parts"></div>';
    box.appendChild(row);
  }
  rows.forEach((entry, i) => {
    const row = box.children[i];
    row.querySelector("b").textContent = entry.name;
    row.querySelector(".formula-total").textContent = entry.shape.total;

    // flatten parent factors and any expanded children into one list of lines
    const lines = [];
    entry.shape.rows.forEach(part => {
      const key = entry.name + "/" + part.label;
      const has = part.children.length > 0;
      const open = has && openFactors.has(key);
      lines.push({ key, label: (has ? (open ? "▾ " : "▸ ") : "") + part.label,
                   value: part.value, child: false, toggles: has });
      if (open) part.children.forEach(c =>
        lines.push({ key: "", label: c.label, value: c.value, child: true, toggles: false }));
    });

    const parts = row.querySelector(".formula-parts");
    while (parts.children.length > lines.length) parts.removeChild(parts.lastChild);
    while (parts.children.length < lines.length) {
      const line = document.createElement("div");
      line.className = "formula-part";
      line.innerHTML = "<span></span><i></i>";
      line.addEventListener("mousedown", () => {
        const k = line.dataset.key;
        if (!k) return;
        if (openFactors.has(k)) openFactors.delete(k); else openFactors.add(k);
        render();
      });
      parts.appendChild(line);
    }
    lines.forEach((line, j) => {
      const node = parts.children[j];
      node.dataset.key = line.toggles ? line.key : "";
      node.classList.toggle("child", line.child);
      node.classList.toggle("expandable", line.toggles);
      node.querySelector("span").textContent = line.label;
      node.querySelector("i").textContent = line.value;
    });
  });
}

// one place decides what a tab dot says, so they cannot drift apart
function setBadge(id, count) {
  const node = el(id);
  if (!node) return;
  node.hidden = !(count > 0);
  setText(node, count > 0 ? (count > 99 ? "99+" : String(count)) : "");
}

function renderBadges() {
  const upgrades = upgradeBadge();
  const achievements = newTrackCount(game);
  const prestige = affordablePrestigeUpgrades();
  // The counts were computed and then thrown away -- a bare dot says something
  // is there, a number says how much, and it costs no more room now that the
  // digit sits inside the dot rather than beside it.
  const unread = libraryUnread(game) + (updatesUnread(game) ? 1 : 0);
  const matriline = matrilineVisible(game) && !matrilineCount(game) && matrilineReady(game) ? 1 : 0;
  setBadge("badge-upgrades", activeTab === "upgrades" ? 0 : upgrades);
  setBadge("badge-achievements", activeTab === "achievements" ? 0 : achievements);
  setBadge("badge-prestige", activeTab === "prestige" ? 0 : prestige);
  setBadge("badge-library", activeTab === "library" ? 0 : unread);
  setBadge("badge-matriline", activeTab === "matriline" ? 0 : matriline);
}

const prestigeCards = {};

function buildPrestige(onChange) {
  const list = el("prestigeUpgradeList");
  PRESTIGE_UPGRADES.forEach(upgrade => {
    const card = document.createElement("button");
    card.className = "upgrade prestige";
    card.innerHTML =
      '<span class="upgrade-head"><b></b><span class="upgrade-cost"></span></span>' +
      '<span class="upgrade-desc"></span>';
    card.querySelector("b").textContent = upgrade.name;
    card.querySelector(".upgrade-desc").textContent = upgrade.desc;
    card.onclick = () => {
      if (buyPrestigeUpgrade(upgrade.id)) (onChange || render)();
    };
    watch(card, {
      title: upgrade.name,
      body: upgrade.desc,
      note: () => {
        if (prestigeUpgradeOwned(game, upgrade)) return "Already bought.";
        return "Costs " + upgrade.cost + " Royal Jelly.";
      }
    });
    prestigeCards[upgrade.id] = {
      card,
      cost: card.querySelector(".upgrade-cost")
    };
    list.appendChild(card);
  });

  el("btnFlight").onclick = () => {
    if (!flightReady()) return;
    const earned = flightReward();
    el("flightModalDetail").textContent =
      "Disperse your colony of " + fmt(population(game)) + " ants to take flight into the summer air. " +
      "You will earn +" + fmt(earned) + " Royal Jelly to enhance your future colonies. " +
      "All achievements, peak records, and royal lineage adaptations remain forever.";
    el("flightModal").hidden = false;
  };
  el("flightCancel").onclick = () => {
    el("flightModal").hidden = true;
  };
  el("flightConfirm").onclick = () => {
    el("flightModal").hidden = true;
    doFlight();
    selectTab("ants");
    render();
  };
}

function renderPrestige() {
  const p = game.prestige || { royalJelly: 0, royalJellyTotal: 0, flightsTaken: 0 };
  el("prestigeJellyTally").textContent = fmt(p.royalJelly) + " Royal Jelly";
  el("prestigeFlightTally").textContent = (p.flightsTaken || 0) + " flights taken (" + fmt(p.royalJellyTotal || 0) + " total earned)";

  const pop = population(game);
  const ready = flightReady();
  const projected = flightReward();
  el("btnFlight").disabled = !ready;
  const perHour = jellyPerHour(projected, game.runTime || 0);
  // the gate, not the flat figure: a species with a hard ceiling is held to half
  // of it, and a tab saying 1,000 while the button unlocks at 700 is worse than
  // no number at all
  const gate = flightGate(game);
  el("flightYield").textContent = ready
    ? "Colony is mature (" + fmt(pop) + " / " + fmt(gate) + " ants) — taking flight now yields +" +
      fmt(projected) + " Royal Jelly" +
      (perHour > 0 ? ", which is " + fmt(perHour) + " an hour for this colony so far." : ".")
    : activeChallenge(game)
      ? "The queen cannot fly out of a trial. Claim or abandon " +
        activeChallenge(game).name + " on the Trials tab first."
      : "Colony needs " + fmt(gate) + " ants to take flight (currently " + fmt(pop) + ").";

  // the tree is finite, and running out of it should read as the edge of what
  // is built rather than as something broken
  const owned = PRESTIGE_UPGRADES.filter(u => prestigeUpgradeOwned(game, u)).length;
  const complete = owned === PRESTIGE_UPGRADES.length;
  el("prestigeOwnedTally").textContent =
    owned + " / " + PRESTIGE_UPGRADES.length + " adaptations" +
    (complete ? "" : " (" + (PRESTIGE_UPGRADES.length - owned) + " left)");
  el("lineageDone").hidden = !complete;
  if (complete) {
    el("lineageDone").textContent =
      "The lineage is complete — all " + PRESTIGE_UPGRADES.length +
      " adaptations are hers. The Trials tab is open: her daughters can now establish colonies " +
      "under conditions that should kill them, and every level cleared strengthens every colony " +
      "founded afterwards. " +
      "Royal Jelly still gathers with every flight" +
      (p.royalJelly > 0 ? " (" + fmt(p.royalJelly) + " banked)" : "") + ".";
  }

  PRESTIGE_UPGRADES.forEach(upgrade => {
    const ui = prestigeCards[upgrade.id];
    if (!ui) return;
    const isOwned = prestigeUpgradeOwned(game, upgrade);
    ui.card.classList.toggle("owned", isOwned);
    ui.card.disabled = isOwned || p.royalJelly < upgrade.cost;
    setText(ui.cost, isOwned ? "owned" : upgrade.cost + " Royal Jelly");
    ui.cost.classList.toggle("affordable", !isOwned && p.royalJelly >= upgrade.cost);
    ui.cost.classList.toggle("owned-tag", isOwned);
  });
}

const challengeCards = {};

const pct = value => fmt(value * 100) + "%";

function listNames(names) {
  if (names.length <= 1) return names[0] || "";
  return names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
}

// the half of a trial's reward the cards never mentioned: another rung on every
// upgrade line that trial pays into -- or, where a trial pays in something that
// is not an upgrade at all, that thing instead
function masteryLineText(type) {
  const raised = linesWithMastery(type);
  if (type === "nanitic") return "the founders stop dying of old age from the first level";
  // Sterile pays into every line rather than into one kind of them, so no line
  // carries its tag -- and the card was reading that empty list as "nothing
  // else" while it was in fact raising the max of all twelve
  if (type === "upgrades") return "the max level of every upgrade line rises by one";
  if (!raised.length) return "nothing else";
  return raised.length === 1
    ? "the max level of " + raised[0].name + " rises by one"
    : "the max level of all " + raised.length + " " + type + " upgrade lines rises by one";
}

// What a trial actually does, in its own terms. Every card and hover used to
// print Drought's food multiplier whatever trial it was describing, so Endless
// Siege -- which does not touch food at all -- announced a 25% food penalty.
function challengeDebuffText(challenge, level) {
  const kind = challenge.kind || "food";
  if (kind === "barren") {
    // at the first attempt the chambers run at full speed, and saying "x 100%"
    // reads as a debuff that is not there
    const speed = Math.pow(BARREN_SCALE, Math.min(level, CHALLENGE_MAX_LEVEL - 1));
    return "Nurses add no brood slots at all" +
      (speed < 1 ? ", and every egg develops at × " + pct(speed) + " speed on this attempt" : "") +
      ". Growth is bound by time rather than by food, which is the opposite of " +
      "every other trial.";
  }
  if (kind === "sealed") {
    return "Excavators raise no population cap whatever. The nest holds " +
      fmt(Math.max(1, Math.floor(30 * Math.pow(SEALED_SCALE, Math.min(level, CHALLENGE_MAX_LEVEL - 1))))) +
      " ants on this attempt and will not widen \u2014 so it is asked for a rate, not a headcount.";
  }
  if (kind === "sterile") {
    const allowed = STERILE_ALLOWANCE[Math.min(level, STERILE_ALLOWANCE.length - 1)];
    return allowed > 0
      ? "The colony may hold only " + allowed + " bought adaptation levels at once on this attempt. " +
        "Caste balance and instinct, and very little else."
      : "No bought adaptation takes hold at all on this attempt. Caste balance and instinct, and nothing else.";
  }
  if (kind === "callow") {
    const weight = CALLOW_CROWDING * Math.pow(CALLOW_SCALE, Math.min(level, CHALLENGE_MAX_LEVEL - 1));
    return "Every egg hatches as a founder whatever caste you chose, and nothing dies of old age " +
      "— but each founder shortens the half-life of every other one by " + pct(weight) +
      " on this attempt. More of them means less from each, and past a point less in total, " +
      "so the trial is finding where that point is.";
  }
  if (kind === "siege") {
    const scale = siegeThreatScaleAt(level);
    return "Attacks from " + fmt(SIEGE_UNLOCK) + " ants, one every " + SIEGE_INTERVAL +
      " seconds, at ×" + fmt(scale) + " strength on this attempt. A defeat costs " +
      pct(SIEGE_LOSS_CAP) + " of the colony instead of the usual fifth, and the nest " +
      "cannot go to ground.";
  }
  return "All food production × " + pct(challengeDebuffAt(level)) + " on the next attempt — against " +
    "× " + fmt(challengeReward(game) * masteryFood(game)) + " you already hold, so about × " +
    pct(challengeDebuffAt(level) * challengeReward(game) * masteryFood(game)) +
    " of a normal colony.";
}

// the one-line version for the running note at the top of the tab
function challengeRunningText(challenge, level) {
  const kind = challenge.kind || "food";
  if (kind === "siege") return "attackers at ×" + fmt(siegeThreatScaleAt(level)) + " strength";
  if (kind === "barren") return "the brood at ×" +
    pct(Math.pow(BARREN_SCALE, Math.min(level, CHALLENGE_MAX_LEVEL - 1))) + " speed";
  if (kind === "sealed") return "the nest sealed at " + fmt(populationCap(game)) + " ants";
  if (kind === "sterile") {
    const allowed = STERILE_ALLOWANCE[Math.min(level, STERILE_ALLOWANCE.length - 1)];
    return allowed > 0 ? allowed + " adaptation levels allowed" : "no adaptations allowed";
  }
  if (kind === "callow") return "founders fading " +
    fmt(callowCrowding(game, game.ants.nanitic)) + "x faster for the crowd";
  return "food at × " + pct(challengeDebuff(game));
}

// The cards used to say "cut hard" and leave it there. Every figure a trial
// changes is now stated as a number, and the hover lists what is taken, what is
// kept, what clears it and what clearing pays -- players could not tell that
// the lineage stays behind at all, and asked.
function trialDetail(challenge) {
  const level = challengeLevel(game, challenge.id);
  const running = activeChallenge(game);
  const mine = !!running && running.id === challenge.id;
  const lines = [];

  if (!challenge.open) {
    lines.push("Not playable yet.", "", challenge.plan);
    return lines.join("\n");
  }

  if (challengeMastered(game, challenge.id)) {
    lines.push("Mastered — all " + CHALLENGE_MAX_LEVEL + " levels cleared.");
    lines.push("");
    lines.push("You hold × " + fmt(challengeReward(game) * masteryFood(game)) +
      " food from it, permanently.");
    return lines.join("\n");
  }
  lines.push("Attempt " + (level + 1) + " of " + CHALLENGE_MAX_LEVEL + " — cleared " + level +
    (level === 1 ? " level so far." : " levels so far."));
  lines.push("");
  lines.push("WHILE IT RUNS");
  lines.push("  · " + challengeDebuffText(challenge, level));
  if ((challenge.kind || "food") === "siege") {
    lines.push("  · Soldiers unlock at " + fmt(SIEGE_UNLOCK) +
      " ants too, or nothing could be raised in time.");
  }
  const failRule = challengeFailKind(challenge);
  if (failRule) lines.push("  · " + failRule.rule);
  TRIAL_GIVES_UP.forEach(line => lines.push("  · " + line));
  lines.push("");
  lines.push("WHAT COMES WITH YOU");
  TRIAL_KEEPS.forEach(line => lines.push("  · " + line));
  lines.push("");
  lines.push("TO CLEAR IT");
  const kind = targetKind(challenge);
  lines.push("  · " + kind.verb + " " + fmt(challengeTargetAmount(game, challenge)) + " " +
    kind.noun + " " + kind.of +
    (mine ? " — you have " + fmt(challengeCount()) : ""));
  // a food-measured ask moves with the food masteries held, or a mastered
  // colony would be meeting a target tuned for one that had nothing
  if (kind.scalesWithFood) {
    lines.push("  · That figure rises with every food mastery you hold, so what " +
      "this trial asks is always what this colony manages under the debuff.");
  }
  lines.push("");
  lines.push("IF YOU CLEAR IT");
  const m = challenge.mastery;
  if (m) {
    const now = Math.pow(m.step, bestTrialLevel(game, challenge.id));
    const then = Math.pow(m.step, Math.max(bestTrialLevel(game, challenge.id), level + 1));
    lines.push("  · " + m.name + " goes from × " + fmt(now) + " to × " + fmt(then) +
      " " + m.type + " — × " + m.step + " for every level, kept for good.");
  }
  const rewardNow = challengeReward(game);
  const rewardThen = rewardNow * CHALLENGE_REWARD_STEP;
  lines.push("  · The trials bonus goes from × " + fmt(rewardNow) + " to × " + fmt(rewardThen) +
    " food — × " + CHALLENGE_REWARD_STEP + " for every level cleared in any trial.");
  if (m && m.type === "food") {
    lines.push("  · Food in every colony: × " + fmt(rewardNow * masteryFood(game)) +
      " now, × " + fmt(rewardThen * Math.pow(m.step,
        Math.max(bestTrialLevel(game, challenge.id), level + 1))) + " after.");
  } else if (m) {
    lines.push("  · You would hold × " + fmt(rewardThen * masteryFood(game)) + " food and × " +
      fmt(Math.pow(m.step, Math.max(bestTrialLevel(game, challenge.id), level + 1))) +
      " " + m.type + ", in every colony.");
  }
  if (m) {
    const raised = linesWithMastery(m.type);
    if (raised.length) {
      lines.push("  · Max level rises by one on " + listNames(raised.map(l => l.name)) +
        " — every level of this trial raises their cap, and the levels past the" +
        " defined top cost protein as well as food.");
    }
  }
  lines.push("  · All of it applies everywhere, inside trials as well as outside.");
  lines.push(level + 1 >= CHALLENGE_MAX_LEVEL
    ? "  · That is the last level — the trial would be mastered."
    : "  · Attempt " + (level + 2) + " would then run at " +
      ((challenge.kind || "food") === "siege"
        ? "× " + fmt(siegeThreatScaleAt(level + 1)) + " attacker strength."
        : "× " + pct(challengeDebuffAt(level + 1)) + " food."));
  return lines.join("\n");
}

// A trial is a colony you found on purpose under conditions that should kill
// it. Entering and abandoning both cost the colony, so both arm on the button
// itself -- confirm() returns false inside a blocked embed, which is what made
// the erase button look dead.
function buildChallenges() {
  const list = el("challengeList");
  CHALLENGES.forEach(challenge => {
    const card = document.createElement("div");
    card.className = "challenge";
    card.innerHTML =
      '<div class="challenge-head"><b></b><span class="challenge-level"></span></div>' +
      '<span class="challenge-flavour"></span>' +
      '<span class="challenge-rule"></span>' +
      '<span class="challenge-target"></span>' +
      '<span class="challenge-reward"></span>';
    card.querySelector("b").textContent = challenge.name;
    card.querySelector(".challenge-flavour").textContent = challenge.flavour;

    const button = document.createElement("button");
    button.className = "challenge-enter";
    button.onclick = () => {
      if (!challenge.open) return;
      const running = activeChallenge(game);
      const mine = !!running && running.id === challenge.id;
      if (mine && challengeMet()) { completeChallenge(); render(); return; }
      if (button.dataset.armed !== "yes") {
        button.dataset.armed = "yes";
        setTimeout(() => { button.dataset.armed = ""; render(); }, 5000);
        render();
        return;
      }
      button.dataset.armed = "";
      if (mine) abandonChallenge(); else enterChallenge(challenge.id);
      render();
    };
    card.appendChild(button);

    watch(card, {
      title: challenge.name,
      body: challenge.flavour,
      note: () => trialDetail(challenge),
      warn: false
    });

    challengeCards[challenge.id] = {
      card, button,
      level: card.querySelector(".challenge-level"),
      rule: card.querySelector(".challenge-rule"),
      target: card.querySelector(".challenge-target"),
      reward: card.querySelector(".challenge-reward")
    };
    list.appendChild(card);
  });
}

function renderChallenges() {
  const running = activeChallenge(game);
  const levels = challengeLevelsTotal(game);
  const met = challengeMet();
  el("challengeTally").textContent = levels + (levels === 1 ? " level cleared" : " levels cleared");
  const soldierMastery = masterySoldier(game);
  el("challengeReward").textContent = levels > 0
    ? "× " + fmt(challengeReward(game) * masteryFood(game)) + " food in every colony — × " +
      fmt(challengeReward(game)) + " from levels cleared, × " + fmt(masteryFood(game)) +
      " from Deep Cisterns" +
      (soldierMastery > 1 ? " — and × " + fmt(soldierMastery) + " soldier strength from Hardened Line" : "")
    : "no reward held yet";
  el("challengeIntro").textContent = running ? "" :
    "A trial founds a brand new colony under conditions that should kill it. The Royal Lineage's " +
    "automation comes with her — Nest Memory, Brood Instinct, Standing Orders, Granary Instinct — " +
    "and its strength does not: no food multipliers, no extra cap, brood or reserves. Everything " +
    "earned on the Achievements tab still pays, and Colony and Combat upgrades are still bought " +
    "as normal. Point at a trial for the full list. Abandon whenever you like; you lose the colony " +
    "and nothing else." +
    // Trial clears are per species now, so a new line starts these ladders from
    // nothing -- and is not meant to climb all of them. Which masteries this
    // line needs is the whole decision: the food ones or the fighting ones.
    (currentSpecies(game) !== GENERIC
      ? " This line is " + speciesName(currentSpecies(game)) + ", and the ladders start from " +
        "nothing for her — but every bonus the matriline has ever earned is still paying, and " +
        "always will be. Clearing a trial unlocks its bonus and nothing else, so none of these " +
        "have to be climbed twice. Climb them as her for the points that finish a species, and " +
        "for the compounding food a cleared level pays this colony."
      : "");

  const note = el("challengeRunning");
  note.hidden = !running;
  if (running) {
    const rk = targetKind(running);
    const rt = { amount: challengeTargetAmount(game, running) };
    const lost = challengeFailed(game);
    const lostRule = challengeFailKind(running);
    setText(note, lost
      ? running.name + " — " + lostRule.lost
      : met
      ? running.name + " is met — " + fmt(challengeCount()) + " of " + fmt(rt.amount) + " " +
        rk.noun + ". Claim it to bank the level and found a fresh colony."
      : running.name + ", attempt " + (challengeLevel(game, running.id) + 1) +
        " — " + challengeRunningText(running, challengeLevel(game, running.id)) + ", " +
        fmt(challengeCount()) + " of " + fmt(rt.amount) + " " + rk.noun + ". " +
        "Abandoning founds a fresh colony and pays nothing.");
    note.classList.toggle("met", met && !challengeFailed(game));
    note.classList.toggle("failed", challengeFailed(game));
  }

  CHALLENGES.forEach(challenge => {
    const ui = challengeCards[challenge.id];
    const level = challengeLevel(game, challenge.id);
    const mine = !!running && running.id === challenge.id;
    ui.card.classList.toggle("locked", !challenge.open);
    ui.card.classList.toggle("running", mine);
    ui.card.classList.toggle("failed", mine && challengeFailed(game));
    const mastered = challengeMastered(game, challenge.id);
    ui.card.classList.toggle("mastered", mastered);
    setText(ui.level, !challenge.open ? "not playable yet"
      : mastered ? "mastered"
      : level > 0 ? level + " of " + CHALLENGE_MAX_LEVEL + " cleared"
      : "0 of " + CHALLENGE_MAX_LEVEL + " cleared");
    setText(ui.rule, !challenge.open ? challenge.plan
      : mastered ? "Every level survived. Nothing here is left to prove."
      : challengeDebuffText(challenge, level));
    const tKind = targetKind(challenge);
    const tAmount = challengeTargetAmount(game, challenge);
    setText(ui.target, challenge.open && !mastered
      ? "Clear it by " + tKind.gerund + " " + fmt(tAmount) + " " + tKind.noun + "." +
        (mine ? " You have " + fmt(challengeCount()) + "." : "")
      : "");
    setText(ui.reward, challenge.open && !mastered
      ? challenge.mastery.name + " pays × " + challenge.mastery.step + " " +
        challenge.mastery.type + " and " + masteryLineText(challenge.mastery.type) +
        " — kept for good, by every species the line ever becomes. Each level also " +
        "pays × " + CHALLENGE_REWARD_STEP + " food to the colony holding it, which is " +
        "the half that starts again when the line changes species."
      : "");
    ui.button.hidden = !challenge.open || mastered;
    ui.button.disabled = !challenge.open || mastered || (!!running && !mine);
    ui.button.classList.toggle("danger", mine && !met);
    const lostRun = mine && challengeFailed(game);
    setText(ui.button, mine
      ? (met ? "Claim the trial"
             : ui.button.dataset.armed === "yes"
               ? (lostRun ? "Really give it up?" : "Really abandon it?")
               : (lostRun ? "Give it up" : "Abandon"))
      : (ui.button.dataset.armed === "yes" ? "Establish a colony here?" : "Enter"));
  });
}

// Settings was one 2,282px column of everything. Same sub-tab pattern as
// Achievements and Upgrades, so each thing has a place.
const SETTINGS_TABS = [
  { id: "colony", name: "Colony" },
  { id: "automation", name: "Automation" },
  { id: "formulas", name: "Formulas" },
  { id: "record", name: "Record" },
  { id: "save", name: "Save" }
];
let settingsTab = "colony";

function selectSettingsTab(name) {
  settingsTab = name;
  SETTINGS_TABS.forEach(tab => {
    el("settingsPanel-" + tab.id).hidden = tab.id !== name;
  });
  for (const button of el("settingsTabs").children) {
    button.classList.toggle("active", button.dataset.tab === name);
  }
  render();
}

function buildSettingsTabs() {
  SETTINGS_TABS.forEach(tab => {
    const button = document.createElement("button");
    button.textContent = tab.name;
    button.dataset.tab = tab.id;
    button.onclick = () => selectSettingsTab(tab.id);
    el("settingsTabs").appendChild(button);
  });
  selectSettingsTab("colony");
}

// The stats bar is the one thing drawn on every frame whichever tab is open,
// and it was writing all twelve of its values and eight hidden flags whether or
// not any of them had changed -- the exact fault fixed everywhere else last
// release, left in the busiest place in the game.
function setHidden(node, value) {
  if (!node || node.__hid === value) return;
  node.__hid = value;
  node.hidden = value;
}

function render() {
  const reserves = el("readoutReserves");
  setHidden(reserves, game.emerged > 0);
  setText(reserves.querySelector("[data-value]"), fmt(game.reserves));
  setText(el("valFood"), fmt(game.food));
  setText(el("valRate"), fmt(foodPerSecond(game)) + "/s");
  setText(el("valPop"), fmt(population(game)) + " / " + fmt(populationCap(game)));
  setText(el("valEggs"), fmt(game.eggs.length));
  const proteinRow = el("readoutProtein");
  const noProtein = !raidsUnlocked(game) && game.protein <= 0;
  setHidden(proteinRow, noProtein);
  setText(el("valProtein"), fmt(game.protein));
  setHidden(el("readoutProteinRate"), noProtein);
  setText(el("valProteinRate"), fmt(proteinPerSecond(game)) + "/s");

  const p = game.prestige || {};
  setHidden(el("readoutRoyalJelly"), !prestigeUnlocked(game) && !(p.royalJelly > 0));
  setText(el("valRoyalJelly"), fmt(p.royalJelly || 0));

  setText(el("valTime"), fmtTime(game.runTime || 0));
  // the line of queens, shown only once there is more than one of them --
  // before the first flight it would just repeat the colony age
  const flown = (game.prestige && game.prestige.flightsTaken || 0) > 0;
  setHidden(el("readoutMatriline"), !flown);
  if (flown) setText(el("valMatriline"), fmtTime(game.stats.playtime));

  setHidden(el("tabButton-prestige"), !prestigeUnlocked(game));
  setHidden(el("tabButton-matriline"), !matrilineVisible(game));
  setHidden(el("tabButton-challenges"), !challengesUnlocked(game));
  setHidden(el("tabButton-library"), !libraryUnlocked(game));
  setHidden(el("takeover"), holdsSave());
  renderAway();
  renderTutorial();
  renderBadges();
  renderInspector();
  renderQueen();
  renderWings();
  renderMilestone();
  renderBrood();
  renderCombatBar();
  renderRaid();
  if (activeTab === "ants") renderAnts();
  else if (activeTab === "upgrades") renderUpgrades();
  else if (activeTab === "achievements") {
    renderAchievements(game);
    renderInstincts(game);
    // a sub-tab can say that something is waiting on it, which is the whole
    // point of a dot -- a track that moved, or an instinct you can now afford
    markSubTab("achievementTabs", "tracks", newTrackCount(game));
    markSubTab("achievementTabs", "instincts", affordableInstincts(game));
  }
  else if (activeTab === "combat") renderFighters();
  else if (activeTab === "prestige") renderPrestige();
  else if (activeTab === "matriline") renderMatriline();
  else if (activeTab === "challenges") renderChallenges();
  else if (activeTab === "library") {
    // marked here rather than inside renderLibrary(), which only runs on the
    // terms sub-tab -- a player who left it on What changed never cleared the
    // dot at all, and it read as a badge that never goes away
    markSeen("library", libraryCounts(game).known);
    // libraryTab holds a GROUP id now, never "terms" -- checking for the old
    // value meant renderLibrary() never ran and pressing a category did nothing
    if (libraryTab === "updates") renderUpdates(); else renderLibrary();
  }
  else if (activeTab === "settings") {
    renderSettings();
    if (settingsTab === "formulas") renderFormulas();
    const unlocked = !el("automationSection").hidden;
    el("automationLocked").hidden = unlocked;
  }
}

// ---------------------------------------------------------- the Matriline
//
// Layer 2. The species cards say what each one rewrites and what it banks for
// good; the tree says what carries through a reset. Cards are built once and
// updated in place, never reparented -- a node detached between mousedown and
// mouseup never receives its click, which is what once made upgrades unbuyable.

const speciesCards = {};
const matUpgradeCards = {};
let matPick = null;
// "line" is the matriline itself -- the reset, the overview and the tree that
// every species shares. Each species then has its own tab holding only its own
// adaptations, which is what keeps their buffs from reading as one pile.
let matSubTab = "line";

function buildMatrilineTabs() {
  const bar = el("matTabs");
  const tabs = [{ id: "line", name: "The line" }].concat(
    SPECIES.map(s => ({ id: s.id, name: s.name })));
  for (const tab of tabs) {
    const button = document.createElement("button");
    button.textContent = tab.name;
    button.dataset.tab = tab.id;
    button.addEventListener("click", () => { matSubTab = tab.id; render(); });
    bar.appendChild(button);
  }
}

function buildMatriline() {
  buildMatrilineTabs();
  const list = el("matSpeciesList");
  for (const s of SPECIES) {
    const card = document.createElement("section");
    card.className = "species-card";
    card.innerHTML = '<div class="species-head"><b></b>' +
      '<span class="species-state"></span></div>' +
      '<p class="species-flavour"></p>' +
      '<p class="species-active"></p>' +
      '<p class="species-passive"></p>' +
      '<p class="species-progress"></p>';
    list.appendChild(card);
    speciesCards[s.id] = {
      card,
      name: card.querySelector("b"),
      state: card.querySelector(".species-state"),
      flavour: card.querySelector(".species-flavour"),
      active: card.querySelector(".species-active"),
      passive: card.querySelector(".species-passive"),
      progress: card.querySelector(".species-progress")
    };
    watch(card, {
      title: s.name,
      body: s.flavour,
      note: () => "WHILE YOU ARE PLAYING IT\n  · " + s.activeText +
        "\n\nONCE IT IS FINISHED, FOR GOOD\n  · " + s.passiveName + " — " + s.passiveText +
        "\n\nFINISHING IT\n  · " + SPECIES_TARGET + " points. A trial level as this species is worth " +
        "2, a nuptial flight as it is worth 1, and each of its two adaptations is worth 4 — " +
        "so the trials are the fast road and the flights are the patient one, and neither is forced.",
      warn: false });
  }

  const pick = el("matPickList");
  for (const s of SPECIES) {
    const button = document.createElement("button");
    button.className = "species-pick";
    button.textContent = s.name;
    button.addEventListener("click", () => { matPick = s.id; render(); });
    pick.appendChild(button);
    speciesCards[s.id].pick = button;
  }

  const tree = el("matUpgradeList");
  for (const u of MATRILINE_UPGRADES) {
    const card = document.createElement("button");
    card.className = "upgrade mat-upgrade " + u.group;
    card.innerHTML = '<div class="upgrade-head"><b></b><span class="upgrade-level"></span></div>' +
      '<span class="upgrade-desc"></span><span class="upgrade-cost"></span>';
    card.addEventListener("click", () => { if (buyMatrilineUpgrade(u.id)) render(); });
    tree.appendChild(card);
    matUpgradeCards[u.id] = {
      card,
      name: card.querySelector("b"),
      level: card.querySelector(".upgrade-level"),
      desc: card.querySelector(".upgrade-desc"),
      cost: card.querySelector(".upgrade-cost")
    };
    watch(card, { title: u.name, body: u.desc,
      note: () => "COSTS\n  · " + u.cost + " Haplotype" +
        (u.species ? "\n\nCOUNTS TOWARDS\n  · Finishing " + speciesName(u.species) +
          ", worth 4 of the " + SPECIES_TARGET + " points it needs." : ""),
      warn: false });
  }

  el("btnMatriline").addEventListener("click", () => {
    const button = el("btnMatriline");
    // armed on the button itself, the same two-step the erase button uses:
    // confirm() returns false inside a blocked embed and reads as a dead button
    if (button.dataset.armed !== "yes") {
      button.dataset.armed = "yes";
      render();
      return;
    }
    button.dataset.armed = "";
    doMatrilineReset(matPick);
    matPick = null;
    render();
  });
}

function renderMatriline() {
  const m = game.matriline || {};
  const line = currentSpecies(game);
  const onLine = matSubTab === "line";
  for (const button of el("matTabs").children) {
    button.classList.toggle("active", button.dataset.tab === matSubTab);
  }
  // the reset only belongs on the line's own tab; a species tab is its
  // adaptations and nothing else
  el("matResetBox").hidden = !onLine;
  el("matSpeciesHead").textContent = onLine ? "The species" : speciesName(matSubTab);
  el("matUpgradeHead").textContent = onLine
    ? "Matriline adaptations" : speciesName(matSubTab) + " adaptations";
  el("matUpgradeNote").textContent = onLine
    ? "Held by the line itself, whichever species it becomes."
    : "Held by " + speciesName(matSubTab) + " for good, and paying only while she is the one " +
      "being played \u2014 which is why one species' adaptations never turn up in another's.";
  el("matHaploTally").textContent = fmt(haplotype(game)) + " Haplotype";
  el("matSpeciesTally").textContent = "this line: " + speciesName(line);
  el("matResetTally").textContent = matrilineCount(game) === 1
    ? "1 matriline behind her" : fmt(matrilineCount(game)) + " matrilines behind her";

  const ready = matrilineReady(game);
  const needed = matrilineJellyNeeded(game);
  el("matDesc").textContent =
    "A queen's daughter founds the next colony; her daughters found the next line. " +
    "Beginning a matriline clears everything the Royal Lineage ever gave you — the jelly, " +
    "the adaptations, all of it — and commits the line to one species for the whole run. " +
    "What survives is what the matriline tree below has bought the right to inherit.";

  const earned = haplotypeEarned(game);
  el("matYield").textContent = ready
    ? "Beginning one now would pay " + fmt(earned) + " Haplotype — " +
      matrilineFlights(game) + " flights and " + matrilineTrialLevels(game) +
      " trial levels behind this line."
    : "";
  el("matGate").textContent = ready
    ? "Ready. Choose what the line becomes."
    : !lineageComplete(game)
    ? "The Royal Lineage has to be complete first — every adaptation bought."
    : "The lineage is complete. " + fmt(jellyBanked(game)) + " of " + fmt(needed) +
      " Royal Jelly gathered in all. Every trial level the line has ever mastered cuts " +
      "that figure by " + 3 + ", so clearing trials is the fast road here and never the only one.";

  el("matSpeciesPick").hidden = !ready;
  const button = el("btnMatriline");
  button.hidden = !ready;
  button.disabled = ready && !matPick;
  setText(button, !matPick
    ? "Choose a species first"
    : button.dataset.armed === "yes"
    ? "Really begin as " + speciesName(matPick) + "? This clears the lineage."
    : "Begin a matriline as " + speciesName(matPick));

  for (const s of SPECIES) {
    const ui = speciesCards[s.id];
    ui.card.hidden = !onLine && matSubTab !== s.id;
    const finished = speciesFinished(game, s.id);
    const playing = line === s.id;
    const points = speciesPoints(game, s.id);
    setText(ui.name, s.name);
    setText(ui.state, playing ? "you are this" : finished ? "finished" : "not yet finished");
    ui.card.classList.toggle("playing", playing);
    ui.card.classList.toggle("finished", finished);
    setText(ui.flavour, s.flavour);
    setText(ui.active, (playing ? "Active now — " : "Active only while chosen — ") + s.activeText);
    setText(ui.passive, s.passiveName + (finished ? " (paying) — " : " (once finished) — ") +
      s.passiveText);
    setText(ui.progress, finished
      ? "Banked for good, at full strength, whichever species the line becomes next."
      : points + " of " + SPECIES_TARGET + " points — " +
        speciesTrialLevels(game, s.id) + " trial levels, " +
        speciesFlights(game, s.id) + " flights, " +
        speciesBranchOwned(game, s.id) + " of " + speciesBranch(s.id).length + " adaptations.");
    if (ui.pick) {
      ui.pick.classList.toggle("active", matPick === s.id);
      setText(ui.pick, s.name + (finished ? " ✓" : ""));
    }
  }

  for (const u of MATRILINE_UPGRADES) {
    const ui = matUpgradeCards[u.id];
    ui.card.hidden = onLine ? !!u.species : u.species !== matSubTab;
    const owned = matrilineUpgradeOwned(game, u.id);
    const afford = haplotype(game) >= u.cost;
    setText(ui.name, u.name);
    setText(ui.level, u.species ? speciesName(u.species) : u.group);
    setText(ui.desc, u.desc);
    setText(ui.cost, owned ? "bought" : fmt(u.cost) + " Haplotype");
    ui.cost.classList.toggle("affordable", !owned && afford);
    ui.cost.classList.toggle("owned-tag", owned);
    ui.card.classList.toggle("owned", owned);
    ui.card.disabled = owned || !afford;
  }
}

// ------------------------------------------------------- the away report
//
// The colony kept working while nobody was watching, and the one-line note that
// used to say so could not say the thing that matters most: how much of the
// absence actually counted. Away for thirty hours against an eight hour cap is
// twenty-two hours the colony did not work, and the line read "while you were
// away -- 8h" as though that were the whole story.
//
// The catch-up itself is NOT animated. load() applies it in one pass before any
// of this runs, so the colony is already in its final state and what is animated
// is only the reveal -- the clock sweeping the absence and the figures counting
// up to numbers that are already true. Deferring the real ticks across frames
// would let the player lay an egg halfway through and land somewhere the instant
// path never would.
const AWAY_MODAL_MIN = 300;        // five minutes; a tab-switch should not nag
const AWAY_SWEEP_MS = 1600;
const awayRows = [];
let awayAnim = null;

function buildAwayReport() {
  const list = el("awayRows");
  for (let i = 0; i < 6; i++) {
    const row = document.createElement("div");
    row.className = "away-row";
    row.innerHTML = '<span class="away-label"></span><b class="away-value"></b>';
    list.appendChild(row);
    awayRows.push({ row, label: row.querySelector(".away-label"), value: row.querySelector(".away-value") });
  }
  el("awayClose").onclick = closeAwayReport;
  el("awaySkip").onclick = () => { finishAwaySweep(); };
  el("awayModal").onclick = event => {
    if (event.target === el("awayModal")) closeAwayReport();
  };
}

function awayFigures(away) {
  const rows = [];
  rows.push(["Food gathered", () => "+" + fmt(away.food)]);
  if (away.protein > 0.5) rows.push(["Protein rendered", () => "+" + fmt(away.protein)]);
  if (away.hatched > 0) rows.push(["Ants hatched", () => fmt(away.hatched)]);
  const grew = away.popAfter - away.popBefore;
  if (grew !== 0) {
    rows.push(["The colony", () => fmt(away.popBefore) + " \u2192 " + fmt(away.popAfter) +
      " ants (" + (grew > 0 ? "+" : "") + fmt(grew) + ")"]);
  }
  if (away.won > 0 || away.lost > 0) {
    rows.push(["Raids", () => away.won + " won, " + away.lost + " lost"]);
  }
  return rows.slice(0, awayRows.length);
}

function openAwayReport(away) {
  if (!away || away.seen) return;
  markAwaySeen();
  if (game.settings.awayReport === false || away.seconds < AWAY_MODAL_MIN) return;
  const figures = awayFigures(away);
  el("awaySpan").textContent = "The colony worked for " + fmtTime(away.seconds) +
    (away.capped ? " of the " + fmtTime(away.requested) + " you were gone." : ".");
  el("awayCapNote").hidden = !away.capped;
  if (away.capped) {
    el("awayCapNote").textContent = "The nest can only carry on for " + fmtTime(away.cap) +
      " unwatched, so " + fmtTime(away.requested - away.seconds) + " of that went unworked. " +
      "Crop Reserve and Full Crop both lengthen it.";
  }
  el("awayBottleneck").textContent = away.hiding
    ? "She went to ground while you were gone \u2014 there are no soldiers, so nothing is attacking and foraging is halved."
    : (colonyBottleneck() || {}).text || "";
  awayRows.forEach((ui, i) => {
    const figure = figures[i];
    ui.row.hidden = !figure;
    if (figure) { ui.label.textContent = figure[0]; ui.value.textContent = ""; }
  });
  el("awayModal").hidden = false;
  startAwaySweep(away, figures);
}

function startAwaySweep(away, figures) {
  const began = (typeof performance !== "undefined" ? performance.now() : Date.now());
  awayAnim = { away, figures, began, done: false };
  el("awaySkip").hidden = false;
  stepAwaySweep();
}

// eased so it rushes through the middle of the absence and settles at the end,
// which is what "time speeding up" actually feels like
function stepAwaySweep() {
  if (!awayAnim || awayAnim.done) return;
  const now = (typeof performance !== "undefined" ? performance.now() : Date.now());
  const t = Math.min(1, (now - awayAnim.began) / AWAY_SWEEP_MS);
  const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  paintAwaySweep(eased);
  if (t >= 1) { finishAwaySweep(); return; }
  requestAnimationFrame(stepAwaySweep);
}

function paintAwaySweep(share) {
  const away = awayAnim.away;
  el("awayBar").style.width = (share * 100).toFixed(1) + "%";
  el("awayClock").textContent = fmtTime(away.seconds * share);
  awayAnim.figures.forEach((figure, i) => {
    const ui = awayRows[i];
    if (!ui) return;
    // the last row of each is a string rather than a number, so the sweep only
    // scales the ones that count
    ui.value.textContent = share >= 1 ? figure[1]() : partialFigure(figure, share);
  });
}

function partialFigure(figure, share) {
  const full = figure[1]();
  // count up anything that is a single figure; leave composed lines to the end
  const single = /^\+?[\d.]+[KMBTQSOND]*$/.test(full.replace(/,/g, ""));
  if (!single) return full;
  const sign = full.startsWith("+") ? "+" : "";
  const value = parseAmount(full.replace(/^\+/, ""));
  return Number.isFinite(value) ? sign + fmt(value * share) : full;
}

function finishAwaySweep() {
  if (!awayAnim) return;
  awayAnim.done = true;
  paintAwaySweep(1);
  el("awaySkip").hidden = true;
  awayAnim = null;
}

function closeAwayReport() {
  finishAwaySweep();
  el("awayModal").hidden = true;
}

// --------------------------------------------------- the brood chamber window

// The queue is strict FIFO and it is laid in batches, so a 600-egg queue is a
// handful of runs rather than 600 rows. Selecting a run selects the whole
// batch: its first egg when taking everything behind it, its last when taking
// everything ahead, so either direction destroys the batch you pointed at.
//
// The selection is held as "which run", not as an index, because eggs hatch
// while the window is open and raw indices would slide onto different eggs
// underneath the player.
let broodPick = null;   // { list: "tended" | "waiting", index }
// how many queued batches the window lists at once. The queue is FIFO, so the
// front is what a player is deciding about; beyond this it is a count.
const WAITING_RUN_LIMIT = 40;

function broodScope() {
  return game.settings.broodScope === "all" ? "all" : "waiting";
}

function broodDirection() {
  return game.settings.broodDirection === "forward" ? "forward" : "back";
}

function tendedCount() {
  return Math.min(game.eggs.length, broodCapacity(game));
}

// Stops as soon as it has one more run than the window will list. Walking all
// 208,000 eggs every frame to build 2,080 runs and then showing 40 of them was
// most of what made the window unopenable at that size -- capping the rows cut
// it from 68ms a frame to 26, and stopping the walk cuts it to under one.
function waitingRuns(limit) {
  const runs = [];
  const stopAt = limit ? limit + 1 : Infinity;
  for (let i = tendedCount(); i < game.eggs.length; i++) {
    const caste = emergingCaste(game, game.eggs[i], i);
    const last = runs[runs.length - 1];
    if (last && last.caste === caste) { last.to = i; continue; }
    if (runs.length >= stopAt) break;
    runs.push({ caste, from: i, to: i });
  }
  return runs;
}

// How many eggs at most, counted outward from the egg that was picked. Empty,
// zero or unreadable means no limit, which is what the window did before this
// existed -- runs were the unit, so a 400-egg batch went whole or not at all and
// trimming a queue to length was impossible.
//
// It counts from the PICK rather than from the end of the range, because the
// pick is the thing the player is pointing at: reaching backwards takes the
// picked egg and the next n behind it, reaching forwards takes the picked egg
// and the n ahead of it.
function broodLimit() {
  const raw = el("broodLimit").value.trim();
  if (!raw) return 0;
  const n = parseAmount(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

// the stretch of the queue the current scope allows to be taken
function broodRegion() {
  return { first: broodScope() === "all" ? 0 : tendedCount(), last: game.eggs.length - 1 };
}

function resolvePick() {
  if (!broodPick) return null;
  if (broodPick.list === "tended") {
    return broodPick.index < tendedCount() ? { from: broodPick.index, to: broodPick.index } : null;
  }
  // only ever as far as the row that was picked, which can never be past the
  // window's limit -- this runs every frame while the dialog is open
  const run = waitingRuns(broodPick.index + 1)[broodPick.index];
  return run ? { from: run.from, to: run.to } : null;
}

function broodRange() {
  const pick = resolvePick();
  const region = broodRegion();
  if (!pick || region.last < region.first) return null;
  if (pick.to < region.first) return null;   // a tended egg while the scope protects them
  let from = broodDirection() === "back" ? Math.max(pick.from, region.first) : region.first;
  let to = broodDirection() === "back" ? region.last : Math.min(pick.to, region.last);
  if (to < from) return null;
  // trim to the limit, from the picked end -- so "at most 10" reaching back
  // takes the picked egg and nine behind it, not ten from the far end
  const limit = broodLimit();
  if (limit > 0 && to - from + 1 > limit) {
    if (broodDirection() === "back") to = from + limit - 1;
    else from = to - limit + 1;
  }
  return to >= from ? { from, to } : null;
}

function casteTally(from, to) {
  const counts = {};
  for (let i = from; i <= to; i++) {
    const caste = emergingCaste(game, game.eggs[i], i);
    counts[caste] = (counts[caste] || 0) + 1;
  }
  return Object.keys(counts)
    .map(id => fmt(counts[id]) + " " + CASTES[id].name.toLowerCase())
    .join(", ");
}

// Rows are pooled and updated in place rather than rebuilt. A node detached
// between mousedown and mouseup never receives its click -- the bug the upgrade
// cards had -- and this list redraws every frame while the window is open.
// Selection binds on mousedown for the same reason.
function fillRows(box, rows) {
  while (box.children.length < rows.length) {
    const row = document.createElement("button");
    row.className = "brood-row";
    row.innerHTML = '<span class="brood-pos"></span><span class="brood-what"></span>' +
      '<span class="bar"><i></i></span><span class="brood-note"></span>';
    row.addEventListener("mousedown", () => {
      broodPick = { list: row.dataset.list, index: Number(row.dataset.index) };
      updateBroodDialog();
    });
    box.appendChild(row);
  }
  while (box.children.length > rows.length) box.removeChild(box.lastChild);
  rows.forEach((data, i) => {
    const row = box.children[i];
    row.dataset.list = data.list;
    row.dataset.index = String(data.index);
    row.disabled = !!data.locked;
    row.classList.toggle("picked", !!data.picked);
    row.classList.toggle("doomed", !!data.doomed);
    row.querySelector(".brood-pos").textContent = data.pos;
    row.querySelector(".brood-what").textContent = data.what;
    row.querySelector(".bar").hidden = data.progress === null;
    if (data.progress !== null) row.querySelector(".bar i").style.width = data.progress + "%";
    row.querySelector(".brood-note").textContent = data.note;
  });
}

function updateBroodDialog() {
  const eggs = game.eggs;
  const tended = tendedCount();
  const waiting = eggs.length - tended;
  const range = broodRange();
  const doomed = i => !!range && i >= range.from && i <= range.to;
  const period = incubationTime(game);

  el("broodSummary").textContent = eggs.length === 0
    ? "The brood chamber is empty."
    : fmt(eggs.length) + " eggs — " + fmt(tended) + " tended in " + broodCapacity(game) +
      " slots" + (waiting > 0 ? ", " + fmt(waiting) + " waiting behind them." : ".");

  const lockTended = broodScope() !== "all";
  el("broodTendedHead").textContent = "Tended — " + fmt(tended) + " developing" +
    (lockTended ? ", protected" : "");
  fillRows(el("broodTendedList"), eggs.slice(0, tended).map((egg, i) => ({
    list: "tended", index: i, locked: lockTended,
    picked: !!broodPick && broodPick.list === "tended" && broodPick.index === i,
    doomed: doomed(i),
    pos: "#" + (i + 1),
    what: CASTES[emergingCaste(game, egg, i)].name + (egg.fed ? " ·fed" : ""),
    progress: Math.min(100, (egg.progress / EGG_TIME) * 100).toFixed(1),
    note: eggSecondsLeft(egg, i).toFixed(0) + "s"
  })));

  // This window redraws every frame, and a queue built out of many small
  // batches is many runs: measured at 208,006 eggs in 2,080 batches it built
  // 2,078 rows and cost 68ms a frame, which is four frames' budget for one
  // panel and is why the details could not be opened at that size. Only the
  // front of the queue is listed -- it is strict FIFO, so the front is the part
  // that matters, and the rest is a count.
  const allRuns = waitingRuns(WAITING_RUN_LIMIT);
  const more = allRuns.length > WAITING_RUN_LIMIT;
  const runs = more ? allRuns.slice(0, WAITING_RUN_LIMIT) : allRuns;
  el("broodWaitingHead").textContent = "Waiting — " + fmt(waiting) +
    (more ? " — the first " + runs.length + " batches of it"
          : allRuns.length > 1 ? " in " + allRuns.length + " batches" : "");
  el("broodWaitingEmpty").hidden = allRuns.length > 0;
  fillRows(el("broodWaitingList"), runs.map((run, i) => ({
    list: "waiting", index: i, locked: false,
    picked: !!broodPick && broodPick.list === "waiting" && broodPick.index === i,
    doomed: doomed(run.from),
    pos: run.from === run.to ? "#" + (run.from + 1) : "#" + (run.from + 1) + "–#" + (run.to + 1),
    what: fmt(run.to - run.from + 1) + " × " + CASTES[run.caste].name,
    progress: null,
    note: ""
  })));

  el("broodScope").value = broodScope();
  el("broodDirection").value = broodDirection();
  if (document.activeElement !== el("broodLimit")) {
    el("broodLimit").value = game.settings.broodLimit || "";
  }

  const count = range ? range.to - range.from + 1 : 0;
  el("broodPlan").textContent = range
    ? "Destroy " + fmt(count) + " of " + fmt(eggs.length) + " eggs — " +
      casteTally(range.from, range.to) + ". Nothing is refunded."
    : "Pick an egg or a batch above to choose what goes.";

  // a part-grown egg is incubation already paid for, so say so plainly
  const hit = range ? Math.max(0, Math.min(range.to, tended - 1) - range.from + 1) : 0;
  const warn = el("broodWarn");
  warn.hidden = hit <= 0;
  if (hit > 0) {
    let best = 0;
    for (let i = range.from; i <= Math.min(range.to, tended - 1); i++) {
      best = Math.max(best, eggs[i].progress / EGG_TIME);
    }
    warn.textContent = fmt(hit) + (hit === 1 ? " of them is tended" : " of them are tended") +
      ", the furthest " + Math.round(best * 100) + "% grown. That incubation is lost.";
  }
  el("broodConfirm").disabled = !range;
  // promoting takes the picked batch alone, whichever way the destroy direction
  // is pointing -- the two are different questions
  const promotePick = resolvePick();
  const frontAt = tendedCount();
  const canPromote = !!promotePick && promotePick.from > frontAt;
  el("broodPromote").disabled = !canPromote;
  el("broodPromote").textContent = canPromote
    ? "Move these " + fmt(promotePick.to - promotePick.from + 1) + " to the front"
    : promotePick && promotePick.from <= frontAt ? "Already at the front" : "Move to the front";
}

function openBroodDialog() {
  if (game.eggs.length === 0) return;
  // opens on the eggs waiting for a slot, which is what the old button did
  const runs = waitingRuns(1);
  broodPick = runs.length ? { list: "waiting", index: 0 } : { list: "tended", index: 0 };
  updateBroodDialog();
  el("broodModal").hidden = false;
}

el("trainAmount").oninput = () => render();
el("btnSellProtein").onclick = () => { sellProtein(exchangeAmount()); render(); };
el("btnBuyProtein").onclick = () => { buyProtein(exchangeAmount()); render(); };
el("exchangeAmount").oninput = () => render();

el("btnBroodDetails").onclick = openBroodDialog;
el("broodClose").onclick = () => { el("broodModal").hidden = true; };
el("broodScope").onchange = event => {
  setSetting("broodScope", event.target.value);
  if (event.target.value !== "all" && broodPick && broodPick.list === "tended") broodPick = null;
  updateBroodDialog();
};
el("broodDirection").onchange = event => {
  setSetting("broodDirection", event.target.value);
  updateBroodDialog();
};
el("broodLimit").oninput = event => {
  setSetting("broodLimit", event.target.value.trim());
  updateBroodDialog();
};
el("tutorialSkip").onclick = () => { dismissTutorial(); render(); };
el("tutorialDo").onclick = () => { doAssistantStep(); render(); };

el("broodPromote").onclick = () => {
  const pick = resolvePick();
  if (pick) promoteEggRange(pick.from, pick.to);
  broodPick = null;
  updateBroodDialog();
  render();
};

el("broodConfirm").onclick = () => {
  const range = broodRange();
  if (range) destroyEggRange(range.from, range.to);
  broodPick = null;
  el("broodModal").hidden = true;
  render();
};

// A finished colony's save code runs to tens of thousands of characters -- a
// 2,400-ant nest with a full brood queue measured over 12,000, and past 60,000
// with a long queue. window.prompt() cannot carry that: browsers truncate the
// default value, a single-line box cannot be selected reliably, it is hopeless
// on a phone, and a sandboxed iframe without allow-modals returns null outright,
// which is what breaks it inside an itch.io embed.
function setSaveStatus(text, bad) {
  el("saveStatus").textContent = text || "";
  el("saveStatus").classList.toggle("bad", !!bad);
}

function openSaveDialog(mode) {
  const box = el("saveCode");
  const exporting = mode === "export";
  el("saveTitle").textContent = exporting ? "Your save code" : "Load a save code";
  el("saveHelp").textContent = exporting
    ? "Select all of it and copy. Keep it somewhere safe — it is the whole colony."
    : "Paste a save code here. It replaces the colony you have now, which cannot be undone.";
  el("saveCopy").hidden = !exporting;
  el("saveLoad").hidden = exporting;
  box.value = exporting ? exportSave() : "";
  box.readOnly = exporting;
  setSaveStatus(exporting ? box.value.length.toLocaleString() + " characters" : "");
  el("saveModal").hidden = false;
  box.focus();
  if (exporting) box.select();
}

el("saveClose").onclick = () => { el("saveModal").hidden = true; };
el("saveCopy").onclick = () => {
  const box = el("saveCode");
  box.select();
  const done = () => setSaveStatus("Copied — " + box.value.length.toLocaleString() + " characters.");
  // clipboard access needs a secure context and is not granted in every embed
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(box.value).then(done, () => {
      setSaveStatus("Could not copy for you — it is selected, press Ctrl+C.", true);
    });
  } else {
    setSaveStatus("It is selected — press Ctrl+C to copy.", true);
  }
};
el("saveLoad").onclick = () => {
  const text = el("saveCode").value.trim();
  if (!text) return setSaveStatus("Paste a save code first.", true);
  if (importSave(text)) {
    el("saveModal").hidden = true;
    render();
  } else {
    setSaveStatus("That is not a valid save code. Check nothing was cut off when you copied it.", true);
  }
};

el("btnTakeOver").onclick = () => {
  // claim without saving: this tab is the stale one, the other holds the real progress
  claimSave();
  window.location.reload();
};

el("autoLay").onchange = event => {
  setSetting("autoLay", event.target.checked);
  render();
};

el("foodReserve").oninput = event => {
  const amount = parseAmount(event.target.value);
  // half-typed values like "1." or "25q" are left alone rather than snapped to
  // zero under the player's cursor
  if (!isFinite(amount)) return;
  setSetting("foodReserve", Math.max(0, Math.floor(amount)));
  render();
};

el("feedBrood").onchange = event => {
  setSetting("feedBrood", event.target.checked);
  render();
};

el("btnShed").onclick = () => {
  shedWings();
  render();
};
el("btnStripWing").onclick = () => {
  stripWing();
  render();
};
el("btnRally").onclick = () => {
  startRally();
  render();
};
el("btnLay").onclick = () => {
  layEggs(1);
  render();
};
el("btnLayBatch").onclick = () => {
  layEggs(layAmount());
  render();
};
el("layAmount").oninput = event => {
  const amount = parseAmount(event.target.value);
  // a half-typed "1." is left alone rather than snapped to zero under the cursor
  if (!isFinite(amount)) return;
  setSetting("layAmount", Math.max(1, Math.floor(amount)));
  render();
};
el("btnLayMax").onclick = () => {
  layEggs(affordableEggs());
  render();
};

// Nothing in the stats bar or the left column explained itself -- the inspector
// only ever answered for things on the right.
function buildReadoutHelp() {
  const help = [
    ["readoutReserves", "Reserves", "What the queen's own body is worth.",
      () => "She sheds her wings for a fixed pool and it never regenerates. Eggs cost 20 each until the first worker emerges, after which reserves stop mattering for good."],
    ["valFood", "Food", "Everything the colony has gathered and not yet spent.",
      () => "Eggs cost food once the founding generation is out. " + fmt(game.food) + " banked, earning " + fmt(foodPerSecond(game)) + " a second."],
    ["valRate", "Food per second", "What the whole colony brings home.",
      () => "Every caste's output multiplied by everything that scales it. Settings has the full breakdown under Formulas."],
    ["valProtein", "Protein", "Meat off the things that attack the nest.",
      () => "Spent on the Combat adaptations, and on feeding the brood so eggs develop twice as fast. " + fmt(game.protein) + " banked."],
    ["valProteinRate", "Protein per second", "Hunting, plus each raid's share.",
      () => "Soldiers hunt between attacks and come home when one is close. Raids pay their protein in a lump, counted here across the six minutes between them."],
    ["valPop", "Population", "Every ant alive, against the room the nest has.",
      () => "Excavators raise the cap. At the cap only excavators can be laid, so a colony can always dig itself out."],
    ["valEggs", "Eggs incubating", "Everything laid and not yet hatched.",
      () => "Only the tended ones develop; the rest queue behind them. See details in the brood panel."],
    ["valFighters", "Fighters", "What the colony can field.",
      () => "Soldiers fight from birth. Every other caste needs the Combat adaptations first. The Combat tab breaks it down by caste."],
    ["valThreat", "Next attacker", "How strong the next monster is.",
      () => {
        const m = currentMonster(game);
        return m.name + ". " + m.note +
          "\n\nStrength scales with the largest this colony has been, and grows with every raid you win.";
      }],
    ["valRaidIn", "Attack in", "Time until the next monster arrives.",
      () => "Soldiers hunt while it is far off and come home in the last thirty seconds. With no soldiers at all the colony goes to ground and nothing comes."],
    ["valRoyalJelly", "Royal Jelly", "What a nuptial flight pays.",
      () => "Spent on the Royal Lineage, which survives every flight."],
    ["valTime", "Colony age", "How long this colony has stood.",
      () => "It resets with every nuptial flight. The founding nanitics measure their lives against it."],
    ["valMatriline", "Matriline", "Every colony in the line, added up.",
      () => "This one never resets. It is the whole line of queens, not the nest standing now."]
  ];
  for (const [id, title, body, note] of help) {
    const node = el(id);
    if (node) watch(node.closest(".readout") || node, { title, body, note, warn: false });
  }
  watch(el("queenPanel"), {
    title: "The queen", body: "One queen per colony, always.",
    note: () => game.wingsShed
      ? "She will never fly again. Everything the colony becomes comes out of her."
      : "She has landed and shed nothing yet. The first click is hers.",
    warn: false });
  watch(el("broodBottleneck"), {
    title: "What the colony is short of",
    body: "The one constraint actually holding growth back right now.",
    note: () => "Every upgrade is a multiplier on some part of the work, so one " +
      "aimed anywhere but the binding constraint buys almost nothing — the " +
      "\"+150%\" forager line delivers about +44% overall because foragers are " +
      "only part of the food. This line names the part that is binding. The " +
      "brood is a throughput limit rather than a speed one, so a colony whose " +
      "chambers are full cannot be bought out of it at any price; a colony with " +
      "room and no food can.",
    warn: false });
  watch(el("broodPanel"), {
    title: "The brood", body: "Eggs develop here, a few at a time.",
    note: () => broodCapacity(game) + " tended at once, " +
      fmt(Math.max(0, game.eggs.length - broodCapacity(game))) + " waiting behind them. " +
      "Nurses widen it, and so does every living founder.",
    warn: false });
}

// E opens whatever the inspector is currently showing, at full size, without
// the player having to move the mouse off the thing they are reading about.
function openInspectModal() {
  if (!el("inspectTitle").textContent || el("inspectTitle").textContent === "Point at anything") return;
  el("inspectModalTitle").textContent = el("inspectTitle").textContent;
  el("inspectModalBody").textContent = el("inspectBody").textContent;
  paintNote(el("inspectModalNote"), currentNote());
  el("inspectModalNote").className = el("inspectNote").className;
  el("inspectModal").hidden = false;
}

el("inspectModalClose").onclick = () => { el("inspectModal").hidden = true; };
el("inspectModal").onclick = event => {
  if (event.target === el("inspectModal")) el("inspectModal").hidden = true;
};
el("inspector").onclick = openInspectModal;
document.addEventListener("keydown", event => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || "");
  if (typing || event.ctrlKey || event.metaKey || event.altKey) return;
  const key = event.key.toLowerCase();
  if (key === "e") { event.preventDefault(); openInspectModal(); }
  else if (key === "escape") {
    if (!el("awayModal").hidden) closeAwayReport();
    else el("inspectModal").hidden = true;
  }
});

buildReadoutHelp();
buildTabs();
buildCasteChoice();
buildAnts(render);
buildExileDialog();
buildUpgrades(render);
buildAchievements(game);
buildPrestige(render);
buildChallenges();
buildRaidDifficulty();
buildLibrary();
buildUpdates();
buildMatriline();
buildAwayReport();
setInstinctBuyer(id => { if (buyInstinct(id)) render(); });
buildLibraryTabs();
buildCombatTabs();
buildRanks();
buildSettingsTabs();
buildSettings({
  refresh: render,
  applyTheme: () => {
    applyTheme();
    render();
  },
  applyLayout: () => {
    applyLayout();
    render();
  },
  exportSave: () => openSaveDialog("export"),
  importSave: () => openSaveDialog("import"),
  reset: () => {
    // confirm() is blocked in a sandboxed embed and returns false there, which
    // makes the button look dead. Two deliberate clicks work everywhere.
    const button = el("btnReset");
    if (button.dataset.armed !== "yes") {
      button.dataset.armed = "yes";
      button.textContent = "Really erase it? This cannot be undone";
      setTimeout(() => {
        button.dataset.armed = "";
        button.textContent = "Erase colony";
      }, 5000);
      return;
    }
    button.dataset.armed = "";
    button.textContent = "Erase colony";
    hardReset();
    render();
  }
});

drawSprite(el("queenSprite"), "queen", 4);
load();
claimSave();
applyTheme();
applyLayout();
markSeen("upgrades", affordableUpgrades());
seedSeenTracks(game);
selectTab("ants");

let lastFrame = Date.now();
function frame() {
  const now = Date.now();
  const elapsed = Math.min(Math.max(0, (now - lastFrame) / 1000), OFFLINE_CAP);
  lastFrame = now;
  const step = Math.max(0.25, elapsed / 600);
  for (let done = 0; done < elapsed; done += step) {
    tick(Math.min(step, elapsed - done));
  }
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

setInterval(save, 10000);
window.addEventListener("beforeunload", save);

