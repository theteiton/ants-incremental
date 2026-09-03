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

## Measured 2 September 2026 — sizing the next release

Four directions were put on the table and all four were taken. Everything below
was measured against 0.3.1.1 before any of it was designed, because three of the
four turned out to rest on numbers nobody had taken.

### The Hunt does not pay, and the reason is a sign

**Measured across six hours on three seeds: 0 of 30 cells held, territory
x1.000, tier 0, and the Hunt's whole contribution to the food rate is
x1.0000.** The feature built to make combat leverage on the 79.4% forager share
currently contributes nothing to a single food figure in the game.

The cause is one term. `resolveRaid` computes `defence = combatPower x (1 -
marchShare)` and is called for **both** halves of the Hunt — the breach at home
and the march in the field. For a breach that is exactly right: soldiers away
cannot defend. For a march it is inverted, so **the detachment fights with
whatever stayed behind.** Swept on one colony fielding 34,988 against a cell of
13,678:

| sent | fights with | result |
|---|---|---|
| 5% | 33,239 | won, ground taken |
| 25% | 26,241 | won, ground taken |
| 50% | 17,494 | lost |
| 75% | 8,747 | lost |
| 100% | **0** | lost |

So committing the army is what loses the fight, and committing all of it fights
at zero. A policy marching at 50% made 521 attempts over six hours, took no
ground at all, and drove the colony from 9,257 ants down to 469. **Playing the
map was strictly worse than ignoring it.**

The fix is that one share read from opposite ends — `attacking ? share : 1 -
share` — with the march call site saying which it is. All 21 suites pass with
it, pacing included, and pacing is untouched *because* the map was contributing
x1.0000 before.

### Even corrected, the map cannot be held — and that is the case for garrisons

With the sign corrected and a commander that takes the cheapest winnable cell
and commits only what the fight needs, six hours on three seeds:

| | marches | held | tier | territory | breaches | pop | food/s |
|---|---|---|---|---|---|---|---|
| no march | 0 | 0/30 | 0 | x1.000 | 0 | 9,257 | 9.49e5 |
| commander | 13 | 2/30 | 0 | x1.018 | 8 (9 cells) | 6,162 | 3.19e5 |
| commander | 18 | 2/30 | 0 | x1.034 | 13 (15 cells) | 5,465 | 5.67e5 |
| commander | 11 | 1/30 | 0 | x1.014 | 4 (6 cells) | 5,505 | 2.80e5 |

Against a designed full board of **x1.720**. The held-over-time trace says it
plainly: 0 to 6 to 7 cells in the first hour, then **collapse to 2 and flat
there for five hours**. Traced tick by tick, a cell taken at t+11s was walked
into at t+15s and lost, because the army was still on the road home and home
defence was `combat x (1 - share)`.

That is the designed defence rule working correctly, and it is why **garrisons
are not an enhancement to the Hunt but the precondition for it to function.**
Without a way to leave strength standing on a cell, ground reverts faster than
it can be taken, every march is a window in which the frontier is undefended,
and the board saturates — monsters sit at a mean of 9.7 of the `MAX_ON_BOARD`
10 for the whole run.

Garrisons also give the Phragmotic Guard the only job that is hers alone, which
is what the roadmap said they were for. Still open: what a garrison costs to
place, whether it can be lost, and whether a garrisoned cell fights at full
strength or at a discount for being dug in rather than manoeuvring.

### The food budget is unchanged by the Hunt, and so is the inert mid-game

Re-taken over four hours, against the canon's 79.4 / 15.8 / 2.4 / 2.3 / 0.1:

**foragers 79.7%, soldiers 15.1%, excavators 2.8%, nurses 2.3%, upgrades 0.0%.**

Identical inside noise — which is expected, because territory pays x1.000. The
Amdahl ceilings follow: x4.93 on the forager share and **x1.03 on everything
else put together**. And one more level of each line, at a 7,258-ant colony:

- moves food: `forager` x1.1538, `colony` x1.1500
- moves something else: `excavator` cap x1.2061, `nurse` brood x1.1107,
  `soldier_power` combat x1.1781, `combat_forager` combat x1.0409
- moves nothing measurable: `nanitic_food`, `nanitic_vigour`, `protein_yield`,
  `brood_slots` (brood x1.0041), `combat_excavator` (x1.0091), `combat_nurse`
  (x1.0048)

**Two of twelve lines move the food rate.** The finding stands exactly as
written, and the Hunt has not yet touched it. It will once ground is holdable:
the terrain kinds already pay into protein, cap, brood, strength and the egg
price, so the map is the first system in the game that makes a non-food
constraint worth anything to the generic line. **Measure the map again once
garrisons land, before designing a second scarcity** — territory may do part of
the widening on its own, and a humidity resource layered on top of a working map
is two large changes compounding.

### A season cannot be built on a bank that does not exist

Measured at two hours: 4,041 ants, 3.70e5 food/s, and **3.27e5 banked — 0.9
seconds of income.** With laying on the colony never stores anything, which the
canon already says from the other direction: food can never rise above the price
of one egg.

So a winter that shuts foraging off does not create a rhythm, it wipes the
colony. **A seasons design has to ship with the storage to survive one**, and
the game already has two half-built answers: Granary Instinct's reserve line and
Myrmecocystus's repletes. The interesting version is that seasons make the
granary matter for everybody rather than for one species — the same move Atta
made for nurses. Still open: whether a season runs on wall-clock or colony time,
and whether it is mean-neutral (a rhythm) or net-negative (a difficulty).

### Layer 2 is 0.9 hours, and the flight is why

Reproduced exactly. On a fully mastered colony holding every trial level, every
adaptation and achievement level 30, **one nuptial flight takes 0.5 minutes.**
Finishing a species is 20 points at 1 point per flight, so:

- the flights-only road: **9.3 minutes per species, 0.9 hours for all six**
- with both branch nodes bought: 5.6 minutes of flying per species

No repricing of `POINTS_PER_FLIGHT` fixes this. Twenty points at forty flights
is 19 minutes of the same minute repeated — that is grind, not length. **The
only unit in this game that costs real time is a trial level**, at a measured
median of about half an hour, which is why species-specific trials are the
answer to layer 2's length and a points retune is not.

Two shapes are open. **Species trials** — one per species, attemptable only as
her, keyed to her active: Atta's garden collapses, Eciton's column is cut off
from its rim, Myrmecocystus's repletes are robbed. Six trials at five levels is
roughly the 40 hours originally asked for, and it keeps the three-roads rule
because the flight road still exists for anyone who dislikes trials. And
**`CHALLENGE_MAX_LEVEL` should stop being a hand-set 5**: every hand-set cap in
this game's history was reached and then sat at, the achievement ladders already
learned this and became endless with a softcap, and the same fix applies here.

### How much time any of this actually adds

Measured after the section above, and it changes the order.

**A trial level costs 2.2 minutes on a fully mastered colony.** Every trial
attempted at level 5 by a colony holding every other mastery, every adaptation,
achievement level 30 and all eight instincts:

