// The Hunt: the ground around the nest, and what it is worth to hold it.
//
// Combat used to be a side system, and the arithmetic said why: soldiers are
// 15.8% of the food budget and they bought nothing the colony grows on. Held
// ground multiplies foraging, so the army becomes leverage on the 79.4% that
// goes to foragers rather than a tax on it. That is the whole idea.
//
// Imports nothing but bestiary.js, which is itself a leaf: ants.js needs the
// territory figure and raids.js needs the board, so this has to sit below both.

import { monsterChoices, monsterById, modifierById, topGradeFor, monsterFullName,
  MODIFIERS, modifierPower } from "./bestiary.js";

export const SECTORS = 6;
export const RINGS = 5;
export const CELLS = SECTORS * RINGS;      // thirty, shown at once, always

// A monster advances one ring on this clock. From the outer ring that is about
// seven and a half minutes to the nest, deliberately close to the six-minute
// raid cadence the game already had, so the feel does not lurch.
export const ADVANCE_SECONDS = 90;

// how often something new appears on the rim
export const SPAWN_SECONDS = 110;

// ...and how much of the board anything is allowed to occupy at once. Without
// it a colony that simply never marched filled 27 of 30 cells in an hour, which
// is the wall of red the design explicitly refused. With it the pressure is
// real and the board stays legible.
export const MAX_ON_BOARD = 10;

// Strength is two-dimensional: distance is the difficulty inside a circle, the
// tier is the difficulty between them.
export const RING_SCALE = 1.6;
export const TIER_SCALE = 2.4;

// What a held cell adds to foraging, per ring out. The far cells are worth more
// because they cost more to take: a full board is 0.008 x 6 x (1+2+3+4+5) =
// x1.72, which is inside the x4.85 Amdahl ceiling for the forager share with
// room left for the tier bonus on top.
export const CELL_YIELD = 0.008;

// What a MERGED tier pays, for ever. This is the number to watch: tiers do not
// stop, so a linear bonus here would eventually make the map the whole game.
// It goes as the square root, so twenty-five tiers is worth five times one
// rather than twenty-five times -- and the real brake is TIER_SCALE, which
// makes each circle far harder than the last.
export const TIER_YIELD = 0.4;

// travel is per ring, each way
export const TRAVEL_SECONDS = 12;

// ---------------------------------------------------------------- the ground
//
// Every cell used to be identical, so the only decision the board offered was
// how far out to push. An area has a KIND now, rolled when the circle is built,
// and holding it pays what that ground is actually good for -- so which cell to
// take is a decision as well as how far.
//
// The weights lean hard towards the food kinds on purpose. Measured, a colony
// is food-bound sixty minutes out of sixty and the cap and the brood are worth
// x1.02 by Amdahl however generous they are, so a board full of loam and seeps
// would be a board full of nothing. The rarer kinds are spice, not staples.
export const AREAS = [
  { id: "forage", name: "Foraging ground", kind: "food", yield: 0.010, weight: 30,
    note: "Open ground with trails already worn into it. The plainest thing the map offers and the most useful." },
  { id: "aphid", name: "Aphid pasture", kind: "food", yield: 0.018, weight: 12,
    note: "A stand of plants under a herd the colony milks for honeydew. Real ants keep these, defend them, and move them." },
  { id: "seedbed", name: "Seed bed", kind: "food", yield: 0.014, weight: 14,
    note: "Grass gone to seed, and enough of it to granary. What the harvester ants live on." },
  { id: "carrion", name: "Carrion field", kind: "protein", yield: 0.05, weight: 12,
    note: "Something died here and nothing else has claimed it yet." },
  { id: "midden", name: "Midden", kind: "egg", yield: 0.012, weight: 10,
    note: "The refuse heap of a nest that is no longer there. Everything a brood chamber needs, already broken down." },
  { id: "ridge", name: "Stony ridge", kind: "strength", yield: 0.06, weight: 10,
    note: "High, hard, and defensible. An army that holds it is fighting downhill." },
  { id: "loam", name: "Deep loam", kind: "cap", yield: 0.09, weight: 7,
    note: "Soft going a long way down. Room for chambers without a season of digging." },
  { id: "seep", name: "Warm seep", kind: "brood", yield: 0.07, weight: 5,
    note: "Ground that stays warm and damp. Eggs left here come on faster than they have any right to." }
];

export function areaById(id) {
  return AREAS.find(a => a.id === id) || AREAS[0];
}

const AREA_TOTAL = AREAS.reduce((n, a) => n + a.weight, 0);

