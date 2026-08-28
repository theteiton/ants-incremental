import { PRESTIGE_UPGRADES, prestigeUpgradeOwned } from "./prestige.js";

// A challenge founds a colony under conditions that should kill it. The
// requirement never moves -- every level of every trial asks for the same
// colony -- so difficulty comes entirely from the debuff, and the reward a
// completion pays is what lets you meet the next one. Climb until the debuff
// outruns the rewards.
// Each trial asks for the thing it is ABOUT. Asking a combat trial for 600 ants
// tested growth, not the siege -- you could clear Endless Siege by outrunning it
// rather than by holding the gate, which is the opposite of what it is for. The
// growth trials still ask for a colony; the combat one asks you to survive.
export const CHALLENGE_TARGET = 600;

export const TARGET_KINDS = {
  population: { noun: "ants", verb: "Raise", gerund: "raising", of: "in one colony" },
  raids: { noun: "raids", verb: "Win", gerund: "winning", of: "without the nest falling" },
  // a colony that is not allowed to grow cannot be asked for a headcount, so
  // the sealed nest is asked to make what little it has produce instead
  foodRate: { noun: "food a second", verb: "Reach", gerund: "reaching",
    of: "from a nest that cannot widen", rate: true },
  // a trial about holding output up over time cannot be measured on a rate,
  // which a handful of ants meets in the first minute
  runFood: { noun: "food", verb: "Gather", gerund: "gathering",
    of: "with this one colony" }
};

// A trial can be LOST as well as won. Declared per trial so the next ones can
// each fail in their own way, and read from the colony rather than stored --
// there is no separate failure flag to keep in step with the save.
export const FAIL_KINDS = {
  raidLost: {
    test: game => (game.raidsLost || 0) > 0,
    rule: "One defeat ends it. The line holds for every attack or the trial is lost.",
    lost: "The line broke. The trial is over — abandon it to found a fresh colony and try again."
  }
};

export function challengeFailKind(challenge) {
  return challenge && challenge.fail ? FAIL_KINDS[challenge.fail] : null;
}

export function challengeFailed(game) {
  const challenge = activeChallenge(game);
  const fail = challengeFailKind(challenge);
  return !!fail && fail.test(game);
}

export function challengeTarget(challenge) {
  return (challenge && challenge.target) || { kind: "population", amount: CHALLENGE_TARGET };
}

export function targetKind(challenge) {
  return TARGET_KINDS[challengeTarget(challenge).kind] || TARGET_KINDS.population;
}

// the debuff for the level being attempted, and the permanent reward held from
// levels already cleared. They multiply against each other, which is the race.
// Five levels and then the trial is mastered. Measured across three seeds at
// 28-30m, 32-34m, 35-38m, 39-43m and 42-45m, so the whole ladder is five
// sittings of well under an hour rather than an open-ended grind.
//
// Measured across three seeds at 28-30m, 32-34m, 34-37m, 39-41m and 42-46m, so
// the whole ladder is five sittings inside an hour with a real ramp. The scale
// has to beat the mastery doubling or the net goes flat: at 0.44 the drought
// and the reward cancelled and level 5 came in no harder than level 1.
//
// Clearing pays twice, and the two halves are deliberately different shapes.
// The trial itself pays a small compounding buff per level cleared; the
// achievement pays on the deepest level ever reached, which no reset can undo.
// A trial's debuff has a KIND, and only a food trial touches food. Drought's
// multiplier used to be applied to any active challenge, which would have cut
// the Siege colony's food as well -- two trials wearing one debuff.
export const CHALLENGE_MAX_LEVEL = 5;

