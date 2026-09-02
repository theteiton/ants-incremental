// What you keep from something you beat.
//
// Fifty creatures, five grades tall: the modifier words are grades of one
// trophy rather than 250 separate entries, so a creature already caught stays
// worth meeting in a bigger form.
//
// Three ways to earn one, mixed, because each alone has a flaw. The first kill
// always gives the trophy, so a fight is never wasted and nothing is gated
// behind luck. Every kill after that rolls for the grade the creature actually
// was, which is the reason to hunt further out. And a kill count raises it
// anyway, as a floor -- bad luck can slow a trophy down but never block one.
//
// Imports only bestiary.js, which is a leaf.

import { MONSTERS, BANDS, bandById, monsterById, topGradeFor } from "./bestiary.js";

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
    return { id: monsterId, from: had, to: want, first: had === 0 };
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

// ---------------------------------------------------------------- what they pay
//
// A band gives a KIND and a trophy gives a value within it, so there are five
// effects to measure rather than fifty -- which is the safeguard against fifty
// inert rewards, the exact mistake 0.2.6.0 spent a release fixing.
//
// Grades are cumulative in the sense that matters: a trophy at grade g pays g
// times what grade 1 paid, so a trophy never stops being worth what it already
// was.
//
// These pay into fighting strength, protein, speed and TERRITORY, and that is
// safe only because of the Hunt: territory multiplies foraging, so a combat
// reward is no longer inert. It is still not a global food multiplier, so the
// hardest rule in the canon holds.
export function bandBonus(game, bandId) {
  const band = bandById(bandId);
  let sum = 0;
  for (const m of bandMonsters(bandId)) sum += band.per * trophyGrade(game, m.id);
  const complete = bandComplete(game, bandId) ? band.complete : 1;
  return (1 + sum) * complete;
}

export function trophyBonus(game, kind) {
  let total = 1;
  for (const band of BANDS) {
    if (band.kind !== kind) continue;
    total *= bandBonus(game, band.id);
  }
  return total;
}

export function trophyStrength(game) { return trophyBonus(game, "strength"); }
export function trophyProtein(game) { return trophyBonus(game, "protein"); }
export function trophyTerritory(game) { return trophyBonus(game, "territory"); }
export function trophySpeed(game) { return trophyBonus(game, "speed"); }

// The myth band does not behave like a trophy, which is the point of it: it
// pays into every other kind at once, at a fraction. Nothing else in the game
// multiplies four things, and nothing else costs seven creatures that only
// appear once a nest holds hundreds of millions.
export function trophyMyth(game) {
  return trophyBonus(game, "myth");
}
