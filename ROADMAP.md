# Roadmap

**This file is not canon.** `CLAUDE.md` and `GEMINI.md` hold what is settled and
`DEVLOG.md` holds what shipped. This one holds what is planned and what is still
undecided, and every line of it is arguable until it lands. When something here
ships, it moves into the canon files and comes out of this one.

Last updated 2 September 2026, against 0.3.1.1.

---

## Where the game stands

Layers 0, 1 and 2 are built.

Measured as one playthrough under a single policy, identical across three seeds:

| | measured |
|---|---|
| first colony to 1,000 ants | 0.78h |
| the Royal Lineage complete, 5 flights | 1.44h |
| every trial mastered | 6.67h |
| **all six species finished — the whole game** | **7.6h** |

**The 27-hour figure this file used to carry was wrong.** It added up per-trial
times each measured from a colony holding no other mastery, and those do not
compose: inside one run the masteries compound and the back half of the ladder
collapses — Drought 117 minutes for five levels, the Endless Siege 115, Barren
Brood 78, then the Nanitic Line in 1.4 minutes, Sealed Nest in 0.5 and Sterile in
2.4.

Per-level trial times, which are the unit everything below is sized in: Drought
96.7 / 86.4 / 96.0 / 96.2 / 114.3m, Sterile 60.6 / 89.6 / 192.5 / 310.7 / 270.6m,
Barren Brood 34.4 / 26.7 / 26.3 / 36.3 / 62.2m, Endless Siege 23.1–23.5m flat,
Sealed Nest 2.0 / 8.0 / 22.0 / 120.3 / 148.0m, Nanitic Line 1.6–2.5m. The median
level is about half an hour; Drought and Sterile are the long ones and the
Nanitic Line is nearly free.

**Layer 2 shipped in 0.2.0.0.** The Matriline: the gate, the reset, Haplotype,
the 22-node tree, all six species with both halves, and per-species trial
records on save v8. What it is and why every number is what it is now lives in
the canon files.

**The problem layer 2 was built to answer, and how far it got.** The game was one
resource wide — on an ordinary colony a day in, foragers carry 84.6% of all food
and ten of the twelve upgrade lines move the rate by exactly ×1.000000. Atta
answers it: under her the garden is the binding constraint and nurses widen it,
so the thing the colony is short of is not food. **That is one species out of
six.** The other five are still food-shaped underneath, and the generic line
still is. Widening the mid-game inside layer 1 is still open.

---

## The shape of the whole game

**Open-ended.** There is no planned last prestige layer. Layers ship until they
stop being worth building. `1.0.0.0` is redefined as **leaving beta** —
feature-complete rather than layer-complete.

---

## Built in 0.2.6.0: the three matriline trials

**Built and measured in 0.2.6.0.** Kept here because the reasoning is worth
reading next to the rest of the plan; the measured figures live in the canon.
Same rule as layer 1: each takes one thing away and gives that same thing back.

**None of the three pays a global food multiplier**, deliberately. Deep Cisterns
is the one mastery with *f* = 1 and it silently broke three of six trials until
0.1.8.0. **No new mastery may multiply all food.** That is the hardest rule in
this document, and layer 2 held to it — every species passive is scoped to one
thing.

### The Blight

*Ophiocordyceps unilateralis*, which is real and does exactly this.

- **Takes**: an infection spreads through the colony. An infected ant produces
  nothing and infects others at a rate that rises with how many are already
  infected. Exiling is the only cure.
- **Asks**: hold a population while the infected share stays under a threshold.
- **Loses**: the infected share passing a ceiling ends the run.
- **Gives back**: **Metapleural Gland** — every kind of ant loss is reduced,
  permanently. Raid deaths, training deaths, the lot.
- **Why first**: exiling is a button nobody presses. It is one of the two
  irreversible acts the game refuses to automate, and it exists only to undo a
  mistake. This makes it the core loop of a trial without inventing a mechanic.

### The Slave-Maker

*Polyergus*, which raids other nests for brood and cannot feed itself.

