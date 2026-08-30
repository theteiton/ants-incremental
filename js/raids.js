import { capPerExcavator, effectTotal, foodPerSecond, globalFoodMultiplier, population, populationCap, runPeakCount,
  SOLDIER_RANKS, RANK_IDS, rankOf, soldierCount } from "./ants.js";
import { prestigeSoldierMult } from "./prestige.js";
import { instinctCombat, instinctProtein } from "./instincts.js";
import {
  passiveCombat, passiveProtein, passiveHunt, passiveSalvage, speciesHuntMult,
  speciesLossMult, speciesRaidIntervalMult, speciesCapture, speciesCaptureDiggerMult, dulosis
} from "./matriline.js";
import { masterySoldier, bestTrialLevel, siegeActive, siegeThreatScale, challengeFailed,
  SIEGE_UNLOCK, SIEGE_INTERVAL, SIEGE_REFERENCE, SIEGE_BASE, SIEGE_LOSS_CAP,
  SIEGE_RAMP } from "./challenges.js";

export const RAID_UNLOCK = 256;
// The gate moved from 400 to 256; the threat curve deliberately did not. Monster
// power is still measured against a 400-ant nest, so a colony of any given size
// meets exactly the attacker it met before -- only the first one arrives sooner.
export const MONSTER_REFERENCE = 400;
export const RAID_INTERVAL = 360;
export const RAID_WARNING = 30;
export const EGG_PROTEIN_COST = 1;
export const FED_EGG_SPEED = 2;
export const MONSTER_BASE = 1000;
export const MONSTER_EXPONENT = 1.05;
export const MONSTER_GROWTH = 0.05;
// The per-win term used to compound forever, so a colony that kept winning
// eventually met a threat no army could hold. Measured over 24 hours: defence
// parked at 0.95-0.97 of the threat for hours, the colony lost 192 raids in a
// row and fell from 152K ants to 41K.
//
// 25 is measured, not picked. Swept over 12 hours on a finished colony, the
// value matters enormously and there is a cliff: at 40 (and uncapped, which is
// identical) the colony stalls at 33 wins, spends 69% of the run gone to ground
// and reaches 167K ants; at 25 it wins 118 of 118, never hides and reaches
// 227K. A player passes 25 wins at about two and a half hours, so everything
// before that is unchanged. The nest size term still grows without limit -- a
// bigger colony always draws worse, and the ratio erodes as it grows -- but
// winning stops being the thing that beats you.
export const MONSTER_GROWTH_CAP = 25;
export const PROTEIN_PER_POWER = 0.04;
export const FOOD_PER_POWER = 60;
export const LOSS_CAP = 0.2;
// Losing the last soldier used to be the start of a death spiral: the monster
// kept coming on the same timer, killed foragers next, and salvage scaled with
// a defence that no longer existed. Now the colony goes to ground instead --
// the attacks stop, and the ants forage warily until an army stands again.
export const HIDING_FOOD_PENALTY = 0.5;
// Hiding used to need the last soldier dead. A colony losing every raid with an
// army still standing got no reprieve at all -- it simply bled until the army
// was gone, which is the same death spiral arriving by a slower road. Three
// straight losses is the signal, and the nest shuts until it can hold again.
export const HIDING_LOSS_STREAK = 3;

export const SOLDIER_COMBAT = 25;
export const BIG_FORAGER_COMBAT_MULT = 3;
export const HUNT_PROTEIN_PER_SOLDIER = 0.01;
export const RAID_RAMP = [0.25, 0.5, 0.75];

const COMBAT_EFFECT = {
  forager: "combatForager",
  excavator: "combatExcavator",
  nurse: "combatNurse"
};

// Lowest rank first, so the ants you spent protein on are the last to fall,
// and every soldier grade still dies before the castes that feed the colony.
export const DEATH_ORDER = ["soldier", "major", "supermajor", "guard",
  "forager", "bigforager", "nanitic", "nurse", "excavator"];

