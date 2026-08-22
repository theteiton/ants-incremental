import {
  achievementFoodBonus,
  BASE_BROOD_SLOTS,
  bigForagerOutput,
  BASE_POPULATION_CAP,
  baseFood,
  broodCapacity,
  CAP_PER_EXCAVATOR,
  CASTES,
  casteFlatBonus,
  casteFoodPerSecond,
  casteHasMultiplier,
  casteMultiplier,
  effectTotal,
  foodPerSecond,
  globalUpgradeMultiplier,
  hidingPenalty,
  runPeakCount,
  populationCap,
  slotsPerNurse,
  UPGRADES,
  upgradeBranch,
  upgradeCurrency,
  upgradeNeedsRaid,
  upgradeOwned,
  upgradeUnlocked
} from "./ants.js";
import {
  combatPerSoldier,
  combatPower,
  HUNT_PROTEIN_PER_SOLDIER,
  MONSTER_BASE,
  MONSTER_EXPONENT,
  MONSTER_GROWTH,
  foodPerProtein,
  monsterPower,
  monsterRamp,
  RAID_UNLOCK,
  raidRewards,
  raidsUnlocked,
  SOLDIER_COMBAT
} from "./raids.js";
import {
  prestigeBaseCap,
  prestigeBroodSlots,
  prestigeExcavatorCap,
  prestigeFoodMultiplier,
  prestigeNaniticMult,
  prestigeSoldierMult
} from "./prestige.js";
import { buyUpgrade, game, markSeen, setSetting } from "./game.js";
import { fmt, fmtFactor, watch } from "./panels.js";

const el = id => document.getElementById(id);

export function upgradeLockText(game, upgrade) {
  const parts = [];
  if (upgradeNeedsRaid(game, upgrade)) parts.push("survive your first raid");
  const req = upgrade.req;
  const have = runPeakCount(game, req.caste);
  if (req.count > 0 && have < req.count) {
    const label = req.caste === "population" ? "ants" : CASTES[req.caste].name.toLowerCase() + "s";
    parts.push("needs " + fmt(req.count) + " " + label + " (you have " + fmt(have) + ")");
  }
  return parts.length ? "Locked: " + parts.join(", and ") : "";
}

// ---------------------------------------------------------------- ants tab

const upgradeCards = {};

// Every rate in the game has the same shape: a base that upgrades add flat
// amounts to, multiplied by whatever scales the whole thing. These read that
// shape back out with live numbers, and name the one factor an upgrade moves.
const f = fmtFactor;

function casteName(id) {
  return CASTES[id].name.toLowerCase();
}

function foodFormula(game, caste) {
  const vigour = casteHasMultiplier(caste)
    ? " × vigour " + f(casteMultiplier(game, caste))
    : "";
  const nanitic = (caste === "nanitic" && prestigeNaniticMult(game) > 1)
    ? " × lineage " + f(prestigeNaniticMult(game))
    : "";
  const lineage = prestigeFoodMultiplier(game) > 1
    ? " × lineage " + f(prestigeFoodMultiplier(game))
    : "";
  const hidden = hidingPenalty(game) < 1
    ? " × hiding " + f(hidingPenalty(game))
    : "";
  return "each " + casteName(caste) + " = (base " + f(baseFood(caste)) +
    " + yield " + f(casteFlatBonus(game, caste)) + ")" + vigour + nanitic +
    " × colony " + f(globalUpgradeMultiplier(game)) +
    " × achievements " + f(achievementFoodBonus(game)) + lineage + hidden +
    " = " + fmt(casteFoodPerSecond(game, caste)) + "/s";
}

function capFormula(game) {
  const base = BASE_POPULATION_CAP + prestigeBaseCap(game);
  const per = CAP_PER_EXCAVATOR + effectTotal(game, "excavatorCap") + prestigeExcavatorCap(game);
  return "cap = base " + base +
    " + per excavator " + f(per) +
    " × excavators " + fmt(game.ants.excavator) +
    " = " + fmt(populationCap(game));
}

function broodFormula(game) {
  const base = BASE_BROOD_SLOTS + effectTotal(game, "broodSlots") + prestigeBroodSlots(game);
  return "brood = base " + base +
    " + per nurse " + f(slotsPerNurse(game)) +
    " × nurses " + fmt(game.ants.nurse) +
    " = " + broodCapacity(game) + " slots";
}

