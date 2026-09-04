import { PRESTIGE_UPGRADES, prestigeUpgradeOwned } from "./prestige.js";
import { currentSpecies } from "./species.js";

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
  population: { noun: "ants", verb: "Raise", gerund: "raising", of: "in one colony", scales: 0.25 },
  raids: { noun: "raids", verb: "Win", gerund: "winning", of: "without the nest falling" },
  // a colony that is not allowed to grow cannot be asked for a headcount, so
  // the sealed nest is asked to make what little it has produce instead
  foodRate: { noun: "food a second", verb: "Reach", gerund: "reaching",
    of: "from a nest that cannot widen", rate: true, scales: 0.25 },
  // a trial about holding output up over time cannot be measured on a rate,
  // which a handful of ants meets in the first minute
  runFood: { noun: "food", verb: "Gather", gerund: "gathering",
    of: "with this one colony", scales: 0.25 },
  // the repletes are asked for food STANDING rather than food gathered: the
  // whole trial is that there is nowhere to put it, so banking it is the test
  banked: { noun: "food banked at once", verb: "Bank", gerund: "banking",
    of: "in the bodies of living ants", scales: 0.5 }
};

// A trial can be LOST as well as won. Declared per trial so the next ones can
// each fail in their own way, and read from the colony rather than stored --
// there is no separate failure flag to keep in step with the save.
// ---------------------------------------------------------- the three matriline
// trials. Same rule as layer 1: each takes one thing away and gives that same
// thing back. None of the three pays a global food multiplier -- Deep Cisterns
// is the only mastery with f = 1 and it silently broke three trials once.

// The Blight. Ophiocordyceps unilateralis, which is real and does exactly this.
// Infection grows on the infected, so it compounds -- and exiling is the only
// cure, which is what makes a button nobody presses into the core loop of a
// trial without inventing a mechanic for it.
export const BLIGHT_RATE = 0.0016;        // per infected ant per second
export const BLIGHT_SEED = 3;             // infected on the day the trial opens
export const BLIGHT_CEILING = 0.62;       // this share infected ends the run
export const BLIGHT_HOLD = 0.35;          // and the target must be met under this
export const BLIGHT_SCALE = 1.34;         // per level
export const BLIGHT_TARGET = 500;

// The Slave-Maker. Polyergus, which raids other nests for brood and cannot feed
// itself. The mechanic is already built as her active; this applies the same
// rewrite to whatever species is playing.
export const DULOSIS_TARGET = 300;
// What a won raid captures, as a share of the colony -- the trial has to grant
// this, because dulosis without capture cannot grow by a single ant. It shrinks
// with each attempt, which is where the difficulty lives.
export const DULOSIS_CAPTURE = 0.05;
export const DULOSIS_SCALE = 0.78;

// The Repletes. Myrmecocystus, whose repletes hang from the ceiling as living
// jars. Also already built as an active, and measured -- 800 per ant is where
// the store sits full without blocking upgrades.
export const REPLETE_PER_ANT = 800;
export const REPLETE_SCALE = 0.62;        // per level
// KNOWN TOO LOW. A first run peaks at 8.37e6 banked inside forty minutes
// against this 4e5. Raising it to 8e6 put level 5 out of reach on a first run
// while a veteran still cleared in 12.9m, because banked food is bounded by the
// replete store rather than by any mastery this scales on -- it needs an index
// of its own before the number is worth moving.
export const REPLETE_TARGET_FOOD = 400000;

