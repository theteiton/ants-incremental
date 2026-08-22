import {
  broodCapacity,
  CASTES,
  EGG_TIME,
  emergingCaste,
  incubationTime,
  NANITIC_LIFESPAN,
  nextEggCaste,
  NANITIC_GENERATION,
  eggCost,
  foodPerSecond,
  isUnlocked,
  layableCastes,
  population,
  populationCap
} from "./ants.js";
import { combatPower, hunting, huntRate, inHiding, monsterPower, raidsSeen, raidsUnlocked, RAID_WARNING } from "./raids.js";
import {
  affordableEggs,
  autoCaste,
  foodReserve,
  automationOn,
  automationUnlocked,
  broodSlots,
  cancelEggs,
  maxCancellable,
  broodSpace,
  buyPrestigeUpgrade,
  canLay,
  doFlight,
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
  raidCountdown,
  save,
  setNextCaste,
  shedWings,
  tick
} from "./game.js";
import {
  buildAnts,
  buildExileDialog,
  buildSettings,
  fmt,
  fmtTime,
  renderAnts,
  renderInspector,
  renderSettings,
  setInspect,
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
  seedSeenTracks
} from "./achievements.js";
import { drawSprite } from "./sprites.js";

const el = id => document.getElementById(id);
const TABS = ["ants", "upgrades", "achievements", "prestige", "settings"];
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

function pendingCaste() {
  return nextEggCaste(game);
}

