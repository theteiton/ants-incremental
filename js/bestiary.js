// What comes through the door, and what you keep from it.
//
// This module imports NOTHING, for the same reason species.js and instincts.js
// do not: raids.js needs it, and anything raids.js reaches has to be a leaf or
// the cycle evaluates one of these before the other's exports exist.
//
// Fifty creatures across five bands. The progression is the one the game has
// always had -- real ant predators for as long as the colony is a plausible
// size, then myth once a nest holds millions -- and `from` is the attacker
// power at which each becomes possible, so a colony always meets something
// scaled to what it can field.

// ------------------------------------------------------------------ the bands
//
// A band is a collection goal and a bonus kind at once. Completing one pays on
// its own, and every trophy in it pays the same KIND of bonus, which is where
// "the mythical ones give something different" lives.
export const BANDS = [
  { id: "small", name: "Small Things",
    note: "The insects and the spiders. Everything here is closer to prey than to predator, and the colony learns to eat what it kills.",
    kind: "protein", per: 0.03, complete: 1.5 },
  { id: "cold", name: "Cold Blood",
    note: "Amphibians and reptiles. Slow, patient, and impossible to hurry — the colony learns to hold ground rather than to rush it.",
    kind: "territory", per: 0.02, complete: 1.4 },
  { id: "feather", name: "Feathers",
    note: "Birds. Nothing else arrives as fast, and a colony that has learned to watch the sky moves faster itself.",
    kind: "speed", per: 0.015, complete: 1.3 },
  { id: "fur", name: "Fur and Claw",
    note: "The mammals, which do not stalk the trails so much as open the nest. What the colony takes from them is how to fight something bigger than itself.",
    kind: "strength", per: 0.04, complete: 1.6 },
  { id: "myth", name: "Things That Should Not Be",
    note: "By the time a nest holds millions, what comes for it is no longer in the books. What it leaves behind does not behave like a trophy either.",
    kind: "myth", per: 0.03, complete: 1.5 }
];

export function bandById(id) {
  return BANDS.find(b => b.id === id) || BANDS[0];
}

// ------------------------------------------------------------- the modifiers
//
// Five words in front of a name, each changing the numbers rather than only the
// reading -- so fifty creatures are hundreds of encounters and one base stays
// useful across many tiers. `grade` is the trophy grade this modifier yields.
export const MODIFIERS = [
  { id: "starveling", name: "Starveling", grade: 1, power: 0.55, speed: 1.4, reward: 0.6,
    note: "Half-starved and in a hurry. It reaches the nest before anything else does." },
  { id: "plain", name: "", grade: 2, power: 1, speed: 1, reward: 1,
    note: "" },
  { id: "great", name: "Great", grade: 3, power: 2.1, speed: 0.75, reward: 1.9,
    note: "Full-grown and unhurried, because nothing it has met has made it hurry." },
  { id: "gravid", name: "Gravid", grade: 4, power: 1.7, speed: 0.9, reward: 1.6, spawns: true,
    note: "Heavy with eggs. Killing it does not end it." },
  { id: "ancient", name: "Ancient", grade: 5, power: 3.6, speed: 0.6, reward: 3.2,
    note: "It has been doing this for longer than the colony has existed." }
];

export function modifierById(id) {
  return MODIFIERS.find(m => m.id === id) || MODIFIERS[1];
}

// The deepest grade a creature can drop, by band. The weakest things in the
// game only ever give the lowest trophy however many you kill; the deepest can
// give the highest, and that is what makes hunting far out worth doing rather
// than farming whatever is nearest.
export const BAND_TOP_GRADE = { small: 2, cold: 3, feather: 3, fur: 4, myth: 5 };

export function topGradeFor(monster) {
  return BAND_TOP_GRADE[monster.band] || 2;
}

// How often each modifier turns up. The ordinary form is much the commonest and
// the deep ones are rare enough to be worth remembering.
export const MODIFIER_WEIGHTS = { starveling: 26, plain: 46, great: 16, gravid: 8, ancient: 4 };

