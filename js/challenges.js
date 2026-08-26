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
  raids: { noun: "raids", verb: "Win", gerund: "winning", of: "without the nest falling" }
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
    open: false,
    flavour: "The soil sets like stone. However many diggers she raises, the chambers do not widen.",
    debuff: "",
    plan: "Planned: excavators would raise no population cap at all, leaving the colony at its base 30 ants. Its target would be a food rate rather than a headcount, because a colony that cannot grow cannot be asked to grow. Clearing it would pay back in population cap, the thing it denies."
  },
  {
    id: "barren",
    name: "Barren Brood",
    open: false,
    flavour: "The chambers stay cold. Nurses tend them and nothing develops any faster for it.",
    debuff: "",
    plan: "Planned: nurses would add no brood slots, so only the base chambers ever develop eggs. Growth would be bound by time rather than by food, which is the opposite of every other trial. Clearing it would pay back in brood slots, the thing it denies."
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
    open: false,
    flavour: "Nothing the colony learns takes hold. Every generation begins from instinct alone.",
    debuff: "",
    // Akami spotted that Drought already suppresses the lineage, which left
    // Sterile with no identity of its own. Its restriction is the twenty-nine
    // bought upgrades, which no other trial touches.
    plan: "Planned: no Colony or Combat upgrade could be bought. Every trial already leaves the Royal Lineage's strength behind — this one takes the twenty-nine adaptations you buy with food and protein as well, leaving caste balance and nothing else. Clearing it would pay back in the strength of every adaptation you buy."
  },
  {
    id: "callow",
    name: "Nanitic Line",
    open: false,
    flavour: "Every daughter emerges undersized, burns bright on the queen's reserves, and is gone.",
    debuff: "",
    plan: "Planned: every worker would emerge as a founder — six times a forager's output, fading fast, and dead within hours. It is not built because the founders currently share one decay clock rather than ageing one at a time, so a whole colony of them would fail at the same instant. Clearing it would pay back in what the founders produce."
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

// what this trial counts, read from the colony
export function challengeProgress(game, population) {
  const challenge = activeChallenge(game);
  if (!challenge) return 0;
  return challengeTarget(challenge).kind === "raids"
    ? (game.raidsWon || 0)
    : population;
}

export function challengeTargetMet(game, population) {
  const challenge = activeChallenge(game);
  if (!challenge || challengeFailed(game)) return false;
  return challengeProgress(game, population) >= challengeTarget(challenge).amount;
}
