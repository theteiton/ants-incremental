import {
  CASTES,
  EGG_TIME,
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
  QUEEN_RESERVES,
  save,
  setNextCaste,
  shedWings,
  tick
} from "./game.js";
import {
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
  renderUpgrades
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

function renderQueen() {
  if (!game.wingsShed) {
    el("queenText").textContent =
      "She has landed and will never fly again. Shedding her wings frees " +
      QUEEN_RESERVES + " units of body reserves — all she will ever have.";
    el("btnShed").hidden = false;
    return;
  }
  el("btnShed").hidden = true;
  if (game.emerged === 0) {
    el("queenText").textContent =
      "Her wing muscles are being metabolised into eggs. Nothing else will feed this brood.";
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
  el("eggCost").textContent = space > 0
    ? "A " + CASTES[game.nextCaste].name.toLowerCase() + " egg costs " +
      fmt(cost.amount) + " " + cost.resource + ". Chamber space: " + fmt(space) + "."
    : "The nest is full at " + fmt(populationCap(game)) +
      ". Only excavators can be laid now — they dig their own chambers.";

  const ready = canLay();
  el("btnLay").disabled = !ready;
  el("btnLay").textContent = "Lay an egg (" + CASTES[game.nextCaste].name + ")";
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
selectTab("ants");

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