export function rollArea(rng) {
  let roll = (rng || Math.random)() * AREA_TOTAL;
  for (const a of AREAS) {
    roll -= a.weight;
    if (roll <= 0) return a.id;
  }
  return AREAS[0].id;
}

export function huntUnlocked(game) {
  return !!(game.hunt && game.hunt.open);
}

// ------------------------------------------------------------------ the board
// A fresh circle is rolled, not laid out, so no two are the same and a player
// is reading a new board each tier rather than the same thirty cells again.
export function newBoard(rng) {
  const cells = [];
  for (let ring = 1; ring <= RINGS; ring++) {
    for (let sector = 0; sector < SECTORS; sector++) {
      cells.push({ ring, sector, area: rollArea(rng), monster: null, mod: null,
        held: false, guard: 0 });
    }
  }
  return cells;
}

export function initHunt(game) {
  if (!game.hunt) game.hunt = {};
  const h = game.hunt;
  if (!h.cells || h.cells.length !== CELLS) h.cells = newBoard();
  if (typeof h.tier !== "number") h.tier = 0;
  if (typeof h.spawnTimer !== "number") h.spawnTimer = SPAWN_SECONDS;
  if (typeof h.advanceTimer !== "number") h.advanceTimer = ADVANCE_SECONDS;
  if (!("march" in h)) h.march = null;
  if (typeof h.open !== "boolean") h.open = false;
  return h;
}

export function cellAt(game, index) {
  const h = game.hunt;
  return h && h.cells ? h.cells[index] : null;
}

export function occupied(game) {
  const h = game.hunt;
  if (!h || !h.cells) return [];
  return h.cells.filter(c => c.monster);
}

export function heldCells(game) {
  const h = game.hunt;
  if (!h || !h.cells) return [];
  return h.cells.filter(c => c.held && !c.monster);
}

export function boardClear(game) {
  const h = game.hunt;
  if (!h || !h.cells) return false;
  return h.cells.every(c => c.held && !c.monster);
}

// ---------------------------------------------------------------- what it pays
//
// Held ground and merged tiers, as one multiplier on foraging. Read by
// foodPenalty's sibling in ants.js -- it is a gain, so it does not belong in
// the penalty term.
// What the ground pays, by kind. A cell is worth its area's yield scaled by how
// far out it sits -- the deep ground costs more to take and is worth more to
// hold. Merged circles keep paying into food for ever, which is what makes
// finishing one worth doing.
export function territoryOf(game, kind) {
  const h = game.hunt;
  if (!h || !h.open) return 1;
  let held = 0;
  for (const c of h.cells) {
    if (!c.held || c.monster) continue;
    const area = areaById(c.area);
    if (area.kind !== kind) continue;
    held += area.yield * c.ring;
  }
  if (kind === "food") {
    held += TIER_YIELD * Math.sqrt(Math.max(0, h.tier || 0));
  }
  return 1 + held;
}

export function territoryYield(game) {
  return territoryOf(game, "food");
}

export function territoryProtein(game) { return territoryOf(game, "protein"); }
export function territoryStrength(game) { return territoryOf(game, "strength"); }
export function territoryCap(game) { return territoryOf(game, "cap"); }
export function territoryBrood(game) { return territoryOf(game, "brood"); }
export function territoryEgg(game) {
  // the midden makes an egg cheaper, so it moves the other way
  return 1 / territoryOf(game, "egg");
}

// what a single cell is worth to hold, for the panel to say
export function cellWorth(cell) {
  const area = areaById(cell.area);
  return { area, gain: area.yield * cell.ring };
}

// ------------------------------------------------------------- what lives there
//
// A cell's attacker is scaled by how far out it sits and by how many circles
// the colony has already taken.
export function cellPower(game, cell, basePower) {
  const tier = (game.hunt && game.hunt.tier) || 0;
  return basePower * Math.pow(RING_SCALE, cell.ring - 1) *
    Math.pow(TIER_SCALE, tier) * modifierPower(monsterById(cell.monster), cell.mod);
}

export function cellName(cell) {
  if (!cell || !cell.monster) return "";
  return monsterFullName(monsterById(cell.monster), cell.mod);
}

function spawn(game, basePower, rng) {
  const h = game.hunt;
  // the ground can only hold so many at once
  if (h.cells.filter(c => c.monster).length >= MAX_ON_BOARD) return null;
  // the rim only, and only where there is room
  const rim = h.cells.filter(c => c.ring === RINGS && !c.monster);
  if (!rim.length) return null;
  const cell = rim[Math.floor(rng() * rim.length)];
  const choices = monsterChoices(basePower * Math.pow(TIER_SCALE, h.tier || 0));
  const picked = choices[Math.floor(rng() * choices.length)];
  cell.monster = picked.id;
  const top = topGradeFor(picked);
  const open = MODIFIERS.filter(m => m.grade <= top);
  cell.mod = open[Math.floor(rng() * open.length)].id;
  cell.held = false;
  return cell;
}