- **Takes**: you cannot lay any worker caste. Only soldiers.
- **Asks**: reach a population.
- **Gives back**: **Dulotic Instinct** — a won raid captures ants for good, in
  every colony afterwards.
- **Note**: layer 2 already built the mechanic, as Polyergus's active. The trial
  is the same rewrite applied to whatever species is playing it, which makes it
  much cheaper than it was when the roadmap first specced it.

### The Repletes

*Myrmecocystus*, whose repletes hang from the ceiling as living jars.

- **Takes**: food cannot be banked above what living ants can hold.
- **Asks**: a banked-food figure.
- **Gives back**: **Social Stomach** — the offline progress cap rises per level.
- **Note**: also already built, as Myrmecocystus's active, and measured — 800 per
  ant is where the store sits permanently full without blocking upgrades.

---

## Sizing: settled

**The colony trials are a menu, not a ladder.** A new species starts every layer-1
ladder from nothing, and is not meant to climb all six. The player takes the ones
that line is short of — Drought and the Nanitic Line pay food, the Endless Siege
pays fighting strength, Sealed Nest pays room, Barren Brood pays chambers,
Sterile pays into every adaptation line. Three of the nine at five levels is
about 45 hours across six matrilines, which is the budget; a completionist can
climb all 134 hours of them and a player who wants none of it can finish a
species on flights alone.

That is why finishing a species has three roads and why the trial road is only
the fastest of them. The matriline trials, once built, are the ones expected of
every line.

The Trials tab now says this outright when a species is playing, because a
ladder that reads as mandatory and takes 134 hours is a wall whether or not it
was meant as one.

---

## Open decisions

1. **Layer 2 is 0.9 hours against the 40 you asked for.** Finishing a species is
   twenty points, a nuptial flight is worth one, and a mastered colony flies in
   about a minute — so twelve flights is twelve minutes and two branch nodes
   cover eight points more. The costs were priced as though a flight were an
   event. Any real length has to be built on something that takes time, and the
   only thing in this game that does is a trial.
2. **A trial's target scales with one mastery while the colony has grown by
   everything.** Sealed Nest's target rises with `masteryFood` and it still
   clears in half a minute, because the colony also holds an achievement level
   worth ×4.07 food and every upgrade line bought out. Asking for a fraction of
   what the colony would produce undebuffed is self-scaling against all of it.

1. **Do the species passives still need re-aiming?** 0.2.1.0 answered the
   symptom rather than the cause: the Instincts tree now carries the
   growth-shaped permanent progression the passives lacked, and each species has
   four adaptations of its own. But the six passives themselves are unchanged and
   still pay only into combat, protein, salvage and the offline cap, so finishing
   a species is still not felt in a growth run. Re-aiming two of them at brood
   and cap is the smallest fix if it should be.
2. **Is Polyergus too strong?** Measured at 24 hours with every passive live and
   the whole tree bought: 51,889 ants and 3.70e6 food/s against about 24,000 and
   2.7e6 for the other four non-nomadic species. Growth is linear in raids won
   rather than exponential, which was the fix — but she wins 239 raids in a day.
   The dial is `CAPTURE_DIGGER_CAP`, cut from 4 to 2 in 0.2.1.0 after her two new adaptations compounded her to 103,476.
3. **Should Eciton be able to flight at all?** Her nomadic cap is 1,400 purely so
   she can clear the 1,000-ant flight gate. That is the gate driving the design
   rather than the other way round. A species-scoped flight gate would be
   cleaner and is a save-shape change.
4. **What does the Blight's infection spread on?** Time, population, or raids.
   Time is simplest; population makes growth itself the risk, which is a better
   trial and a harder balance.
5. **A regression harness in the repo.** The simulation harness that found all
   five of layer 2's bugs lives in a scratch directory and dies with the session.
   Ladders every trial, runs 48 hours of a mastered colony, plays 24 hours of
   each species, and fails on an unreachable target, a NaN, or a population above
   its cap. Every one of those checks caught something real this time.