// Endless Siege. It does not scale a number down, it changes when the game
// happens: the first attacker arrives at 16 ants instead of 256 and comes every
// ninety seconds instead of every six minutes, so soldiers have to exist before
// anything else does. Its own threat curve is measured against that 16-ant
// nest rather than the 400-ant one the ordinary game uses.
export const SIEGE_UNLOCK = 16;
export const SIEGE_INTERVAL = 90;
export const SIEGE_REFERENCE = 16;
// 140 is measured, against the raids-won target and the rule that ONE defeat
// ends the run. Because a win takes ninety seconds, fifteen of them put a hard
// floor of about 28 minutes under every level, so difficulty is not how long it
// takes -- it is whether the line holds at all, and the ladder is a ladder of
// how much of the colony has to be soldiers.
//
// Swept at 80 / 100 / 120 / 140 across three soldier shares. At 80 every level
// clears on any army, at 100 the ladder is only two steps, at 140 the first
// level -- which is what unlocks the Units menu -- cannot be cleared without
// already restructuring the colony. At 120:
//   30% soldiers -> clears level 1
//   45% soldiers -> clears levels 1-4
//   60% soldiers -> clears all five
//   45% soldiers, training ranks hard -> clears all five
// so entering is achievable on a modest army and finishing is not. There are
// two ways to finish and they are a real choice: turn 60% of the colony into
// soldiers, or keep 45% and spend the protein turning them into elites. The
// second only works if you train with a thin cushion -- measured, a player who
// waits for a 1.8x margin before training never trains at all. The ladder
// is monotonic, no level being easier than the one before it, and runs are lost
// late rather than at a cliff on the first full-strength attack.
export const SIEGE_BASE = 120;
// The level scale has to BEAT the mastery doubling, the same trap Drought hit.
// Hardened Line pays x2 soldier strength per level cleared, so at 1.3 the
// reward outran the difficulty and level 5 came in easier than level 1 --
// measured at 6W/0L on the last level against 0W/3L on the first. At 2.8 the
// net is (2.8/2)^level, a real ramp, matching Drought's 1/0.36 against its x2.
export const SIEGE_LEVEL_SCALE = 2.8;

// A raid loses at most a fifth of the colony, which is tuned for an attack
// every six minutes. At ninety seconds that is far too gentle: measured, the
// colony outgrew the siege and cleared in 12 minutes while losing every single
// raid. Under siege a defeat costs half the nest, so losing is actually losing.
export const SIEGE_LOSS_CAP = 0.5;

// The ordinary ramp softens three attacks, which is tuned for six-minute gaps.
// At ninety seconds that puts a cliff at raid four -- the first attack at full
// strength arrives about five minutes in, and measured, that is where levels
// were being lost rather than at the end where the scaling is meant to bite.
// Five gentler steps give the colony a run-up, so the trial is decided late.
export const SIEGE_RAMP = [0.15, 0.3, 0.45, 0.6, 0.8];

// Barren Brood. Nurses add nothing to the brood at any level -- that is its
// identity -- so the difficulty has to come from somewhere else, and it comes
// from the chambers themselves running cold: eggs develop more slowly each
// attempt. The scale has to beat the x2 brood mastery or level five arrives
// easier than level one, the same trap Drought and the Siege both hit.
export const BARREN_SCALE = 0.42;

// Sealed Nest. Excavators raise no cap, so the colony is stuck at whatever its
// base is -- and that base shrinks each attempt. It cannot be asked for a
// headcount when it is not allowed to grow, so it is asked for a rate instead.
// 0.40 and 2,500 are measured together, and they trade against each other. The
// cap mastery doubles per level, so a debuff of 0.40 leaves the nest at 0.8^level
// -- a gentle ramp on purpose, because a shrinking cap against a fixed rate has
// a hard ceiling: per-ant output tops out at what the adaptations allow, and
// below about 12 ants no amount of time reaches 4,000/s. Swept at 0.33, 0.36 and
// 0.38 the last levels became impossible rather than slow; at 0.40 with a 2,500
// target every level is reachable and the ramp is in how long it takes.
export const SEALED_SCALE = 0.40;
export const SEALED_TARGET_RATE = 2500;

// Sterile. The colony may hold only so many bought adaptation levels at once,
// and that allowance falls to nothing by the last attempt. Unlike the others
// this debuff is a count rather than a multiplier, so it steps rather than
// scales.
export const STERILE_ALLOWANCE = [10, 7, 4, 2, 0];

// Nanitic Line. Every egg emerges as a founder, and the founders burn each other
// out: the more of them there are, the faster the whole generation fades. That
// crowding IS the mechanic, and it is what makes the trial buildable at all --
// the old note called it blocked because the founders share one decay clock and
// a colony of them would die together, but a decay that rises with the count
// needs no per-ant ageing. They fade towards nothing rather than dropping dead,
// so the colony is never wiped, it just stops being worth anything.
//
// More ants therefore means less output each, and past a point less output in
// total. Finding that point is the trial, so it is asked for a rate.
// Crowding bites on what a founder gathers as well as on how fast she fades. A
// shorter half-life alone is a weaker lever than a doubled output, so as a pure
// decay debuff it lost to the x2 mastery every time and the last level came in
// easier than the first.
//
// The scale is 2.15 rather than something steeper because the output goes to
// zero either way -- the line always burns out -- so what each level really sets
// is how much one colony can extract before it does. At 2.8 those ceilings ran
// a fifteenfold spread that no single target can ramp across; at 2.15 they run
// 279K / 203K / 130K / 77K / 43K, and a target of 38,000 is an eighth of the
// first attempt's ceiling and seven eighths of the last one's.
//
// How LONG a level takes is not set here. The founders' half-life is twenty
// minutes and nothing extends it any more, so almost everything a colony will
// ever gather arrives in the first half hour whatever these numbers say. Making
// the trial a longer sitting means a longer half-life inside it, not more
// crowding.
export const CALLOW_CROWDING = 0.012;
export const CALLOW_SCALE = 2.15;
export const CALLOW_TARGET_FOOD = 38000;
export const CHALLENGE_BASE_DEBUFF = 0.25;
export const CHALLENGE_LEVEL_SCALE = 0.36;
export const CHALLENGE_REWARD_STEP = 1.1;

