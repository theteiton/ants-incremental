import {
  ACHIEVEMENT_FOOD_PER_LEVEL,
  ACHIEVEMENT_HATCH_PER_LEVEL,
  BASE_POPULATION_CAP,
  CASTES,
  EGG_TIME,
  eggCost,
  emergingCaste,
  foodPerSecond,
  hatchRate,
  isUnlocked,
  layableCastes,
  population,
  populationCap,
  UPGRADES,
  upgradeOwned,
  upgradeUnlocked
} from "./ants.js";
import {
  ACHIEVEMENTS,
  affordableEggs,
  broodSlots,
  broodSpace,
  buyUpgrade,
  canLay,
  game,
  layEggs,
  levelPoints,
  load,
  POINTS_PER_LEVEL,
  QUEEN_RESERVES,
  save,
  setNextCaste,
  shedWings,
  tick
} from "./game.js";

const SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi"];

export function fmt(n) {
  if (!isFinite(n)) return "0";
  if (n < 0) return "-" + fmt(-n);
  if (n < 10) return (Math.round(n * 10) / 10).toString();
  if (n < 1000) return Math.floor(n).toString();
  const tier = Math.floor(Math.log10(n) / 3);
  if (tier >= SUFFIXES.length) return n.toExponential(2);
  const scaled = n / Math.pow(1000, tier);
  return (scaled < 100 ? scaled.toFixed(1) : scaled.toFixed(0)) + SUFFIXES[tier];
}

function fmtTime(seconds) {
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours > 0) return hours + "h " + minutes + "m";
  if (minutes > 0) return minutes + "m " + (total % 60) + "s";
  return total + "s";
}

const el = id => document.getElementById(id);
const casteButtons = {};
const casteRows = {};
const upgradeRows = {};
const achievementChips = {};

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

function buildCasteList() {
  const list = el("casteList");
  Object.keys(CASTES).forEach(id => {
    const row = document.createElement("li");
    row.innerHTML =
      '<span class="caste-name"></span>' +
      '<span class="caste-role"></span>' +
      '<span class="caste-output"></span>' +
      '<span class="caste-count"></span>';
    casteRows[id] = {
      row,
      name: row.querySelector(".caste-name"),
      role: row.querySelector(".caste-role"),
      output: row.querySelector(".caste-output"),
      count: row.querySelector(".caste-count")
    };
    list.appendChild(row);
  });
}

function buildUpgrades() {
  const list = el("upgradeList");
  UPGRADES.forEach(upgrade => {
    const row = document.createElement("button");
    row.className = "upgrade";
    row.innerHTML =
      '<span class="upgrade-head"><b></b><span class="upgrade-cost"></span></span>' +
      '<span class="upgrade-desc"></span>';
    row.onclick = () => {
      buyUpgrade(upgrade.id);
      render();
    };
    upgradeRows[upgrade.id] = {
      row,
      name: row.querySelector("b"),
      cost: row.querySelector(".upgrade-cost"),
      desc: row.querySelector(".upgrade-desc")
    };
    row.querySelector("b").textContent = upgrade.name;
    row.querySelector(".upgrade-desc").textContent = upgrade.desc;
    row.querySelector(".upgrade-cost").textContent = fmt(upgrade.cost) + " food";
    list.appendChild(row);
  });
}

function buildAchievements() {
  const list = el("achievementList");
  ACHIEVEMENTS.forEach(achievement => {
    const chip = document.createElement("li");
    chip.className = "achievement";
    chip.innerHTML = '<b></b><span></span><i></i>';
    chip.querySelector("b").textContent = achievement.name;
    chip.querySelector("span").textContent = achievement.desc;
    chip.querySelector("i").textContent = achievement.points + " pts";
    achievementChips[achievement.id] = chip;
    list.appendChild(chip);
  });
}

function renderQueen() {
  if (!game.wingsShed) {
    el("queenText").textContent =
      "She has landed and will never fly again. Shedding her wings frees " +
      QUEEN_RESERVES +
      " units of body reserves — all she will ever have.";
    el("btnShed").hidden = false;
    return;
  }
  el("btnShed").hidden = true;
  el("queenText").textContent =
    game.emerged === 0
      ? "Her wing muscles are being metabolised into eggs. Nothing else will feed this brood."
      : "The first workers have emerged. Her reserves no longer matter; the colony feeds her now.";
}