---

## 0.3.0.0 — The Hunt (SHIPPED)

**Built and measured in 0.3.0.0.** Kept here because the reasoning is worth
reading; the measured figures live in the canon. What follows was the plan.

Chosen 2 September 2026. Five things were on the table and the map subsumes one of
them, so it is four.

### The number the whole release answers

Measured across two hours of automated play, the colony's food budget is
**foragers 79.4%, soldiers 15.8%, excavators 2.4%, nurses 2.3%, upgrades 0.1%**.
Amdahl bounds a reward at `1/(1-f)` of the share it touches, so making the
population cap free is worth **×1.02** and a free brood the same. Only the
forager share is worth anything, at **×4.85**.

That is why ten of twelve upgrade lines move nothing, why four of eight Instincts
are near-inert, why twelve species nodes measured ×0.97, and why finishing a
species is not felt in a growth run. **They all aim at the 20% that is not
foragers.** It is also why the upgrade tab has no interesting decision: the whole
upgrade system consumes one part in a thousand of the colony's food.

### The idea

Combat is a side system because soldiers buy nothing the colony grows on. Make
**cleared ground multiply foraging** and the army becomes leverage on the 79.4%
rather than a tax on it:

> The colony's food rate scales with how much ground it holds, and holding
> ground is what the army is for.

This is the "second cost" the roadmap wanted, arrived at from the other side. It
is better than an abstract foraging-distance penalty because it is a thing the
player can see, and because it pays rather than punishes.

### The map

**Thirty cells shown at a time**, nest at the centre, drawn in `sprites.js`.
A cell is empty, held, garrisoned or occupied. A new **Hunt** sub-tab under
Combat.

- Monster strength at ring `r` is `monsterPower() × DISTANCE_SCALE^r`, about
  ×1.6 a ring, so the outer ring is ten times the inner. Reward scales the same
  way. **Distance is the difficulty dial.**
- Monsters advance one ring roughly every 90s. From ring 5 that is about seven
  and a half minutes to the nest, deliberately near today's six-minute raid
  cadence so the feel does not lurch.
- **Reaching ring 0 is an assault**, which is the raid the game already resolves.
  `monsterPower`, `DEATH_ORDER`, salvage and the four difficulty settings all
  keep working underneath.

### The board telescopes, so the map has no edge

Decided 2 September 2026, replacing the three bounded options that were offered.

**Thirty cells are visible at any time.** Clear all of them and the whole ring
collapses inward — it **merges into the nest**, becomes permanently held, and a
fresh thirty appear outside it. The circle grows outward for ever and the board
the player reads never gets bigger.

That gives combat the shape the achievement ladders already have: an endless
climb with a fixed-size readout. Each completed circle is a **tier**, and a tier
is permanent — its foraging bonus is banked and can never be walked back into.

- Monster strength is `base × DISTANCE^ring × TIER^tier`, so distance is the
  difficulty inside a circle and the tier is the difficulty between them.
- A merged tier keeps paying, so the food multiplier from ground is cumulative
  across tiers. **This is the number that has to be watched**: it is a permanent
  multiplier on the 79.4% share and it compounds every tier. `TIER` and the
  per-cell bonus together decide whether the whole game is eventually just the
  map. It wants measuring before anything else in the feature is tuned.
- **Regions have their own shapes.** Not every circle is the same arrangement;
  different terrain gives differently shaped boards. Deliberately left unspecced
  — shape is judged by eye, so it is Gemini's, and the mechanic does not depend
  on it.

### Held ground is nest, and that is what a defence battle is

**A monster entering ground you hold triggers a defence battle immediately.**
There is no separate "it reached the centre" event: held ground counts as the
nest, so any incursion is an assault on it. The existing raid resolution is what
runs.

This is the self-balancing part of the design. The further out the frontier, the
longer the perimeter to be attacked along, so expansion pays in food and costs in
exposure without either needing a hand-tuned penalty.