// A won raid is not free. Losses scale with how close it was, so an army that
// barely holds is chewed down and one that overmatches walks away almost whole
// -- which is what makes a rank worth buying rather than a number worth
// meeting. Capped so a win can never cost more than a loss would.
export const WIN_LOSS_SHARE = 0.05;
// Veterancy: surviving a raid promotes a slice of the rank and file, free but
// slow -- and it STOPS at Major. Measured without a ceiling, 4% a raid over 118
// raids turned the whole army elite on its own: 13.2K guards of 28.1K bodies,
// fielding 37.5M strength against a 2.8M attacker. Free progress has to have a
// roof or the paid ladder above it is decoration.
export const VETERAN_SHARE = 0.03;
export const VETERAN_MAX_RANK = 1;


export function combatPerSoldier(game) {
  return SOLDIER_COMBAT * (1 + effectTotal(game, "soldierPower")) *
    prestigeSoldierMult(game) * masterySoldier(game);
}

// what one ant of a given rank is worth at the gate
export function combatPerRank(game, id) {
  const rank = rankOf(id);
  return rank ? combatPerSoldier(game) * rank.power : 0;
}

export function combatPerCaste(game, caste) {
  if (rankOf(caste)) return combatPerRank(game, caste);
  if (caste === "bigforager") {
    return effectTotal(game, COMBAT_EFFECT.forager) * BIG_FORAGER_COMBAT_MULT;
  }
  const effect = COMBAT_EFFECT[caste];
  return effect ? effectTotal(game, effect) : 0;
}

export function combatPower(game) {
  let power = 0;
  for (const id in game.ants) power += game.ants[id] * combatPerCaste(game, id);
  return power * passiveCombat(game) * instinctCombat(game);
}

export function raidsSeen(game) {
  return (game.raidsWon || 0) + (game.raidsLost || 0);
}

// Nothing hides from the Endless Siege. Going to ground stops the raid clock,
// which inside this trial defeated its entire premise: measured, a colony lost
// three raids, shut the nest and then grew in peace, clearing every level in
// twelve minutes regardless of how strong the attackers were. It is found, and
// it stays found.
export function inHiding(game) {
  if (!raidsUnlocked(game) || siegeActive(game)) return false;
  return soldierCount(game) <= 0 || (game.lossStreak || 0) >= HIDING_LOSS_STREAK;
}

// The streak clears the moment the colony can hold the next one, which is what
// lets it come back out. Nothing else clears it: while the nest is shut the
// threat is static, so rebuilding an army is always enough.
export function clearLossStreak(game) {
  if ((game.lossStreak || 0) > 0 && combatPower(game) >= monsterPower(game)) {
    game.lossStreak = 0;
  }
}

export function hunting(game) {
  return raidsUnlocked(game) && game.raidTimer > RAID_WARNING && soldierCount(game) > 0;
}

// Hunting falls off with rank, which is the cost of an elite army: a nest of
// guards fields enormous strength and brings home nothing.
export function huntingSoldiers(game) {
  let effective = 0;
  for (const rank of SOLDIER_RANKS) effective += (game.ants[rank.id] || 0) * rank.hunt;
  return effective;
}

export function huntRate(game) {
  if (!hunting(game)) return 0;
  return huntingSoldiers(game) * HUNT_PROTEIN_PER_SOLDIER *
    (1 + effectTotal(game, "proteinYield")) *
    passiveHunt(game) * speciesHuntMult(game) * instinctProtein(game);
}


