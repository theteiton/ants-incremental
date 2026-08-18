import {
  CASTES,
  EGG_TIME,
  eggCost,
  emergingCaste,
  foodPerSecond,
  isUnlocked,
  layableCastes,
  population,
  populationCap
} from "./ants.js";
import {
  broodSpace,
  canLay,
  game,
  layEgg,
  load,
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

const el = id => document.getElementById(id);
const casteButtons = {};
const casteRows = {};

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
      '<span class="caste-count"></span>';
    casteRows[id] = {
      row,
      name: row.querySelector(".caste-name"),
      role: row.querySelector(".caste-role"),
      count: row.querySelector(".caste-count")
    };
    list.appendChild(row);
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
  el("eggCost").textContent =
    "An egg costs " + fmt(cost.amount) + " " + cost.resource + ". Chamber space: " + space + ".";
  el("btnLay").disabled = !canLay();
  el("btnLay").textContent =
    space <= 0 ? "No room in the nest" : "Lay an egg (" + CASTES[game.nextCaste].name + ")";

  layableCastes().forEach(id => {
    const button = casteButtons[id];
    const unlocked = isUnlocked(game, id);
    button.disabled = !unlocked;
    button.classList.toggle("selected", game.nextCaste === id);
    button.textContent = unlocked
      ? CASTES[id].name
      : CASTES[id].name + " — " + CASTES[id].unlockAt + " ants";
  });

  const list = el("eggList");
  list.innerHTML = "";
  game.eggs.forEach(egg => {
    const item = document.createElement("li");
    const pct = Math.min(100, (egg.progress / EGG_TIME) * 100);
    item.innerHTML =
      '<span>' + CASTES[emergingCaste(game, egg)].name + '</span>' +
      '<span class="bar"><i style="width:' + pct.toFixed(1) + '%"></i></span>';
    list.appendChild(item);
  });
}

function renderColony() {
  el("colonyPanel").hidden = game.emerged === 0;
  Object.keys(CASTES).forEach(id => {
    const ui = casteRows[id];
    const count = game.ants[id];
    ui.row.hidden = count === 0 && !isUnlocked(game, id);
    ui.name.textContent = CASTES[id].name;
    ui.role.textContent = CASTES[id].role;
    ui.count.textContent = fmt(count);
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
  renderQueen();
  renderBrood();
  renderColony();
}

el("btnShed").onclick = () => {
  shedWings();
  render();
};
el("btnLay").onclick = () => {
  layEgg();
  render();
};

buildCasteChoice();
buildCasteList();
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
