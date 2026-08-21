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
import { combatPower, hunting, huntRate, monsterPower, raidsSeen, raidsUnlocked, RAID_WARNING } from "./raids.js";
import {
  affordableEggs,
  broodSlots,
  broodSpace,
  buyPrestigeUpgrade,
  canLay,
  doFlight,
  exportSave,
  game,
  hardReset,
  importSave,
  claimSave,
  feedableEggs,
  holdsSave,
  layEggs,
  load,
  PRESTIGE_UNLOCK,
  PRESTIGE_UPGRADES,
  prestigeUpgradeOwned,
  proteinUnlocked,
  flightReady,
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

  const cost = eggCost(game);
  const space = broodSpace();
  const emerging = pendingCaste();
  el("eggCost").textContent = space > 0
    ? "A " + CASTES[emerging].name.toLowerCase() + " egg costs " +
      fmt(cost.amount) + " " + cost.resource + ". Chamber space: " + fmt(space) + "."
    : "The nest is full at " + fmt(populationCap(game)) +
      ". Only excavators can be laid now — they dig their own chambers.";

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

  const left = raidCountdown(game);
  const defence = combatPower(game);
  const threat = monsterPower(game);
  el("raidDefence").textContent = fmt(defence);
  el("raidThreat").textContent = fmt(threat);
  el("raidDefence").classList.toggle("losing", defence < threat);

  const soon = left <= RAID_WARNING;
  el("raidPanel").classList.toggle("imminent", soon);
  el("raidCountdown").textContent = soon
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
  el("flightYield").textContent = ready
    ? "Colony is mature (" + fmt(pop) + " / " + fmt(PRESTIGE_UNLOCK) + " ants) — Taking flight now yields +" + fmt(projected) + " Royal Jelly."
    : "Colony needs " + fmt(PRESTIGE_UNLOCK) + " ants to take flight (currently " + fmt(pop) + ").";

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

  el("valTime").textContent = fmtTime(game.stats.playtime);

  el("tabButton-prestige").hidden = !prestigeUnlocked(game);
  el("takeover").hidden = holdsSave();
  renderBadges();
  renderInspector();
  renderQueen();
  renderBrood();
  renderRaid();
  if (activeTab === "ants") renderAnts();
  else if (activeTab === "upgrades") renderUpgrades();
  else if (activeTab === "achievements") renderAchievements(game);
  else if (activeTab === "prestige") renderPrestige();
  else if (activeTab === "settings") renderSettings();
}

el("btnTakeOver").onclick = () => {
  // claim without saving: this tab is the stale one, the other holds the real progress
  claimSave();
  window.location.reload();
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
  exportSave: () => window.prompt("Copy your save code:", exportSave()),
  importSave: () => {
    const text = window.prompt("Paste a save code:");
    if (!text) return;
    window.alert(importSave(text) ? "Save imported." : "That save code is not valid.");
    render();
  },
  reset: () => {
    if (!window.confirm("Erase this colony and start over? This cannot be undone.")) return;
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