// ---------------------------------------------------------- how hard raids are
//
// A colony that has mastered every trial outguns the next attacker by about 350
// times, because the soldier mastery and the adaptation strength both compound
// while the threat only follows the nest's size. Rather than cut what clearing
// a trial pays -- the reward is earned, and taking it back is the wrong lever --
// the ceiling comes off by choice.
//
// It is unlocked by clearing the Endless Siege once: the trial that teaches the
// colony to fight is the one that lets it ask for a real fight.
export const RAID_DIFFICULTIES = [
  // A harder setting used to pay nothing at all -- it was a difficulty dial with
  // no reward on the other side of it, which is why a playtester called the
  // whole raid economy not worth the protein. What comes through the door is
  // bigger, so what it is worth stripping is bigger: the spoils scale with the
  // setting, and that is the trade.
  { id: "sheltered", name: "Sheltered",
    note: "The default. An attacker grows five per cent with each raid you win, and stops growing after twenty-five of them.",
    capWins: true, seesMastery: 0, exponent: MONSTER_EXPONENT, spoils: 1 },
  { id: "unchecked", name: "Unchecked",
    note: "The growth per win never stops. Every victory makes the next attacker larger, for as long as you keep winning — and a larger corpse is worth more. Spoils × 1.5.",
    capWins: false, seesMastery: 0, exponent: MONSTER_EXPONENT, spoils: 1.5 },
  { id: "hunted", name: "Hunted",
    note: "Uncapped, and what you have learned about fighting is known to whatever is coming. Everything Hardened Line pays you, it brings with it — and it is worth stripping for it. Spoils × 2.5.",
    capWins: false, seesMastery: 1, exponent: MONSTER_EXPONENT, spoils: 2.5 },
  // Hunted sees what Hardened Line taught you once; Relentless sees it and
  // half again. At seesMastery 1 a fully mastered colony held a 5.18x margin
  // and went 119W/0L over twelve hours -- the hardest setting in the game had
  // never actually lost a raid, which makes it a label rather than a choice. At
  // 1.5 the same colony sits at 0.95x and goes 112W/3L: it wins most of them
  // and is genuinely broken into now and then. At 1.75 it collapses to 2W/3L.
  // The exponent scales with how mastered you are, so a colony that has just
  // cleared the siege once still enters at a 1.20x margin and 78W/0L.
  { id: "relentless", name: "Relentless",
    note: "As Hunted, and a larger nest draws far worse than it used to. There is no arrangement of ants that wins this comfortably — a colony that has mastered the trials will lose raids here.",
    capWins: false, seesMastery: 1.5, exponent: 1.12, spoils: 4 }
];

export function raidDifficulty(game) {
  const chosen = (game.settings && game.settings.raidDifficulty) || "sheltered";
  if (!raidDifficultyUnlocked(game)) return RAID_DIFFICULTIES[0];
  return RAID_DIFFICULTIES.find(d => d.id === chosen) || RAID_DIFFICULTIES[0];
}

// the trial that demands soldiers is the one that lets you ask for worse
export function raidDifficultyUnlocked(game) {
  return bestTrialLevel(game, "siege") > 0;
}

// what the colony's own record adds to the next attacker, capped
export function monsterWinGrowth(game) {
  const wins = game.raidsWon || 0;
  const counted = raidDifficulty(game).capWins
    ? Math.min(wins, MONSTER_GROWTH_CAP) : wins;
  return 1 + MONSTER_GROWTH * counted;
}

// one place decides the run-up, so the raid and the Formulas panel agree
export function raidRamp(game) {
  return siegeActive(game) ? SIEGE_RAMP : RAID_RAMP;
}

export function monsterRamp(game) {
  const ramp = raidRamp(game);
  const seen = raidsSeen(game);
  return seen < ramp.length ? ramp[seen] : 1;
}

// A siege attacker is scaled against the 16-ant nest it actually arrives at.
// Running it through the ordinary 400-ant reference would send a 1,000-power
// monster at a colony of sixteen, which is not a trial but a wall.
export function monsterReference(game) {
  return siegeActive(game) ? SIEGE_REFERENCE : MONSTER_REFERENCE;
}

export function monsterBase(game) {
  return siegeActive(game) ? SIEGE_BASE * siegeThreatScale(game) : MONSTER_BASE;
}

