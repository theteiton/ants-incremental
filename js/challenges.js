import { PRESTIGE_UPGRADES, prestigeUpgradeOwned } from "./prestige.js";

// A challenge founds a colony under conditions that should kill it. The
// requirement never moves -- every level of every trial asks for the same
// colony -- so difficulty comes entirely from the debuff, and the reward a
// completion pays is what lets you meet the next one. Climb until the debuff
// outruns the rewards.
export const CHALLENGE_TARGET = 600;

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
export const CHALLENGE_MAX_LEVEL = 5;
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
    open: false,
    flavour: "Something out there has learned where the nest is, and it is not waiting six minutes.",
    debuff: "",
    plan: "Planned: the first attacker would arrive at 16 ants and they would come every ninety seconds instead of every six minutes. Soldiers before foragers, or nothing. Clearing it would pay back in soldier strength, the thing it demands."
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

export function challengeDebuff(game) {
  const challenge = activeChallenge(game);
  return challenge ? challengeDebuffAt(challengeLevel(game, challenge.id)) : 1;
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

export function trialsWithMastery() {
  return CHALLENGES.filter(challenge => !!challenge.mastery);
}

// the lifetime count, which is what an achievement track has to read -- cleared
// levels live on the colony and a deeper reset would otherwise take a tier back
export function trialLevelsEver(game) {
  const stat = (game.stats && game.stats.challengeLevels) || 0;
  return Math.max(stat, challengeLevelsTotal(game));
}

export function challengeTargetMet(game, population) {
  return challengeActive(game) && population >= CHALLENGE_TARGET;
}