// A modifier must add VARIETY, not difficulty. Left raw, the weighted mean of
// the power multipliers is 1.219, so every attacker in the game was quietly 22%
// stronger -- measured, that pushed 2,000 ants from 66.2m to 74.3m. Worse, the
// mean differs per band, because a band caps which modifiers it can carry: the
// Small Things average 0.84 and the myth band 1.22, so the same change made the
// early game easier and the late game harder at once.
//
// So each band is normalised to a mean of exactly 1. The spread is untouched --
// an Ancient still hits three and a half times a Starveling -- and the expected
// attacker is what it always was.
const BAND_MEAN = {};
for (const band of BANDS) {
  const top = BAND_TOP_GRADE[band.id] || 2;
  let weight = 0;
  let power = 0;
  for (const m of MODIFIERS) {
    if (m.grade > top) continue;
    const w = MODIFIER_WEIGHTS[m.id] || 1;
    weight += w;
    power += w * m.power;
  }
  BAND_MEAN[band.id] = weight > 0 ? power / weight : 1;
}

// the power multiplier this modifier is worth ON this creature, mean-1 within
// its band
export function modifierPower(monster, modifierId) {
  const mean = BAND_MEAN[monster && monster.band] || 1;
  return modifierById(modifierId).power / mean;
}

export function bandMeanPower(bandId) {
  return BAND_MEAN[bandId] || 1;
}