export function monsterPower(game) {
  const reference = monsterReference(game);
  const reach = Math.max(reference, runPeakCount(game, "population"));
  const level = raidDifficulty(game);
  // at the harder settings the attacker knows what the colony has learned
  const learned = level.seesMastery > 0
    ? Math.pow(masterySoldier(game), level.seesMastery) : 1;
  return monsterBase(game) * Math.pow(reach / reference, level.exponent) *
    monsterWinGrowth(game) * monsterRamp(game) * learned;
}


// ------------------------------------------------------------ the attackers
//
// "What kind of monster am I facing" was a fair question with no answer: the
// nest was attacked by a number. Each attacker is now a thing, drawn from the
// band its strength falls in -- real ant predators for as long as the colony is
// a plausible size, and then rather less plausible ones, because by the time a
// nest holds a million ants a wild boar is no longer the frightening option.
//
// `from` is the attacker power at which one starts appearing. The band stays
// open afterwards, so a strong colony still meets the occasional woodpecker.
export const MONSTERS = [
  { id: "phorid", name: "Phorid Fly", from: 0,
    note: "A fly the size of a pinhead that lays a single egg in a worker's head. Barely an attack at all, and every colony's first." },
  { id: "antlion", name: "Antlion", from: 200,
    note: "It does not hunt. It digs a pit in loose sand and waits at the bottom for the trail to cross it." },
  { id: "spider", name: "Wolf Spider", from: 600,
    note: "No web. It runs the foraging trails down one ant at a time and carries them off." },
  { id: "assassin", name: "Assassin Bug", from: 1500,
    note: "It drains a worker and wears the empty shell on its back, stacked with the others, and walks into the nest wearing them." },
  { id: "mantis", name: "Praying Mantis", from: 4000,
    note: "Still for hours at the mouth of the tunnel, then not still." },
  { id: "raiders", name: "Army Ant Raiders", from: 10000,
    note: "Another colony, and a bigger one. They take the brood rather than the workers, which is worse." },
  { id: "toad", name: "Cane Toad", from: 25000,
    note: "Sits on the entrance and swallows whatever comes out of it, for as long as anything does." },
  { id: "woodpecker", name: "Green Woodpecker", from: 60000,
    note: "It is not after the wood. Its tongue is longer than its head and sticky along its whole length." },
  { id: "pangolin", name: "Pangolin", from: 150000,
    note: "Armoured, clawed, and entirely uninterested in being bitten. It opens the nest like a tin." },
  { id: "aardvark", name: "Aardvark", from: 400000,
    note: "A metre of digging muscle that eats fifty thousand insects a night and sleeps somewhere else." },
  { id: "anteater", name: "Giant Anteater", from: 1e6,
    note: "Two metres, no teeth, and a tongue that goes in and out a hundred and fifty times a minute." },
  { id: "echidna", name: "Echidna", from: 2.5e6,
    note: "Spined, egg-laying, and older than almost everything. It has been eating ants since before there were anteaters to compete with." },
  { id: "bear", name: "Sloth Bear", from: 6e6,
    note: "It closes its nostrils, puts its face into the nest and inhales. The noise carries for half a mile." },
  { id: "badger", name: "Honey Badger", from: 1.5e7,
    note: "It is not especially large. It is simply unwilling to stop, and nothing it meets has yet convinced it otherwise." },
  { id: "monitor", name: "Monitor Lizard", from: 4e7,
    note: "It excavates rather than raids, and it returns to the same nest until there is nothing left worth returning for." },
  { id: "boar", name: "Wild Boar", from: 1e8,
    note: "Not a specialist. It simply ploughs the ground where the colony happens to be and eats what surfaces." },
  { id: "basilisk", name: "Basilisk", from: 2.5e8,
    note: "The trails nearest the entrance are found stopped mid-step, every ant still facing the way it came." },
  { id: "wyvern", name: "Wyvern", from: 7e8,
    note: "Two legs, two wings, and a descent steep enough that the first warning is the shadow crossing the trail." },
  { id: "chimera", name: "Chimera", from: 2e9,
    note: "Three heads that do not agree on which chamber to open first, which is the only reason anything survives it." },
  { id: "dragon", name: "Dragon", from: 5e9,
    note: "It does not dig. It waits above the nest for the alates to rise, and takes the whole flight in one pass." },
  { id: "wyrm", name: "Elder Wyrm", from: 2e10,
    note: "It was underground before the colony was, and it has been moving towards the warmth for a very long time." }
];