function applyTheme() {
  document.documentElement.setAttribute("data-theme", game.settings.theme || "dark");
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
    const left = Math.max(0, NANITIC_LIFESPAN - (game.runTime || 0));
    el("queenText").textContent =
      "The first workers have emerged. Her reserves no longer matter; the colony feeds her now. " +
      "The founding nanitics die of old age in " + fmtTime(left) + ".";
  } else if (game.naniticsDied) {
    el("queenText").textContent =
      "The founding nanitics have died of old age. The colony they raised carries on without them.";
  } else {
    el("queenText").textContent =
      "The first workers have emerged. Her reserves no longer matter; the colony feeds her now.";
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
  el("btnLay10").disabled = !ready;
  el("btnLay10").textContent = "Lay ×" + Math.min(10, Math.max(1, broodSlots()));
  el("btnLayMax").disabled = !ready;
  el("btnLayMax").textContent = "Lay max (" + fmt(affordableEggs()) + ")";

  layableCastes().forEach(id => {
    const button = casteButtons[id];
    const unlocked = isUnlocked(game, id);
    button.disabled = !unlocked;
    button.classList.toggle("selected", game.nextCaste === id);
    button.textContent = unlocked
      ? CASTES[id].name
      : CASTES[id].name + " — " + CASTES[id].unlockAt + " ants";
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
    el("foodReserve").value = String(foodReserve());
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
    let soonest = 0;
    for (let i = 0; i < tended; i++) soonest = Math.max(soonest, eggs[i].progress);
    el("eggSummary").textContent =
      tended + " of " + slots + " brood slots working — next hatches in " +
      Math.max(0, (EGG_TIME - soonest) / (EGG_TIME / period)).toFixed(1) + "s" +
      (waiting > 0 ? ", " + fmt(waiting) + " waiting for a slot" : "");
  }
  const cancelButton = el("btnCancelEggs");
  cancelButton.hidden = eggs.length === 0;
  cancelButton.textContent = waiting > 0
    ? "Destroy waiting eggs (" + fmt(waiting) + ")"
    : "Destroy eggs (" + fmt(eggs.length) + ")";
  if (!el("cancelModal").hidden) updateCancelDialog();

  renderSlots(eggs, slots, tended);
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
}

function renderRaid() {
  const active = raidsUnlocked(game);
  el("raidPanel").hidden = !active;
  if (!active) return;

  const hidden = inHiding(game);
  const left = raidCountdown(game);
  const defence = combatPower(game);
  const threat = monsterPower(game);
  el("raidDefence").textContent = fmt(defence);
  el("raidThreat").textContent = fmt(threat);
  el("raidDefence").classList.toggle("losing", defence < threat);

  const soon = !hidden && left <= RAID_WARNING;
  el("raidPanel").classList.toggle("imminent", soon);
  el("raidPanel").classList.toggle("hiding", hidden);
  el("raidCountdown").textContent = hidden
    ? "The nest is shut. With no soldiers left the colony has gone to ground — nothing is coming while it stays that way."
    : soon
      ? "Something is coming — " + Math.ceil(left) + "s"
      : "Next attack in " + fmtTime(left) + ".";

  const out = hunting(game);
  el("raidHunt").hidden = game.ants.soldier === 0;
  el("raidHunt").textContent = out
    ? "Your soldiers are out hunting — +" + fmt(huntRate(game)) + " protein a second."
    : "Your soldiers are back at the nest for the fight.";

  const notice = el("raidNotice");
  const armed = game.upgrades.indexOf("combat_1") >= 0;
  notice.hidden = raidsSeen(game) === 0 || armed;
  if (!notice.hidden) {
    notice.textContent =
      "The colony has been attacked. Workers cannot fight until you teach them how — " +
      "the Combat upgrades on the Upgrades tab arm your foragers, diggers and nurses. " +
      "Soldiers hunt between attacks and come home when one is close.";
  }

  if (hidden) {
    el("raidReport").textContent =
      "Foraging is half what it was — the workers keep to cover and will not range far. " +
      "Lay a soldier and the colony opens up again; the next attack is a full six minutes away.";
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
    el("raidReport").textContent =
      "The last attacker was killed and stripped: +" + fmt(last.protein) +
      " protein, +" + fmt(last.food) + " food.";
  } else {
    const toll = Object.keys(last.dead).map(c => fmt(last.dead[c]) + " " + CASTES[c].name.toLowerCase()).join(", ");
    el("raidReport").textContent =
      "The last attacker broke through. Lost " + (toll || "nothing") +
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

function renderAway() {
  const away = lastAway;
  const box = el("awayNote");
  box.hidden = !away;
  if (!away) return;
  const bits = ["+" + fmt(away.food) + " food"];
  if (away.protein > 0.5) bits.push("+" + fmt(away.protein) + " protein");
  if (away.hatched > 0) bits.push(fmt(away.hatched) + " hatched");
  if (away.won > 0) bits.push(away.won + " raids won");
  if (away.lost > 0) bits.push(away.lost + " lost");
  box.textContent = "While you were away — " + fmtTime(away.seconds) + ": " + bits.join(", ") + ".";
}

function renderFormulas() {
  const box = el("formulaList");
  const rows = formulaSummary(game);
  while (box.children.length > rows.length) box.removeChild(box.lastChild);
  while (box.children.length < rows.length) {
    const row = document.createElement("div");
    row.className = "formula-row";
    row.innerHTML = "<b></b><span></span>";
    box.appendChild(row);
  }
  rows.forEach((entry, i) => {
    box.children[i].querySelector("b").textContent = entry.name;
    box.children[i].querySelector("span").textContent = entry.text;
  });
}

function renderBadges() {
  const upgrades = upgradeBadge();
  const achievements = newTrackCount(game);
  const prestige = affordablePrestigeUpgrades();
  el("badge-upgrades").hidden = activeTab === "upgrades" || upgrades <= 0;
  el("badge-achievements").hidden = activeTab === "achievements" || achievements <= 0;
  el("badge-prestige").hidden = activeTab === "prestige" || prestige <= 0;
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
  el("flightYield").textContent = ready
    ? "Colony is mature (" + fmt(pop) + " / " + fmt(PRESTIGE_UNLOCK) + " ants) — taking flight now yields +" +
      fmt(projected) + " Royal Jelly" +
      (perHour > 0 ? ", which is " + fmt(perHour) + " an hour for this colony so far." : ".")
    : "Colony needs " + fmt(PRESTIGE_UNLOCK) + " ants to take flight (currently " + fmt(pop) + ").";

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
      " adaptations are hers, and there is nothing left here to buy. " +
      "Royal Jelly still gathers with every flight" +
      (p.royalJelly > 0 ? " (" + fmt(p.royalJelly) + " banked)" : "") +
      ". Deeper prestige layers are being built, and the beta will carry more of them — " +
      "this is as far down as the nest goes for now.";
  }

  PRESTIGE_UPGRADES.forEach(upgrade => {
    const ui = prestigeCards[upgrade.id];
    if (!ui) return;
    const isOwned = prestigeUpgradeOwned(game, upgrade);
    ui.card.classList.toggle("owned", isOwned);
    ui.card.disabled = isOwned || p.royalJelly < upgrade.cost;
    ui.cost.textContent = isOwned ? "owned" : upgrade.cost + " Royal Jelly";
    ui.cost.classList.toggle("affordable", !isOwned && p.royalJelly >= upgrade.cost);
    ui.cost.classList.toggle("owned-tag", isOwned);
  });
}

function render() {
  const reserves = el("readoutReserves");
  reserves.hidden = game.emerged > 0;
  reserves.querySelector("[data-value]").textContent = fmt(game.reserves);
  el("valFood").textContent = fmt(game.food);
  el("valRate").textContent = fmt(foodPerSecond(game)) + "/s";
  el("valPop").textContent = fmt(population(game)) + " / " + fmt(populationCap(game));
  el("valEggs").textContent = fmt(game.eggs.length);
  const proteinRow = el("readoutProtein");
  proteinRow.hidden = !raidsUnlocked(game) && game.protein <= 0;
  el("valProtein").textContent = fmt(game.protein);
  
  const p = game.prestige || {};
  const jellyRow = el("readoutRoyalJelly");
  jellyRow.hidden = !prestigeUnlocked(game) && !(p.royalJelly > 0);
  el("valRoyalJelly").textContent = fmt(p.royalJelly || 0);

  el("valTime").textContent = fmtTime(game.runTime || 0);
  // the line of queens, shown only once there is more than one of them --
  // before the first flight it would just repeat the colony age
  const flown = (game.prestige && game.prestige.flightsTaken || 0) > 0;
  el("readoutMatriline").hidden = !flown;
  if (flown) el("valMatriline").textContent = fmtTime(game.stats.playtime);

  el("tabButton-prestige").hidden = !prestigeUnlocked(game);
  el("takeover").hidden = holdsSave();
  renderAway();
  renderBadges();
  renderInspector();
  renderQueen();
  renderBrood();
  renderRaid();
  if (activeTab === "ants") renderAnts();
  else if (activeTab === "upgrades") renderUpgrades();
  else if (activeTab === "achievements") renderAchievements(game);
  else if (activeTab === "prestige") renderPrestige();
  else if (activeTab === "settings") {
    renderSettings();
    renderFormulas();
  }
}

function updateCancelDialog() {
  const allowed = maxCancellable();
  const input = el("cancelAmount");
  let amount = Math.max(0, Math.min(allowed, Math.floor(Number(input.value) || 0)));
  input.value = String(amount);
  input.max = String(allowed);
  const slots = broodCapacity(game);
  const waiting = Math.max(0, game.eggs.length - slots);
  el("cancelDetail").textContent =
    "Destroy " + fmt(amount) + " of " + fmt(game.eggs.length) + " eggs. " +
    "They go from the back of the queue, so the eggs closest to hatching are the last to be taken. " +
    "Nothing is refunded." +
    (waiting > 0 ? " " + fmt(waiting) + " are waiting for a slot." : "");
  el("cancelConfirm").disabled = amount <= 0;
}

function openCancelDialog() {
  if (maxCancellable() <= 0) return;
  const slots = broodCapacity(game);
  const waiting = Math.max(0, game.eggs.length - slots);
  el("cancelAmount").value = String(waiting > 0 ? waiting : game.eggs.length);
  updateCancelDialog();
  el("cancelModal").hidden = false;
}

el("btnCancelEggs").onclick = openCancelDialog;
el("cancelAmount").oninput = updateCancelDialog;
el("cancelKeep").onclick = () => { el("cancelModal").hidden = true; };
el("cancelConfirm").onclick = () => {
  cancelEggs(Number(el("cancelAmount").value));
  el("cancelModal").hidden = true;
  render();
};
[1, 10, 100].forEach(n => {
  const chip = document.createElement("button");
  chip.className = "chip";
  chip.textContent = "+" + n;
  chip.onclick = () => {
    el("cancelAmount").value = String(Math.min(maxCancellable(), Number(el("cancelAmount").value) + n));
    updateCancelDialog();
  };
  el("cancelQuick").appendChild(chip);
});
const cancelAll = document.createElement("button");
cancelAll.className = "chip";
cancelAll.textContent = "All";
cancelAll.onclick = () => {
  el("cancelAmount").value = String(maxCancellable());
  updateCancelDialog();
};
el("cancelQuick").appendChild(cancelAll);

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
  setSetting("foodReserve", Math.max(0, Math.floor(Number(event.target.value) || 0)));
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
el("btnLay").onclick = () => {
  layEggs(1);
  render();
};
el("btnLay10").onclick = () => {
  layEggs(10);
  render();
};
el("btnLayMax").onclick = () => {
  layEggs(affordableEggs());
  render();
};

buildTabs();
buildCasteChoice();
buildAnts(render);
buildExileDialog();
buildUpgrades(render);
buildAchievements(game);
buildPrestige(render);
buildSettings({
  refresh: render,
  applyTheme: () => {
    applyTheme();
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