function renderBrood() {
  el("broodPanel").hidden = !game.wingsShed;
  if (!game.wingsShed) return;

  const cost = eggCost(game);
  const space = broodSpace();
  const affordable = affordableEggs();
  el("eggCost").textContent = space > 0
    ? "An egg costs " + fmt(cost.amount) + " " + cost.resource + ". Chamber space: " + fmt(space) + "."
    : "The nest is full at " + fmt(populationCap(game)) +
      ". Only excavators can be laid now — they dig their own chambers.";

  el("btnLay").disabled = !canLay();
  el("btnLay").textContent = "Lay an egg (" + CASTES[game.nextCaste].name + ")";
  el("btnLay10").disabled = !canLay();
  el("btnLayMax").disabled = !canLay();
  el("btnLayMax").textContent = "Lay max (" + fmt(affordable) + ")";
  el("btnLay10").textContent = "Lay ×" + Math.min(10, Math.max(1, broodSlots()));

  layableCastes().forEach(id => {
    const button = casteButtons[id];
    const unlocked = isUnlocked(game, id);
    button.disabled = !unlocked;
    button.classList.toggle("selected", game.nextCaste === id);
    button.textContent = unlocked
      ? CASTES[id].name
      : CASTES[id].name + " — " + CASTES[id].unlockAt + " ants";
  });

  const eggs = game.eggs;
  if (eggs.length === 0) {
    el("eggSummary").textContent = "No eggs in the brood chamber.";
    el("eggBar").style.width = "0%";
    return;
  }
  let best = 0;
  for (const egg of eggs) best = Math.max(best, egg.progress);
  const rate = hatchRate(game);
  const remaining = Math.max(0, (EGG_TIME - best) / rate);
  el("eggSummary").textContent =
    fmt(eggs.length) + " eggs incubating — next hatches in " + remaining.toFixed(1) + "s";
  el("eggBar").style.width = Math.min(100, (best / EGG_TIME) * 100).toFixed(1) + "%";
}

function renderColony() {
  el("colonyPanel").hidden = game.emerged === 0;
  Object.keys(CASTES).forEach(id => {
    const ui = casteRows[id];
    const count = game.ants[id];
    ui.row.hidden = count === 0 && !isUnlocked(game, id);
    ui.name.textContent = CASTES[id].name;
    ui.role.textContent = CASTES[id].role;
    ui.output.textContent = count > 0 && id === "excavator"
      ? "+" + fmt(populationCap(game) - BASE_POPULATION_CAP) + " cap"
      : "";
    ui.count.textContent = fmt(count);
  });
}

function renderUpgrades() {
  let shown = 0;
  UPGRADES.forEach(upgrade => {
    const ui = upgradeRows[upgrade.id];
    const owned = upgradeOwned(game, upgrade);
    const unlocked = upgradeUnlocked(game, upgrade);
    ui.row.hidden = owned || !unlocked;
    if (ui.row.hidden) return;
    shown++;
    ui.row.disabled = game.food < upgrade.cost;
  });
  el("upgradePanel").hidden = shown === 0 && game.upgrades.length === 0;
  el("upgradeEmpty").hidden = shown > 0;
  el("upgradeOwned").textContent = game.upgrades.length + " / " + UPGRADES.length + " bought";
}

function renderAchievements() {
  el("achievementPanel").hidden = game.achievements.length === 0;
  ACHIEVEMENTS.forEach(achievement => {
    const earned = game.achievements.indexOf(achievement.id) >= 0;
    achievementChips[achievement.id].classList.toggle("earned", earned);
  });
  const level = game.achievementLevel;
  const next = levelPoints(level + 1);
  el("achievementLevel").textContent = "Level " + level;
  el("achievementPoints").textContent =
    game.achievementPoints + " points — " + (next - game.achievementPoints) + " to next level";
  el("achievementBonus").textContent =
    "+" + Math.round(ACHIEVEMENT_FOOD_PER_LEVEL * level * 100) + "% food, +" +
    Math.round(ACHIEVEMENT_HATCH_PER_LEVEL * level * 100) + "% hatch speed";
  const progress = (game.achievementPoints - levelPoints(level)) / POINTS_PER_LEVEL;
  el("achievementBar").style.width = Math.min(100, progress * 100).toFixed(1) + "%";
}

function render() {
  const reserves = el("readoutReserves");
  reserves.hidden = game.emerged > 0;
  reserves.querySelector("[data-value]").textContent = fmt(game.reserves);
  el("valFood").textContent = fmt(game.food);
  el("valRate").textContent = fmt(foodPerSecond(game)) + "/s";
  el("valPop").textContent = fmt(population(game)) + " / " + fmt(populationCap(game));
  el("valEggs").textContent = fmt(game.eggs.length);
  el("valTime").textContent = fmtTime(game.stats.playtime);
  renderQueen();
  renderBrood();
  renderColony();
  renderUpgrades();
  renderAchievements();
}

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

buildCasteChoice();
buildCasteList();
buildUpgrades();
buildAchievements();
load();
render();

let lastFrame = Date.now();
function frame() {
  const now = Date.now();
  tick(Math.min((now - lastFrame) / 1000, 1));
  lastFrame = now;
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

setInterval(save, 10000);
window.addEventListener("beforeunload", save);
