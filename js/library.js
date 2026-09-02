import { CASTES, isUnlocked, peakCasteCount, population, runPeakCount,
  UPGRADES, upgradeLevel, levelsOwned } from "./ants.js";
import { raidsUnlocked, raidsSeen } from "./raids.js";
import { challengesUnlocked, challengeLevelsTotal, bestTrialLevel } from "./challenges.js";
import { SPECIES, currentSpecies, speciesFinished, matrilineVisible, matrilineCount,
  gardenActive, haplotype } from "./matriline.js";
import { prestigeUpgradeOwned, PRESTIGE_UPGRADES } from "./prestige.js";

// The colony's own record of what the words mean. Raised because a playtester
// who had reached 187,000 ants said he understood "less than half" of what the
// game was telling him -- not because the explanations were missing, but
// because they lived in hover text he had no reason to point at.
//
// An entry has two states. It becomes KNOWN when the thing it describes is
// available to the colony, and it EXPANDS once the colony has actually done it:
// a short definition arrives in time to be useful, and the fuller one arrives
// once you have something to attach it to. Nothing undiscovered is listed at
// all, so the library is a record of this colony rather than a spoiler for the
// next one.

export const LIBRARY_GROUPS = [
  { id: "castes", name: "The castes" },
  { id: "colony", name: "Running a colony" },
  { id: "combat", name: "Combat" },
  { id: "upgrades", name: "Adaptations" },
  { id: "prestige", name: "The lineage" },
  { id: "trials", name: "The trials" },
  { id: "matriline", name: "The matriline" }
];

const held = (game, caste) => peakCasteCount(game, caste) > 0;