// What every trial does, stated once. Players asked what a trial actually
// changes and the cards did not say -- "cut hard" is not a number, and nothing
// mentioned that the lineage stays behind.
export const TRIAL_KEEPS = [
  "Nest Memory, Brood Instinct, Standing Orders and Granary Instinct all work.",
  "Every achievement bonus still pays — food, hatch speed, and the ×25 for big foragers.",
  "Colony and Combat upgrades can be bought as normal.",
  "Rallying the foragers and stripping the wings work as normal."
];

export const TRIAL_GIVES_UP = [
  "No Royal Lineage food multipliers.",
  "No extra population cap, brood slots or starting reserves from the lineage.",
  "The queen cannot take a nuptial flight until the trial is claimed or abandoned."
];

export const CHALLENGES = [
  {
    id: "drought",
    name: "Drought",
    open: true,
    flavour: "The trails run dry. Foraging trips come back light, and the colony lives on what little the workers can carry home.",
    // the live figure is filled in by the UI -- this says what it applies to
    debuff: "All food production is multiplied by the drought figure, on top of everything a trial already gives up.",
    // a trial takes one thing away and its achievement gives that same thing
    // back, permanently -- the Drought starves the colony, so surviving it
    // teaches the colony to eat
    kind: "food",
    target: { kind: "population", amount: CHALLENGE_TARGET },
    mastery: { type: "food", step: 2, name: "Deep Cisterns",
      desc: "What the colony learned from the Drought. Every level of it doubles all food, for good." },
    plan: ""
  },
  {
    id: "sealed",
    name: "Sealed Nest",
    open: true,
    kind: "sealed",
    flavour: "The soil sets like stone. However many diggers she raises, the chambers do not widen.",
    debuff: "Excavators raise no population cap at all, and the base nest is smaller with every attempt.",
    // it denies you room, so it gives room back
    target: { kind: "foodRate", amount: SEALED_TARGET_RATE },
    mastery: { type: "cap", step: 2, name: "Hollowed Earth",
      desc: "What the colony learned sealed in. Every level of it doubles the population cap, for good." },
    plan: ""
  },
  {
    id: "barren",
    name: "Barren Brood",
    open: true,
    kind: "barren",
    flavour: "The chambers stay cold. Nurses tend them and nothing develops any faster for it.",
    debuff: "Nurses add no brood slots at all, and every egg develops more slowly with each attempt.",
    // it denies you throughput, so it gives throughput back
    mastery: { type: "brood", step: 2, name: "Warm Chambers",
      desc: "What the colony learned from the cold. Every level of it doubles the brood, for good." },
    plan: ""
  },
  {
    id: "siege",
    name: "Endless Siege",
    open: true,
    kind: "siege",
    flavour: "Something out there has learned where the nest is, and it is not waiting six minutes.",
    debuff: "The first attacker arrives at 16 ants and they come every ninety seconds. Soldiers unlock at 16 too, because nothing else would survive it.",
    // A siege is cleared by outlasting it, not by growing past it -- and it is
    // lost the first time the nest does not hold.
    target: { kind: "raids", amount: 15 },
    fail: "raidLost",
    // it demands soldiers, so it gives soldiers back
    mastery: { type: "soldier", step: 2, name: "Hardened Line",
      desc: "What the colony learned under siege. Every level of it doubles what every soldier is worth at the gate, for good." },
    plan: ""
  },
  {
    id: "sterile",
    name: "Sterile",
    open: true,
    kind: "sterile",
    flavour: "Nothing the colony learns takes hold. Every generation begins from instinct alone.",
    debuff: "The colony can hold only a few bought adaptation levels at once, and fewer with every attempt \u2014 none at all on the last.",
    // it denies you adaptations, so it gives adaptations back
    mastery: { type: "upgrades", step: 1.25, levels: 1, name: "Learned by Heart",
      desc: "What the colony kept when nothing else took hold. Every level raises the max of every upgrade line by one, and makes every level you buy a quarter stronger." },
    // Akami spotted that Drought already suppresses the lineage, which left
    // Sterile with no identity of its own. Its restriction is the twenty-nine
    // bought upgrades, which no other trial touches.
    plan: ""
  },
  {
    id: "callow",
    name: "Nanitic Line",
    open: true,
    kind: "callow",
    flavour: "Every daughter emerges undersized, burns bright on the queen's reserves, and is gone.",
    debuff: "Every egg hatches as a founder, whatever caste you chose \u2014 and the more founders there are, the faster the whole generation fades.",
    target: { kind: "runFood", amount: CALLOW_TARGET_FOOD },
    // It takes a workforce that will not last, so the first clear buys exactly
    // that: the founders stop dying of old age. After that every level makes a
    // founder better at all of it rather than at foraging alone -- she gathers,
    // she tends the brood, and a trial about founders should lift the whole ant.
    mastery: { type: "nanitic", step: 1.6, lifespan: true, name: "Long Burning",
      desc: "What the colony learned from a generation that would not last. The first level means the founders never die of old age; every level makes each of them better at everything she does." },
    plan: ""
  }
];