function soldierFormula(game) {
  const lineage = prestigeSoldierMult(game) > 1
    ? " × lineage " + f(prestigeSoldierMult(game))
    : "";
  return "each soldier = base " + SOLDIER_COMBAT +
    " × power " + f(1 + effectTotal(game, "soldierPower")) + lineage +
    " = " + fmt(combatPerSoldier(game)) + " strength";
}

function armsFormula(game, caste, type) {
  return "each " + casteName(caste) + " = " + f(effectTotal(game, type)) +
    " strength, " + fmt(game.ants[caste]) + " of them = " +
    fmt(game.ants[caste] * effectTotal(game, type));
}

function proteinFormula(game) {
  return "hunting = soldiers " + fmt(game.ants.soldier) +
    " × base " + f(HUNT_PROTEIN_PER_SOLDIER) +
    " × yield " + f(1 + effectTotal(game, "proteinYield")) +
    " = " + f(game.ants.soldier * HUNT_PROTEIN_PER_SOLDIER *
      (1 + effectTotal(game, "proteinYield"))) + "/s";
}

function monsterFormula(game) {
  const reach = Math.max(RAID_UNLOCK, runPeakCount(game, "population"));
  const ramp = monsterRamp(game);
  return "next attacker = base " + MONSTER_BASE +
    " × (this colony " + fmt(reach) + " / " + RAID_UNLOCK + ")^" + MONSTER_EXPONENT +
    " × wins " + f(1 + MONSTER_GROWTH * (game.raidsWon || 0)) +
    (ramp < 1 ? " × ramp " + f(ramp) : "") +
    " = " + fmt(monsterPower(game));
}

function bigForagerFormula(game) {
  return "each big forager = a forager " + fmt(casteFoodPerSecond(game, "forager")) +
    "/s × 5 × her age, " + game.ants.bigforager + " of them = " +
    fmt(bigForagerOutput(game)) + "/s";
}

// every layer at once, for the Formulas panel in Settings
export function formulaSummary(game) {
  const rows = [];
  for (const caste of ["nanitic", "forager"]) {
    if (game.ants[caste] > 0) {
      rows.push({ name: CASTES[caste].name + " food", text: foodFormula(game, caste) });
    }
  }
  if (game.ants.bigforager > 0) {
    rows.push({ name: "Big Forager food", text: bigForagerFormula(game) });
  }
  rows.push({ name: "Population cap", text: capFormula(game) });
  rows.push({ name: "Brood slots", text: broodFormula(game) });
  if (game.ants.soldier > 0) rows.push({ name: "Soldier strength", text: soldierFormula(game) });
  if (raidsUnlocked(game)) rows.push({ name: "Next attacker", text: monsterFormula(game) });
  if (game.ants.soldier > 0) rows.push({ name: "Hunting", text: proteinFormula(game) });
  return rows;
}