// Everything on the board steps one ring inward. A monster reaching ring 1 does
// not "arrive at the nest" -- held ground IS the nest, so it has already been
// fought for wherever it walked into held ground.
function advance(game) {
  const h = game.hunt;
  const moved = [];
  // innermost first, so two monsters never swap through each other
  const order = h.cells.slice().sort((a, b) => a.ring - b.ring);
  for (const cell of order) {
    if (!cell.monster || cell.ring <= 1) continue;
    const target = h.cells.find(c => c.ring === cell.ring - 1 && c.sector === cell.sector);
    if (!target || target.monster) continue;
    target.monster = cell.monster;
    target.mod = cell.mod;
    // walking into ground the colony holds is what a defence battle IS
    if (target.held) moved.push(target);
    target.held = false;
    cell.monster = null;
    cell.mod = null;
  }
  return moved;
}

// `rng` is passed in so a test can make the board deterministic.
export function huntTick(game, dt, basePower, rng) {
  const h = game.hunt;
  if (!h || !h.open) return { spawned: null, breached: [] };
  const roll = rng || Math.random;
  let spawned = null;
  let breached = [];

  h.spawnTimer -= dt;
  while (h.spawnTimer <= 0) {
    spawned = spawn(game, basePower, roll) || spawned;
    h.spawnTimer += SPAWN_SECONDS;
  }
  h.advanceTimer -= dt;
  let guard = 0;
  while (h.advanceTimer <= 0 && guard++ < 64) {
    breached = breached.concat(advance(game));
    h.advanceTimer += ADVANCE_SECONDS;
  }
  return { spawned, breached };
}

// ------------------------------------------------------------- the expedition
//
// One at a time, and the soldiers sent CANNOT defend the nest while they are
// gone. That is the decision the game was short of: push out to grow, or hold
// back to survive.
export function marchReady(game) {
  const h = game.hunt;
  return !!(h && h.open && !h.march);
}

export function travelTime(cell) {
  return TRAVEL_SECONDS * cell.ring;
}

export function sendMarch(game, index, share) {
  const h = game.hunt;
  if (!marchReady(game)) return null;
  const cell = cellAt(game, index);
  if (!cell || !cell.monster) return null;
  const part = Math.max(0.05, Math.min(1, share));
  h.march = { cell: index, share: part, out: travelTime(cell), fighting: false, home: 0 };
  return h.march;
}

// how much of the colony's strength is away, and therefore not defending
export function marchShare(game) {
  const h = game.hunt;
  return h && h.march ? h.march.share : 0;
}

// A circle taken whole collapses inward and becomes the nest. The tier is
// banked -- it survives a flight, which is what makes finishing a circle worth
// doing before flying -- and a fresh thirty appear outside it, harder by
// TIER_SCALE. This is why the board has no edge.
export function mergeTier(game) {
  const h = game.hunt;
  if (!h || !boardClear(game)) return false;
  h.tier = (h.tier || 0) + 1;
  // a new circle is rolled fresh, so the ground beyond is never the ground behind
  h.cells = newBoard();
  h.spawnTimer = SPAWN_SECONDS;
  h.advanceTimer = ADVANCE_SECONDS;
  return true;
}

// The march: out, fight, home. `fight` is handed in by game.js, because the
// resolution belongs to raids.js and this module sits below it.
export function marchTick(game, dt, fight) {
  const h = game.hunt;
  if (!h || !h.march) return null;
  const m = h.march;
  let result = null;
  if (m.out > 0) {
    m.out = Math.max(0, m.out - dt);
    if (m.out > 0) return null;
    const cell = cellAt(game, m.cell);
    // it may have walked off while the army was on the road, which is its own
    // small lesson about sending an army a long way
    if (cell && cell.monster) result = fight(cell);
    m.home = travelTime(cell || { ring: 1 });
    return result;
  }
  if (m.home > 0) {
    m.home = Math.max(0, m.home - dt);
    if (m.home <= 0) h.march = null;
  } else {
    h.march = null;
  }
  return null;
}

export function recallMarch(game) {
  const h = game.hunt;
  if (!h || !h.march || h.march.home > 0) return false;
  const cell = cellAt(game, h.march.cell);
  h.march.out = 0;
  h.march.fighting = false;
  h.march.home = travelTime(cell || { ring: 1 });
  return true;
}
