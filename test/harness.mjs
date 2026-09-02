import "./stub.mjs";

export const G = await import("../js/game.js");
export const A = await import("../js/ants.js");
export const C = await import("../js/challenges.js");
export const R = await import("../js/raids.js");
export const AC = await import("../js/achievements.js");
export const L = await import("../js/library.js");
export const P = await import("../js/prestige.js");
export const S = await import("../js/save.js");
export const U = await import("../js/upgrades.js");

export const game = G.game;

// deterministic runs
export function seed(n) {
  let s = n >>> 0 || 1;
  Math.random = () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

export function reset() {
  G.hardReset();
}

export function grantAllLineage() {
  for (const u of P.PRESTIGE_UPGRADES) {
    if (!game.prestige.upgrades.includes(u.id)) game.prestige.upgrades.push(u.id);
  }
}

export function grantAutomation() {
  for (const u of P.PRESTIGE_UPGRADES) {
    if (u.effect.type === "automation" && !game.prestige.upgrades.includes(u.id)) {
      game.prestige.upgrades.push(u.id);
    }
  }
}

// every finite/non-negative invariant the model must hold every tick
export function checkState(where, problems) {
  const bad = (label, v, opts = {}) => {
    if (!Number.isFinite(v)) problems.push(`${where}: ${label} is ${v}`);
    else if (!opts.allowNeg && v < -1e-9) problems.push(`${where}: ${label} is negative (${v})`);
  };
  bad("food", game.food);
  bad("protein", game.protein);
  bad("reserves", game.reserves);
  bad("runTime", game.runTime);
  bad("raidTimer", game.raidTimer, { allowNeg: true });
  bad("foodPerSecond", A.foodPerSecond(game));
  bad("populationCap", A.populationCap(game));
  bad("broodCapacity", A.broodCapacity(game));
  bad("hatchRate", A.hatchRate(game));
  bad("combatPower", R.combatPower(game));
  bad("monsterPower", R.monsterPower(game));
  bad("achievementLevel", game.achievementLevel);
  bad("achievementXp", game.achievementXp);
  for (const id in game.ants) {
    const n = game.ants[id];
    if (!Number.isInteger(n) || n < 0) problems.push(`${where}: ants.${id} = ${n}`);
  }
  const pop = A.population(game);
  if (!Number.isFinite(pop) || pop < 0) problems.push(`${where}: population = ${pop}`);
  for (const egg of game.eggs) {
    if (!Number.isFinite(egg.progress) || egg.progress < 0) {
      problems.push(`${where}: egg progress = ${egg.progress}`);
      break;
    }
  }
}

// A policy-driven player. Uses the game's own automation for laying and buying
// (so the real code paths are exercised), and adds the clicks automation never
// does: rallying, and stripping wings before the shed instinct is owned.
export function play(seconds, opts = {}) {
  const step = opts.step || 1;
  const problems = opts.problems || [];
  const marks = opts.marks || {};
  const stop = opts.stop || (() => false);
  const rally = opts.rally !== false;
  let t = 0;
  let checkAt = 0;
  while (t < seconds) {
    if (!game.wingsShed) G.shedWings();
    if (G.stripReady()) G.stripWing();
    if (rally && G.rallyReady()) G.startRally();
    // Under the Blight, exiling is the only cure and it is the trial's whole
    // loop. A policy that never exiles is not playing the trial, it is watching
    // the colony die -- which is exactly what the first measurement did.
    if (opts.cure) handCure();
    // when the colony's own Nest Memory is off (Sterile), a real player still
    // buys -- greedily, by what one level actually does to the food rate per
    // unit of cost, which is what a competent hand approximates
    if (opts.handBuy && !G.automationOn("autoBuy")) handBuyBest();
    // a player with no automation yet: keep the tended chambers full with the
    // caste the ratios ask for, and buy what is worth buying
    if (opts.hand) {
      if (!G.automationOn("autoBuy")) handBuyBest();
      if (!G.automationOn("autoLay")) handLay();
      // Brood Instinct without Standing Orders lays whatever caste is selected
      // and nothing else, so a colony left on foragers caps out and stops. A
      // player picks; this is that pick.
      else if (!G.automationOn("autoRatio")) {
        const want = G.managedCaste();
        if (want !== game.nextCaste) G.setNextCaste(want);
      }
    }
    G.tick(step);
    t += step;
    if (t >= checkAt) { checkState(opts.label || "tick", problems); checkAt = t + 60; }
    for (const key in marks) {
      if (marks[key].at === undefined && marks[key].when()) marks[key].at = t;
    }
    if (stop(t)) break;
  }
  return { seconds: t, problems, marks };
}

// Carry out the sick. Exiling removes infected ants first, so a player keeps
// the share down by spending workers -- which is the trade the Blight is about.
// Held a little under the failure ceiling rather than at zero, because every ant
// carried out is an ant that was gathering.
export function handCure() {
  if (!C.blightActive(game)) return 0;
  const pop = A.population(game);
  const share = C.blightShare(game, pop);
  if (share < C.BLIGHT_HOLD) return 0;
  // bring it back to the hold line, taking from the caste with the most to spare
  const target = Math.max(0, C.blightCount(game) - Math.floor(pop * C.BLIGHT_HOLD * 0.6));
  let left = target;
  for (const caste of ["forager", "nurse", "excavator", "soldier"]) {
    if (left <= 0) break;
    left -= G.exile(caste, left);
  }
  return target - left;
}

// pick the affordable level with the best gain-per-cost, and buy it
export function handBuyBest() {
  let best = null;
  const before = A.foodPerSecond(game);
  for (const line of A.UPGRADES) {
    if (A.upgradeMaxed(game, line) || !A.upgradeUnlocked(game, line)) continue;
    const cost = A.nextLevelCost(game, line);
    if (!cost || game.food < cost.food || game.protein < cost.protein) continue;
    const levels = Object.assign({}, game.upgrades);
    levels[line.id] = A.upgradeLevel(game, line) + 1;
    const probe = Object.assign({}, game, { upgrades: levels });
    const gain = A.foodPerSecond(probe) - before +
      (A.populationCap(probe) - A.populationCap(game)) * 0.5 +
      (A.broodCapacity(probe) - A.broodCapacity(game)) * 20;
    const price = Math.max(1, cost.food + cost.protein * 1000);
    if (gain > 0 && (!best || gain / price > best.value)) {
      best = { id: line.id, value: gain / price };
    }
  }
  if (best) G.buyUpgrade(best.id);
  return best;
}

// what a hand does every few seconds: top up the brood with the caste the
// colony is shortest of, which is exactly what Standing Orders automates
export function handLay() {
  const caste = G.managedCaste();
  let guard = 0;
  while (game.eggs.length < A.broodCapacity(game) && guard++ < 64) {
    if (!G.layEgg(caste)) break;
  }
}

export const mins = s => (s / 60).toFixed(1) + "m";
