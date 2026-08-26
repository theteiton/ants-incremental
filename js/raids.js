import { effectTotal, foodPerSecond, globalFoodMultiplier, population, runPeakCount,
  SOLDIER_RANKS, RANK_IDS, rankOf, soldierCount } from "./ants.js";
import { prestigeSoldierMult } from "./prestige.js";
import { masterySoldier, siegeActive, siegeThreatScale, challengeFailed,
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
  return power;
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
    (1 + effectTotal(game, "proteinYield"));
}

// what the colony's own record adds to the next attacker, capped
export function monsterWinGrowth(game) {
  return 1 + MONSTER_GROWTH * Math.min(game.raidsWon || 0, MONSTER_GROWTH_CAP);
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
  return monsterBase(game) * Math.pow(reach / reference, MONSTER_EXPONENT) *
    monsterWinGrowth(game) * monsterRamp(game);
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

export function raidRewards(game, power) {
  return {
    protein: Math.max(1, Math.round(power * PROTEIN_PER_POWER * (1 + effectTotal(game, "proteinYield")))),
    food: power * FOOD_PER_POWER * globalFoodMultiplier(game)
  };
}

export function raidUnlockAt(game) {
  return siegeActive(game) ? SIEGE_UNLOCK : RAID_UNLOCK;
}

export function raidInterval(game) {
  return siegeActive(game) ? SIEGE_INTERVAL : RAID_INTERVAL;
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
    game.lastRaid = { won: true, power, protein: reward.protein, food: reward.food,
      dead: fallen, promoted };
    return game.lastRaid;
  }

  const shortfall = Math.min(1, (power - defence) / power);
  const cap = siegeActive(game) ? SIEGE_LOSS_CAP : LOSS_CAP;
  const toll = Math.max(1, Math.floor(population(game) * cap * shortfall));
  const dead = killAnts(game, toll);
  const salvage = Math.round(reward.protein * (defence / power));
  game.protein += salvage;
  game.stats.proteinEarned = (game.stats.proteinEarned || 0) + salvage;
  game.raidsLost++;
  game.lossStreak = (game.lossStreak || 0) + 1;
  game.lastRaid = { won: false, power, protein: salvage, food: 0, dead, promoted: {} };
  return game.lastRaid;
}