**An ungarrisoned cell therefore does not quietly revert.** It is defended, or it
is lost in a battle the player sees.

### A lost push strands the survivors

A clearing attempt that fails loses a share of the detachment, scaled by how
badly it was outmatched — the rule raids already use — and **the survivors hold
where they are and must be recalled**, taking travel time to come home. So a
misread costs soldiers and leaves the army out of position, which is the failure
this kind of map should have.

### The bestiary: about fifty, times five words

The game has 21 named attackers today, drawn from the band their strength falls
in. The map needs far more variety, because a monster is now a place as well as a
number.

**About fifty base creatures**, keeping the existing progression — real ant
predators while the colony is a plausible size (phorid fly, antlion, assassin
bug, army ant raiders, pangolin, aardvark, giant anteater), then mythical once a
nest holds millions (basilisk, wyvern, chimera, dragon).

**Five modifier words** in front, each changing the numbers rather than only the
name, so fifty bases read as hundreds of encounters:

| word | what it does |
|---|---|
| **Starveling** | weaker, and advances a ring faster — the one that reaches you first |
| **Great** | much stronger, slower, worth more |
| **Gravid** | killing it puts another on the board |
| **Ancient** | high strength and high reward, deep rings only |
| **Blighted** | strongest of all, outer tiers only |

The words are the tuning surface: the same aardvark is an early nuisance as a
Starveling and a wall as an Ancient, so a base creature stays useful across many
tiers instead of scrolling past.

### First sight, at 256 ants

**Mostly empty, filling as you watch.** A few monsters on the outer ring and room
to breathe. The board should read as somewhere to go rather than as a siege
already lost — a full circle of red on the first frame reads as a defeat screen.

### The two pressures

**Defending** is what the game already does. Winning kills the nearest attacker
and the rest press one ring closer, so defence alone never clears the board —
which is what pushes the player out.

**Clearing** is new. A detachment is sent to a cell, travels for a time
proportional to the ring, and fights on arrival with only the soldiers sent.
**Soldiers in the field cannot defend the nest.** That is the decision: push out
to grow, or hold back to survive. Sending is a click; nothing dispatches an army
on the player's behalf.

### What ground pays, and what a Guard is for

A cleared cell pays a foraging bonus weighted by its ring. Full control should
land near **×2–×3 food** — inside the ×4.85 ceiling, and not so large it eats the
upgrade tree.

**Garrisoning decides who answers the door.** Held ground is nest, so anything
walking into it starts a defence battle either way — the question is who fights
it. **A garrisoned cell defends itself**; an ungarrisoned one pulls the home army
out to the frontier, and the home army cannot be in two places.

**That is what Phragmotic Guards are for.** They are living doors, they already
never hunt, and this is the first job that is theirs alone: a Guard on a cell is
the difference between a battle that resolves where it happens and one that drags
the army across the map. A Guard spent holding is a Guard not fighting, so a long
frontier is only as safe as it is garrisoned.

That gives the four ranks distinct roles rather than bigger numbers: Guards hold,
Supermajors take the deep cells, Majors are the field army, plain soldiers defend
and hunt. **No heroes** — the tiers are the whole RPG element, by decision.

### Folding into what exists

- `inHiding()` becomes **ceding ground**: no soldiers means monsters advance
  freely and the ×0.5 stands, so the death spiral is still capped but now
  visible on a map instead of being a line of text.
- Hunting protein comes from held cells rather than from nowhere.
- Save **v9**, migrating an existing colony to an empty map and zero held cells,
  so nothing is lost and nothing is granted.

### Blast radius: all three, as a sequence

1. **Species-scoped first**, the way the garden proved the territory idea before
   it was general.
2. **Then a layer on top**, biting only past a colony size the current opening
   never reaches, so the measured 1.2 / 3.1 / 7.1 / 22.8 / 41.4 / 60.9 / 87.9
   is untouched.
3. **Then rebalance the curves** into one economy, re-taking every pacing number
   in the canon.

Each step ships on its own and the risky one is last.