// Which attackers a threat of this size could be. The last few bands stay open
// so a colony meets some variety rather than the same creature for ever.
export function monsterChoices(power) {
  const open = MONSTERS.filter(m => power >= m.from);
  if (!open.length) return [MONSTERS[0]];
  return open.slice(Math.max(0, open.length - 3));
}

export function monsterById(id) {
  return MONSTERS.find(m => m.id === id) || MONSTERS[0];
}

// Rolled once and remembered, so the attacker does not change identity between
// frames while the colony is looking at it.
export function rollMonster(game) {
  const choices = monsterChoices(monsterPower(game));
  game.monster = choices[Math.floor(Math.random() * choices.length)].id;
  return game.monster;
}

export function currentMonster(game) {
  if (!game.monster) rollMonster(game);
  return monsterById(game.monster);
}

// Protein and food are not comparable by their raw numbers: measured across a
// full run one protein is worth between 5,700 and 18,400 food, and the ratio
// triples as foragers outscale the soldier count. So the exchange is read from
// what the colony actually earns right now rather than fixed to a constant.
export function proteinPerSecond(game) {
  if (!raidsUnlocked(game)) return 0;
  const power = monsterPower(game);
  return huntRate(game) + raidRewards(game, power).protein / raidInterval(game);
}

export function foodPerProtein(game) {
  const perProtein = proteinPerSecond(game);
  if (!(perProtein > 0)) return 0;
  const power = monsterPower(game);
  const food = foodPerSecond(game) + raidRewards(game, power).food / raidInterval(game);
  return food / perProtein;
}

// Trading takes a cut in BOTH directions, which is what stops the exchange
// being a loop: food -> protein -> food returns 0.8 x 0.8 = 64% of what went
// in, so there is no round trip that makes anything. The fair rate is
// foodPerProtein(), read from what the colony earns right now rather than
// fixed -- one protein is worth between 2M and 4.1M food across a late run, so
// no constant would stay honest.
export const EXCHANGE_RETURN = 0.8;

export function exchangeReady(game) {
  return raidsUnlocked(game) && foodPerProtein(game) > 0;
}

// what selling n protein pays, and what buying n protein costs
export function proteinSaleValue(game, n) {
  return exchangeReady(game) ? n * foodPerProtein(game) * EXCHANGE_RETURN : 0;
}

export function proteinPurchaseCost(game, n) {
  return exchangeReady(game) ? n * foodPerProtein(game) / EXCHANGE_RETURN : Infinity;
}

// what the chosen difficulty is worth stripping, so a harder setting is a trade
// rather than a dare
export function raidSpoils(game) {
  return raidDifficulty(game).spoils || 1;
}

export function raidRewards(game, power) {
  const spoils = raidSpoils(game);
  return {
    protein: Math.max(1, Math.round(power * PROTEIN_PER_POWER *
      (1 + effectTotal(game, "proteinYield")) * passiveProtein(game) *
      instinctProtein(game) * spoils)),
    food: power * FOOD_PER_POWER * globalFoodMultiplier(game) * spoils
  };
}