// ----------------------------------------------------------------- the fifty
export const MONSTERS = [
  { id: "phorid", name: "Phorid Fly", from: 0, band: "small",
    note: "A fly the size of a pinhead that lays a single egg in a worker's head. Barely an attack at all, and every colony's first." ,
    trophy: { name: "Phorid Case", kinds: ["brood", "hunt"] }},
  { id: "thief", name: "Thief Ant", from: 60, band: "small",
    note: "Small enough to use tunnels too narrow for anything that could stop her, and she is only ever after the brood." ,
    trophy: { name: "Stolen Cache", kinds: ["capture", "egg"] }},
  { id: "antlion", name: "Antlion", from: 200, band: "small",
    note: "It does not hunt. It digs a pit in loose sand and waits at the bottom for the trail to cross it." ,
    trophy: { name: "Pit Sand", kinds: ["territory", "strength"] }},
  { id: "rove", name: "Rove Beetle", from: 350, band: "small",
    note: "It smells like one of yours. The workers groom it and feed it while it eats the brood, and nothing about the nest objects." ,
    trophy: { name: "Mimic Gland", kinds: ["egg", "brood"] }},
  { id: "spider", name: "Wolf Spider", from: 600, band: "small",
    note: "No web. It runs the foraging trails down one ant at a time and carries them off." ,
    trophy: { name: "Runner's Legs", kinds: ["speed", "hunt"] }},
  { id: "robber", name: "Robber Fly", from: 950, band: "small",
    note: "It takes alates out of the air during the flight, which is the one day the colony cannot afford to lose any." ,
    trophy: { name: "Robber's Proboscis", kinds: ["strength", "speed"] }},
  { id: "assassin", name: "Assassin Bug", from: 1500, band: "small",
    note: "It drains a worker and wears the empty shell on its back, stacked with the others, and walks into the nest wearing them." ,
    trophy: { name: "Shell Cloak", kinds: ["salvage", "strength"] }},
  { id: "spitting", name: "Spitting Spider", from: 2400, band: "small",
    note: "It does not chase. It glues the worker to the ground from a body length away and then takes its time." ,
    trophy: { name: "Glue Sac", kinds: ["strength", "territory"] }},
  { id: "mantis", name: "Praying Mantis", from: 4000, band: "small",
    note: "Still for hours at the mouth of the tunnel, then not still." ,
    trophy: { name: "Raptorial Foreleg", kinds: ["strength", "hunt"] }},
  { id: "centipede", name: "Giant Centipede", from: 6500, band: "small",
    note: "Long enough to be in the chamber and the tunnel behind it at the same time." ,
    trophy: { name: "Segment Chain", kinds: ["cap", "strength"] }},
  { id: "raiders", name: "Army Ant Raiders", from: 10000, band: "small",
    note: "Another colony, and a bigger one. They take the brood rather than the workers, which is worse." ,
    trophy: { name: "Raiders' Trail", kinds: ["capture", "speed"] }},
  { id: "scorpion", name: "Bark Scorpion", from: 16000, band: "small",
    note: "It hunts by feeling the ground shake, so a busy trail is the loudest thing for a hundred body lengths." ,
    trophy: { name: "Tremor Sense", kinds: ["hunt", "speed"] }},

  { id: "newt", name: "Fire Salamander", from: 22000, band: "cold",
    note: "Damp, unhurried, and entirely unbothered by formic acid." ,
    trophy: { name: "Alkaloid Skin", kinds: ["salvage", "protein", "strength"] }},
  { id: "toad", name: "Cane Toad", from: 25000, band: "cold",
    note: "Sits on the entrance and swallows whatever comes out of it, for as long as anything does." ,
    trophy: { name: "Wide Gullet", kinds: ["protein", "hunt", "food"] }},
  { id: "skink", name: "Blue-tongued Skink", from: 40000, band: "cold",
    note: "It works the trail like a queue, and it has all afternoon." ,
    trophy: { name: "Blue Tongue", kinds: ["hunt", "protein", "speed"] }},
  { id: "gecko", name: "Tokay Gecko", from: 90000, band: "cold",
    note: "It comes down the wall of the chamber head-first, which nothing in the colony's experience prepares it for." ,
    trophy: { name: "Setae Pads", kinds: ["cap", "territory", "speed"] }},
  { id: "monitor", name: "Monitor Lizard", from: 4e7, band: "cold",
    note: "It opens the nest with its forelimbs the way a badger does, and it is not in a hurry either." ,
    trophy: { name: "Digging Claw", kinds: ["cap", "strength", "territory"] }},
  { id: "tegu", name: "Argentine Tegu", from: 9e7, band: "cold",
    note: "Warm-blooded when it wants to be, which is the part nothing expects." ,
    trophy: { name: "Warm Blood", kinds: ["brood", "protein", "food"] }},
  { id: "python", name: "Rock Python", from: 3e8, band: "cold",
    note: "It does not eat ants. It moves into the chamber, and the chamber is no longer the colony's." ,
    trophy: { name: "Coil Hide", kinds: ["territory", "strength", "cap"] }},
  { id: "croc", name: "Nile Crocodile", from: 9e8, band: "cold",
    note: "It has no business here at all, which does not stop it." ,
    trophy: { name: "Armoured Jaw", kinds: ["strength", "salvage", "protein"] }},

  { id: "woodpecker", name: "Green Woodpecker", from: 60000, band: "feather",
    note: "It is not after the wood. Its tongue is longer than its head and sticky along its whole length." ,
    trophy: { name: "Barbed Tongue", kinds: ["protein", "hunt", "speed"] }},
  { id: "wryneck", name: "Wryneck", from: 110000, band: "feather",
    note: "It hisses like a snake when cornered, and it eats nothing but ants." ,
    trophy: { name: "Wryneck's Hiss", kinds: ["strength", "hunt", "salvage"] }},
  { id: "flicker", name: "Northern Flicker", from: 220000, band: "feather",
    note: "The one woodpecker that feeds on the ground, which is where the colony is." ,
    trophy: { name: "Ground Quill", kinds: ["hunt", "food", "speed"] }},
  { id: "antbird", name: "Ocellated Antbird", from: 700000, band: "feather",
    note: "It does not eat the ants. It follows the raiding column and takes everything the column flushes out, which is worse for whoever is in the way." ,
    trophy: { name: "Follower's Eye", kinds: ["speed", "capture", "hunt"] }},
  { id: "hornbill", name: "Ground Hornbill", from: 3e6, band: "feather",
    note: "It walks. It has walked all morning and it will walk all afternoon, and it is turning over every stone on the way." ,
    trophy: { name: "Walker's Stride", kinds: ["territory", "speed", "food"] }},
  { id: "shoebill", name: "Shoebill", from: 2e7, band: "feather",
    note: "It stands entirely still for so long that the colony rebuilds the trail around it." ,
    trophy: { name: "Still Watch", kinds: ["territory", "strength", "cap"] }},
  { id: "roc", name: "Roc", from: 4e9, band: "feather",
    note: "The shadow crosses the whole foraging range at once, and the workers stop where they stand." ,
    trophy: { name: "Roc Pinion", kinds: ["speed", "territory", "food"] }},

  { id: "shrew", name: "Elephant Shrew", from: 130000, band: "fur",
    note: "It keeps its own trails cleared and it runs them faster than anything its size has a right to." ,
    trophy: { name: "Trailkeeper", kinds: ["speed", "territory", "food", "hunt"] }},
  { id: "pangolin", name: "Pangolin", from: 150000, band: "fur",
    note: "Armoured against everything the colony has. It opens the chamber, eats, and leaves the nest standing." ,
    trophy: { name: "Keratin Scale", kinds: ["salvage", "strength", "cap", "territory"] }},
  { id: "numbat", name: "Numbat", from: 300000, band: "fur",
    note: "It eats nothing else and it eats twenty thousand a day, which for a small colony is the whole colony." ,
    trophy: { name: "Numbat Tongue", kinds: ["protein", "hunt", "food", "speed"] }},
  { id: "aardvark", name: "Aardvark", from: 400000, band: "fur",
    note: "It does not eat the ants near the surface. It digs down to the chambers where the brood is." ,
    trophy: { name: "Aardvark Claw", kinds: ["cap", "protein", "strength", "egg"] }},
  { id: "armadillo", name: "Giant Armadillo", from: 700000, band: "fur",
    note: "The largest digging claw of any living animal, and it is used on exactly this." ,
    trophy: { name: "Great Claw", kinds: ["cap", "territory", "strength", "egg"] }},
  { id: "anteater", name: "Giant Anteater", from: 1e6, band: "fur",
    note: "Two metres of tongue and no teeth. It takes a nest apart in ninety seconds and then walks to the next one." ,
    trophy: { name: "Anteater Tongue", kinds: ["protein", "food", "hunt", "strength"] }},
  { id: "aardwolf", name: "Aardwolf", from: 1.6e6, band: "fur",
    note: "A hyena that gave up on everything except this." ,
    trophy: { name: "Aardwolf Jaw", kinds: ["hunt", "protein", "speed", "strength"] }},
  { id: "echidna", name: "Echidna", from: 2.5e6, band: "fur",
    note: "It has been doing this, essentially unchanged, since before there were ants worth eating." ,
    trophy: { name: "Ancient Spine", kinds: ["territory", "salvage", "cap", "food"] }},
  { id: "pichi", name: "Pichi", from: 4e6, band: "fur",
    note: "Small, armoured, and it sleeps in the hole it dug through the side of the nest." ,
    trophy: { name: "Burrow Shell", kinds: ["cap", "brood", "salvage", "territory"] }},
  { id: "bear", name: "Sloth Bear", from: 6e6, band: "fur",
    note: "It closes its nostrils and sucks the chamber out. It can be heard doing this from a very long way away." ,
    trophy: { name: "Sloth Bear Lung", kinds: ["protein", "strength", "salvage", "food"] }},
  { id: "chimp", name: "Chimpanzee", from: 1e7, band: "fur",
    note: "It brought a stick. It has used a stick before, and it will improve the stick if this one does not work." ,
    trophy: { name: "Termite Stick", kinds: ["egg", "food", "capture", "strength"] }},
  { id: "badger", name: "Honey Badger", from: 1.5e7, band: "fur",
    note: "It is not especially interested in ants. It is interested in whether the nest can be opened, which is a different problem." ,
    trophy: { name: "Loose Hide", kinds: ["strength", "salvage", "territory", "protein"] }},
  { id: "wolverine", name: "Wolverine", from: 6e7, band: "fur",
    note: "Nothing about this is proportionate." ,
    trophy: { name: "Wolverine Jaw", kinds: ["strength", "hunt", "salvage", "capture"] }},
  { id: "boar", name: "Wild Boar", from: 1e8, band: "fur",
    note: "It is not hunting. It is rooting, and the nest happens to be in the way of that." ,
    trophy: { name: "Rooting Tusk", kinds: ["food", "cap", "territory", "protein"] }},
  { id: "bearbrown", name: "Brown Bear", from: 1.8e8, band: "fur",
    note: "It turns the boulder over, eats what is under it, and does not come back for a month." ,
    trophy: { name: "Boulder-Turner", kinds: ["strength", "cap", "food", "salvage"] }},

  { id: "basilisk", name: "Basilisk", from: 2.5e8, band: "myth",
    note: "The first thing to come for the nest that is not in any book of animals." ,
    trophy: { name: "Basilisk Eye", kinds: ["strength", "territory", "salvage", "capture", "food"] }},
  { id: "wyvern", name: "Wyvern", from: 7e8, band: "myth",
    note: "Two legs and a tail that does the arguing. It takes a section of the hill with it when it leaves." ,
    trophy: { name: "Wyvern Sinew", kinds: ["speed", "strength", "territory", "food", "capture"] }},
  { id: "chimera", name: "Chimera", from: 2e9, band: "myth",
    note: "Three ways of being wrong, arriving together and disagreeing about the approach." ,
    trophy: { name: "Chimera Heart", kinds: ["food", "strength", "protein", "territory", "egg"] }},
  { id: "dragon", name: "Dragon", from: 5e9, band: "myth",
    note: "It does not dig and it does not need to. It has been aware of the colony for some time and has only now found it worth the trip." ,
    trophy: { name: "Dragon Scale", kinds: ["food", "strength", "cap", "salvage", "territory"] }},
  { id: "wyrm", name: "Elder Wyrm", from: 2e10, band: "myth",
    note: "It came up from underneath, which nothing has ever done, and the deep chambers are simply gone." ,
    trophy: { name: "Wyrm Vertebra", kinds: ["cap", "territory", "food", "egg", "strength"] }},
  { id: "kraken", name: "Land Kraken", from: 8e10, band: "myth",
    note: "There is no ocean here. It does not appear to have been told." ,
    trophy: { name: "Kraken Beak", kinds: ["territory", "capture", "strength", "food", "protein"] }},
  { id: "titan", name: "Sleeping Titan", from: 3e11, band: "myth",
    note: "The hill the colony has always lived on rolls over." ,
    trophy: { name: "Titan Shard", kinds: ["food", "territory", "cap", "strength", "egg"] }}
];