export const FAIL_KINDS = {
  blight: {
    test: game => blightShare(game) >= BLIGHT_CEILING,
    rule: "The colony falls when the infected are " +
      Math.round(100 * BLIGHT_CEILING) + "% of it. Exiling is the only cure.",
    lost: "The fungus has the nest. Abandon the trial to found a clean colony."
  },
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

// What a trial is actually asking for right now. A food-measured target has to
// move with the food masteries the colony holds, or it is not a target at all.
// Deep Cisterns pays x2 food a level and multiplies EVERYTHING, so five levels
// of Drought is x32 on every food figure in the game -- measured, that cleared
// Sealed Nest and the Nanitic Line in twenty to thirty seconds a level, while a
// colony that had not cleared Drought could not clear either of them at any
// level of play. There was no window in which either was a trial: impossible
// before Drought, a formality after. Scaling the ask by the same figure makes
// them mastery-neutral, so what they measure is what THIS colony manages under
// the debuff rather than what a previous trial handed it.
//
// Only the food-measured kinds scale. A headcount is bounded by the cap and a
// raid count by the clock, and neither moves with a food multiplier.
// What an unmastered line produces by the time the trials open to it. The
// target constants below were all calibrated against exactly that colony, so
// scaling by `peak / REFERENCE` leaves a first-time player facing the number
// this file already records and raises it for everyone who has grown past it.
export const REFERENCE_FOOD_RATE = 5e6;

// A trial colony is refounded at nothing and grows for one sitting, so what it
// can reach is NOT proportional to its parent's peak -- a line a million times
// richer does not build a million-ant nest in half an hour. The ask therefore
// goes as a fractional power of how far the line has come. At 1 the food trials
// became unclearable and at 0.25, which is what reading `masteryFood` alone
// amounted to, every trial fell to about two minutes.
// ...and the power is per KIND, because the kinds are dimensionally different
// and one exponent cannot serve them. Swept on a mastered colony at level 5,
// against a 2.2-minute baseline:
//
//   power   drought   sealed   barren   callow  repletes
//   0.25      18.9m     0.1m    20.2m     0.1m      7.4m
//   0.35      61.5m     0.1m    43.7m     0.1m      7.4m
//   0.42     110.0m     0.1m    83.0m     0.2m      7.4m
//   0.50      >120m     0.1m    >120m    >120m     25.4m
//
// A headcount grows sub-linearly with how rich the line is -- 0.25 puts the two
// population trials at about twenty minutes, which is the half-hour median the
// ladder is sized in. A banked total tracks the rate much more closely and wants
// 0.5, measured at 25.4m. The rate- and run-total kinds are left at 0.25, which
// is what reading `masteryFood` alone already amounted to, because they do not
// respond at all until 0.5 and then cliff straight past reachable -- the Nanitic
// Line especially, whose ceiling is hard by construction. Those two need their
// own calibration and should not be guessed at.
export function colonyScale(game, power) {
  const peak = (game.stats && game.stats.peakFoodRate) || 0;
  const ratio = Math.max(1, peak / REFERENCE_FOOD_RATE);
  return Math.pow(ratio, power > 0 ? power : 0.25);
}

// A headcount was assumed to be bounded by the cap and so left unscaled. It is
// not: the cap mastery is x2 a level, so five levels is x32 room and 600 ants
// is a rounding error to a mastered colony. Every kind that grows with the
// colony scales; a raid count is bounded by the clock and does not.
// What a level asks over the one before it. Measured on Drought, the ladder was
// FLAT -- 44.5, 42.5, 46.7, 44.6, 46.3 minutes -- because the x2 food mastery a
// level pays almost exactly cancels the x0.36 drought, so the fifth rung cost
// what the first did. This is the ramp: 44.5 to 107.5 minutes across the five.
export const LEVEL_STEP = 1.666;

// ...and what it asks of a line that has already cleared other trials. The
// masteries are what make a later trial trivial -- x32 food, x32 cap, x32 brood,
// x32 soldier -- so the ask is scaled by the same figures, which cancels by
// construction and is exactly 1 on a line that has cleared nothing. Measured,
// a mastered colony cleared Drought level 5 in 0.6 minutes against 46.3 fresh;
// this holds the two within sight of each other without touching a single
// reward, which is earned and should not be taken back.
export const MASTERY_POWER = 0.59;

// Which masteries make each kind of target easy. A headcount and a bank are
// bounded by how many ants the colony can hold and how fast they arrive; a rate
// and a run total are bounded by food.
function masteryFor(game, kind) {
  if (kind === "population" || kind === "banked") {
    return masteryCap(game) * masteryBrood(game);
  }
  return masteryFood(game);
}

export function challengeTargetAmount(game, challenge) {
  const target = challengeTarget(challenge);
  const kind = TARGET_KINDS[target.kind];
  if (!kind || !kind.scales) return target.amount;
  // NOT multiplied by colonyScale as well. That term reads the line's peak food
  // rate, which itself rises with every mastery, so stacking the two scaled the
  // ask three times over -- measured, every trial became unclearable past level
  // three on a fresh line and at every level on a mastered one. The mastery
  // term replaces it rather than joining it.
  // Sterile is the exception and says so in its own data: its debuff is the
  // number of adaptation levels it will let you hold at once -- 10, 7, 4, 2 and
  // then none -- which is already a savage ramp. Multiplying the ask on top of
  // that made level 2 unclearable on a first run.
  const level = challengeLevel(game, challenge.id) + 1;
  const step = challenge.ramp === undefined ? LEVEL_STEP : challenge.ramp;
  const ramp = Math.pow(step, Math.max(0, level - 1));
  const held = Math.pow(masteryFor(game, target.kind), MASTERY_POWER);
  return Math.round(target.amount * ramp * held);
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
// Measured against a colony holding no other mastery and buying its adaptations
// by hand. Swept at 200 / 250 / 300 / 350 / 400 / 450 / 500 across all five
// attempts: below 350 every attempt clears in two minutes, at 450 the last two
// run past two hours, and 400 gives 2.0 / 4.0 / 12.2 / 38.0 / 36.0 minutes --
// a real ramp with nothing out of reach. It is multiplied by whatever food
// mastery the colony holds -- see challengeTargetAmount -- so a Drought-
// mastered player meets the same trial rather than a formality. The old 2,500
// was calibrated on a colony that already held Drought, and measured, no
// first-time player could reach even the first level of it.
//
// The ramp is two-step rather than five: attempts one to three sit at 2-12
// minutes and four and five at about 37. That is SEALED_SCALE at 0.40 against
// a x2 cap mastery, which leaves the nest at 0.8^level -- a deliberately gentle
// shrink. Steepening it is the lever if a five-step ramp is wanted.
// KNOWN TOO LOW and deliberately left alone. Measured, a first run reaches
// 5.66e4 food a second inside forty minutes against this ask of 400, so the
// trial is over in under twenty seconds at every level. Raising it to 5e4 was
// tried and made levels 3 and 5 unclearable on a first run: one seed is not a
// calibration, and this needs its own sweep.
export const SEALED_TARGET_RATE = 400;

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
// Measured ceilings with no other mastery held: 215K / 155K / 100K / 59.7K /
// 32.8K. 28,000 is an eighth of the first attempt's and seven eighths of the
// last -- the shape this trial was always meant to have, which the old 38,000
// missed by asking for more than the last attempt could ever gather. Scaled by
// the colony's food mastery, as SEALED_TARGET_RATE is.
// KNOWN TOO LOW, and the reason this one is hard to fix is worth recording.
// The Nanitic Line has a CEILING by construction -- the founders fade, so there
// is a maximum any colony can extract before the line burns out. Measured at
// level 1 on four seeds the peak run-food is 3.36e5, 3.50e5, 3.39e5 and 3.39e5,
// so a target of 3.5e5 sits exactly on that ceiling and only one seed in four
// can reach it at all. A base for this trial has to sit well under the ceiling,
// and the ceiling itself moves with the level and with what the line holds.
export const CALLOW_TARGET_FOOD = 28000;
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
    id: "blight",
    name: "The Blight",
    open: true,
    kind: "blight",
    matriline: true,
    flavour: "A fungus takes the workers one at a time. It grows in them, steers them, and puts them where its spores will carry furthest. Ophiocordyceps unilateralis, which does exactly this and is not invented.",
    debuff: "An infection spreads through the colony and grows on itself. An infected ant gathers nothing, and exiling her is the only cure.",
    // it takes ants, so it gives back every ant you would otherwise lose
    target: { kind: "population", amount: BLIGHT_TARGET },
    fail: "blight",
    mastery: { type: "losses", step: 0.72, name: "Metapleural Gland",
      desc: "What the colony learned from the Blight. Every level of it cuts every kind of ant loss -- raids, training, all of it -- for good." },
    plan: ""
  },
  {
    id: "dulosis",
    name: "The Slave-Maker",
    open: true,
    kind: "dulosis",
    matriline: true,
    flavour: "She cannot feed herself. Her mandibles are sabres, good for one thing, and the nest is run entirely by workers she stole as brood. Polyergus.",
    debuff: "No worker caste can be laid at all. Only soldiers -- and every worker in the nest is one you captured.",
    // it denies you a workforce, so it gives you one that never leaves
    target: { kind: "population", amount: DULOSIS_TARGET },
    mastery: { type: "capture", step: 1.6, name: "Dulotic Instinct",
      desc: "What the colony learned raiding. Every level of it captures more from a won raid, in every colony afterwards." },
    plan: ""
  },
  {
    id: "repletes",
    name: "The Repletes",
    open: true,
    kind: "repletes",
    matriline: true,
    flavour: "There is nowhere to put it. Some of the workers swell until they cannot walk and hang from the ceiling as living jars, and that is the whole granary. Myrmecocystus.",
    debuff: "Food cannot be banked above what the living ants can hold, and each attempt gives them less room.",
    // it denies you a store, so it gives you the longest store there is
    target: { kind: "banked", amount: REPLETE_TARGET_FOOD },
    mastery: { type: "offline", step: 1.5, name: "Social Stomach",
      desc: "What the colony learned hanging from the ceiling. Every level of it lengthens how long the colony keeps working while nobody is watching." },
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
    ramp: 1,
    flavour: "Nothing the colony learns takes hold. Every generation begins from instinct alone.",
    debuff: "The colony can hold only a few bought adaptation levels at once, and fewer with every attempt \u2014 none at all on the last. Nest Memory does not run here: which few you hold is yours to decide, and nothing gives a level back.",
    // it denies you adaptations, so it gives adaptations back
    mastery: { type: "upgrades", step: 1.25, levels: 1, name: "Learned by Heart",
      desc: "What the colony kept when nothing else took hold. Every level raises the max of every upgrade line by one, and makes every level you buy a quarter stronger." },
    // Akami spotted that Drought already suppresses the lineage, which left
    // Sterile with no identity of its own. Its restriction is the twenty-nine
    // bought upgrades, which no other trial touches.
    plan: ""
  },
  // ---------------------------------------------------------- species trials
  //
  // Layer 2 is 0.9 hours because finishing a species is twenty points and a
  // nuptial flight -- worth one of them -- takes half a minute on a mastered
  // colony. No repricing fixes that: forty flights is the same minute forty
  // times. The only unit in this game that costs real time is a trial level,
  // now that the target scales with the colony.
  //
  // Each one takes away THE THING THAT SPECIES IS, which is why they are cheap
  // to build and impossible to confuse: the debuff is a scale on that species'
  // own active, and the mastery gives the same active back. A species trial can
  // only be entered while playing her, so `speciesTrialLevel` already records
  // them correctly and no new save shape is needed.
  {
    id: "sp_atta", name: "The Blighted Garden", open: true, kind: "species",
    species: "atta", matriline: true,
    flavour: "Escovopsis is in the beds. The fungus the colony eats is being eaten, and the leaves come back to a garden that cannot turn them over.",
    debuff: "The garden turns over a fraction of what it should, and less with every attempt. Foragers still bring leaves; nothing downstream can use them.",
    target: { kind: "population", amount: 500 },
    mastery: { type: "garden", step: 1.6, name: "Fungal Husbandry",
      desc: "What the colony learned when the beds failed. Every level widens the garden for good." },
    plan: ""
  },
  {
    id: "sp_solenopsis", name: "The Single Queen", open: true, kind: "species",
    species: "solenopsis", matriline: true,
    flavour: "The other queens are dead. What was a nest of many laying chambers is one ordinary colony with a great many mouths.",
    debuff: "The polygyne cap bonus collapses towards nothing, and further with every attempt — and a lost raid still costs what a fire ant colony pays.",
    target: { kind: "population", amount: 500 },
    mastery: { type: "queens", step: 1.5, name: "Pleometrosis",
      desc: "What the line learned burying its queens. Every level raises the cap a polygyne nest holds, for good." },
    plan: ""
  },
  {
    id: "sp_camponotus", name: "Aposymbiotic", open: true, kind: "species",
    species: "camponotus", matriline: true,
    flavour: "Blochmannia is gone from the gut. Nitrogen that was recycled for nothing must now be caught, killed and carried.",
    debuff: "Feeding the brood costs far more protein rather than half, and more with every attempt.",
    target: { kind: "population", amount: 500 },
    mastery: { type: "symbiont", step: 0.7, name: "Bacteriocytes",
      desc: "What the line learned without its endosymbiont. Every level cuts what feeding the brood costs, for good." },
    plan: ""
  },
  {
    id: "sp_eciton", name: "The Halted Column", open: true, kind: "species",
    species: "eciton", matriline: true,
    flavour: "The column cannot move. A colony that is its own nest and has stopped walking is a colony with no nest at all.",
    debuff: "The column holds a fraction of what it should, and less with every attempt. Excavators still dig nothing.",
    target: { kind: "population", amount: 400 },
    mastery: { type: "column", step: 1.5, name: "Statary Phase",
      desc: "What the line learned standing still. Every level lets the column hold more, for good." },
    plan: ""
  },
  {
    id: "sp_myrmecocystus", name: "The Broken Jars", open: true, kind: "species",
    species: "myrmecocystus", matriline: true,
    flavour: "The repletes have been raided. What hung from the ceiling is on the floor, and the colony has nowhere to put tomorrow.",
    debuff: "Each living ant holds a fraction of the food she should, and less with every attempt.",
    target: { kind: "banked", amount: 200000 },
    mastery: { type: "crop", step: 1.6, name: "Distended Crop",
      desc: "What the line learned with its jars broken. Every level lets each ant hold more, for good." },
    plan: ""
  },
  {
    id: "sp_polyergus", name: "The Failed Raid", open: true, kind: "species",
    species: "polyergus", matriline: true,
    flavour: "The nests she found were empty, or ready. A slave-maker who takes no brood has no workers, and a queen with sabres for jaws cannot feed herself.",
    debuff: "A won raid captures a fraction of the brood it should, and less with every attempt — and dulosis means there is no other way to grow.",
    target: { kind: "population", amount: 300 },
    mastery: { type: "sabre", step: 1.5, name: "Pheromone Mimicry",
      desc: "What the line learned coming home empty. Every level takes more from a nest you beat, for good." },
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
      desc: "What the colony learned from a generation that would not last. The first level means the founders never die of old age — they still fade as the queen's reserves run out, so an old founder is a living one rather than a useful one — and every level after makes each of them better at everything she does." },
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

// A species trial belongs to one species and is only offered while she is the
// one being played. Everything else is open to any line.
export function challengeAvailable(game, challenge) {
  return !challenge.species || challenge.species === currentSpecies(game);
}

export function playableChallenges(game) {
  return CHALLENGES.filter(ch => challengeAvailable(game, ch));
}

export function speciesTrialActive(game) {
  const ch = activeChallenge(game);
  return ch && ch.kind === "species" ? ch : null;
}

// What a species trial does to the active it is about: the same shape every
// other debuff uses, so the ramp and the mastery race work identically. A
// species whose trial is not running is untouched, which is what lets the
// consuming sites read this unconditionally.
export function speciesTrialScale(game, speciesId) {
  const ch = speciesTrialActive(game);
  if (!ch || ch.species !== speciesId) return 1;
  return challengeDebuff(game);
}

// Trial clears are recorded per species. Playing as Atta re-earns the ladders
// as Atta, and an Atta mastery pays only while the line is Atta -- which is what
// makes a matriline a fresh run of the whole game rather than a fresh colony.
// Everything cleared before layer 2 existed belongs to the generic line, which
// is exactly right: the first run is generic ants.
export function challengeLevel(game, id, speciesId) {
  const key = speciesId || currentSpecies(game);
  const mine = (game.challenges && game.challenges[key]) || {};
  return mine[id] || 0;
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

export function blightActive(game) {
  return challengeKind(game) === "blight";
}

export function dulosisTrial(game) {
  return challengeKind(game) === "dulosis";
}

// A won raid brings brood home, and under this trial that is the ONLY way the
// colony grows. Shrinks with each attempt.
export function dulosisCapture(game) {
  if (!dulosisTrial(game)) return 0;
  const level = Math.min(challengeLevel(game, "dulosis"), CHALLENGE_MAX_LEVEL - 1);
  return DULOSIS_CAPTURE * Math.pow(DULOSIS_SCALE, level);
}

export function repleteActive(game) {
  return challengeKind(game) === "repletes";
}

// ------------------------------------------------------------------ the Blight
//
// The infection grows ON the infected, so it compounds, and it grows faster the
// larger a share of the colony it already holds. That shape is what makes
// exiling worth doing early and hopeless late.
export function blightCount(game) {
  return Math.max(0, (game.run && game.run.infected) || 0);
}

// The headcount is passed in where the caller has it, and read from the last
// tick where it does not -- challenges.js cannot import ants.js, because ants.js
// imports this file.
export function blightShare(game, pop) {
  if (!blightActive(game)) return 0;
  const total = pop === undefined ? ((game.run && game.run.population) || 0) : pop;
  if (!(total > 0)) return 0;
  return Math.min(1, blightCount(game) / total);
}

// how fast it spreads, steepening with each attempt
export function blightRate(game) {
  const level = Math.min(challengeLevel(game, "blight"), CHALLENGE_MAX_LEVEL - 1);
  return BLIGHT_RATE * Math.pow(BLIGHT_SCALE, level);
}

// an infected ant gathers nothing, so the colony produces what is left of it
export function blightThrottle(game, pop) {
  if (!blightActive(game)) return 1;
  return Math.max(0, 1 - blightShare(game, pop));
}

// What the repletes can hold per ant, shrinking with each attempt.
export function repletePerAnt(game) {
  if (!repleteActive(game)) return 0;
  const level = Math.min(challengeLevel(game, "repletes"), CHALLENGE_MAX_LEVEL - 1);
  return REPLETE_PER_ANT * Math.pow(REPLETE_SCALE, level);
}

// ---------------------------------------------------------------- the masteries
//
// Each gives back exactly what its trial took. None of them multiplies all food.
export function masteryLosses(game) {
  // a SHRINKING multiplier: 0.72 per level cleared, floored so it can never
  // make a loss into a gain
  return Math.max(0.05, masteryOf(game, "losses"));
}

export function masteryCapture(game) {
  return masteryOf(game, "capture");
}

export function masteryOffline(game) {
  return masteryOf(game, "offline");
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
// A mastery, once earned, is held for good and by every line. Clearing a trial
// unlocks its bonus and does nothing else — so a matriline that becomes a new
// species keeps the x32 food it already had rather than dropping to x1, which is
// what reading this per species did, and it made every reset a cliff.
//
// The deepest level ANY line has reached, so it is a high-water mark across the
// whole game and no reset of any kind can walk it back. The per-species record
// still exists and still matters: it is what a species is finished on and why
// the ladders are worth replaying. It just does not gate the bonus.
// `bestTrialLevel` walks every line's record and `masteryOf` calls it once per
// trial, so the six species masteries -- which sit on hot paths like
// `speciesCapMult` and `nomadCap` -- turned one tick from 0.077ms into 0.242ms,
// a 3.1x regression measured the moment they were wired.
//
// Invalidation is EXPLICIT, the same rule the brood tally follows: a cleared
// level is the only thing that can move any of these, and inferring it from the
// shape of `game.challenges` would mean walking the thing being cached.
// A cache was tried here and taken out again. Memoising these on an explicit
// `touchTrials()` made a tick about 10% faster and made every mastery read
// STALE for any code that writes `game.challenges` or `stats.bestTrial`
// directly -- which the trial harness does, and which is a silent wrong number
// rather than a crash. The brood tally can be cached because six functions own
// every write to the brood; trial records have no such choke point. Ten percent
// of a tick that is already 1.5% of a frame is not worth a class of silent bug.
export function touchTrials() {}

export function bestTrialLevel(game, id) {
  let top = 0;
  const best = (game.stats && game.stats.bestTrial) || {};
  for (const line in best) {
    const held = best[line];
    if (held && (held[id] || 0) > top) top = held[id];
  }
  const cleared = game.challenges || {};
  for (const line in cleared) {
    const held = cleared[line];
    if (held && (held[id] || 0) > top) top = held[id];
  }
  return top;
}

// what ONE line has done with this trial, which is what finishing a species
// counts and what the per-species records are for
export function speciesTrialLevel(game, id, speciesId) {
  const key = speciesId || currentSpecies(game);
  const best = (game.stats && game.stats.bestTrial && game.stats.bestTrial[key]) || {};
  return Math.max(best[id] || 0, challengeLevel(game, id, key));
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

export function masteryGarden(game) { return masteryOf(game, "garden"); }
export function masteryQueens(game) { return masteryOf(game, "queens"); }
export function masterySymbiont(game) { return masteryOf(game, "symbiont"); }
export function masteryColumn(game) { return masteryOf(game, "column"); }
export function masteryCrop(game) { return masteryOf(game, "crop"); }
export function masterySabre(game) { return masteryOf(game, "sabre"); }

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
  if (kind === "banked") return game.food || 0;
  return (values && values.population) || 0;
}

export function challengeTargetMet(game, values) {
  const challenge = activeChallenge(game);
  if (!challenge || challengeFailed(game)) return false;
  return challengeProgress(game, values) >= challengeTargetAmount(game, challenge);
}