// Polyergus grows only by raiding, so she has to be raided early -- gated at
// 256 with nothing but soldiers layable, the colony could never reach the gate
// that was the only way to get workers.
export const DULOSIS_UNLOCK = 16;
// the least a won raid brings home, so a small colony can still get started
export const CAPTURE_FLOOR = 4;
// the share of a capture that is somebody else's diggers
export const CAPTURE_DIGGERS = 0.25;
// Measured at 24 hours on a fully mastered colony with the whole tree bought:
// at 4 Polyergus reaches 103,476 ants against about 24,000 for every other
// species, because each captured digger is worth up to 58 cap once the
// excavator line is deep and she wins 299 raids in a day. At 2 she lands near
// twice the field, which is what a species that grows only by war should be.
export const CAPTURE_DIGGER_CAP = 2;

export function raidUnlockAt(game) {
  if (siegeActive(game)) return SIEGE_UNLOCK;
  return dulosis(game) ? DULOSIS_UNLOCK : RAID_UNLOCK;
}

export function raidInterval(game) {
  const base = siegeActive(game) ? SIEGE_INTERVAL : RAID_INTERVAL;
  return base * speciesRaidIntervalMult(game);
}

export function raidsUnlocked(game) {
  return runPeakCount(game, "population") >= raidUnlockAt(game);
}

// A lost trial stops being attacked. The run is already over -- carrying on
// hammering the colony at half the nest per defeat would only punish a player
// for not having clicked Abandon yet.
export function raidsHalted(game) {
  return challengeFailed(game);
}

export function raidCountdown(game) {
  return Math.max(0, game.raidTimer);
}

export function raidImminent(game) {
  return raidsUnlocked(game) && game.raidTimer <= RAID_WARNING;
}

// Only the ranks, lowest first. A won raid costs soldiers and nothing else --
// the workers never came out.
function killSoldiers(game, toll) {
  const dead = {};
  let remaining = Math.floor(toll);
  for (const id of RANK_IDS) {
    if (remaining <= 0) break;
    const held = game.ants[id] || 0;
    if (held <= 0) continue;
    const taken = Math.min(held, remaining);
    game.ants[id] -= taken;
    dead[id] = taken;
    remaining -= taken;
  }
  return dead;
}

// What holding the gate costs. It scales with how close the fight was -- an
// army that overmatches walks away nearly whole, one that barely holds is
// chewed down -- which is what makes a rank worth buying rather than a number
// worth merely meeting.
export function winToll(game, defence, power) {
  if (!(defence > 0)) return 0;
  const closeness = Math.min(1, power / defence);
  return Math.floor(soldierCount(game) * WIN_LOSS_SHARE * Math.pow(closeness, 3));
}

// Surviving a raid makes veterans. Walked from the top down so an ant promoted
// by this raid is not promoted twice by the same one.
export function promoteVeterans(game) {
  const moved = {};
  // VETERAN_MAX_RANK is the highest rank veterancy may PRODUCE, so the loop
  // stops one index below it -- promoting at i moves an ant from i to i+1.
  for (let i = Math.min(VETERAN_MAX_RANK - 1, SOLDIER_RANKS.length - 2); i >= 0; i--) {
    const from = SOLDIER_RANKS[i].id;
    const to = SOLDIER_RANKS[i + 1].id;
    const n = Math.floor((game.ants[from] || 0) * VETERAN_SHARE);
    if (n <= 0) continue;
    game.ants[from] -= n;
    game.ants[to] = (game.ants[to] || 0) + n;
    moved[to] = n;
  }
  return moved;
}

function killAnts(game, toll) {
  const dead = {};
  let remaining = toll;
  for (const caste of DEATH_ORDER) {
    if (remaining <= 0) break;
    const held = game.ants[caste];
    if (held <= 0) continue;
    const taken = Math.min(held, remaining);
    game.ants[caste] -= taken;
    if (caste === "bigforager") game.bigForagers.splice(0, taken);
    dead[caste] = taken;
    remaining -= taken;
  }
  return dead;
}

