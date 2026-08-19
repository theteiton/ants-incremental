import {
  CASTES,
  EGG_TIME,
  NANITIC_GENERATION,
  eggCost,
  foodPerSecond,
  hatchRate,
  isUnlocked,
  layableCastes,
  population,
  populationCap
} from "./ants.js";
import {
  affordableEggs,
  broodSlots,
  broodSpace,
  canLay,
  exportSave,
  game,
  hardReset,
  importSave,
  layEggs,
  load,
  markSeen,
  OFFLINE_CAP,
  queenTitle,
  QUEEN_RESERVES,
  save,
  setNextCaste,
  shedWings,
  tick
} from "./game.js";
import {
  achievementBadge,
  affordableUpgrades,
  buildAchievements,
  buildAnts,
  buildExileDialog,
  buildSettings,
  buildUpgrades,
  fmt,
  fmtTime,
  renderAchievements,
  renderAnts,
  renderSettings,
  renderUpgrades,
  upgradeBadge
} from "./panels.js";
import { drawSprite } from "./sprites.js";

const el = id => document.getElementById(id);
const TABS = ["ants", "upgrades", "achievements", "settings"];
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
  return game.emerged < NANITIC_GENERATION ? "nanitic" : game.nextCaste;
}

function applyTheme() {
  document.documentElement.setAttribute("data-theme", game.settings.theme || "dark");
}

function renderBadges() {
  const upgrades = upgradeBadge();
  const achievements = achievementBadge();
  el("badge-upgrades").hidden = activeTab === "upgrades" || upgrades <= 0;
  el("badge-achievements").hidden = activeTab === "achievements" || achievements <= 0;
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

  const eggs = game.eggs;
  if (eggs.length === 0) {
    el("eggSummary").textContent = "No eggs in the brood chamber.";
    el("eggBar").style.width = "0%";
    return;
  }
  let best = 0;
  for (const egg of eggs) best = Math.max(best, egg.progress);
  el("eggSummary").textContent =
    fmt(eggs.length) + " eggs incubating — next hatches in " +
    Math.max(0, (EGG_TIME - best) / hatchRate(game)).toFixed(1) + "s";
  el("eggBar").style.width = Math.min(100, (best / EGG_TIME) * 100).toFixed(1) + "%";
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

  renderBadges();
  renderQueen();
  renderBrood();
  if (activeTab === "ants") renderAnts();
  else if (activeTab === "upgrades") renderUpgrades();
  else if (activeTab === "achievements") renderAchievements();
  else if (activeTab === "settings") renderSettings();
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

buildTabs();
buildCasteChoice();
buildAnts(render);
buildExileDialog();
buildUpgrades(render);
buildAchievements();
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
applyTheme();
markSeen("upgrades", affordableUpgrades());
markSeen("achievements", game.achievements.length);
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
