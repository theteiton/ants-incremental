import { PRESTIGE_UPGRADES, prestigeUpgradeOwned } from "./prestige.js";

// A challenge founds a colony under conditions that should kill it. The
// requirement never moves -- every level of every trial asks for the same
// colony -- so difficulty comes entirely from the debuff, and the reward a
// completion pays is what lets you meet the next one. Climb until the debuff
// outruns the rewards.
export const CHALLENGE_TARGET = 600;

// the debuff for the level being attempted, and the permanent reward held from
// levels already cleared. They multiply against each other, which is the race.
export const CHALLENGE_BASE_DEBUFF = 0.4;
export const CHALLENGE_LEVEL_SCALE = 0.6;
export const CHALLENGE_REWARD_STEP = 1.3;

export const CHALLENGES = [
  {
    id: "drought",
    name: "Drought",
    open: true,
    // what the colony is up against
    flavour: "The trails run dry. Everything the colony brings home is a fraction of what it should be.",
    rule: "All food production is cut hard, and cut harder at every level.",
    target: "Raise " + CHALLENGE_TARGET + " ants.",
    reward: "Every completion permanently multiplies the colony's food."
  },
  {
    id: "sealed",
    name: "Sealed Nest",
    open: false,
    flavour: "The soil will not give. Something about the ground refuses to be dug.",
    rule: "Locked — the shape of this one is still being decided.",
    target: "",
    reward: ""
  },
  {
    id: "barren",
    name: "Barren Brood",
    open: false,
    flavour: "The chambers stay cold however many tend them.",
    rule: "Locked — the shape of this one is still being decided.",
    target: "",
    reward: ""
  },
  {
    id: "siege",
    name: "Endless Siege",
    open: false,
    flavour: "Something out there has learned where the nest is, and it is not waiting six minutes.",
    rule: "Locked — the shape of this one is still being decided.",
    target: "",
    reward: ""
  },
  {
    id: "sterile",
    name: "Sterile",
    open: false,
    flavour: "The lineage remembers nothing. No adaptation will take.",
    rule: "Locked — the shape of this one is still being decided.",
    target: "",
    reward: ""
  },
  {
    id: "callow",
    name: "Nanitic Line",
    open: false,
    flavour: "Every daughter emerges undersized, and none of them last.",
    rule: "Locked — this one needs the founders to age one by one, which they do not yet.",
    target: "",
    reward: ""
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
  return CHALLENGE_BASE_DEBUFF * Math.pow(CHALLENGE_LEVEL_SCALE, level);
}

export function challengeDebuff(game) {
  const challenge = activeChallenge(game);
  return challenge ? challengeDebuffAt(challengeLevel(game, challenge.id)) : 1;
}

// Paid for every level cleared, everywhere, including inside a trial. It has to
// apply inside or there is no race: each level would be strictly harder with
// nothing to meet it, and the ladder would stall at two.
export function challengeReward(game) {
  return Math.pow(CHALLENGE_REWARD_STEP, challengeLevelsTotal(game));
}

export function challengeTargetMet(game, population) {
  return challengeActive(game) && population >= CHALLENGE_TARGET;
}