// A raid you win is a raid you took something from. Eciton carries brood home
// with the column; Polyergus has no other way to grow at all, which is what
// makes dulosis a rewrite rather than a debuff. It compounds with the colony,
// so it is growth rather than a trickle.
function captureBrood(game) {
  const share = speciesCapture(game);
  if (share <= 0) return 0;
  // A floor as well as a share, because a share of a tiny colony is nothing and
  // Polyergus has no other way to grow at all -- measured, 21 ants after an
  // hour and a death spiral, because two captures a raid could not build an
  // army fast enough to keep winning them.
  const want = Math.max(CAPTURE_FLOOR, Math.floor(population(game) * share));
  // A raided nest is a whole nest, so what comes back includes its diggers --
  // and it has to. Under dulosis no excavator can ever be laid, so without
  // captured ones the cap sits at its base for ever: measured, 30 ants in a
  // nest built for 30, winning every raid and unable to grow by a single ant.
  // They are exempt from the room check for the same reason a laid excavator
  // is: she digs the chamber she will occupy. Where digging raises nothing --
  // a nomadic column -- none are taken and the whole capture is clamped.
  // Capped flat, and that cap is what keeps this species bounded. A share of
  // the colony compounds: each captured digger raises the cap, which raises the
  // next capture, which raises the cap -- measured, 107,233 ants at four hours
  // against about 6,600 for every other species. Capped, the nest grows by a
  // fixed amount per raid WON, which is exactly what dulosis should be: she
  // grows by raiding and by nothing else, so the growth is linear in raids.
  const diggerCap = CAPTURE_DIGGER_CAP * speciesCaptureDiggerMult(game);
  const diggers = capPerExcavator(game) > 0
    ? Math.min(diggerCap, Math.max(1, Math.round(want * CAPTURE_DIGGERS))) : 0;
  // and a ceiling on the rest: the column carries what it can carry. Without it
  // Eciton walked its own captures past the nomadic cap -- 859 ants in a column
  // built for 500 -- which is the cap bypass again in a new coat.
  const room = Math.max(0, populationCap(game) - population(game));
  const rest = Math.max(0, Math.min(want - diggers, room));
  if (diggers <= 0 && rest <= 0) return 0;
  game.ants.excavator += diggers;
  game.ants.forager += rest;
  return diggers + rest;
}

export function resolveRaid(game) {
  const power = monsterPower(game);
  const defence = combatPower(game);
  const won = defence >= power;
  const reward = raidRewards(game, power);

  if (won) {
    game.protein += reward.protein;
    game.stats.proteinEarned = (game.stats.proteinEarned || 0) + reward.protein;
    game.food += reward.food;
    game.stats.foodEarned += reward.food;
    game.raidsWon++;
    game.lossStreak = 0;
    game.stats.raidsWonTotal = (game.stats.raidsWonTotal || 0) + 1;
    const fallen = killSoldiers(game, winToll(game, defence, power));
    const promoted = promoteVeterans(game);
    const captured = captureBrood(game);
    game.lastRaid = { won: true, power, protein: reward.protein, food: reward.food,
      dead: fallen, promoted, captured, monster: game.monster };
    rollMonster(game);
    return game.lastRaid;
  }

  const shortfall = Math.min(1, (power - defence) / power);
  const cap = siegeActive(game) ? SIEGE_LOSS_CAP : LOSS_CAP;
  const toll = Math.max(1, Math.floor(population(game) * cap * shortfall * speciesLossMult(game)));
  const dead = killAnts(game, toll);
  const salvage = Math.round(reward.protein * (defence / power) * passiveSalvage(game));
  game.protein += salvage;
  game.stats.proteinEarned = (game.stats.proteinEarned || 0) + salvage;
  game.raidsLost++;
  game.lossStreak = (game.lossStreak || 0) + 1;
  game.lastRaid = { won: false, power, protein: salvage, food: 0, dead, promoted: {},
    monster: game.monster };
  rollMonster(game);
  return game.lastRaid;
}
