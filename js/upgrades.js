import {
  BASE_BROOD_SLOTS,
  broodCapacity,
  CASTES,
  EGG_TIME,
  foodPerSecond,
  incubationTime,
  peakCasteCount,
  populationCap,
  UPGRADES,
  upgradeBranch,
  upgradeCurrency,
  upgradeNeedsRaid,
  upgradeOwned,
  upgradeUnlocked
} from "./ants.js";
import { combatPower, monsterPower, raidRewards } from "./raids.js";
import { buyUpgrade, game, markSeen, setSetting } from "./game.js";
import { fmt, watch } from "./panels.js";

const el = id => document.getElementById(id);

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