| trial | level 5 |
|---|---|
| Drought | 1.1m |
| The Slave-Maker | 0.3m |
| The Repletes | 7.5m |
| Sealed Nest | 0.1m |
| Barren Brood | 6.2m |
| Sterile | 0.4m |
| Nanitic Line | 0.1m |
| **The Blight** | **failed** |
| **Endless Siege** | **failed** |

Seven of nine clear, five of them inside a minute and a half. So **six species
trials at five levels each would add about 1.1 hours** under today's target
rules, not the forty that were asked for. The content would exist and then
evaporate on contact with the colony that plays it.

**The two that resisted are the two with a `fail` condition.** The Blight and
the Endless Siege are lost rather than merely unmet — an infected share passing
a ceiling, a single defeat — and neither is outgrown by any amount of food
mastery. Every trial scored on a target alone was outgrown. That is the lever:
**a target gets outgrown, a fail condition does not.**

So the length of layer 2 is decided by the target rule and not by how much
content is built. Open decision 2 in this file — *ask for a fraction of what
this colony would produce undebuffed* — is therefore not a polish item, it is
the precondition for species trials being worth building at all. Against the
per-level times measured on a colony holding nothing (Drought 114.3m, Sterile
270.6m, Sealed Nest 148.0m, Barren Brood 62.2m at level 5), a correctly scaled
target restores roughly a **half-hour median per level**, which turns the same
thirty levels from 1.1 hours into something near fifteen.

**And a working map makes the game shorter, not longer.** Five seeds, the board
granted whole so the food effect is isolated from the effort of taking it:

| | 20 | 50 | 100 | 250 | 500 | 1000 | 2000 |
|---|---|---|---|---|---|---|---|
| today, map pays x1 | 1.2m | 2.6m | 5.7m | 16.2m | 28.9m | 47.0m | 67.5m |
| full board, 0 tiers | 1.2m | 2.6m | 5.7m | 16.2m | 24.2m | 36.2m | 50.0m |
| full board, 9 tiers | 1.2m | 2.6m | 5.7m | 16.2m | 20.3m | 24.0m | 30.3m |
| full board, 25 tiers | 1.2m | 2.6m | 5.7m | 16.2m | 19.8m | 23.0m | 28.1m |

Territory runs x1.788 at a full board and x3.788 at twenty-five circles. The
opening is untouched because the map opens at 256 ants; from there a held board
takes **1,000 ants from 47.0m to 36.2m and 2,000 from 67.5m to 50.0m**, and a
deep tier count roughly halves both again.

So finishing the Hunt does not lengthen the 7.6-hour playthrough — it compresses
the middle of it and adds an unbounded axis beside it. That is the right shape,
but it means **the map speeds up every lap of layer 2**, and a flight already
takes half a minute. Garrisons and species trials pull in opposite directions on
length, and the trial targets have to be fixed first or the map will make layer
2 shorter than the 0.9 hours it already is.

### Order

1. **The march sign**, which is a bug and blocks measuring anything else.
2. **Garrisons**, without which the map cannot be held.
3. **Hunt achievement tracks and Library entries** — 23 tracks and 38 entries,
   none of which mention held ground, tiers, trophies, grades or bands.
4. **Re-measure the map**, then decide whether the mid-game still needs a second
   scarcity.
5. **The trial target rule** — a fraction of what this colony would produce
   undebuffed — which has to land *before* any new trial, or the new trial is
   worth 2.2 minutes like every existing one.
6. **Species trials**, as the length answer for layer 2, and only then.

Seasons sit behind storage, and are the one item here that is a new system
rather than the completion of an existing one.

---

## Layer 3 — three shapes, none of them a tree

Asked for on 3 September 2026: a third prestige layer is wanted, but it must not
work the way the first two do. This file already said "it should not be another
multiplier tree"; the requirement is stronger than that.

**Layers 1 and 2 are the same machine twice.** Reset the colony, earn a scalar
currency proportional to how far you got, spend it on a tree of permanent
multipliers, own the tree outright, move on. The Nuptial Flight and the Matriline
differ in theme and in what they reset, not in shape. So the test for a candidate
is which of the four defining properties it breaks — **the reset, the scalar
currency, the tree, or the multiplier.** A candidate that keeps all four is a
reskin however good its fiction is.

Everything below is measured against 0.3.1.1 where a number is quoted.

### The engineering fact that opens the field

**One tick costs 0.077ms of a 16.7ms frame — 0.5% — at a 9,082-ant colony.**
Measured at 1, 2, 4 and 6 hours: 0.093 / 0.071 / 0.080 / 0.077ms, essentially
flat, because the brood tally is cached and the effect walks are memoised on
`game.upgrades` identity. **Six colonies ticking at once would cost 0.46ms a
frame, 2.8% of the budget.**

That matters because it removes the only serious objection to running more than
one colony at a time. The model is nowhere near its budget and has not been since
0.2.5.1. What stops a multi-colony layer is UI and save shape, not simulation
cost.

### Candidate A — the Supercolony (breaks the reset)

**A flight sends one daughter out. This sends several, and they all keep
running.** Layer 3 stops resetting and starts *adding*: the line buds entirely new
nests that tick in parallel, each with its own board, its own species, its own
bottleneck. There is no scalar currency and no tree at all — what you accumulate
is **nests**, and what you spend is attention.

- **Trails** connect nests. Food, protein and soldiers move along them at a rate,
  so a nest that is strong at one thing feeds a nest that is short of it.
- **Specialisation is the point.** Measured, two of twelve upgrade lines move the
  food rate and the rest are worth x1.03 by Amdahl. In a single colony that is a
  dead end. Across six nests it is a *reason*: a nest built on the excavator and
  nurse lines is a brood factory that ships ants down a trail to a forager nest,
  and the inert lines become the correct build for one nest rather than a wasted
  purchase in the only one.
- **Prestige-independence.** Each nest can be at a different layer — one flying,
  one deep in a matriline, one sitting on a finished species — which is the first
  thing in the game that makes the earlier layers keep mattering after they are
  finished.

**Uniqueness**: no reset, no currency, no tree. It is a *breadth* layer where
both the others were depth. **Risk**: the largest UI job the game has ever had,
and a save shape that holds N colonies rather than one. **Why it is the strongest
candidate**: it is the only one of the three that attacks the game's oldest
measured problem — that the colony is one resource wide — rather than adding
something beside it.

### Candidate B — Speciation (breaks the tree and the completeness)

**Layer 2 lets you pick a species. This lets you make one.** A genome with a
fixed budget of points, spent into traits, where **every trait is paid for in
another trait**: bigger soldiers cost hatch speed, a longer-lived founder costs
her output, a wider garden costs the cap. The line becomes the species you
designed, permanently, and that species is what every future colony is.

The defining property is that **the set can never be completed.** Layers 1 and 2
both end with the tree bought out — the Nuptial tab literally prints a line
saying there is nothing left to buy. A budget with costs has no such state, so
the layer is about choices that stay made rather than about eventually owning
everything.

