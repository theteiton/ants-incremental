import {
  broodCapacity,
  CASTES,
  EGG_TIME,
  emergingCaste,
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
import { combatPower, hunting, huntRate, inHiding, monsterPower, raidsSeen, raidsUnlocked, RAID_WARNING } from "./raids.js";
import {
  affordableEggs,
  autoCaste,
  foodReserve,
  automationOn,
  automationUnlocked,
  broodSlots,
  destroyEggRange,
  broodSpace,
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
  CHALLENGE_TARGET,
  activeChallenge,
  challengeDebuff,
  challengeDebuffAt,
  challengeLevel,
  challengeLevelsTotal,
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
  shortAmount,
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
const TABS = ["ants", "upgrades", "achievements", "prestige", "challenges", "settings"];
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
    const left = Math.max(0, naniticLifespan(game) - (game.runTime || 0));
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

function renderMilestone() {
  const box = el("queenMilestone");
  box.hidden = !game.wingsShed;
  if (box.hidden) return;
  // reads the run high-water mark, the same figure the gates themselves read,
  // so a lost raid never walks the milestone backwards
  const reach = runPeakCount(game, "population");
  const next = MILESTONES.find(milestone => reach < milestone.at);
  box.textContent = next
    ? "Next milestone at " + fmt(next.at) + " ants — " + next.text +
      " " + fmt(reach) + " so far, " + fmt(next.at - reach) + " to go."
    : "Every milestone this colony has is behind her, the last being the Nuptial Flight at " +
      fmt(PRESTIGE_UNLOCK) + " ants. Deeper ones are being built for the beta.";
}

function renderRally() {
  const state = el("rallyState");
  el("btnRally").disabled = !rallyReady();
  state.classList.toggle("live", rallyActive(game));
  if (rallyActive(game)) {
    state.textContent = "Out in force — ×" + RALLY_MULT + " forager food for another " +
      Math.ceil(game.rallyTime) + "s, the colony on " + fmt(foodPerSecond(game)) + "/s.";
  } else if (game.rallyCooldown > 0) {
    state.textContent = "The foragers are resting. Ready again in " +
      Math.ceil(game.rallyCooldown) + "s.";
  } else {
    state.textContent = "Work the trails hard: ×" + RALLY_MULT + " forager food for " +
      RALLY_DURATION + "s, then " + RALLY_COOLDOWN + "s to recover.";
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
  detailsButton.textContent = "See details (" + fmt(eggs.length) + " eggs" +
    (waiting > 0 ? ", " + fmt(waiting) + " waiting)" : ")");
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
    : activeChallenge(game)
      ? "No alate leaves a trial. " + activeChallenge(game).name +
        " has to be claimed or abandoned on the Trials tab before she can fly again."
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
      " adaptations are hers. The Trials tab is open: her daughters can now found a colony " +
      "under conditions that should kill it, and every level cleared feeds every colony after. " +
      "Royal Jelly still gathers with every flight" +
      (p.royalJelly > 0 ? " (" + fmt(p.royalJelly) + " banked)" : "") + ".";
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

const challengeCards = {};

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
      '<span class="challenge-target"></span>';
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
      note: () => {
        if (!challenge.open) return challenge.rule;
        const level = challengeLevel(game, challenge.id);
        return [
          challenge.rule,
          "Cleared " + level + (level === 1 ? " time." : " times.") +
            " The next attempt runs at " + fmt(challengeDebuffAt(level) * 100) + "% food.",
          challenge.target,
          challenge.reward
        ].filter(Boolean).join("\n");
      },
      warn: false
    });

    challengeCards[challenge.id] = {
      card, button,
      level: card.querySelector(".challenge-level"),
      rule: card.querySelector(".challenge-rule"),
      target: card.querySelector(".challenge-target")
    };
    list.appendChild(card);
  });
}