const CHALLENGE_INDEX = {};
for (const challenge of CHALLENGES) CHALLENGE_INDEX[challenge.id] = challenge;

export function challengeById(id) {
  return CHALLENGE_INDEX[id] || null;
}

// bought with Royal Jelly at the end of the lineage, so the trials begin
// exactly where the tree used to run out
export function challengesUnlocked(game) {
  return PRESTIGE_UPGRADES.some(u =>
    u.effect.type === "challenges" && prestigeUpgradeOwned(game, u));
}

export function activeChallenge(game) {
  return game.challenge ? challengeById(game.challenge) : null;
}

export function challengeActive(game) {
  return !!activeChallenge(game);
}

export function challengeLevel(game, id) {
  const cleared = (game.challenges && game.challenges[id]) || 0;
  return cleared;
}

// how many levels of every trial the colony has behind it, which is what the
// permanent reward is paid on
export function challengeLevelsTotal(game) {
  let total = 0;
  for (const challenge of CHALLENGES) total += challengeLevel(game, challenge.id);
  return total;
}

// the debuff for the level currently being attempted -- level 1 is the first
// attempt, so a colony with no completions faces CHALLENGE_BASE_DEBUFF
export function challengeDebuffAt(level) {
  const clamped = Math.min(level, CHALLENGE_MAX_LEVEL - 1);
  return CHALLENGE_BASE_DEBUFF * Math.pow(CHALLENGE_LEVEL_SCALE, clamped);
}

export function challengeMastered(game, id) {
  return challengeLevel(game, id) >= CHALLENGE_MAX_LEVEL;
}

// Only a food trial cuts food. Every other kind changes the shape of the run
// instead, and reads its own numbers below.
export function challengeDebuff(game) {
  const challenge = activeChallenge(game);
  if (!challenge || challenge.kind !== "food") return 1;
  return challengeDebuffAt(challengeLevel(game, challenge.id));
}

export function challengeKind(game) {
  const challenge = activeChallenge(game);
  return challenge ? challenge.kind || "food" : null;
}

export function siegeActive(game) {
  return challengeKind(game) === "siege";
}

export function barrenActive(game) {
  return challengeKind(game) === "barren";
}

export function sealedActive(game) {
  return challengeKind(game) === "sealed";
}

export function sterileActive(game) {
  return challengeKind(game) === "sterile";
}

export function callowActive(game) {
  return challengeKind(game) === "callow";
}

// How much faster the generation fades for being crowded. Every founder shortens
// the half-life of every other one, and each attempt makes the crowding worse.
export function callowCrowding(game, founders) {
  if (!callowActive(game)) return 1;
  const level = Math.min(challengeLevel(game, "callow"), CHALLENGE_MAX_LEVEL - 1);
  const weight = CALLOW_CROWDING * Math.pow(CALLOW_SCALE, level);
  return 1 + Math.max(0, founders) * weight;
}

export function masteryNanitic(game) {
  return masteryOf(game, "nanitic");
}

// The founders stop dying of old age once the Nanitic Line has been cleared
// even once. Inside the trial nothing dies anyway -- the whole colony shares one
// decay clock, so a lifespan would end every ant at the same instant.
export function naniticsImmortal(game) {
  for (const challenge of CHALLENGES) {
    if (!challenge.mastery || !challenge.mastery.lifespan) continue;
    if (bestTrialLevel(game, challenge.id) > 0) return true;
  }
  return false;
}