- It composes with what exists: the six species are worked examples of what a
  genome produces, and `PASSIVE_KINDS` is already the vocabulary.
- It answers the difficulty finding directly. A trial level costs 2.2 minutes on
  a mastered colony because every mastery is additive and permanent. A genome
  where strength is bought with weakness does not accumulate that way.

**Uniqueness**: a constrained allocation, not a tree; nothing is a pure gain.
**Risk**: balancing tradeoffs is far harder than balancing multipliers, and a
genome that is strictly worse than the six hand-authored species would make the
layer feel like a downgrade. **Cheapest of the three to build.**

### Candidate C — the Season and the Year (breaks the multiplier)

**Progression measured in years survived rather than in a number owned.** The
world runs a cycle; the colony's job is to still be there next spring. What
carries forward is not a multiplier but **state**: stores laid down, chambers dug
below the frost line, a queen who has overwintered before.

This is the layer the seasons idea grows into, and it has one hard prerequisite
already measured: **the colony banks 0.9 seconds of income.** With laying on, food
never accumulates, so a winter that shuts foraging off is not a rhythm, it is a
wipe. Storage has to exist before a season does — Granary Instinct's reserve line
and Myrmecocystus's repletes are the two half-built answers.

**Uniqueness**: the reward is survival and world state, not a factor in a
formula. It is also the only candidate that makes the *existing* game harder
rather than larger, which is what the 2.2-minute finding says the game is short
of. **Risk**: a layer that only takes things away reads as punishment; each year
has to visibly open something.

### What they have in common, and what to decide

All three break the machine in a different place, and **they are not exclusive**.
Speciation is what a nest in a Supercolony would be built from; a Year is the
clock any number of nests could run on. The decision is which one is the *spine*
of layer 3 and which are folded in later.

The one thing that must not happen is the fourth version of the same tree. It is
worth recording that both existing layers were correct decisions at the time —
layer 1 gave the game automation to sell and layer 2 gave it six rewrites of the
core loop — and that the objection is to a third of the same, not to either of
them.

### Deferred content, unrelated to the layer

Independent of which spine is chosen, and none of it needing a new layer:

- **The queen has no live state after minute ten.** She sheds, and then does
  nothing for seven hours but carry a name. Fecundity that ages, supersedure by a
  daughter, a real risk of being lost in a raid — the left column would have
  something that changes.
- **Nothing is ever lost by neglect except ground.** Offline is pure gain under a
  cap. The Blight proves inside a trial that an absence can cost something.
- **Brood is a queue, not a nursery.** Egg to ant in one step, where real
  development is egg, larva, pupa, adult and only larvae eat — which would make
  food and protein consumption continuous instead of a single payment at laying,
  and give nurses a job per stage. The most ant-shaped thing missing, and the
  riskiest: it touches the brood array, the tally cache and the save.
- **Caste decided by feeding rather than by laying.** An ant egg is totipotent.
  Choosing at hatch out of what is in the larder is a genuine rewrite of the core
  loop, and probably too central to change now.
- **Neighbouring colonies.** The Hunt board already has cells, terrain and an
  occupancy model; every cell currently contests with a wandering monster rather
  than with anything that wants the same ground.
- **The achievement level still pays three fixed bonuses** — food, hatch, jelly —
  which is the deferred note from the 20 August playtest. Instincts answered the
  spending half of it; the level itself is unchanged.

---

## Garrisons, built and measured — 3 September 2026

Built this session, in the model only; the board interface is still a click
target and a dot. Six hours, three seeds, a commander that takes the cheapest
winnable cell and posts a Guard on what it took:

| | held | territory | breaches | pop | food/s |
|---|---|---|---|---|---|
| no guards at all | 1-2 / 30 | x1.014-1.034 | 4-13 | 5,465-6,162 | 2.8e5-5.7e5 |
| guards trained, not posted | 2-3 / 30 | x1.014-1.050 | 64-77 | 1,527-2,672 | 8.1e4-2.8e5 |
| **guards posted** | **7-10 / 30** | x1.024-1.144 | 126-133 | **6,213-10,780** | **7.3e5-1.25e6** |

**Posting roughly quintuples the ground a colony can hold and leaves it larger
than never having played the map at all** — 10,780 ants against a 5,465
baseline on the same seed, because the nest is no longer dragged out to the
frontier every time something walks into held ground.

Three things worth recording.

**Training Guards and not posting them is the worst of the three**, at 1,527 to
2,672 ants. Promoting soldiers into Guards takes them out of the hunt and out of
the ordinary line, and if they are not holding anything in return the colony has
simply weakened itself. That is the trade working as designed, and it means a
Guard is now a decision rather than a strictly better soldier — which is the
caste rule the game has always held.

**The breach count went up, not down**, from 8-13 to 126-133. That is not a
regression: there is five times as much held ground to be walked into, and each
breach is now one Guard fighting on one cell instead of the whole army being
pulled across the map. Breaches became cheap events rather than catastrophes.

**Posted equals held, exactly, in all three runs** — 7 and 7, 10 and 10. The
Guard supply is the binding constraint on how much ground a colony can keep, so
**the garrison count is the dial** for territory, and the map is still only a
third held because the policy trained only a tenth of its soldiery. That is the
right shape: ground is limited by an army you have to build rather than by a
constant.

`combatMultiplier()` is now the single source for everything that multiplies the
whole army, because the nest, a garrison and a marching detachment are the same
soldiers under the same bonuses and three copies of that product would drift the
first time a source was added. Every path that kills a Guard calls
`clampGarrisons()`, since a posting must never outlive the ant holding it. A
merged circle drops its postings and the Guards walk back in, because the ground
they were holding is interior now.

All 22 suites pass, pacing and fuzz included; the recorded pacing row is
untouched, because Guards do not exist until the Endless Siege has been cleared
and an ordinary run never trains one.

---

## "The game seems too plain" — 3 September 2026

Said after two sessions of structural work, and it is the most useful note in
this file. Everything proposed above is *architecture* — Amdahl shares, tick
budgets, target-scaling rules, prestige shapes. None of it is what makes a
colony feel like a colony. A game can be structurally excellent and still read
as a spreadsheet, and this one currently does: nine thousand ants are a number
called `population`, a monster is a name and a power figure, and an hour of play
produces no story.

What follows is aimed at character rather than at systems. Most of it is cheap,
because the data is already there and is simply never shown.

### Nearly free — the colony already knows these things and does not say them

**Individual ants.** Big Foragers are already individuals: each one has a
`bornAt`, ages, and grows towards a cap. They are stored in an array and
displayed as a count. Give them names and a lifetime haul and the roster stops
being a number — "Grey-Mandible, 41 minutes old, has carried 18,400" is a
different game from "8 big foragers". The same applies to the four nanitics, who
are the most characterful ants in the game and are shown as a countdown.