// returns [the formula as it stands, what this upgrade moves inside it]
function formulaLines(upgrade, probe) {
  const effect = upgrade.effect;
  const type = effect.type;

  if (type === "casteFood" || type === "casteFlat") {
    const caste = effect.caste;
    const added = type === "casteFlat" ? effect.add : baseFood(caste) * effect.add;
    return [
      foodFormula(game, caste),
      "adds " + f(added) + " to " + casteName(caste) + " yield → " +
        f(casteFlatBonus(game, caste)) + " → " + f(casteFlatBonus(probe, caste))
    ];
  }
  if (type === "casteMult") {
    const caste = effect.caste;
    return [
      foodFormula(game, caste),
      "raises " + casteName(caste) + " vigour → " +
        f(casteMultiplier(game, caste)) + " → " + f(casteMultiplier(probe, caste))
    ];
  }
  if (type === "globalFood") {
    return [
      "all food × colony " + f(globalUpgradeMultiplier(game)) +
        " × achievements " + f(achievementFoodBonus(game)),
      "raises the colony bonus — " + f(globalUpgradeMultiplier(game)) +
        " → " + f(globalUpgradeMultiplier(probe))
    ];
  }
  if (type === "excavatorCap") {
    return [
      capFormula(game),
      "adds " + f(effect.add) + " to per excavator — " +
        f(CAP_PER_EXCAVATOR + effectTotal(game, "excavatorCap")) + " → " +
        f(CAP_PER_EXCAVATOR + effectTotal(probe, "excavatorCap"))
    ];
  }
  if (type === "nurseSlots") {
    return [
      broodFormula(game),
      "adds " + f(effect.add) + " to per nurse — " + f(slotsPerNurse(game)) +
        " → " + f(slotsPerNurse(probe))
    ];
  }
  if (type === "broodSlots") {
    return [
      broodFormula(game),
      "adds " + f(effect.add) + " to the base — " +
        (BASE_BROOD_SLOTS + effectTotal(game, "broodSlots")) + " → " +
        (BASE_BROOD_SLOTS + effectTotal(probe, "broodSlots"))
    ];
  }
  if (type === "soldierPower") {
    return [
      soldierFormula(game),
      "raises soldier power — " + f(1 + effectTotal(game, "soldierPower")) +
        " → " + f(1 + effectTotal(probe, "soldierPower"))
    ];
  }
  if (type === "combatForager" || type === "combatExcavator" || type === "combatNurse") {
    const caste = type === "combatForager" ? "forager"
      : type === "combatExcavator" ? "excavator" : "nurse";
    return [
      armsFormula(game, caste, type),
      "adds " + f(effect.add) + " to " + casteName(caste) + " strength — " +
        f(effectTotal(game, type)) + " → " + f(effectTotal(probe, type))
    ];
  }
  if (type === "proteinYield") {
    return [
      proteinFormula(game),
      "raises protein yield — " + f(1 + effectTotal(game, "proteinYield")) +
        " → " + f(1 + effectTotal(probe, "proteinYield"))
    ];
  }
  return [];
}

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
  if (type === "casteFood" || type === "casteFlat" || type === "casteMult") {
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

// a protein cost only compares to a food cost through what the colony earns,
// so sorting by price converts protein into its food equivalent first
export function comparableCost(game, upgrade) {
  if (upgradeCurrency(upgrade) !== "protein") return upgrade.cost;
  const rate = foodPerProtein(game);
  return rate > 0 ? upgrade.cost * rate : upgrade.cost * 10000;
}

export function proteinInFood(game, upgrade) {
  if (upgradeCurrency(upgrade) !== "protein") return 0;
  const rate = foodPerProtein(game);
  return rate > 0 ? upgrade.cost * rate : 0;
}

const SORTS = {
  "default": null,
  "name": (a, b) => a.name.localeCompare(b.name),
  "name-desc": (a, b) => b.name.localeCompare(a.name),
  "cost": (a, b) => comparableCost(game, a) - comparableCost(game, b),
  "cost-desc": (a, b) => comparableCost(game, b) - comparableCost(game, a),
  "req": (a, b) => a.req.count - b.req.count || a.name.localeCompare(b.name),
  "req-desc": (a, b) => b.req.count - a.req.count || a.name.localeCompare(b.name)
};

function sortedUpgrades() {
  const compare = SORTS[game.settings.upgradeSort || "default"];
  return compare ? UPGRADES.slice().sort(compare) : UPGRADES;
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
        const probe = Object.assign({}, game, { upgrades: game.upgrades.concat([upgrade.id]) });
        const worth = proteinInFood(game, upgrade);
        return ["Costs " + fmt(upgrade.cost) + " " + upgradeCurrency(upgrade) +
          (worth > 0 ? " — about " + fmt(worth) + " food at what the colony earns now." : ".")]
          .concat(formulaLines(upgrade, probe), previewUpgrade(upgrade)).join("\n");
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
  el("upgradeSort").onchange = event => {
    setSetting("upgradeSort", event.target.value);
    renderUpgrades();
  };
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
  const list = el("upgradeList");
  sortedUpgrades().forEach(upgrade => {
    list.appendChild(upgradeCards[upgrade.id].card);
  });
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
    const worth = proteinInFood(game, upgrade);
    ui.cost.textContent = isOwned
      ? "owned"
      : fmt(upgrade.cost) + " " + currency +
        (worth > 0 ? " (≈ " + fmt(worth) + " food)" : "");
    ui.cost.classList.toggle("affordable", !isOwned && isOpen && game[currency] >= upgrade.cost);
    ui.cost.classList.toggle("owned-tag", isOwned);

    ui.lock.textContent = isOwned ? "" : upgradeLockText(game, upgrade);
    ui.effect.textContent = isOwned || !isOpen ? "" : previewUpgrade(upgrade);
  });
  el("upgradeTally").textContent = owned + " / " + UPGRADES.length + " bought";
  el("upgradeLocked").textContent = locked > 0 ? locked + " still locked" : "all unlocked";
  el("upgradeSort").value = game.settings.upgradeSort || "default";
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
