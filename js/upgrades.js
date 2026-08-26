import {
  achievementFoodBonus,
  ACHIEVEMENT_FOOD_RATE,
  BASE_BROOD_SLOTS,
  bigForagerOutput,
  BASE_POPULATION_CAP,
  baseFood,
  NANITIC_BROOD_SLOTS,
  NANITIC_HALFLIFE,
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
  foodPenalty,
  globalFoodMultiplier,
  hidingPenalty,
  runPeakCount,
  naniticHalflife,
  naniticVigour,
  populationCap,
  rallyActive,
  RALLY_MULT,
  slotsPerNurse,
  UPGRADES,
  wingYield,
  WING_FOOD,
  WING_STRIP_TIME,
  upgradeBranch,
  upgradeCurrency,
  upgradeNeedsRaid,
  upgradeOwned,
  upgradeUnlocked,
  upgradeLevel,
  upgradeMaxLevel,
  upgradeMaxed,
  levelEffect,
  levelCost,
  levelReq,
  levelName,
  nextLevelCost,
  levelsOwned,
  DEFINED_LEVELS
} from "./ants.js";
import {
  combatPerSoldier,
  combatPower,
  HUNT_PROTEIN_PER_SOLDIER,
  MONSTER_BASE,
  MONSTER_EXPONENT,
  MONSTER_GROWTH,
  MONSTER_GROWTH_CAP,
  monsterWinGrowth,
  MONSTER_REFERENCE,
  foodPerProtein,
  monsterPower,
  monsterRamp,
  raidRewards,
  raidsUnlocked,
  SOLDIER_COMBAT
} from "./raids.js";
import {
  PRESTIGE_UPGRADES,
  prestigeUpgradeOwned,
  prestigeBaseCap,
  prestigeBroodSlots,
  prestigeExcavatorCap,
  prestigeFoodMultiplier,
  prestigeNaniticMult,
  prestigeSoldierMult
} from "./prestige.js";
import { activeChallenge, challengeDebuff, challengeReward, masteryFood } from "./challenges.js";
import { buyUpgrade, game, markSeen, setSetting } from "./game.js";
import { fmt, fmtFactor, watch } from "./panels.js";

const el = id => document.getElementById(id);