**A colony chronicle.** An auto-written log in the colony's own voice, of things
that already happen and are already detected: the first nanitic dying, a Big
Forager appearing, a raid that was nearly lost, the first Guard trained, a
circle merged. The events exist — `lastRaid`, the trophy awards, the milestone
crossings — and each is currently one line of UI that is overwritten by the next
one. Kept, they are a history, and a history is what an absence should return
you to.

**Say what a creature is.** Forty-nine creatures have notes and bands, and the
raid report names one and moves on. A first encounter that *stops* and tells you
what walked in — with its sprite, its band, what it is known for — is a moment
rather than a log line. The bestiary is the most authored content in the game
and the least seen.

**Cause of death.** Ants die in `DEATH_ORDER` and are reported as a tally. Which
ants, doing what, is already known at the point of death.

### Cheap, and adds a decision as well as texture

**Day and night.** Foragers work by day; some real species are strictly
nocturnal, and Camponotus is one of the six already in the game. A cycle costs
one term in the food formula and gives the colony a rhythm it has never had —
and it is the honest small version of the Year layer, testable before committing
to seasons.

**Weather.** Rain floods the shallow galleries, heat drives foraging to dawn and
dusk, wind grounds the alates so a flight must wait for a still day. Each is one
multiplier and one line of text, and together they make two identical hours
different.

**Encounters with a choice.** A dying beetle at the entrance: drag it in for
protein and risk what is living on it, or leave it. A neighbouring queen's
alates landing on your ground. A fungus in the brood chamber. Two buttons and a
consequence — this is the single most common answer to "plain" in this genre and
the game has none of it. It also fits the rule that nothing irreversible is
automated: the player chooses.

**The midden.** Real colonies manage refuse and die when they do not. Waste that
accumulates with population and needs excavators to carry out gives the
excavator line a second job and the nest a housekeeping pressure — and it is
already in the fiction, since `midden` is one of the eight terrain kinds.

### Castes the game is missing, all real

Five worker castes and four soldier ranks, and the real family is wider:

- **Alates.** The nuptial flight is a threshold you cross at 1,000 ants. Winged
  reproductives are what a real colony *builds towards* — expensive, useless for
  work, and the only way to fly. Raising them would turn prestige from a gate
  into a project, and give the flight a cost that is currently zero.
- **Males.** They exist for one flight and die. Cheap, useless, and the honest
  reason a colony spends a season's surplus on nothing.
- **Minims.** Atta's smallest workers, who ride on cut leaves and fend off phorid
  flies. Already named in her branch as Minim Chewers.
- **Repletes.** Living granaries — built as Myrmecocystus's active, but not as a
  caste anyone else can raise.
- **Media workers.** The continuum between minor and major, which is what makes a
  real polymorphic colony look the way it does.

### Things to find

**The game enumerates everything it has.** Every upgrade, every trophy, every
achievement tier is listed with its requirement before it is earned, which is
excellent for legibility and leaves nothing to discover. A small number of
things that are *not* listed — a rare creature, an unmarked achievement, a
chamber found while digging — is what gives a long game its stories.

**Myrmecophiles.** Beetles, mites and silverfish that live inside real nests,
some tolerated and some parasitic. A guest that appears in your nest, does
something odd, and has to be tolerated or evicted is content that costs one
system and pays across the whole game.

### The one that is not cheap

**Brood as a nursery rather than a queue.** Egg, larva, pupa, adult — and only
larvae eat. It would make food and protein consumption continuous instead of a
single payment at laying, give nurses a job per stage, and make the brood
chamber a place rather than a list. It is the most ant-shaped thing missing from
the game and it touches the brood array, the tally cache and the save shape, so
it is the one item here that is a release of its own.

### What this list is not

None of it is a multiplier, and none of it needs a prestige layer. Roughly two
thirds of it is *displaying things the model already computes* — which is why
"plain" is fixable without touching balance, and why it should be measured
against nothing at all.

---

## The trial target rule — built and measured, 3 September 2026

Step 3 of the plan, and the one that gates species trials. Measured before:
**a trial level costs 2.2 minutes on a fully mastered colony**, so thirty new
levels of species trials would have added about an hour to a 7.6-hour game.

**The old rule scaled only the food-measured targets, and only by
`masteryFood`.** That fixed the case it was written for in 0.1.8.0 and missed
everything else the colony had grown by. Two things were wrong with it.

**Only three of nine trials are food-measured.** The other six ask for a
headcount or a raid count, and a headcount was assumed to be bounded by the cap
and therefore safe. It is not: the cap mastery is x2 a level, so five levels is
x32 room and 600 ants is a rounding error. Drought, the Slave-Maker, Barren
Brood and Sterile were all unscaled, and all four cleared in under six minutes.

**And a single ratio is the wrong shape.** The line's undebuffed peak food rate
is the right index — it is self-scaling against every source at once rather than
against one mastery — but a trial colony is refounded at nothing and grows for
one sitting, so what it can reach is **not** proportional to its parent's peak.
A line a million times richer does not build a million-ant nest in half an hour.
Applied raw, the scale came out at **x1,100,607** and made every food trial
unclearable while leaving every headcount trial untouched.

So the ask goes as a **fractional power** of how far the line has come, and the
power is **per kind**, because the kinds are dimensionally different. Swept on a
mastered colony at level 5:

| power | Drought | Sealed Nest | Barren Brood | Nanitic Line | Repletes |
|---|---|---|---|---|---|
| 0.25 | 18.9m | 0.1m | 20.2m | 0.1m | 7.4m |
| 0.35 | 61.5m | 0.1m | 43.7m | 0.1m | 7.4m |
| 0.42 | 110.0m | 0.1m | 83.0m | 0.2m | 7.4m |
| 0.50 | >120m | 0.1m | >120m | >120m | 25.4m |

**Set: population 0.25, banked 0.5.** That puts the two population trials at
about twenty minutes against a 2.2-minute baseline — a **9x increase in what a
trial level costs** — and the Repletes at 25.4m, both inside the half-hour
median the ladder is sized in.

**`foodRate` and `runFood` are deliberately left at 0.25**, which is what reading
`masteryFood` alone already amounted to, so their behaviour is unchanged. They do
not respond at all below 0.5 and then cliff straight past reachable, the Nanitic
Line especially, whose ceiling is hard by construction — the canon already
records it as 279K / 203K / 130K / 77K / 43K extractable against a 38,000 ask.
**Those two need their own calibration and are not guessed at here.**

`REFERENCE_FOOD_RATE` is 5e6, measured: an unmastered line holding the full
lineage peaks at 5.18 / 4.91 / 4.90e6 food a second by the time the trials open
to it. So a first-time player faces exactly the numbers this file already
records, and the ask rises only for a line that has grown past them.

`stats.peakFoodRate` is recorded **outside a trial only**, or a trial would raise
the bar it is being measured against.

All 22 suites pass, pacing and fuzz included.

---

## Layer 3 — the Supercolony, specced