// how much slower the brood runs on this attempt
export function barrenHatchScale(game) {
  if (!barrenActive(game)) return 1;
  return Math.pow(BARREN_SCALE, Math.min(challengeLevel(game, "barren"), CHALLENGE_MAX_LEVEL - 1));
}

// how much of the base nest is left on this attempt
export function sealedCapScale(game) {
  if (!sealedActive(game)) return 1;
  return Math.pow(SEALED_SCALE, Math.min(challengeLevel(game, "sealed"), CHALLENGE_MAX_LEVEL - 1));
}

// how many bought adaptation levels the colony may hold at once
export function sterileAllowance(game) {
  if (!sterileActive(game)) return Infinity;
  const level = Math.min(challengeLevel(game, "sterile"), STERILE_ALLOWANCE.length - 1);
  return STERILE_ALLOWANCE[level];
}

export function masteryBrood(game) {
  return masteryOf(game, "brood");
}

export function masteryCap(game) {
  return masteryOf(game, "cap");
}

// Sterile gives back the strength of what you buy, not a resource. The
// multiplier lifts every additive adaptation effect; the level count raises how
// far every line can be pushed.
export function masteryUpgradeStrength(game) {
  return masteryOf(game, "upgrades");
}

export function masteryUpgradeLevels(game) {
  let total = 0;
  for (const challenge of CHALLENGES) {
    if (!challenge.mastery || !challenge.mastery.levels) continue;
    total += challenge.mastery.levels * bestTrialLevel(game, challenge.id);
  }
  return total;
}

// how much harder this attempt's attackers are than the first
// one source for how much harder an attempt's attackers are, so the cards, the
// hover and the raid itself cannot drift apart
export function siegeThreatScaleAt(level) {
  return Math.pow(SIEGE_LEVEL_SCALE, Math.min(level, CHALLENGE_MAX_LEVEL - 1));
}

export function siegeThreatScale(game) {
  if (!siegeActive(game)) return 1;
  return siegeThreatScaleAt(challengeLevel(game, "siege"));
}

// What the trials themselves pay: a small buff for every level cleared
// anywhere, applied inside a trial as well as outside. It has to apply inside
// or there is no race -- each level would be strictly harder with nothing to
// meet it, and the ladder would stall at two.
export function challengeReward(game) {
  return Math.pow(CHALLENGE_REWARD_STEP, challengeLevelsTotal(game));
}

// The deepest level ever reached in one particular trial. Read from a lifetime
// stat as well as the colony, because cleared levels live on the colony and a
// deeper reset would otherwise take an achievement back.
export function bestTrialLevel(game, id) {
  const stat = (game.stats && game.stats.bestTrial && game.stats.bestTrial[id]) || 0;
  return Math.max(stat, challengeLevel(game, id));
}

// The achievement half, paid per trial on that trial's deepest level. Each one
// gives back the thing it took: the Drought starves the colony and pays in
// food, and the trials still to come pay in cap, brood, soldiers and the rest.
export function masteryOf(game, type) {
  let total = 1;
  for (const challenge of CHALLENGES) {
    if (!challenge.mastery || challenge.mastery.type !== type) continue;
    total *= Math.pow(challenge.mastery.step, bestTrialLevel(game, challenge.id));
  }
  return total;
}

export function masteryFood(game) {
  return masteryOf(game, "food");
}

export function masterySoldier(game) {
  return masteryOf(game, "soldier");
}

export function trialsWithMastery() {
  return CHALLENGES.filter(challenge => !!challenge.mastery);
}

// the lifetime count, which is what an achievement track has to read -- cleared
// levels live on the colony and a deeper reset would otherwise take a tier back
export function trialLevelsEver(game) {
  const stat = (game.stats && game.stats.challengeLevels) || 0;
  return Math.max(stat, challengeLevelsTotal(game));
}

// What this trial counts, read from the colony. The caller passes the live
// figures because this file cannot import ants.js -- ants.js imports it.
export function challengeProgress(game, values) {
  const challenge = activeChallenge(game);
  if (!challenge) return 0;
  const kind = challengeTarget(challenge).kind;
  if (kind === "raids") return game.raidsWon || 0;
  if (kind === "foodRate") return (values && values.foodRate) || 0;
  if (kind === "runFood") return (values && values.runFood) || 0;
  return (values && values.population) || 0;
}

export function challengeTargetMet(game, values) {
  const challenge = activeChallenge(game);
  if (!challenge || challengeFailed(game)) return false;
  return challengeProgress(game, values) >= challengeTarget(challenge).amount;
}