export const LIBRARY = [
  // ------------------------------------------------------------- castes
  { id: "queen", group: "castes", term: "Queen",
    known: () => true,
    short: "The one ant every colony is built from. She lands already mated, sheds her wings, and never flies again.",
    done: game => game.wingsShed,
    full: "Everything the colony becomes comes out of her. There is exactly one, always — and when she takes the nuptial flight it is her daughter who founds the next nest, which is why the line of them is called a matriline." },

  { id: "nanitic", group: "castes", term: "Nanitic",
    known: () => true,
    short: "The founding generation. Undersized, fed on the queen's dissolved flight muscle, and not built to last.",
    done: game => held(game, "nanitic"),
    full: "They work at six times a forager's rate and halve every twenty minutes as the muscle runs out, so the opening is a race to raise a real workforce before the founders are spent. They also hatch at double speed and each one tends a brood chamber. A founding generation really does work itself to death on borrowed reserves — that part is not a balance quirk, it is what happens." },

  { id: "forager", group: "castes", term: "Forager",
    known: () => true,
    short: "Gathers food, which is what everything else is bought with.",
    done: game => held(game, "forager"),
    full: "The backbone of the colony and the caste every other one exists to support. Rallying drives them onto the trails for triple food, and the Combat adaptations can arm them at one strength each when the nest is attacked." },

  { id: "bigforager", group: "castes", term: "Big Forager",
    known: game => held(game, "bigforager"),
    short: "An oversized forager that hatches by chance from an ordinary forager egg. She cannot be laid on purpose.",
    done: game => peakCasteCount(game, "bigforager") >= 2,
    full: "Each is worth five foragers and grows five per cent stronger every minute she is alive, up to triple. They arrive rarely and on a widening gap, so they thin out as the colony grows — until the first nuptial flight, after which the colony knows how to feed them and each is worth twenty-five times what she was." },

  { id: "excavator", group: "castes", term: "Excavator",
    known: game => isUnlocked(game, "excavator"),
    short: "Digs new chambers, which is the only thing that raises the population cap.",
    done: game => held(game, "excavator"),
    full: "When the nest is full, excavators are the only egg that can still be laid — they dig the chamber they will occupy. Without that rule a colony that filled its cap with foragers would be dead for good, unable to lay the diggers that were the only way out." },

  { id: "nurse", group: "castes", term: "Nurse",
    known: game => isUnlocked(game, "nurse"),
    short: "Tends the brood, so more eggs develop at once.",
    done: game => held(game, "nurse"),
    full: "Only a few eggs develop at a time and the rest queue behind them, so nurses widen the throughput rather than speeding any single egg up. That is what makes them worth raising: hatching speed was never the constraint, the number of chambers being tended was." },

  { id: "soldier", group: "castes", term: "Soldier",
    known: game => isUnlocked(game, "soldier"),
    short: "Fights the things that attack the nest, and hunts between attacks for protein.",
    done: game => held(game, "soldier"),
    full: "Soldiers fight from birth at twenty-five strength each. Every other caste fights at nothing until the Combat adaptations arm them. Between raids the soldiers are out hunting and come home in the last thirty seconds before an attack — workers never leave, which is why the colony only ever fights defensively." },

  { id: "major", group: "castes", term: "Major",
    known: game => held(game, "major") || held(game, "soldier"),
    short: "A soldier grown into her armour: three times the strength, half the hunting.",
    done: game => held(game, "major"),
    full: "The first grade above a plain soldier, and the only one that comes free — surviving a raid promotes a small share of the rank and file. Everything above a Major has to be trained deliberately, with protein." },

  { id: "supermajor", group: "castes", term: "Supermajor",
    known: game => bestTrialLevel(game, "siege") > 0,
    short: "Head and mandibles out of all proportion. Nine times a soldier's strength, and almost useless away from the gate.",
    done: game => held(game, "supermajor"),
    full: "Trained from a Major in the Units menu, at the cost of protein and of the ones who do not survive the training. She hunts at fifteen per cent of a plain soldier's rate — the trade that runs the whole rank ladder is that the head which wins a fight is the head that cannot carry food home." },

  { id: "guard", group: "castes", term: "Phragmotic Guard",
    known: game => bestTrialLevel(game, "siege") > 0,
    short: "Her head is a living door, shaped to plug the tunnel. Twenty-five times a soldier, and she never hunts at all.",
    done: game => held(game, "guard"),
    full: "Phragmosis is real: several ants, including Colobopsis and Cephalotes, have heads shaped like plugs and block the nest entrance with their faces. In the game she is the heaviest grade there is, and an army of nothing but Guards fields enormous strength while bringing home none of the protein that trained it." },

  // ------------------------------------------------------- running a colony
  { id: "reserves", group: "colony", term: "Reserves",
    known: () => true,
    short: "What the queen's own body is worth. A finite pool, freed by shedding her wings, that never regenerates.",
    done: game => game.emerged > 0,
    full: "Eggs cost reserves until the first worker emerges, and after that reserves stop mattering for good. There is no way to make more — everything the colony becomes is bought on credit against her body." },

  { id: "food", group: "colony", term: "Food",
    known: () => true,
    short: "The main currency. Foragers bring it in, and eggs and most adaptations are paid for with it.",
    done: game => game.stats.foodEarned > 1000,
    full: "Every food rate in the game has the same shape: a base that upgrades add flat amounts to, multiplied by everything that scales the whole thing. The Formulas panel in Settings shows that shape with live numbers, so you can see exactly which multiplier your rate is coming from." },

  { id: "protein", group: "colony", term: "Protein",
    known: game => raidsUnlocked(game) || game.protein > 0,
    short: "The second resource. It comes off the things that attack the nest, and off what the soldiers hunt between attacks.",
    done: game => game.stats.proteinEarned > 100,
    full: "Protein feeds the brood so eggs develop twice as fast, buys the Combat adaptations, trains soldiers into higher grades, and pays for upgrade levels past their designed top. It can also be traded for food in the rendering pit, at a rate read from what the colony actually earns." },

  { id: "brood", group: "colony", term: "Brood slot",
    known: () => true,
    short: "A chamber that can develop one egg. Eggs beyond the slots queue behind them and do nothing until a slot opens.",
    done: game => game.stats.eggsHatched >= 10,
    full: "Three slots to begin with, plus one for each living founder and a quarter for each nurse. This is why nurses matter and why hatching speed alone never did: the brood is a throughput limit, not a speed limit. The queue is strict first-in-first-out, so a batch laid by mistake sits in front of everything behind it." },

  { id: "offline", group: "colony", term: "Offline progress",
    known: () => true,
    short: "The colony carries on while the tab is shut — but only for so long, and it tells you how long when you come back.",
    done: game => (game.stats.awayReturns || 0) > 0,
    full: "Time away is fed through the same tick the game runs on, so nothing about it is a separate calculation. It is capped at eight hours: away for thirty against that cap is twenty-two hours the colony did not work, and the report on your return says exactly that rather than only what it gathered. Crop Reserve, banked by finishing Myrmecocystus, and the Full Crop instinct both lengthen the cap. A tab left open in the background is credited the same way and is not capped separately." },

  { id: "eggprice", group: "colony", term: "Egg price",
    known: () => true,
    short: "Each caste has its own rising price curve, counted from how many of that caste already exist.",
    done: game => game.stats.eggsHatched >= 50,
    full: "One caste's count never moves another's price. The count includes eggs already in the brood as well as hatched ants, so laying a batch at once costs exactly what laying them one at a time would — before that rule, buying a hundred at once was half price." },

  { id: "rally", group: "colony", term: "Rallying",
    known: () => true,
    short: "The queen drives the foragers onto the trails: triple forager food for thirty seconds, then ninety to recover.",
    done: game => (game.stats.playtime || 0) > 300,
    full: "The one thing a hand can do to the food rate. Worked steadily it holds about one and a half times an idler's output. Big Foragers ride on it because they are paid as a multiple of a forager; the founding nanitics do not, because they are not out on the trails to be called back." },

  { id: "exile", group: "colony", term: "Exiling",
    known: game => held(game, "forager"),
    short: "Sends ants of a caste away for good. Nothing is refunded and they do not come back.",
    done: game => (game.stats.exiled || 0) > 0,
    full: "It is blocked when it would strand the colony above its own population cap, so excavators cannot be dumped to trap the nest. Caste unlocks read a high-water mark rather than the live count, so exiling can never re-lock something the colony has already earned." },

  // ------------------------------------------------------------- combat
  { id: "raid", group: "combat", term: "Raid",
    known: game => raidsUnlocked(game),
    short: "Something finds the nest and attacks it. Win and it is stripped for protein and food; lose and ants die.",
    done: game => raidsSeen(game) > 0,
    full: "Losses fall in a fixed order — soldiers first, then foragers, big foragers, nanitics, nurses, and excavators last so the population cap survives the fight. A won raid still costs soldiers, scaled by how close it was: overmatch and you walk away nearly whole." },

  { id: "strength", group: "combat", term: "Fighting strength",
    known: game => raidsUnlocked(game),
    short: "What the colony can field against the next attacker. Hold more than it has and you win.",
    done: game => (game.peakStrength || 0) > 0,
    full: "Soldiers fight from birth; every other caste contributes nothing until the Combat adaptations arm them, and that branch only appears once the colony has survived its first attack. The Combat tab breaks the total down by caste." },

  { id: "hiding", group: "combat", term: "Going to ground",
    known: game => raidsUnlocked(game),
    short: "With no soldiers left, or after three straight defeats, the nest shuts. Nothing attacks, and foraging halves.",
    done: game => (game.raidsLost || 0) > 0,
    full: "This exists so a beaten colony is not ground to nothing. Before it, losing the last soldier began a spiral the colony could not escape. Half food for safety is a trade rather than a wall — and inside the Endless Siege it does not apply at all, which is what makes that trial endless." },

  { id: "veterancy", group: "combat", term: "Veterancy",
    known: game => raidsSeen(game) > 0,
    short: "Surviving a raid promotes a small share of the rank and file into Majors, for nothing.",
    done: game => held(game, "major"),
    full: "It stops at Major deliberately. Left uncapped it turned an entire army elite on its own over a long run, which made the paid grades above it decoration. Free progress needs a ceiling or the ladder above it means nothing." },

  { id: "training", group: "combat", term: "Training",
    known: game => bestTrialLevel(game, "siege") > 0,
    short: "Spending protein to raise a soldier into the next grade. Some of them do not survive it.",
    done: game => (game.stats.trained || 0) > 0,
    full: "Ten per cent are lost making Majors, twenty making Supermajors, thirty-five making Guards. Training is worth doing on a comfortable cushion and dangerous on a thin one — inside a siege, where a single defeat ends the run, thinning your own line at the wrong moment loses it." },

  // ----------------------------------------------------------- adaptations
  { id: "line", group: "upgrades", term: "Upgrade line",
    known: () => true,
    short: "An adaptation with levels rather than a single purchase. Each level costs more and does more.",
    done: game => levelsOwned(game, null) > 0,
    full: "There are twelve lines across the Colony and Combat branches, holding twenty-nine defined levels between them. Most were once separate one-off upgrades that turned out to be the same upgrade at a bigger number." },

  { id: "maxlevel", group: "upgrades", term: "Max level",
    known: game => levelsOwned(game, null) > 0,
    short: "How far a line can currently be pushed. Clearing a trial raises it on every line that trial pays into.",
    done: game => challengeLevelsTotal(game) > 0,
    full: "Drought raises the three food lines, Endless Siege the four combat ones. Levels past a line's designed top cost protein as well as food, and are deliberately worth less than the level they repeat — at full strength they were a global multiplier large enough to be a different game." },

  // ------------------------------------------------------------ prestige
  { id: "flight", group: "prestige", term: "Nuptial flight",
    known: game => runPeakCount(game, "population") >= 500,
    short: "At a thousand ants the queen takes wing. The colony disperses and a daughter founds the next one.",
    done: game => (game.prestige.flightsTaken || 0) > 0,
    full: "It pays Royal Jelly based on the colony standing at the moment of the flight, so pushing further genuinely pays more. Food, ants, brood, bought adaptations and the raid record all reset; achievements, peaks, jelly and the Royal Lineage do not." },

  { id: "jelly", group: "prestige", term: "Royal Jelly",
    known: game => (game.prestige.royalJellyTotal || 0) > 0 || runPeakCount(game, "population") >= 500,
    short: "What a nuptial flight pays. It buys the Royal Lineage and never resets.",
    done: game => (game.prestige.royalJellyTotal || 0) > 0,
    full: "Thirteen adaptations to spend it on. Eight make the next colony stronger, four sell automation, and the last one opens the Trials." },

  // The layer took the bare name in 0.2.0.0, so the older entry -- which is
  // about the clock in the header rather than about the layer -- keeps its own
  // id. Two entries sharing one id means the second silently shadows the first
  // in the index and the discovered count is wrong by one.
  { id: "matrilineAge", group: "prestige", term: "Matriline age",
    known: game => (game.prestige.flightsTaken || 0) > 0,
    short: "The whole line of queens, mother to daughter. The clock that never resets.",
    done: game => (game.stats.playtime || 0) > 7200,
    full: "Colony age resets with every flight; the matriline does not. The word is deliberate — ant colonies really are matrilineal, every worker descending from the queen and each new nest founded by her daughter. It is not a bloodline: ants have hemolymph, which is not red and not carried in vessels." },

  { id: "automation", group: "prestige", term: "Automation",
    known: game => PRESTIGE_UPGRADES.some(u => u.effect.type === "automation" && prestigeUpgradeOwned(game, u)),
    short: "The colony doing for itself what you were doing by hand. Bought with jelly, never given.",
    done: game => PRESTIGE_UPGRADES.filter(u => u.effect.type === "automation" && prestigeUpgradeOwned(game, u)).length >= 2,
    full: "Nothing is automated before the first flight. Even afterwards, nothing exiles an ant or destroys an egg on your behalf — both are irreversible, and an automated mistake there is the kind you cannot see happening." },

  // -------------------------------------------------------------- trials
  { id: "trial", group: "trials", term: "Trial",
    known: game => challengesUnlocked(game),
    short: "A colony founded on purpose under conditions that should kill it. Claim it or abandon it; you lose only the colony.",
    done: game => challengeLevelsTotal(game) > 0,
    full: "The lineage's automation comes with you and its strength does not, and everything earned on the Achievements tab still pays. Each trial asks for the thing it is about: Drought, Barren Brood and Sterile ask for a colony of 600, Sealed Nest asks for a food rate from a nest that cannot widen, the Nanitic Line asks for what one burning-out generation can gather, and Endless Siege asks you to hold the gate for fifteen attacks without losing one." },

  { id: "mastery", group: "trials", term: "Mastery",
    known: game => challengesUnlocked(game),
    short: "What clearing a trial pays, permanently. Each trial gives back the thing it took away.",
    done: game => challengeLevelsTotal(game) > 0,
    full: "A mastery is earned once and held for good, by every line the matriline ever becomes \u2014 clearing a trial unlocks its bonus and does nothing else, so a new species keeps everything the last one learned. Drought pays food as Deep Cisterns, Sealed Nest pays population cap as Hollowed Earth, Barren Brood pays brood as Warm Chambers, Endless Siege pays soldier strength as Hardened Line — all four double per level cleared. Sterile pays Learned by Heart, which raises the max level of every upgrade line and makes each level a quarter stronger; the Nanitic Line pays Long Burning, which stops the founders dying of old age and makes each of them better at everything. Every one of them applies inside trials as well as outside, or the ladder would stall at its second rung." },

  { id: "softcap", group: "trials", term: "Softcap",
    known: game => (game.achievementPoints || 0) > 40,
    short: "Past an achievement ladder's designed top, each further rung sits further from the last than the one before it.",
    done: game => (game.achievementLevel || 0) >= 10,
    full: "No ladder ends any more, because a track that finishes is a bar that pays nothing for the rest of the run. The softcap is what stops one number running away with the rest: the growth-driven tracks police themselves, but exiling ants and destroying eggs are free and repeatable, and could otherwise be farmed for tiers forever." },

  // ------------------------------------------------------------ matriline
  { id: "matriline", group: "matriline", term: "Matriline",
    known: game => matrilineVisible(game),
    short: "The line of queens itself. A colony ends with a flight; a matriline ends when the line becomes something else.",
    done: game => matrilineCount(game) > 0,
    full: "Beginning one clears everything the Royal Lineage ever gave you \u2014 the jelly, every adaptation \u2014 and commits the line to a single species for the whole run. What survives is only what the matriline tree has bought the right to inherit, which is why its first purchases are the ones that make a second matriline bearable. Colonies really are matrilineal: every worker descends from the queen, and each nest is founded by her daughter." },

  { id: "species", group: "matriline", term: "Species",
    known: game => matrilineVisible(game),
    short: "What the line becomes. Six real subfamilies, each with a half that rewrites the game and a half that pays for ever.",
    done: game => SPECIES.some(s => speciesFinished(game, s.id)),
    full: "The active half rewrites a mechanic and runs only while you are playing that species. The passive half is a plain modifier and pays at full strength for ever once the species is finished, whichever line you play next. So no matriline is ever wasted and no choice is ever regretted: what a run buys is another permanent passive, and what it costs is only the time. Finishing one takes twenty points \u2014 two for a trial level cleared as it, one for a nuptial flight as it, four for each of its own two adaptations \u2014 so the trials are the fast road and never the only one." },

  { id: "instinct", group: "matriline", term: "Instinct",
    known: game => (game.achievementPoints || 0) > 8,
    short: "Permanent traits bought with achievement tiers. Nothing here unlocks on its own \u2014 you spend the points by clicking.",
    done: game => (game.instincts || []).length > 0,
    full: "Every tier the line has ever earned is one point, and all eight instincts draw on the same pool, so buying one leaves fewer for the others. Spending never lowers your achievement level \u2014 the level is what the tiers scored, and this is what the same tiers can be spent on besides. Nothing here is ever lost: an instinct is held through a nuptial flight, a matriline and a trial alike, which makes it the only thing in the game that only ever grows. Four of the eight move the growth loop \u2014 population cap, brood chambers, hatch speed \u2014 which is the part of the game every other permanent reward turned out not to touch." },

  { id: "haplotype", group: "matriline", term: "Haplotype",
    known: game => matrilineVisible(game),
    short: "What a matriline pays. It buys the matriline tree, and nothing else spends it.",
    done: game => haplotype(game) > 0,
    full: "A haplotype is a set of alleles inherited together, and mitochondrial haplotypes are how a matriline is actually traced in biology \u2014 so it is the accurate word for what passes down a line of queens. It is paid on what the matriline did rather than on the colony standing at the end of it: the flights it took and the trial levels it cleared." },

  { id: "garden", group: "matriline", term: "Fungus garden",
    known: game => gardenActive(game) || speciesFinished(game, "atta"),
    short: "Atta does not eat what she carries. Foragers bring leaves, and only the garden turns leaves into food.",
    done: game => speciesFinished(game, "atta"),
    full: "Gathering more leaves than the garden can turn over wastes the rest, and what widens the garden is nurses rather than foragers \u2014 so the thing the colony is short of stops being food. That is the whole reason the species exists: measured on an ordinary colony a day in, foragers carry 84.6% of all food and ten of the twelve adaptation lines move the rate by nothing at all." },

  { id: "tier", group: "trials", term: "Tier and level",
    known: () => true,
    short: "A tier is one rung of one achievement track. Tiers pay XP, and XP buys achievement levels.",
    done: game => (game.achievementLevel || 0) > 0,
    full: "A tier is worth its own depth — the first rung of a track pays 1 XP and the ninth pays 9 — because the first is a formality and the last is a grind. Each level costs more XP than the one before it, so the ladder throttles itself rather than needing a cap. Every level makes the whole colony gather more." }
];