### Order of the release

**Shipped in 0.2.6.0**, and out of this file: the regression harness, the
Amdahl audit, the three matriline trials, sub-batch egg destroying and Eciton's
species-scoped flight gate. What they measured is in the canon.

**Left for 0.3.0.0: the Hunt**, in the three stages above, and nothing else.
It is the whole release now.

**Not in: layer 3.** Layer 2 is 0.9 hours of a 40-hour intent, and a third layer
on top compounds that instead of fixing it.

### Trophies

Decided 2 September 2026. The Hunt alone is one system, which is thin for a
release; trophies are what make the fifty creatures matter. Without something
that records them, all 250 encounters are names that scroll past, and the
optimal play is to clear the nearest cheap cell for ever.

**Fifty trophies, five grades tall.** One per base creature -- not 250, because
the five modifier words are *grades* of the same trophy rather than separate
entries. So the wall is fifty slots deep and five grades tall, and a creature
already caught stays worth meeting in a bigger form.

**Three ways to earn one, mixed, because each alone has a flaw.**

1. **The first kill always gives the trophy**, at the lowest grade that creature
   can give. A fight is never wasted and nothing is gated behind luck.
2. **Every kill after that rolls for a higher grade**, capped by what that
   creature is capable of dropping. This is the upside, and it is the reason to
   go deep.
3. **Kill count raises it anyway**, as a floor. Bad luck slows a trophy down; it
   can never block one.

**A creature's band decides which grades it can drop.** The weakest drop only
the lowest grade. The deepest can drop the highest, at low chance. So the grade
ladder is climbed by hunting *further out*, not by farming the nearest cell --
which is exactly the behaviour the map needs to encourage.

**Grades are cumulative.** Holding grade 4 pays grades 1 through 4, so a trophy
never stops being worth what it already was.

**What they pay, and why combat is safe here.** A reward that does not touch what
binds is decoration -- the lesson from twelve species nodes and five instincts.
Trophies pay into **fighting strength and territory yield**, and that is safe
*only because of the Hunt*: territory multiplies foraging, so combat stops being
a side system and a combat reward is no longer inert. It is still not a global
food multiplier, so the hardest rule in the canon holds.

**Each band pays a different kind of bonus**, which is where the uniqueness lives:
the real animals and the mythical ones do not give the same sort of thing.
Completing a whole band pays a large bonus on top. Five bands, so five real
collection goals rather than one slowly rising number.

**A Trophies sub-tab under Combat**, making it Overview, Units, Hunt, Trophies,
Trade -- each about a screen, the way the Settings split went.

**All fifty authored in the first build.** A wall with visible gaps for content
that does not exist yet reads as unfinished rather than as something to
complete.

#### Open

- **Do the fifty unique bonuses risk being fifty inert rewards?** That is the
  exact mistake 0.2.6.0 fixed. The safeguard is that a band gives a *kind* and a
  trophy gives a value within it, so there are five effects to measure rather
  than fifty -- and every one of them has to be measured against a colony that
  is food-bound sixty minutes out of sixty.
- **Band completion and territory yield both multiply held ground.** They will
  compound; the pair needs measuring together, not separately.

---

### Open, for the map

- **What is the per-cell foraging bonus, and what is `TIER`?** Together they
  decide whether the map eventually becomes the whole game, because a merged
  tier pays for ever and tiers do not stop. Measure before tuning anything else.
- **Can the frontier be attacked in more than one place at once?** One battle at
  a time is readable; several is what a long perimeter should actually feel like.
- **Do soldiers in the field keep hunting protein?** They are out there, which
  argues yes, and it makes a stranded detachment less pure loss.
- **Region shapes.** Left to Gemini, and nothing mechanical depends on them.

---

## Later

- **Widen the mid-game.** Ten of twelve upgrade lines still move the food rate by
  nothing. Atta proves a non-food bottleneck works; the generic line still has
  only one.
- **Layer 3.** Nothing designed. It should not be another multiplier tree.