// power order, used by both the encounter roll and the trophy value
const BY_POWER = MONSTERS.slice().sort((a, b) => a.from - b.from);

// ------------------------------------------------------------ what one is worth
//
// Derived rather than typed out 49 times, so the numbers stay consistent with
// each other and with the depth they came from. A creature's rank in power order
// is its tier, and the grade is its rarity -- an Ancient of something deep is
// the best trophy in the game and a plain Phorid Fly is the worst, with
// everything in between falling where it should without anyone tuning it.
export const TROPHY_BASE = 0.006;
export const TROPHY_TIER_STEP = 0.9;     // per rank, as a share of BASE
export const TROPHY_GRADE_STEP = 0.75;   // per grade above the first

export function monsterRank(monster) {
  const i = BY_POWER.indexOf(monster);
  return i < 0 ? 0 : i / Math.max(1, BY_POWER.length - 1);
}

// the value ONE grade of a trophy adds, in its own kind
export function trophyGradeValue(monster, grade) {
  if (!monster || grade < 1) return 0;
  const tier = 1 + TROPHY_TIER_STEP * monsterRank(monster) * 6;
  const rarity = 1 + TROPHY_GRADE_STEP * (grade - 1);
  return TROPHY_BASE * tier * rarity;
}

// which kind a given grade of this creature's trophy pays into
export function trophyKindAt(monster, grade) {
  const kinds = monster && monster.trophy ? monster.trophy.kinds : null;
  if (!kinds || grade < 1 || grade > kinds.length) return null;
  return kinds[grade - 1];
}

export function trophyName(monster) {
  return monster && monster.trophy ? monster.trophy.name : (monster ? monster.name : "");
}

export function monsterById(id) {
  return MONSTERS.find(m => m.id === id) || MONSTERS[0];
}

// Everything a colony of this strength could plausibly meet: the six strongest
// things it has unlocked. Sorted by `from` rather than trusting array order --
// the list is grouped by band for reading, so it is NOT in power order, and
// slicing it raw would have offered a colony of 200 power a Land Kraken.
export function monsterChoices(power) {
  const open = BY_POWER.filter(m => power >= m.from);
  return open.length ? open.slice(-6) : [BY_POWER[0]];
}

// The full name, modifier and all. "plain" has no word in front of it, so the
// ordinary form of a creature reads as its own name rather than as a variant.
export function monsterFullName(monster, modifierId) {
  const mod = modifierById(modifierId);
  return mod.name ? mod.name + " " + monster.name : monster.name;
}