const INDEX = {};
for (const entry of LIBRARY) INDEX[entry.id] = entry;

export function libraryEntry(id) {
  return INDEX[id] || null;
}

// The library opens on the colony's first achievement tier -- earned rather than
// bought, and early, because the player who most needs the words explained is
// the one who has just met them.
export function libraryUnlocked(game) {
  return (game.achievementPoints || 0) > 0 ||
    Object.keys(game.library || {}).length > 0;
}

// 0 unseen, 1 known, 2 expanded
export function entryState(game, entry) {
  return (game.library && game.library[entry.id]) || 0;
}

// Walked once a frame. Each predicate is a couple of reads, and an entry only
// ever moves forward -- nothing already learned can be taken away by a reset.
export function discoverLibrary(game) {
  if (!game.library) game.library = {};
  let found = 0;
  for (const entry of LIBRARY) {
    const at = game.library[entry.id] || 0;
    if (at >= 2) continue;
    let want = at;
    if (entry.known(game)) want = Math.max(want, 1);
    if (want >= 1 && entry.done(game)) want = 2;
    if (want > at) {
      game.library[entry.id] = want;
      found++;
    }
  }
  return found;
}

export function libraryCounts(game) {
  let known = 0;
  let expanded = 0;
  for (const entry of LIBRARY) {
    const at = entryState(game, entry);
    if (at >= 1) known++;
    if (at >= 2) expanded++;
  }
  return { known, expanded, total: LIBRARY.length };
}