Chosen 3 September 2026, and it is a better layer than any of the three offered,
because it makes the Hunt board **load-bearing** instead of decorative. The
brief: nests on the combat map, abilities that mix, a daughter that inherits
chosen bonuses from the nest that raised her, and a third clock counting all of
it instead of a matriline.

Real, as usual: *Linepithema humile* holds a supercolony along roughly 6,000km
of Mediterranean coast, thousands of nests with no aggression between them. They
**bud** rather than fly — a daughter walks out with workers and brood instead of
mating in the air — which is exactly the shape this layer needs.

### The engineering fact that makes it affordable

**The 0.077ms tick figure below is wrong — see the correction in *Built 3
September 2026*. The controlled figure is 0.16–0.31ms and the conclusion is
unchanged.**

**286 of 342 exported functions across the ten model modules already take a
colony as their first argument.** ants.js 60/80, raids.js 42/43, challenges.js
47/54, matriline.js 48/51, hunt.js 25/31, trophies.js 21/24. Only `game.js`
binds the global, at 73 of 74.

So the model is already multi-colony and nobody planned it that way — it fell
out of the rule that UI never mutates state and everything reads `game`. The
layer is a `game.js` refactor (`tick(dt)` becomes `tickColony(nest, dt)`) plus
interface work, **not a rewrite**. With one tick measured at 0.077ms, six nests
cost 2.8% of a frame.

### What a nest is, and where it lives

**A daughter nest is founded on a cell the colony holds.** That is the whole
unification: ground stops being a food multiplier and becomes *somewhere to
live*. Two things follow immediately and neither needs a new constant.

**The garrison supply caps the supercolony.** Measured this session: posted
Guards equalled held cells exactly, 7 and 7, 10 and 10 — the Guard supply is
already the binding constraint on territory. A nest needs ground, ground needs a
Guard, so the size of the supercolony is set by an army you have to build. No
`MAX_NESTS` constant, and the cap is something the player earns.

**The ground decides what the daughter is.** The eight terrain kinds already
exist and already pay into different things, so a nest founded on an aphid
pasture is a food nest, on a stony ridge a war nest, on a warm seep a brood
nest. Her caste-share defaults should follow the terrain the way
`speciesRatios()` already follows the species — the Atta measurement is the
precedent, where the wrong default cost her 89% of her output.

### Inheritance: three traits, chosen, and everything else lost

When a daughter is founded, the player picks **exactly three** of her raiser's
traits to carry over. The rest do not transfer.

**The fixed width is the whole design.** If a daughter inherits everything, then
generation N is at least as strong as N−1 by construction and the line runs
away — which is what happened to Polyergus at `CAPTURE_DIGGER_CAP` 4, and to the
veterancy ladder before it was capped at Major. A fixed three means a line
**drifts** rather than accumulates: taking something means leaving something,
the set can never be completed, and two supercolonies built by two players
diverge. That is what makes this not a tree, and it is the single property to
protect if anything else here changes.

### Traits are earned by play, never bought

A nest gains traits from what it *did*, which is the opposite of every currency
in the game so far:

- the terrain she was founded on
- the species she committed to, and the trials she cleared as her
- what she achieved — fifty raids won, a circle merged, a species finished
- **how she was played** — a nest that never lost a raid, never exiled an ant,
  never let the brood run dry

That last group is the interesting one, because it is the first thing in the
game that rewards a *style* rather than a total, and it costs nothing to detect:
the stats are all already kept.

### Mixing: two traits of a family fuse into a third

Pass two related traits to the same daughter and they **merge into something
neither parent had**. Forager and Garden make a Harvester; Martial and Deep
Ground make a Sapper. The fused trait is not the sum of its parents, it is a
different kind of thing.

This is the "skill tree" in the brief, and it is combinatorial rather than
additive — which also hands the game the one thing it was measured to be short
of. Every upgrade, trophy and achievement tier in this game is listed with its
requirement before it is earned; there is nothing to *find*. A fusion table that
is discovered by trying it is content that costs one system and pays for the
rest of the game.

### The clock, and why it is not a currency

The header carries colony age and matriline age. The third is the
**supercolony**, and what it counts is **nest-hours: the summed running time of
every nest in the network.** Six nests for an hour is six nest-hours, so breadth
is the thing that accumulates, which is the correct incentive for a breadth
layer.

**Nest-hours buy nothing.** They *mature* traits: a trait held by a nest long
enough deepens on its own. So time is the mechanic rather than the currency,
there is no third tree to buy out, and the player's decisions are the only
decisions — where to found, what to pass on, what to fuse. This is the property
that most clearly separates layer 3 from layers 1 and 2.

### There is no reset. There is retirement.

Nothing is wiped. A nest can be **retired**: folded into the network, her ground
kept, her traits made available to seed a daughter. Retirement is voluntary,
it is how a line consolidates, and it is the rhythm that a reset used to
provide.

A retired nest keeps her ground held and **sends her garrison home**, or
retiring would be pure loss.

### What happens to layers 1 and 2

Each nest flies and matrilines **independently**. That is the best thing about
this layer: it is the first mechanic in the game that makes the finished layers
keep mattering, because a network can hold one nest mid-flight, one three
species deep, and one just founded. The Nuptial tab and the Matriline tab become
per-nest rather than obsolete.

---

## Changes I would make to the brief, and the risks

**1. Inheritance must be lossy and fixed-width.** Stated above; it is the load
bearing rule. Anything that lets a daughter carry four traits "just this once"
re-opens the runaway.

**2. Traits must be scoped, and a fusion is where a global multiplier will try
to sneak in.** *No new mastery may multiply all food* is the hardest rule in
these files and it has been broken once already, by Deep Cisterns, which
silently made three of six trials unplayable. A fusion table is exactly the
place where two innocent scoped traits combine into an unscoped one. **Every
fusion output needs the same audit a mastery gets.**

**3. This will make the game shorter, and that has to be measured first.** Six
nests producing is six times the food into one network. The Hunt already
shortened 1,000 ants from 47.0m to 36.2m at a full board. A supercolony on top
of that could collapse the mid-game entirely. **Measure the network yield before
tuning anything else** — the same instruction the Hunt was given and the same one
that should have been followed before territory shipped.

**4. Six nests must not be six times the tedium.** If every nest is a generic
colony, the layer is the same game six times in parallel, which is the failure
the trials note already records: *six trials of manual laying is not a
challenge, it is the same challenge six times with the fun removed.* Terrain
seeding is the answer, and it has to be strong enough that nests genuinely play
differently.

**5. One nest is focused, the rest run — through the real `tick()`.** Not a
simplified background model. The away-report finding applies directly: *anything
that animates progress must animate a settled result*, and a cheap background
approximation would diverge from the real path the moment a player switched to
it. At 0.077ms each there is no reason to approximate.

**6. The save shape is the real cost, not the simulation.** One colony becomes N,
and every migration, export, import and the one-tab lock has to follow. Save v10
with a migration that wraps an existing colony as nest one of a network of one —
which is also the honest way to ship the layer in stages, since a network of one
is exactly today's game.