function renderChallenges() {
  const running = activeChallenge(game);
  const levels = challengeLevelsTotal(game);
  const met = challengeMet();
  el("challengeTally").textContent = levels + (levels === 1 ? " level cleared" : " levels cleared");
  el("challengeReward").textContent = levels > 0
    ? "×" + fmt(challengeReward(game)) + " food, held everywhere"
    : "no reward held yet";
  el("challengeIntro").textContent = running ? "" :
    "A trial founds a colony under conditions that should kill it. The lineage's automation comes with " +
    "you; its strength does not. The target never moves — every level asks for the same " +
    fmt(CHALLENGE_TARGET) + " ants, and every level makes them harder to raise.";

  const note = el("challengeRunning");
  note.hidden = !running;
  if (running) {
    note.textContent = met
      ? running.name + " is met — " + fmt(population(game)) + " ants standing. Claim it to bank the level."
      : "Running " + running.name + ", attempt " + (challengeLevel(game, running.id) + 1) +
        " — food at " + fmt(challengeDebuff(game) * 100) + "%, " +
        fmt(Math.max(0, CHALLENGE_TARGET - population(game))) + " ants to go. " +
        "Abandoning founds a fresh colony and pays nothing.";
    note.classList.toggle("met", met);
  }

  CHALLENGES.forEach(challenge => {
    const ui = challengeCards[challenge.id];
    const level = challengeLevel(game, challenge.id);
    const mine = !!running && running.id === challenge.id;
    ui.card.classList.toggle("locked", !challenge.open);
    ui.card.classList.toggle("running", mine);
    ui.level.textContent = !challenge.open ? "sealed"
      : level > 0 ? "cleared ×" + level : "never cleared";
    ui.rule.textContent = challenge.rule;
    ui.target.textContent = challenge.open
      ? challenge.target + " Next attempt runs at " +
        fmt(challengeDebuffAt(level) * 100) + "% food."
      : "";
    ui.button.hidden = !challenge.open;
    ui.button.disabled = !challenge.open || (!!running && !mine);
    ui.button.classList.toggle("danger", mine && !met);
    ui.button.textContent = mine
      ? (met ? "Claim the trial"
             : ui.button.dataset.armed === "yes" ? "Really abandon it?" : "Abandon")
      : (ui.button.dataset.armed === "yes" ? "Found a colony here?" : "Enter");
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
  el("tabButton-challenges").hidden = !challengesUnlocked(game);
  el("takeover").hidden = holdsSave();
  renderAway();
  renderBadges();
  renderInspector();
  renderQueen();
  renderWings();
  renderMilestone();
  renderBrood();
  renderRaid();
  if (activeTab === "ants") renderAnts();
  else if (activeTab === "upgrades") renderUpgrades();
  else if (activeTab === "achievements") renderAchievements(game);
  else if (activeTab === "prestige") renderPrestige();
  else if (activeTab === "challenges") renderChallenges();
  else if (activeTab === "settings") {
    renderSettings();
    renderFormulas();
  }
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

function broodScope() {
  return game.settings.broodScope === "all" ? "all" : "waiting";
}

function broodDirection() {
  return game.settings.broodDirection === "forward" ? "forward" : "back";
}

function tendedCount() {
  return Math.min(game.eggs.length, broodCapacity(game));
}

function waitingRuns() {
  const runs = [];
  for (let i = tendedCount(); i < game.eggs.length; i++) {
    const caste = emergingCaste(game, game.eggs[i], i);
    const last = runs[runs.length - 1];
    if (last && last.caste === caste) last.to = i;
    else runs.push({ caste, from: i, to: i });
  }
  return runs;
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
  const run = waitingRuns()[broodPick.index];
  return run ? { from: run.from, to: run.to } : null;
}

function broodRange() {
  const pick = resolvePick();
  const region = broodRegion();
  if (!pick || region.last < region.first) return null;
  if (pick.to < region.first) return null;   // a tended egg while the scope protects them
  const from = broodDirection() === "back" ? Math.max(pick.from, region.first) : region.first;
  const to = broodDirection() === "back" ? region.last : Math.min(pick.to, region.last);
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

  const runs = waitingRuns();
  el("broodWaitingHead").textContent = "Waiting — " + fmt(waiting) +
    (runs.length > 1 ? " in " + runs.length + " batches" : "");
  el("broodWaitingEmpty").hidden = runs.length > 0;
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
}

function openBroodDialog() {
  if (game.eggs.length === 0) return;
  // opens on the eggs waiting for a slot, which is what the old button did
  const runs = waitingRuns();
  broodPick = runs.length ? { list: "waiting", index: 0 } : { list: "tended", index: 0 };
  updateBroodDialog();
  el("broodModal").hidden = false;
}

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
buildChallenges();
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