// what the player has not read yet, for the tab dot
export function libraryUnread(game) {
  const seen = (game.seen && game.seen.library) || 0;
  return Math.max(0, libraryCounts(game).known - seen);
}

// ------------------------------------------------------------- what changed
//
// The player-facing changelog. Deliberately NOT the devlog: that one records
// why a decision was made and what was measured, which is written for whoever
// maintains the game. This one says what is different for the person playing
// it, in the words the game itself uses.
//
// Newest first. A version stays on this list once it ships.
export const UPDATES = [
  { version: "0.3.0.0", name: "The Hunt",
    changes: [
      "There is ground around the nest now, and a map of it under Combat. Thirty cells in five rings, with things walking inward across them. Ground you hold makes your foragers bring back more \u2014 which is the first time an army has ever paid for itself.",
      "Held ground counts as the nest, so anything that walks into it is a fight where it stands. The further out your frontier, the more of it there is to defend.",
      "You send the army out yourself, one expedition at a time \u2014 and whoever you send cannot defend the nest while they are gone. Push out to grow, or hold back to survive.",
      "Clear all thirty cells and the whole circle becomes part of your nest for ever. A new thirty opens outside it, harder. There is no last ring.",
      "Forty-nine creatures instead of twenty-one, and each can turn up Starveling, Great, Gravid or Ancient \u2014 245 things that can come through the door. An Ancient hits three and a half times as hard as a Starveling and is worth remembering.",
      "Fifty trophies to take, five grades deep, on their own page. Beating something always gives you its trophy; beating a bigger one upgrades it; and killing enough of anything upgrades it eventually, so bad luck can slow you down but never stop you. The weakest creatures only ever give the lowest trophy, so the good ones are out in the deep ground.",
      "Trophies make you fight harder, hunt better, and hold ground for more. Finishing a whole band pays on top of that."
    ] },

  { version: "0.2.6.0", name: "Three new trials, and rewards that finally pay",
    changes: [
      "Three new trials, and these ones are asked of every matriline. The Blight: a fungus spreads through the colony, an infected ant gathers nothing, and carrying her out is the only cure \u2014 so exiling, which you have probably never once used, becomes the whole loop. Clearing it means every ant you lose anywhere, to anything, you lose fewer of.",
      "The Slave-Maker: no worker caste can be laid at all, only soldiers, and every worker in the nest is one you captured. Clearing it means a won raid brings brood home in every colony afterwards.",
      "The Repletes: food cannot be banked above what your living ants can physically hold, and each attempt gives them less room. Clearing it means the colony keeps working for longer while you are away.",
      "Five things you had bought were doing nothing. Deep Chambers, Deeper Chambers, Wide Brood, Quick Larvae and the Leafcutter\u0027s Gongylidia all paid in room or in protein \u2014 and a colony is almost never short of either. Each still does what it did, and now also makes eggs cheaper, which is what a colony really is short of.",
      "The Army ant flies at 700 ants instead of 1,000. Her column has a hard ceiling no other species has, so being asked for the same headcount meant filling three quarters of everything she could ever hold. She earns less per flight for it.",
      "Destroying eggs takes a number now. There is an \u0027at most\u0027 box, so you can trim ten off the front of a batch instead of losing all four hundred."
    ] },

  { version: "0.2.5.0", name: "Three species that were doing nothing",
    changes: [
      "Fire ant, Carpenter ant and Honeypot ant each spent three of their four adaptations on room \u2014 a bigger nest, deeper galleries, a fuller store \u2014 and a colony is almost never short of room. Their whole branch was worth nothing at all. Each of those adaptations still does what it did, and now also makes eggs cheaper, which is the thing a colony really is short of.",
      "Leafcutter was being played wrong by her own automation. The caste shares start where they suit an ordinary colony, and she wants far more nurses than that \u2014 the garden is what feeds her and nurses are what widen it. Committing to her now sets them for her. She reaches about two and a half times as far in an hour.",
      "The founders\u0027 chambers no longer let you buy slots for founders who are about to die. The card says how long they have left, and stops offering once there is no time to use them. If you have cleared the Nanitic Line they never die, and it never warns.",
      "Achievement tracks asked for whole numbers of whole things again \u2014 28 big foragers rather than 27.899, 57 upgrades rather than 56.869. Nobody loses a tier they had.",
      "The Upgrades tab was doing about eight times the work of any other tab, every frame, to redraw numbers that had not changed \u2014 and about thirteen times that again if you had it sorted by price. Sorting by price should feel like a different tab now.",
      "The readouts along the top stopped being rewritten sixty times a second whether or not anything moved."
    ] },

  { version: "0.2.4.0", name: "An assistant, and dots that say how many",
    changes: [
      "A small ant stands in the queen's panel and names the next thing worth doing — through the opening, and then for the rest of the game. Where that thing is one safe click she offers to make it: strip a wing, lay an egg, rally, buy the best adaptation you can afford, dig out when the nest is full.",
      "She never acts on her own and never offers anything you cannot take back. Exiling, destroying eggs, taking the flight and beginning a matriline all stay yours — and so does shedding her wings, which is the click the game opens on. There is a switch for her in Settings.",
      "The dots on the tabs say how many. Adaptations you can afford, entries you have not read, instincts you can buy — the number now sits inside the dot rather than being thrown away.",
      "The Achievements page says how many points you have to spend on instincts, from any of its pages rather than only from the Instincts one.",
      "The milestone line under the queen goes all the way up now: the Royal Lineage, then the Matriline, then the species you are playing and how far off finishing her, then how many of the six are banked. It used to stop at a thousand ants.",
      "Pressing a category in the library does something again — it had been showing the same page whichever one you pressed.",
      "Headings have room above them, everywhere. And the Achievements tab stopped redrawing four hundred things a frame that had not changed, which is what made buying an instinct feel like it stuck."
    ] },

  { version: "0.2.3.0", name: "The first playtest of the Matriline",
    changes: [
      "A matriline reset was quietly taking achievement tiers back \u2014 25 of them on a line with thirty flights and a lot of jelly behind it. It never should have, and it does not now. Nothing you had earned is gone.",
      "Retained Royalty keeps your royal jelly instead of 43 of it. What resets is only the figure the next matriline is gated on, which was the same number doing two jobs.",
      "The flights you took before the Matriline existed now count towards it. Thirty of them paid four Haplotype; they pay forty-three.",
      "The brood chamber can be opened at any size, and a queue you have laid can be reordered rather than only destroyed \u2014 pick a batch and move it to the front. A thousand foragers no longer bury the nurses behind them.",
      "An opening guide, one instruction at a time, which retires itself once soldiers unlock. It answers where nanitics come from, which was the first thing everybody asked.",
      "The library is a page per category rather than one long scroll, and its dot clears whichever page you are on.",
      "Harder raid settings are worth choosing: Unchecked, Hunted and Relentless now strip \u00d71.5, \u00d72.5 and \u00d74 the spoils. A bigger thing through the door is a bigger thing to render.",
      "Each species has one name instead of two. Fire ant, not Solenopsis and Fire ant \u2014 the Latin is in the flavour where it belongs.",
      "Hide owned is Hide maxed, which is what it does. The panel no longer sits over the brood by default. Tracks and Instincts carry a dot when something is waiting on them."
    ] },

  { version: "0.2.2.0", name: "What happened while you were away",
    changes: [
      "Coming back after a while now opens a report: how long the colony worked, what it gathered and rendered, how many hatched, how the nest grew, and what it fought. The clock sweeps the whole absence rather than dropping the numbers on you at once.",
      "It tells you what the offline cap cost. Away for thirty hours against an eight-hour cap means twenty-two hours the colony did not work \u2014 the old line said \u201cwhile you were away \u2014 8h\u201d and never mentioned the rest. Crop Reserve and Full Crop are both named as the things that lengthen it.",
      "It says what the colony is short of now, and if she went to ground while you were gone it says that instead.",
      "Absences under five minutes still get the one-line note, and the whole thing has a switch in Settings under Colony rules."
    ] },

  { version: "0.2.1.0", name: "What the line keeps",
    changes: [
      "A trial mastery is earned once and kept by every line. Clearing a trial unlocks its bonus and nothing else, so becoming a new species never costs you the food, the strength or the room the matriline had already learned \u2014 it only starts the ladders again.",
      "Every species has its own tab of adaptations, bought with Haplotype and held for good. Four each, and they pay only while that species is the one being played, so no two species\u2019 buffs ever pile up together.",
      "Achievement tiers finally buy something. The Instincts page spends them on eight permanent traits \u2014 population cap, brood chambers, hatch speed, fighting strength, protein, offline time, and a crop of food that survives every reset. Spending never lowers your level, and nothing there is ever lost.",
      "Atta can widen her garden by teaching her nurses to chew; Solenopsis can seat a third queen; Camponotus can cut into the heartwood; Eciton can bivouac; Myrmecocystus can render what will not fit rather than lose it; Polyergus can take the diggers as well as the workers."
    ] },

  { version: "0.2.0.0", name: "The Matriline",
    changes: [
      "A second prestige layer. Once the Royal Lineage is complete and the line has gathered enough Royal Jelly in all, the queen can begin a matriline \u2014 and every trial level the line has ever mastered cuts the jelly it asks for, so clearing trials is the fast road there and never the only one.",
      "Beginning a matriline clears everything layer one gave you: the jelly, every adaptation, all of it. What survives is what the matriline tree has bought the right to inherit, and its first purchases are the ones that carry your automation through.",
      "The line commits to one of six real species for the whole run. Atta the leafcutter, Solenopsis the fire ant, Camponotus the carpenter, Eciton the army ant, Myrmecocystus the honeypot, and Polyergus the amazon.",
      "Each species has two halves. The active half rewrites a mechanic and runs only while you are playing it; the passive half pays at full strength for ever once the species is finished, whichever line you play next. No matriline is wasted and no choice is regretted.",
      "Atta does not eat what she carries. Foragers bring leaves, only the fungus garden turns leaves into food, and nurses are what widen the garden \u2014 so for the first time the thing the colony is short of is not food.",
      "Polyergus lays nothing but soldiers. Every worker in her nest is brood taken from a raid she won, so the only way that colony grows is by winning.",
      "Eciton has no nest at all. The column holds what it holds, something finds you two and a half times as often, and a raid you win is a raid you took something from.",
      "Solenopsis lays from several queens at once; Camponotus recycles nitrogen and cuts her chambers from wood; Myrmecocystus keeps her whole store in the bodies of living ants, so growing the nest is the only way to save.",
      "Trial clears are recorded per species now. Playing as Atta re-earns the ladders as Atta, and everything cleared before this belongs to the common line \u2014 the first run is common ants, and it always was.",
      "Finishing a species takes twenty points: two for a trial level cleared as it, one for a nuptial flight as it, four for each of its first two adaptations."
    ] },

  { version: "0.1.8.0", name: "Trials you can actually reach, and a colony that says what it is short of",
    changes: [
      "The trials no longer have a secret order. Deep Cisterns doubles all food per level, and three trials are measured in food — so five levels of Drought made Sealed Nest and the Nanitic Line clear in half a minute, while a colony that had not cleared Drought could not clear either of them at all. A food-measured target now rises with the food masteries you hold, so every trial asks what this colony manages under its own debuff.",
      "Sealed Nest and the Nanitic Line were both unreachable on a first attempt and are now a real ladder. Sealed Nest runs about 2, 4, 12, 38 and 36 minutes across its five attempts; the Nanitic Line stays the short one.",
      "Excavators no longer dig past a cap they cannot raise. Inside Sealed Nest the dig-out rule never closed behind itself, so a colony could hold 1,631 ants in a nest built for 30 — and Standing Orders spent the whole trial laying diggers that widened nothing.",
      "Nest Memory does not run inside Sterile. It spent the whole allowance on whatever was cheapest, which was worth nothing an hour later, and no adaptation level can be given back. Which few you hold is the trial.",
      "Under the brood, the colony now says what is actually holding it back — chambers, food, or a full nest. An upgrade aimed anywhere else is a multiplier on a fraction, and buys almost nothing.",
      "An adaptation level that cannot pay says so. Pushed past its designed rungs, the founders' food line was costing millions of protein to move the colony's rate by three parts in a million, because four founders cannot matter against twenty thousand foragers.",
      "Relentless lives up to its name. A colony that had mastered the trials had never once lost a raid on the hardest setting; the attacker now sees half again as much of what Hardened Line taught you, and a mastered nest is broken into now and then.",
      "Sterile's card said its reward was “nothing else”. It is the only mastery that raises the max level of every adaptation line there is."
    ] },

  { version: "0.1.7.0", name: "Every trial playable, and a library",
    changes: [
      "All six trials are open. Sealed Nest, Barren Brood, Sterile and the Nanitic Line join Drought and the Endless Siege, and each still gives back exactly the thing it took away.",
      "Sealed Nest — excavators widen nothing and the nest is smaller with every attempt. It asks for a food rate rather than a headcount, because a colony that is not allowed to grow cannot be asked to grow. Clearing it doubles the population cap for good.",
      "Barren Brood — nurses add no chambers at all, and the ones you have run colder each attempt, so growth is bound by time instead of by food. Clearing it doubles the brood for good.",
      "Sterile — the colony may hold only ten bought adaptation levels at once, then seven, four, two, and none at all on the last attempt. Clearing it raises the max level of every upgrade line and makes every level you buy a quarter stronger.",
      "The Nanitic Line — every egg hatches as a founder, whatever caste you chose, and the more founders there are the faster the whole generation fades. Nothing dies of old age in it; the line burns out instead, so the trial is finding how much one colony can gather before it does. The first clear stops the founders dying of old age in every colony afterwards.",
      "Living Larder and Borrowed Time buy brood chambers now instead of a longer life, because the Nanitic Line hands the lifespan over for nothing.",
      "The nest is attacked by something rather than by a number. Twenty-one named attackers, from the phorid fly to the elder wyrm, each drawn from the band its strength falls in.",
      "How hard raids are is yours to choose. Sheltered, Unchecked, Hunted and Relentless, on the Combat tab once the siege has been cleared once — a colony that has mastered the trials outguns the next attacker several hundred times over, and this is the dial for that.",
      "A Library tab. Every term the game uses, written up in plain words — castes, resources, combat, the lineage, the trials. Entries appear as the colony meets them and fill out once it has actually done them.",
      "Laying thousands of eggs no longer freezes the tab. A colony that could afford a hundred thousand eggs was doing a hundred thousand sums every frame just to label the Lay max button.",
      "The instinct to shed now strips the wings as well. It only ever shed them before, which left four wings to click by hand every time you founded a colony.",
      "You can choose how many eggs a batch lays. Type a number beside the Lay buttons — 250, or 2k — instead of clicking ×10 over and over.",
      "Numbers run to 10^63, and Settings offers scientific notation outright rather than handing it over when the suffixes run out.",
      "The food-reserve row no longer squeezes itself into three lines with half the panel empty beside it."
    ] },

  { version: "0.1.6.0", name: "The achievement rework",
    changes: [
      "No achievement track ever finishes. Past its designed rungs a ladder keeps going, with each further rung a little harder than the last, so nothing ends up as a full bar paying nothing.",
      "There is no level cap. Each level costs more than the one before it, so the climb slows itself instead of stopping.",
      "A deep tier is worth more than a shallow one. The first rung of a track pays the least and the last pays the most.",
      "Six new tracks: soldiers trained, Phragmotic Guards raised, your deepest single adaptation, matriline age, ants exiled and eggs destroyed.",
      "Ladder steps now follow how fast each thing actually grows, so food rungs are far apart and big forager rungs are close together."
    ] },

  { version: "0.1.5.0", name: "Soldier ranks, and the second trial",
    changes: [
      "Soldiers have grades. Major, Supermajor and the Phragmotic Guard, whose head is a living door. Every grade fights harder and hunts worse, so an army of nothing but Guards brings home no protein.",
      "Surviving a raid promotes some of the rank and file into Majors for free. Everything above that is trained with protein in the new Units menu, and some of them do not survive the training.",
      "Endless Siege, the second trial. Attacks from 16 ants, one every ninety seconds, and a single defeat ends the run. Clearing it once opens the Units menu.",
      "Winning a raid now costs soldiers, scaled by how close the fight was.",
      "The twenty-nine adaptations became twelve lines with levels. Clearing a trial raises the max level of every line it pays into.",
      "Food and protein can be traded in the rendering pit, at what the colony currently earns."
    ] },

  { version: "0.1.4.0", name: "Trials that end, and a interface that fits",
    changes: [
      "Drought stops at five levels and is then mastered, rather than grinding on forever.",
      "Everything you own on the Achievements tab keeps paying inside a trial, including the bonus for big foragers.",
      "The queen, brood and details panel moved into their own column, so a tab starts at the top of the page instead of halfway down it.",
      "Press E to read the details panel at full size."
    ] },

  { version: "0.1.3.0", name: "The Trials",
    changes: [
      "The last Royal Lineage adaptation opens a tab. A trial founds a colony under conditions that should kill it.",
      "The lineage's automation comes with you; its strength does not."
    ] },

  { version: "0.1.2.0", name: "The founding generation",
    changes: [
      "The queen's four wings survive the shed. Strip them one at a time for food — they are the only food that exists before the first workers emerge.",
      "Nanitics start at six times a forager and fade as the queen's flight muscle runs out. They hatch at double speed and each one tends a brood chamber."
    ] },

  { version: "0.1.1.0", name: "Automation, and a colony that can recover",
    changes: [
      "Four Royal Lineage adaptations sell automation: buying adaptations, laying eggs, holding a caste balance, and keeping a food reserve back.",
      "A colony with no soldiers goes to ground instead of being ground down. Nothing attacks, and foraging halves until an army stands again.",
      "A Formulas panel in Settings shows how every rate is built, with live numbers."
    ] },

  { version: "0.1.0.0", name: "The Nuptial Flight",
    changes: [
      "At a thousand ants the queen takes flight and a daughter founds the next colony.",
      "Royal Jelly buys the Royal Lineage, which survives every flight."
    ] },

  { version: "0.0.4.0", name: "Raids, soldiers and protein",
    changes: [
      "A monster attacks on a timer. Soldiers fight from birth; every other caste fights at nothing until the Combat adaptations arm them.",
      "Protein feeds the brood so eggs develop twice as fast, and buys its own branch of adaptations."
    ] },

  { version: "0.0.3.0", name: "Nurses, brood slots and the Big Forager",
    changes: [
      "Only a few eggs develop at once and the rest queue. Nurses widen that, which is what makes them worth raising.",
      "Big Foragers hatch by chance from ordinary forager eggs and grow stronger the longer they live."
    ] },

  { version: "0.0.1.0", name: "The founding phase",
    changes: [
      "A mated queen who has already landed. Shedding her wings frees a finite pool of reserves, and those buy her first eggs.",
      "The first four workers emerge as nanitics whatever caste you chose."
    ] }
];

export function latestVersion() {
  return UPDATES.length ? UPDATES[0].version : "";
}

// true when something has shipped that this player has not looked at
export function updatesUnread(game) {
  return ((game.seen && game.seen.updates) || "") !== latestVersion();
}