**7. Do not let a nest be founded before the map works.** The whole layer stands
on held ground, and ground was only holdable at all as of this session's
garrison work. **Nothing about layer 3 should ship until the map has been
measured with garrisons in a real interface**, or the layer will be built on a
mechanic nobody has played.

**8. The name.** *Supercolony* is correct and real. The clock should be its own
word rather than a second use of it — the game already learned this when
*matriline* was doing duty as both a clock and a prestige layer, and the fix was
to call the clock *matriline age*. So: the layer is the Supercolony, the clock
is **network age**, and what it counts is nest-hours.

### Open

- **How many traits does a nest hold?** Three inherited plus what she earns, and
  a ceiling on the total is probably needed or a long-lived nest becomes a tree
  by another route.
- **Can two nests fuse traits with each other**, or only parent to daughter?
  Parent to daughter is simpler and matches budding; nest to nest is what a real
  supercolony's shared workers would imply.
- **Does a nest that is not focused fight its own raids?** It has to, or an
  unwatched nest is free food. Whether the player sees it happen is the
  interface question.
- **What does an absence do to a network?** The offline cap is per colony today.
  Eight hours across six nests is either eight or forty-eight, and those are very
  different games.

---

## Built 3 September 2026 — steps 1, 3 and 4

### Step 1 — the Hunt is finished

**The march sign**, `attacking ? share : 1 - share`, so a detachment fights with
what was sent. **Garrisons**: `cell.guard` is now settable, a garrisoned cell
fights its own battle with its own Guards and the nest never stirs, an overrun
garrison loses only those Guards, and every path that kills one calls
`clampGarrisons()` so a posting never outlives the ant holding it. A merged
circle drops its postings and the Guards walk back in.

`combatMultiplier()` is the single source for everything multiplying the whole
army — the nest, a garrison and a marching detachment are the same soldiers
under the same bonuses, and three copies of that product would drift.

**Three achievement tracks**: Ground held, Circles merged, Trophies taken —
twenty-six now. All three read lifetime figures (`stats.peakHeld`,
`stats.circlesEver`, `trophyCount`), because a flight refounds at zero ants and
a track must never lose a tier to a reset.

**Seven library entries in a new group**: held ground, terrain, the march,
garrison, circles and tiers, trophies, bands and grades. Forty-five entries in
eight groups, no duplicate ids.

**A detachment hunts at half rate** while it is away — `MARCH_HUNT_SHARE` —
because sending the army cost nothing in protein before, which made the march
decision cheaper than it is.

### Step 4 — six species trials

One per species, enterable only while playing her, each taking away **the thing
that species is** and giving the same thing back:

| species | trial | takes | mastery |
|---|---|---|---|
| Atta | The Blighted Garden | garden turnover | Fungal Husbandry ×1.6 |
| Solenopsis | The Single Queen | the polygyne cap bonus | Pleometrosis ×1.5 |
| Camponotus | Aposymbiotic | Blochmannia — protein per egg | Bacteriocytes ×0.7 |
| Eciton | The Halted Column | the nomadic cap | Statary Phase ×1.5 |
| Myrmecocystus | The Broken Jars | what each ant can hold | Distended Crop ×1.6 |
| Polyergus | The Failed Raid | what a won raid captures | Pheromone Mimicry ×1.5 |

The debuff is `speciesTrialScale(game, id)`, which returns 1 unless that
species' own trial is running — so every consuming site reads it
unconditionally and a species whose trial is closed is untouched. Fifteen trials
now. Aposymbiotic divides where every other debuff multiplies, because a
*cost* moves the other way.

**The trials achievement ladder had to be pinned.** `TRIAL_TIER_TOP` was
`CHALLENGE_MAX_LEVEL * CHALLENGES.length`, so opening six trials moved it from
45 to 75 on its own and shifted every rung underneath — the exact fault the
comment above it warns about, one indirection further out. It is the literal 45
now, verified byte-identical to the shipped ladder
(`1,2,3,4,6,8,10,15,20,30,45`) against `git show HEAD`. Zero tiers lost. **Do not
compute a ladder top from anything that can grow.**

### A cache that was built and then taken out

Memoising `masteryOf` and `bestTrialLevel` on an explicit `touchTrials()` made a
tick about 10% faster and made every mastery read **stale** for any code that
writes `game.challenges` or `stats.bestTrial` directly. The trial harness does
exactly that, and it caught it: Metapleural Gland, Dulotic Instinct and Social
Stomach all read 1.000 at five levels.

The brood tally can be cached because six functions own every write to the
brood. **Trial records have no such choke point**, so there is nowhere honest to
put the invalidation. Ten percent of a tick that is already about 1.5% of a
frame is not worth a class of silent wrong numbers, and it is out.

What did survive the exercise: the string keys. `"best:" + id` allocated on every
call under `populationCap` and `foodPenalty`, and measured, that concatenation
alone made a tick both slower and markedly noisier.

### A correction: the tick figure in the Supercolony section was wrong

That section quotes **0.077ms a tick** and reasons from it that six nests cost
2.8% of a frame. That number came from a script that reset and replayed four
colonies in one warmed process, and it does not survive a controlled comparison.

Measured properly — the same script run alternately against the working tree and
against `git stash`, three times each — **the shipped tick is 0.16–0.31ms and
the working tree is 0.19–0.20ms**, inside each other's noise. Absolute tick cost
on this machine varies by a factor of two between processes, so any single
figure is meaningless.

So six nests cost roughly **1.2ms of a 16.7ms frame, about 7%**, not 2.8%. The
conclusion is unchanged — a supercolony is affordable and the model is nowhere
near its budget — but the figure it was argued from was five times too
optimistic. **A tick cost quoted from one process is not a measurement**, which
is the same lesson the pacing suite already learned about seeds.

All 22 suites pass, pacing and fuzz included.

---

## Step 7 — the brood is a nursery, 3 September 2026

The brood was a queue: an egg went in, an ant came out, and the protein was paid
in one lump at the moment of laying. A real ant passes through three forms and
**only the middle one eats** — an egg is yolk, a pupa is sealed inside its own
cuticle and takes nothing at all, and everything the adult will be is built
during the larval stage out of what the nurses bring.

### It needed no save migration, which was the surprise

**The stage is derived from `progress`, not stored.** Every egg already carries
the only number the question needs, so `broodStage()` is a pure function of it
and a v9 save loads unchanged. `BROOD_STAGES` are shares of `EGG_TIME` that sum
to 1 — egg to 0.30, larva to 0.80, pupa to 1.00.

The one thing that did need care is protein already paid. An egg written under
the old rule carries `fed: true` and no `paid`, and charging it again would have
double-billed every egg in a queue that can be 200,000 long. `broodFedShare()`
reads `paid` when it is there and falls back to `fed ? 1 : 0` when it is not, so
an in-flight egg is never charged twice and no migration was needed.

### What actually changed

**Laying no longer buys protein.** `layOne` only rolls Atta's Gongylidia, which
is a property of the egg rather than of the larder and so still decides at
laying. Everything else is drawn down during the larval stage.