export function upgradeLockText(game, upgrade) {
  const parts = [];
  if (upgradeNeedsRaid(game, upgrade)) parts.push("survive your first raid");
  const req = levelReq(upgrade, Math.min(upgradeLevel(game, upgrade) + 1, upgradeMaxLevel(game, upgrade)));
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

// The probe is "this colony with one more level of that line". Everything that
// shows a before-and-after reads it, so a preview can never disagree with what
// buying actually does.
function probeWith(line) {
  const levels = Object.assign({}, game.upgrades);
  levels[line.id] = upgradeLevel(game, line) + 1;
  return Object.assign({}, game, { upgrades: levels });
}

function nextLevelOf(line) {
  return Math.min(upgradeLevel(game, line) + 1, upgradeMaxLevel(game, line));
}

// what the next level of this line adds or multiplies
function nextEffect(line) {
  return levelEffect(line, nextLevelOf(line));
}

// A level can cost food and protein at once past the defined rungs, so cost is
// a pair and every place that shows or compares one has to say both.
export function costText(game, line) {
  const cost = nextLevelCost(game, line);
  if (!cost) return "";
  const bits = [];
  if (cost.food > 0) bits.push(fmt(cost.food) + " food");
  if (cost.protein > 0) {
    const worth = foodPerProtein(game);
    bits.push(fmt(cost.protein) + " protein" +
      (worth > 0 && cost.food <= 0 ? " (≈ " + fmt(cost.protein * worth) + " food)" : ""));
  }
  return bits.join(" + ");
}

export function canAfford(game, line) {
  const cost = nextLevelCost(game, line);
  return !!cost && game.food >= cost.food && game.protein >= cost.protein;
}

const fmtTimeShort = seconds => seconds >= 60
  ? Math.round(seconds / 60) + "m"
  : Math.round(seconds) + "s";

function casteName(id) {
  return CASTES[id].name.toLowerCase();
}

// A formula is a total and the factors that make it, so it can be read down a
// column instead of parsed left to right. One long "a x b x c x d x e" line was
// unreadable by the time a food rate had six terms in it, and the trials add
// more. Falsey rows drop out, so a factor that is doing nothing never shows.
function formula(total, rows) {
  return { total, rows: rows.filter(Boolean) };
}

// A factor names its kind -- upgrades, achievements, trials, lineage -- and
// carries the individual sources underneath it. Short labels keep the columns
// narrow; the nested rows say which upgrade, which trial, which adaptation.
const row = (label, value, children) => ({ label, value, children: (children || []).filter(Boolean) });

// every owned upgrade of one effect type, as child rows
function ownedRows(list, ownedTest, match, format) {
  return list.filter(u => match(u) && ownedTest(u)).map(u => row(u.name, format(u)));
}

// one row per LEVEL bought, named by that level, so the panel still says which
// upgrade each part of the number came from
function levelRows(game, match, format) {
  const rows = [];
  for (const line of UPGRADES) {
    if (!match(line)) continue;
    const held = upgradeLevel(game, line);
    for (let level = 1; level <= held; level++) {
      rows.push(row(levelName(line, level), format(levelEffect(line, level), line)));
    }
  }
  return rows;
}

function upgradeMultRows(game) {
  return levelRows(game, u => u.effect.type === "globalFood", e => "×" + f(e.mult));
}

function casteYieldRows(game, caste) {
  return levelRows(game,
    u => (u.effect.type === "casteFlat" || u.effect.type === "casteFood") && u.effect.caste === caste,
    (e, line) => "+" + f(line.effect.type === "casteFlat" ? e.add : baseFood(caste) * e.add));
}

function lineageFoodRows(game) {
  return ownedRows(PRESTIGE_UPGRADES, u => prestigeUpgradeOwned(game, u),
    u => u.effect.type === "prestigeGlobalFood", u => "×" + f(u.effect.mult));
}

// for the inspector, which is one block of text rather than a grid
export function formulaText(shape) {
  const lines = [];
  for (const r of shape.rows) {
    lines.push("    " + r.label + "  " + r.value);
    for (const child of r.children || []) lines.push("        " + child.label + "  " + child.value);
  }
  lines.push("    ——  " + shape.total);
  return lines.join("\n");
}

// What every caste shares, built once. A caste's own formula names it as a
// single factor rather than repeating all of it.
function sharedFoodFactor(game) {
  return globalFoodMultiplier(game) * foodPenalty(game);
}

function colonyFoodFormula(game) {
  const rows = [];
  for (const caste of ["nanitic", "forager", "excavator", "nurse", "soldier"]) {
    const each = casteFoodPerSecond(game, caste);
    const held = game.ants[caste];
    if (held <= 0 || each <= 0) continue;
    rows.push(row(fmt(held) + " " + casteName(caste) + (held === 1 ? "" : "s") +
      " at " + fmt(each) + "/s", fmt(held * each) + "/s"));
  }
  if (game.ants.bigforager > 0) {
    rows.push(row(fmt(game.ants.bigforager) + " big foragers", fmt(bigForagerOutput(game)) + "/s"));
  }
  if (wingYield(game) > 0) rows.push(row("stripping a wing", fmt(wingYield(game)) + "/s"));
  if (!rows.length) rows.push(row("nothing is gathering yet", "0/s"));
  return formula(fmt(foodPerSecond(game)) + "/s", rows);
}

function overallFoodFormula(game) {
  const trials = challengeReward(game) * masteryFood(game);
  return formula("×" + f(sharedFoodFactor(game)), [
    globalUpgradeMultiplier(game) !== 1 &&
      row("upgrades", "×" + f(globalUpgradeMultiplier(game)), upgradeMultRows(game)),
    achievementFoodBonus(game) !== 1 &&
      row("achievements", "×" + f(achievementFoodBonus(game)), [
        row("level " + game.achievementLevel, "×" + f(ACHIEVEMENT_FOOD_RATE) + " each")
      ]),
    trials > 1 && row("trials", "×" + f(trials), [
      challengeReward(game) > 1 && row("levels cleared", "×" + f(challengeReward(game))),
      masteryFood(game) > 1 && row("Deep Cisterns", "×" + f(masteryFood(game)))
    ]),
    prestigeFoodMultiplier(game) > 1 &&
      row("lineage", "×" + f(prestigeFoodMultiplier(game)), lineageFoodRows(game)),
    hidingPenalty(game) < 1 && row("hiding", "×" + f(hidingPenalty(game))),
    challengeDebuff(game) < 1 &&
      row(activeChallenge(game).name.toLowerCase(), "×" + f(challengeDebuff(game)))
  ]);
}


function foodFormula(game, caste) {
  return formula(fmt(casteFoodPerSecond(game, caste)) + "/s", [
    row("base", f(baseFood(caste))),
    casteFlatBonus(game, caste) !== 0 &&
      row("+ upgrades", f(casteFlatBonus(game, caste)), casteYieldRows(game, caste)),
    casteHasMultiplier(caste) && row("× vigour", "×" + f(casteMultiplier(game, caste))),
    caste === "nanitic" && prestigeNaniticMult(game) > 1 &&
      row("× lineage", "×" + f(prestigeNaniticMult(game))),
    caste === "nanitic" && row("× fading", "×" + f(naniticVigour(game))),
    caste === "forager" && rallyActive(game) && row("× rally", "×" + f(RALLY_MULT)),
    row("× multipliers", "×" + f(sharedFoodFactor(game)))
  ]);
}

function capFormula(game) {
  const base = BASE_POPULATION_CAP + prestigeBaseCap(game);
  const per = CAP_PER_EXCAVATOR + effectTotal(game, "excavatorCap") + prestigeExcavatorCap(game);
  return formula(fmt(populationCap(game)), [
    row("base", fmt(base)),
    row("+ per excavator", f(per)),
    row("× excavators", fmt(game.ants.excavator))
  ]);
}

function broodFormula(game) {
  const base = BASE_BROOD_SLOTS + effectTotal(game, "broodSlots") + prestigeBroodSlots(game);
  return formula(fmt(broodCapacity(game)), [
    row("base", fmt(base)),
    row("+ per nurse", f(slotsPerNurse(game))),
    row("× nurses", fmt(game.ants.nurse)),
    game.ants.nanitic > 0 && row("+ founders", fmt(game.ants.nanitic) +
      " × " + f(NANITIC_BROOD_SLOTS))
  ]);
}

function soldierFormula(game) {
  return formula(fmt(combatPerSoldier(game)) + " each", [
    row("base", fmt(SOLDIER_COMBAT)),
    row("× upgrades", "×" + f(1 + effectTotal(game, "soldierPower"))),
    prestigeSoldierMult(game) > 1 && row("× lineage", "×" + f(prestigeSoldierMult(game)))
  ]);
}

function armsFormula(game, caste, type) {
  return formula(fmt(game.ants[caste] * effectTotal(game, type)), [
    row("each fights at", f(effectTotal(game, type))),
    row("× count", fmt(game.ants[caste]))
  ]);
}

function proteinFormula(game) {
  const rate = game.ants.soldier * HUNT_PROTEIN_PER_SOLDIER * (1 + effectTotal(game, "proteinYield"));
  return formula(f(rate) + "/s", [
    row("soldiers", fmt(game.ants.soldier)),
    row("× each brings", f(HUNT_PROTEIN_PER_SOLDIER)),
    row("× upgrades", "×" + f(1 + effectTotal(game, "proteinYield")))
  ]);
}

function monsterFormula(game) {
  const reach = Math.max(MONSTER_REFERENCE, runPeakCount(game, "population"));
  const ramp = monsterRamp(game);
  return formula(fmt(monsterPower(game)), [
    row("base, nest of " + MONSTER_REFERENCE, fmt(MONSTER_BASE)),
    row("× nest size", "×" + f(Math.pow(reach / MONSTER_REFERENCE, MONSTER_EXPONENT))),
    row("× your wins", "×" + f(monsterWinGrowth(game)) +
      ((game.raidsWon || 0) > MONSTER_GROWTH_CAP ? " (capped)" : "")),
    ramp < 1 && row("× ramp", "×" + f(ramp))
  ]);
}

function bigForagerFormula(game) {
  return formula(fmt(bigForagerOutput(game)) + "/s", [
    row("a forager", fmt(casteFoodPerSecond(game, "forager")) + "/s"),
    row("× big forager", "×" + fmt(BIG_FORAGER_BASE_SHOWN)),
    row("× age", "up to ×3"),
    row("× count", fmt(game.ants.bigforager))
  ]);
}

const BIG_FORAGER_BASE_SHOWN = 5;

// every layer at once, for the Formulas panel in Settings
export function formulaSummary(game) {
  const rows = [
    { name: "Colony food", shape: colonyFoodFormula(game) },
    { name: "Shared multipliers", shape: overallFoodFormula(game) }
  ];
  for (const caste of ["nanitic", "forager"]) {
    if (game.ants[caste] > 0) {
      rows.push({ name: CASTES[caste].name + " food", shape: foodFormula(game, caste) });
    }
  }
  if (game.ants.bigforager > 0) {
    rows.push({ name: "Big Forager food", shape: bigForagerFormula(game) });
  }
  if (wingYield(game) > 0) {
    rows.push({ name: "Wing muscle", shape: formula(fmt(wingYield(game)) + "/s", [
      row("per wing", fmt(WING_FOOD) + " food"),
      row("over", WING_STRIP_TIME + "s")
    ]) });
  }
  rows.push({ name: "Population cap", shape: capFormula(game) });
  rows.push({ name: "Brood slots", shape: broodFormula(game) });
  if (game.ants.soldier > 0) rows.push({ name: "Soldier strength", shape: soldierFormula(game) });
  if (raidsUnlocked(game)) rows.push({ name: "Next attacker", shape: monsterFormula(game) });
  if (game.ants.soldier > 0) rows.push({ name: "Hunting", shape: proteinFormula(game) });
  return rows;
}

// returns [the formula as it stands, what this upgrade moves inside it]
function formulaLines(upgrade, probe) {
  const effect = upgrade.effect;
  const type = effect.type;
  const step = nextEffect(upgrade);

  if (type === "casteFood" || type === "casteFlat") {
    const caste = effect.caste;
    const added = type === "casteFlat" ? step.add : baseFood(caste) * step.add;
    return [
      formulaText(foodFormula(game, caste)),
      "adds " + f(added) + " to " + casteName(caste) + " yield → " +
        f(casteFlatBonus(game, caste)) + " → " + f(casteFlatBonus(probe, caste))
    ];
  }
  if (type === "casteMult") {
    const caste = effect.caste;
    return [
      formulaText(foodFormula(game, caste)),
      "raises " + casteName(caste) + " vigour → " +
        f(casteMultiplier(game, caste)) + " → " + f(casteMultiplier(probe, caste))
    ];
  }
  if (type === "globalFood") {
    return [
      formulaText(overallFoodFormula(game)),
      "raises the colony bonus — " + f(globalUpgradeMultiplier(game)) +
        " → " + f(globalUpgradeMultiplier(probe))
    ];
  }
  if (type === "excavatorCap") {
    return [
      formulaText(capFormula(game)),
      "adds " + f(step.add) + " to per excavator — " +
        f(CAP_PER_EXCAVATOR + effectTotal(game, "excavatorCap")) + " → " +
        f(CAP_PER_EXCAVATOR + effectTotal(probe, "excavatorCap"))
    ];
  }
  if (type === "naniticVigour") {
    return [
      formulaText(foodFormula(game, "nanitic")),
      "the founders fade half as fast every " + fmtTimeShort(NANITIC_HALFLIFE) +
        " — halves in " + fmtTimeShort(naniticHalflife(game)) +
        " → " + fmtTimeShort(naniticHalflife(probe))
    ];
  }
  if (type === "nurseSlots") {
    return [
      formulaText(broodFormula(game)),
      "adds " + f(step.add) + " to per nurse — " + f(slotsPerNurse(game)) +
        " → " + f(slotsPerNurse(probe))
    ];
  }
  if (type === "broodSlots") {
    return [
      formulaText(broodFormula(game)),
      "adds " + f(step.add) + " to the base — " +
        (BASE_BROOD_SLOTS + effectTotal(game, "broodSlots")) + " → " +
        (BASE_BROOD_SLOTS + effectTotal(probe, "broodSlots"))
    ];
  }
  if (type === "soldierPower") {
    return [
      formulaText(soldierFormula(game)),
      "raises soldier power — " + f(1 + effectTotal(game, "soldierPower")) +
        " → " + f(1 + effectTotal(probe, "soldierPower"))
    ];
  }
  if (type === "combatForager" || type === "combatExcavator" || type === "combatNurse") {
    const caste = type === "combatForager" ? "forager"
      : type === "combatExcavator" ? "excavator" : "nurse";
    return [
      formulaText(armsFormula(game, caste, type)),
      "adds " + f(step.add) + " to " + casteName(caste) + " strength — " +
        f(effectTotal(game, type)) + " → " + f(effectTotal(probe, type))
    ];
  }
  if (type === "proteinYield") {
    return [
      formulaText(proteinFormula(game)),
      "raises protein yield — " + f(1 + effectTotal(game, "proteinYield")) +
        " → " + f(1 + effectTotal(probe, "proteinYield"))
    ];
  }
  return [];
}

function previewUpgrade(upgrade) {
  const probe = probeWith(upgrade);
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
  if (type === "naniticVigour") {
    if (game.ants.nanitic === 0) return "The founders are already gone.";
    return "Founders halve in " + fmtTimeShort(naniticHalflife(game)) +
      " to " + fmtTimeShort(naniticHalflife(probe));
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
// A level can cost both currencies now, so the comparable price is the food
// plus the protein converted at what the colony currently earns.
export function comparableCost(game, upgrade) {
  const cost = nextLevelCost(game, upgrade);
  if (!cost) return Infinity;
  const rate = foodPerProtein(game);
  return cost.food + cost.protein * (rate > 0 ? rate : 10000);
}

export function proteinInFood(game, upgrade) {
  const cost = nextLevelCost(game, upgrade);
  if (!cost || cost.protein <= 0) return 0;
  const rate = foodPerProtein(game);
  return rate > 0 ? cost.protein * rate : 0;
}

function reqCount(line) {
  return levelReq(line, nextLevelOf(line)).count;
}

const SORTS = {
  "default": null,
  "name": (a, b) => a.name.localeCompare(b.name),
  "name-desc": (a, b) => b.name.localeCompare(a.name),
  "cost": (a, b) => comparableCost(game, a) - comparableCost(game, b),
  "cost-desc": (a, b) => comparableCost(game, b) - comparableCost(game, a),
  "req": (a, b) => reqCount(a) - reqCount(b) || a.name.localeCompare(b.name),
  "req-desc": (a, b) => reqCount(b) - reqCount(a) || a.name.localeCompare(b.name)
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
      '<span class="upgrade-head"><b></b><span class="upgrade-level"></span>' +
      '<span class="upgrade-cost"></span></span>' +
      '<span class="upgrade-desc"></span>' +
      '<span class="upgrade-effect"></span>' +
      '<span class="upgrade-formula"></span>' +
      '<span class="upgrade-lock"></span>';
    card.onclick = () => {
      if (buyUpgrade(upgrade.id)) (onChange || onColonyChange)();
    };
    watch(card, {
      title: upgrade.name,
      body: upgrade.desc || "",
      note: () => {
        const held = upgradeLevel(game, upgrade);
        const max = upgradeMaxLevel(game, upgrade);
        const head = upgrade.name + " — level " + held + " of " + max + ".";
        if (upgradeMaxed(game, upgrade)) {
          return head + (upgrade.mastery
            ? " Every level you have unlocked is bought. Clearing another level of the trial that pays in " +
              upgrade.mastery + " raises this cap."
            : " Fully bought.");
        }
        const next = nextLevelOf(upgrade);
        const lines = [head, "", "NEXT — " + levelName(upgrade, next),
          levelEffect(upgrade, next).desc || "One more step of the same."];
        const locked = upgradeLockText(game, upgrade);
        if (locked) { lines.push("", locked); return lines.join("\n"); }
        lines.push("", "Costs " + costText(game, upgrade) + ".");
        return lines.concat(formulaLines(upgrade, probeWith(upgrade)), previewUpgrade(upgrade)).join("\n");
      },
      warn: false
    });
    upgradeCards[upgrade.id] = {
      card,
      name: card.querySelector("b"),
      level: card.querySelector(".upgrade-level"),
      desc: card.querySelector(".upgrade-desc"),
      cost: card.querySelector(".upgrade-cost"),
      effect: card.querySelector(".upgrade-effect"),
      formula: card.querySelector(".upgrade-formula"),
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
  const levelsHeld = levelsOwned(game, null);
  // Ordered by CSS, not by moving the nodes. appendChild on a card already in
  // the list detaches it first, and a button detached between mousedown and
  // mouseup never receives the click -- buying an upgrade needed an
  // autoclicker to land both inside one frame.
  sortedUpgrades().forEach((upgrade, i) => {
    upgradeCards[upgrade.id].card.style.order = i;
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
    const held = upgradeLevel(game, upgrade);
    const max = upgradeMaxLevel(game, upgrade);
    const affordable = canAfford(game, upgrade);
    ui.card.disabled = isOwned || !isOpen || !affordable;

    ui.name.textContent = upgrade.name;
    ui.level.textContent = "Lv " + held + " / " + max;
    ui.desc.textContent = isOwned
      ? levelName(upgrade, held) + " — " + (levelEffect(upgrade, held).desc || "")
      : levelName(upgrade, nextLevelOf(upgrade)) + " — " +
        (levelEffect(upgrade, nextLevelOf(upgrade)).desc || "");

    ui.cost.textContent = isOwned ? "fully bought" : costText(game, upgrade);
    ui.cost.classList.toggle("affordable", !isOwned && isOpen && affordable);
    ui.cost.classList.toggle("owned-tag", isOwned);

    ui.lock.textContent = isOwned
      ? (upgrade.mastery
          ? "Clear another level of the trial that pays in " + upgrade.mastery + " to raise this cap."
          : "")
      : upgradeLockText(game, upgrade);
    ui.effect.textContent = isOwned || !isOpen ? "" : previewUpgrade(upgrade);
    ui.formula.textContent = isOwned || !isOpen
      ? "" : (formulaLines(upgrade, probeWith(upgrade))[1] || "");
  });
  // An empty grid with nothing said reads as a broken tab. It is usually
  // "Hide owned" doing exactly what it promises, and at 29 of 29 it hides
  // every card there is.
  const showing = UPGRADES.filter(u => !upgradeCards[u.id].card.hidden).length;
  const note = el("upgradeEmpty");
  note.hidden = showing > 0;
  if (showing === 0) {
    const filter = game.settings.upgradeFilter || "all";
    const reasons = [];
    if (game.settings.hideOwned && owned > 0) reasons.push("Hide owned");
    if (game.settings.hideLocked && locked > 0) reasons.push("Hide locked");
    if (owned === UPGRADES.length) {
      note.textContent = "Every adaptation the colony can reach is bought — " +
        levelsHeld + " levels across all " + UPGRADES.length +
        " lines. Clearing more of a trial raises the lines it pays into. " +
        "Untick Hide owned to look back over what the colony has.";
    } else if (reasons.length) {
      note.textContent = "Nothing to show here: " + reasons.join(" and ") +
        (filter === "all" ? "" : " and the " + filter + " filter") +
        " account for all " + UPGRADES.length + ".";
    } else {
      note.textContent = "No " + filter + " adaptations to show.";
    }
  }
  el("upgradeTally").textContent = levelsHeld + " levels across " +
    owned + " / " + UPGRADES.length + " lines";
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
    if (upgradeMaxed(game, upgrade) || !upgradeUnlocked(game, upgrade)) continue;
    if (canAfford(game, upgrade)) ready++;
  }
  return ready;
}

export function upgradeBadge() {
  return Math.max(0, affordableUpgrades() - (game.seen.upgrades || 0));
}
