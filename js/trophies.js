// What you keep from something you beat.
//
// Forty-nine creatures, five grades tall: the modifier words are grades of one
// trophy rather than 250 separate entries, so a creature already caught stays
// worth meeting in a bigger form.
//
// Three ways to earn one, mixed, because each alone has a flaw. The first kill
// always gives the trophy, so a fight is never wasted and nothing is gated
// behind luck. Every kill after that rolls for the grade the creature actually
// was, which is the reason to hunt further out. And a kill count raises it
// anyway, as a floor -- bad luck can slow a trophy down but never block one.
//
// EVERY GRADE PAYS A DIFFERENT KIND. A trophy is not a number that grows, it is
// a thing that keeps opening up: the Aardvark Claw gives room at grade 1,
// protein at 2, fighting strength at 3 and cheaper brood at 4, and holding it at
// grade 4 pays all four. What each creature teaches matches what it is -- an
// antlion teaches holding ground, a chimpanzee teaches technique, a pangolin
// teaches armour.
//
// Imports only bestiary.js, which is a leaf.

import { MONSTERS, BANDS, bandById, monsterById, topGradeFor,
  trophyGradeValue, trophyKindAt, trophyName } from "./bestiary.js";

// the chance a kill hands over the grade the creature actually was
export const DROP_CHANCE = 0.22;

// the kill count at which a grade is guaranteed regardless of luck
export const KILL_LADDER = [0, 1, 12, 45, 160, 520];

export function gradeFromKills(kills) {
  let grade = 0;
  for (let g = 1; g < KILL_LADDER.length; g++) if (kills >= KILL_LADDER[g]) grade = g;
  return grade;
}

export function trophyGrade(game, monsterId) {
  return (game.trophies && game.trophies[monsterId]) || 0;
}

export function trophyKills(game, monsterId) {
  return (game.trophyKills && game.trophyKills[monsterId]) || 0;
}

// Called when a creature is beaten. `grade` is what the modifier it wore was
// worth. Returns what changed, so the raid report can say so.
export function awardTrophy(game, monsterId, grade, rng) {
  const monster = monsterById(monsterId);
  if (!monster) return null;
  if (!game.trophies) game.trophies = {};
  if (!game.trophyKills) game.trophyKills = {};
  const roll = rng || Math.random;

  game.trophyKills[monsterId] = trophyKills(game, monsterId) + 1;
  const kills = game.trophyKills[monsterId];
  const top = topGradeFor(monster);
  const had = trophyGrade(game, monsterId);
  let want = had;

  // 1. the first kill always gives it
  if (had === 0) want = 1;
  // 2. and every kill rolls for the grade this one actually was
  if (grade > want && roll() < DROP_CHANCE) want = grade;
  // 3. with the kill count as a floor luck cannot undercut
  want = Math.max(want, gradeFromKills(kills));
  // never past what this creature is capable of giving
  want = Math.min(want, top);

  if (want > had) {
    game.trophies[monsterId] = want;
    return { id: monsterId, from: had, to: want, first: had === 0,
      name: trophyName(monster), kind: trophyKindAt(monster, want) };
  }
  return null;
}

// ------------------------------------------------------------------ the bands
export function bandMonsters(bandId) {
  return MONSTERS.filter(m => m.band === bandId);
}

export function bandHeld(game, bandId) {
  return bandMonsters(bandId).filter(m => trophyGrade(game, m.id) > 0).length;
}

export function bandComplete(game, bandId) {
  const all = bandMonsters(bandId);
  return all.length > 0 && bandHeld(game, bandId) === all.length;
}

export function trophyCount(game) {
  return MONSTERS.filter(m => trophyGrade(game, m.id) > 0).length;
}

// The band multiplies what its members are worth, ramping with how much of it
// you hold and reaching the band's full figure when it is complete. So a band
// pays continuously as it fills and completing one is the peak of it rather
// than a cliff that only exists at the very end.
export function bandMultiplier(game, bandId) {
  const band = bandById(bandId);
  const all = bandMonsters(bandId);
  if (!all.length) return 1;
  const share = bandHeld(game, bandId) / all.length;
  return 1 + (band.complete - 1) * share;
}

// ---------------------------------------------------------------- what they pay
//
// A trophy pays into whatever kind its grade names, multiplied by how far its
// band has come. Grades are cumulative: holding grade 4 pays grades 1 to 4, in
// four different kinds.
//
// These reach fighting strength, protein, hunting, salvage, capture, territory
// and the egg price. That is safe because of the Hunt: territory multiplies
// foraging, so a combat reward is no longer inert. `food` is here too but it is
// the rarest kind by design, and no single trophy gives much of it.
export function trophyBonus(game, kind) {
  let total = 1;
  for (const monster of MONSTERS) {
    const grade = trophyGrade(game, monster.id);
    if (!grade) continue;
    let sum = 0;
    for (let g = 1; g <= grade; g++) {
      if (trophyKindAt(monster, g) === kind) sum += trophyGradeValue(monster, g);
    }
    if (sum > 0) total += sum * bandMultiplier(game, monster.band);
  }
  return total;
}

// what one held trophy is contributing, for the panel to say
export function trophyEffects(game, monsterId) {
  const monster = monsterById(monsterId);
  const grade = trophyGrade(game, monsterId);
  const out = [];
  if (!monster || !grade) return out;
  const band = bandMultiplier(game, monster.band);
  for (let g = 1; g <= grade; g++) {
    const kind = trophyKindAt(monster, g);
    if (!kind) continue;
    out.push({ grade: g, kind, value: trophyGradeValue(monster, g) * band });
  }
  return out;
}

// what a trophy WOULD give at a grade not yet held, so the wall can say what is
// worth hunting for
export function trophyNextGrade(game, monsterId) {
  const monster = monsterById(monsterId);
  if (!monster) return null;
  const grade = trophyGrade(game, monsterId);
  const top = topGradeFor(monster);
  if (grade >= top) return null;
  const next = grade + 1;
  return { grade: next, kind: trophyKindAt(monster, next),
    value: trophyGradeValue(monster, next) * bandMultiplier(game, monster.band) };
}

export function trophyStrength(game) { return trophyBonus(game, "strength"); }
export function trophyProtein(game) { return trophyBonus(game, "protein"); }
export function trophyTerritory(game) { return trophyBonus(game, "territory"); }
export function trophySpeed(game) { return trophyBonus(game, "speed"); }
export function trophyFood(game) { return trophyBonus(game, "food"); }
export function trophyHunt(game) { return trophyBonus(game, "hunt"); }
export function trophySalvage(game) { return trophyBonus(game, "salvage"); }
export function trophyCapture(game) { return trophyBonus(game, "capture"); }
export function trophyCap(game) { return trophyBonus(game, "cap"); }
export function trophyBrood(game) { return trophyBonus(game, "brood"); }

// the egg price moves the other way: a trophy that teaches the colony to raise
// brood cheaply makes an egg cost LESS
export function trophyEgg(game) { return 1 / trophyBonus(game, "egg"); }

// Every kind a trophy can pay into, with a readable name. One table, so the
// panel, the inspector and the away report cannot disagree about what a kind is.
export const TROPHY_KINDS = {
  food: "food",
  egg: "cheaper eggs",
  protein: "protein from raids",
  hunt: "hunting",
  strength: "fighting strength",
  salvage: "salvage from a defeat",
  capture: "ants captured",
  territory: "what held ground pays",
  speed: "speed",
  cap: "population cap",
  brood: "brood"
};

export function kindName(kind) {
  return TROPHY_KINDS[kind] || kind;
}