**A larva eats continuously**, charged on the progress it actually makes. The
total per egg is unchanged at `EGG_PROTEIN_COST × speciesProteinCostMult`,
verified on an isolated egg with no protein income: **0.0000 as an egg, 0.9924
as a larva, 0.0000 as a pupa**, the 0.8% being tick granularity at the stage
boundary.

**Being fed is a matter of degree, not a flag.** A larva develops at
`1 + (FED_EGG_SPEED − 1) × paid`, so a colony that runs short slows rather than
stops. Measured on one isolated egg: **well fed 12.4s, half starved 13.7s,
unfed 16.5s.** `eggSecondsLeft()` reads the same share, because a countdown that
does not match the rate is worse than no countdown.

**The rows say which form it is** — "Forager · egg", "Forager · larva ·feeding",
"Forager · pupa" — in the brood slots and in the details window.

### The bug worth recording

The first version billed the larva on `rate × dt` while it advanced at
`rate × dt × (1 + share)`. **A fed larva therefore outran its own bill and left
the stage having paid 0.72 of 1.00**, which is a 28% silent discount on every
protein cost in the game. It is charged on the actual progress made now. This is
the exact class of fault the canon warns about: the game keeps running and only
the numbers are wrong.

### What it did to pacing, and why

Five seeds, against the canon table:

| | 20 | 50 | 100 | 250 | 500 | 1000 | 2000 |
|---|---|---|---|---|---|---|---|
| idle, canon | 1.2 | 3.0 | 6.9 | 22.4 | 40.7 | 63.8 | 92.0 |
| idle, measured | — | — | — | — | — | **60.8** | **87.8** |
| drift | | | | | | **−4.7%** | **−4.6%** |
| rallying | +0.6% | +1.3% | +0.5% | 0.0% | +0.2% | **+0.3%** | **−0.1%** |

Inside the suite's 8% tolerance, but it is a real shift and it has a cause.
Under the old rule, feeding was decided in the single instant an egg was laid:
if the larder was empty at that moment the egg went unfed for its whole
development, however much protein arrived a second later. Continuous feeding
means **a raid or a stretch of hunting now feeds the larvae already in the
chamber**, so an idle colony — whose protein arrives in lumps between raids —
gets more of its brood fed than it used to. A rallying colony was already
feeding nearly everything, which is why its row does not move.

That is the mechanic behaving as intended rather than a leak: protein supply
matters continuously instead of at one instant. **If the 4.7% is not wanted, the
dial is `EGG_PROTEIN_COST`, not the stage model.**

### Still a queue in one respect

Only the tended eggs develop, so only they eat — the queue behind them is inert,
exactly as before. Nurses have not been given a per-stage job; that is a balance
change and is deliberately not taken here.

### An unrelated flaky gate, found while testing

`test/invariants.mjs:89` asserts a wall-clock `ms < 45` on one render of the
brood window. Measured ten times on an unchanged tree it ranges **19–57ms**, so
the threshold sits inside its own noise and the suite fails intermittently under
load. It is not caused by this work: the new label costs **1.7µs per 40-row
render** (2.52µs against 0.84µs), which is 0.0001% of the budget it is being
blamed for. The row-count invariant beside it — 40 rows, never 2,078 — is exact
and is the one actually worth asserting. **A wall-clock assertion in a
shim-dominated measurement is not a test.**

---

## Step 2 — the map, re-measured with garrisons live

The open question was whether a working map widens the mid-game on its own, or
whether the generic line still needs a second scarcity. Six hours, three seeds, a
commander that takes the cheapest winnable cell and posts a Guard on what it
holds:

| seed | held | territory | protein | strength | egg |
|---|---|---|---|---|---|
| 11 | 12/30 | x1.256 | x1.100 | x1.180 | x1.000 |
| 22 | 2/30 | x1.024 | x1.000 | x1.000 | x1.000 |
| 33 | 13/30 | x1.162 | x1.200 | x1.060 | x0.954 |

Garrisons took held ground from the 1–2 cells measured without them to **12–13
of 30**, and territory to x1.16–1.26 against a designed full board of x1.720.
Seed 22 at 2 cells is the reminder that the board is rolled: a circle whose near
cells came up strong is a circle that stays shut for a while.

**The budget did not move at all**, on a colony that plays the map for four
hours: **foragers 79.5%, soldiers 15.4%, excavators 2.8%, nurses 2.3%, upgrades
0.0%** — inside noise of the 79.4 / 15.8 / 2.4 / 2.3 / 0.1 the canon has carried
since before the Hunt existed. And **still exactly 2 of 12 upgrade lines move
the food rate**: `forager` x1.1538 and `colony` x1.1500, with everything else
paying into cap, brood or combat as before.

### So the answer is no, and the reason is structural

Territory is a **multiplier on food**, not a change in what the colony is short
of. It makes the same foragers worth more; it does not make excavators or nurses
worth buying. Amdahl still bounds everything outside the forager share at
**x1.03** however much ground is held, because the share itself is unchanged.

**The mid-game still needs a second scarcity.** That is now measured rather than
assumed, and it means the humidity-shaped idea — a colony-wide resource only the
brood consumes — is not made redundant by the map. What the terrain kinds do
give is *variety* in what a circle is worth, which is a different and smaller
thing than a second constraint.

---

## Step 5 — the character pass

"The game seems too plain." Two thirds of the answer was displaying things the
model already computes, and that is what this is. **None of it touches balance**:
pacing is unchanged and no new number enters any formula.

### The big foragers have names

They were always the only individuals in the game — a handful of them, each with
a birthday, each growing +5% a minute to a ceiling of x3 — and they were
rendered as a count. **The name is derived from her birth time rather than
stored**, so `game.bigForagers` stays an array of numbers and no save changes.
Real ants have no names, so these are keeper's epithets: Quick-Shanks,
Gilt-Antenna, Bent-Femur.

A roster on the Ants tab now says who they are, how old each one is, what she is
worth, and what share of everything the colony gathers the group carries.

Two faults found and fixed while building it. **Two sisters emerging in the same
tick shared a birth time and therefore a name**, so a new one is nudged a
microsecond later — far below anything her age is measured in. And with only 384
possible names, **a dozen sisters collide by the birthday problem rather than by
bad luck**, so the roster numbers a repeat (`Quick-Shanks II`) instead of the
namer trying to be unique. Derivation stays pure; the display stays unambiguous.

### The colony keeps a chronicle

An hour of play produced no story: every notable event was one line of interface
that the next one overwrote. All of them were already detected. Kept, they read
like this:

```
179m  The nest did not hold. 254 ants died to Cane Toad.
137m  First kill: Army Ant Raiders. The colony kept the Raiders' Trail.
120m  The founding generation is spent. 4 of them worked themselves to death
      on the queen's flight muscle, which is what a founding generation is for.
114m  An oversized daughter emerged. The colony calls her Gilt-Antenna.
```

Six events: an oversized daughter, the founders' generation ending, a circle
merged, a nuptial flight, the first kill of a creature, and a defeat that cost
twenty ants or more. Newest first, capped at sixty, shown under Settings →
Record.

**An entry stores the event, not the sentence.** Written out in full it cost 180
characters an entry and made a finished colony's save **25.7% longer** — and
save length is a real cost here, because a truncated paste is the documented way
importing fails. As a key and two parameters it is about 79 characters and the
same entries add **17.6%**. The sentence is built at render time, which also
means the wording can be improved later without rewriting anybody's history.

A save written before the chronicle existed imports cleanly and starts empty, so
no migration was needed.

### The bug that hid half of it

The first build recorded no raids at all. `resolveRaid()` in `game.js` is an
exported wrapper with **no callers** — the timer raid is resolved inline at
`game.js:1505` — so wiring the wrapper wired nothing. It is the inline call that
had to be wrapped. An exported function that looks like the entry point is not
the entry point; check who actually calls it.

### What is deliberately not here

Day and night, weather, encounters with a choice, the midden and alates as a
raised caste are all in the list above and all of them **change the economy**.
They are balance decisions and are left alone. What is built is the part that
was only ever a display problem.

---

## Step 6 — the Supercolony, built 3 September 2026

Layer 3 is in, in `js/supercolony.js`, which is the shape the file layout already
expects of a prestige layer. It breaks all four properties the first two layers
share: **no reset**, **no currency**, **no tree**, and **no completion**.

### What it cost, and why it was affordable

The measured claim held up: 286 of 342 model functions already take a colony as
their first argument, so nothing outside `game.js` had to change to support more
than one colony. What `game.js` needed was a list of which keys belong to a nest
rather than to the line, and a way to run one that is not focused.

`NEST_KEYS` names the per-nest state — food, protein, ants, eggs, upgrades,
`runTime`, `run`, `hunt`, the raid clock, traits. Everything else is the line's
and is shared by every nest in it: the matriline, the lineage, achievements,
trophies, the chronicle, lifetime stats, settings. **Listing what is per-nest
rather than what is shared is the safe direction** — a key nobody remembered to
add stays shared, which is what it already was.

A background nest is ticked by swapping it into `game`, calling the **real**
`tick()`, and swapping back. `game` is one exported object that every module
holds a reference to, so the focused nest is swapped into it rather than passed
around; nothing observes the swap because it begins and ends inside one
synchronous call. `tick(dt, background)` takes a flag purely to stop the network
ticking itself once per nest per nest.

It runs the real tick and not an approximation for the reason the away report
already established: **anything that progresses in the background must take the
path the player would have watched**, or switching to it lands somewhere the
live path never would.

### Budding, and the bug that made it obvious

A nest is founded on a cell the colony **holds**, so the map is the cap on the
network and Guards are what keep the map. No `MAX_NESTS` constant: the size of a
supercolony is set by an army you have to build.

The first build gave a daughter a blank founding colony, and she sat at **zero
ants for ever**. Nothing sheds a queen's wings in a colony nobody is watching —
the harness does it, and so does the player. The fix is not automation, it is
that **budding is not a nuptial flight**: a daughter walks out on foot with a
tenth of the workers and a queen already in the column, so the mother is that
many ants poorer and the daughter is alive from her first second. That is what
budding is biologically, it is why *Linepithema humile* runs six thousand
kilometres of coast, and it makes founding a nest cost something real.

Measured: budded from a 4,900-ant mother, the daughter reached **1,849 ants in
thirty minutes** on her own while the mother kept growing, focus swapped both
ways without either changing, and the whole network survived an export/import.

### Inheritance is three, and that is the layer

`INHERIT_WIDTH` is 3. A daughter carries exactly three of her mother's traits and
what is not sent is never hers. If she inherited everything, generation N would
be at least as strong as N−1 by construction and the line would run away — which
is precisely what happened to Polyergus at `CAPTURE_DIGGER_CAP` 4 and to
veterancy before it was capped at Major. A fixed three means a line **drifts**
rather than accumulates, the set can never be completed, and two networks built
by two players diverge.

**Traits are earned by play, never bought.** Eight of them, each scoped and none
touching all food: Worn Trails and Broad Holding (this nest's foraging),
Deep Galleries (cap), Warm Chambers and Unhurried Line (brood), Hardened Gate
and Standing Army (combat), Thrifty Brood (egg price). Two are earned by *how* a
nest was played rather than by a total — Thrifty Brood wants a thousand ants
with no egg ever destroyed, Unhurried Line wants a thousand eggs with no ant
ever exiled — which is the first thing in this game to reward a style.

A trait pays only in the nest that holds it. That is what keeps it inside the
rule: `traitFood` multiplies one colony's food, and every other nest in the
network is untouched by it.

### The clock counts nest-hours and buys nothing

`networkAge()` sums the running time of every nest, so **breadth is what
accumulates**, which is the right incentive for a breadth layer. It is a measure,
not a currency: there is no third tree, and the player's decisions — where to
found, what to send — are the only decisions.

### Gated, and inert until it opens

The layer needs two species finished. All 22 suites pass with it in, pacing and
fuzz included, because a colony that has not opened it has an empty `nests` array
and `tickNests` returns immediately.

### Still to do

The panel lives on the Matriline tab and founds on the first available cell with
the first three traits; **choosing which cell and which three is the interface
job that is not done**, and a prestige layer probably wants a tab of its own the
way Nuptial and Matriline do. A merged circle rolls a fresh board and would
orphan a nest marker. And the network yield is **not measured**: six nests
producing is six times the food into one line, and the roadmap's own instruction
was to measure that before tuning anything.

---

## A flaky gate, fixed

`test/invariants.mjs` asserted a wall-clock `ms < 45` on one render of the brood
window. Measured ten times on an unchanged tree it ranges **19–57ms**, so the
threshold sat inside its own noise and the suite failed intermittently under load
— four times across this session, each time on work that was fine. **A
wall-clock bound on a shim-dominated measurement is not a test.**

What the window actually promises is that it reads the *front* of the queue
rather than all of it, so the assertion is now a **ratio**: the same render
against a queue five hundred times smaller must cost about the same. Measured
four times, the ratio is **1.94, 1.94, 2.26, 2.20** while the absolute figures
swing 30.8–50.8ms. Scale-free, so it does not care how loaded the machine is, and
it still catches the regression it was written for — a window that walked the
whole queue would show a ratio in the hundreds.

---

## Later

- **Widen the mid-game.** Ten of twelve upgrade lines still move the food rate by
  nothing, and step 2 measured that a working map does NOT fix it: territory
  multiplies food without changing what the colony is short of, so the budget
  stays 79.5% foragers and Amdahl still bounds everything else at x1.03. A
  second scarcity is still the open item.
- **Layer 3.** Built — the Supercolony, in `js/supercolony.js`. What is left is
  the interface (choosing the cell and the three traits, and probably a tab of
  its own) and measuring what a network of several nests is actually worth.
