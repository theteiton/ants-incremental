# Roadmap

**This file is not canon.** `CLAUDE.md` and `GEMINI.md` hold what is settled and
`DEVLOG.md` holds what shipped. This one holds what is planned and what is still
undecided, and every line of it is arguable until it lands. When something here
ships, it moves into the canon files and comes out of this one.

Last updated 29 August 2026, against 0.1.8.0.

---

## Where the game stands

Layer 0 and layer 1 are built. Measured under one fixed policy driven by the
game's own automation:

| | measured |
|---|---|
| first run to 1,000 ants | 60.9m idle, 47.7m rallying |
| the Royal Lineage, all 13 adaptations | about 4.9 hours across 2 flights |
| all six trials, every level | about 22.3 hours |
| **layer 0 + layer 1, end to end** | **about 27 hours** |

Per-level trial times, which are the unit everything below is sized in: Drought
96.7 / 86.4 / 96.0 / 96.2 / 114.3m, Sterile 26.6 / 26.2 / 32.6 / 84.1 / 277.4m,
Barren Brood 34.4 / 26.7 / 26.3 / 36.3 / 62.2m, Endless Siege 23.1–23.5m flat,
Sealed Nest 2.0 / 4.0 / 12.2 / 38.0 / 36.0m, Nanitic Line 1.6–2.5m. The median
level is about half an hour; Drought and Sterile are the long ones and the
Nanitic Line is nearly free.

**The problem layer 2 has to answer.** The game is one resource wide. Measured on
a colony 24 hours in, foragers carry 84.6% of all food and big foragers the rest;
ten of the twelve upgrade lines move the food rate by exactly ×1.000000. Amdahl's
bound says a multiplier on a fraction *f* of the work is worth at most 1/(1−f)
overall, so on that colony a forager-only multiplier is capped at ×6.47 and
everything else at nothing. Adding another multiplier tree makes this worse. A
new **bottleneck** is what creates decisions; a new **currency** is only
bookkeeping.

---

## The shape of the whole game

**Open-ended.** There is no planned last prestige layer. Layers ship until they
stop being worth building.

This breaks the version scheme as written, which defines `1.0.0.0` as "the
release where the last planned prestige layer ships". **Epoch 1 is redefined as
leaving beta** — feature-complete rather than layer-complete: every system in the
game finished, documented and balanced, with layers still to come after it.
`DEVLOG.md` carries the corrected wording.

---

## Layer 2 — the Matriline

The lifetime clock is already named the Matriline in canon, and this is what
happens on it. Colonies genuinely are matrilineal: every worker descends from the
queen, and each nest is founded by her daughter. What passes down that line, in
real biology, is mitochondrial inheritance — which is why the layer is about
which *species* the line becomes.

**The first run is generic ants.** Layer 0 and layer 1 are played as no
particular species, exactly as they are today. The matriline reset is where the
line commits.

### The species commitment

At a matriline reset you choose one species and play the whole matriline as it.
Six of them, each a real subfamily with a mechanic drawn from what that animal
actually does.

Every species has an **active** part and a **passive** part, and the rule is:

| | active | passive |
|---|---|---|
| species you have never finished | — | — |
| species you have finished, not chosen | **0%** | **100%** |
| the species you are playing | **100%** | **100%** |

So finishing a species banks its passive forever at full strength, and choosing
it turns its active on as well. No matriline is ever wasted and no choice is ever
regretted — what a run buys is another permanent passive, and what it costs is
only the time. **Matriline upgrades** are the layer-2 tree and they raise passive
effectiveness, so the passives keep growing after the species that granted them
is behind you.

The actives are mechanical rewrites and the passives are simple and always safe
to hold, because a passive is live in every future run and a rewrite that is
always on is not a choice.

### The six species

| species | active — a rewrite, on only while chosen | passive — always on once finished |
|---|---|---|
| **Atta** (leafcutter) | Foragers bring leaves, not food. Leaves become pulp becomes fungus becomes food, a three-stage chain with its own throughput. **The bottleneck stops being food**, which is the point of the whole layer. | **Gongylidia** — a share of eggs are fed without spending protein. |
| **Solenopsis** (fire ant) | Polygyne: several queens lay at once, so the cap rises and the brood widens, but every raid costs far more foragers. | **Solenopsin** — colony-wide fighting strength. |
| **Camponotus** (carpenter) | *Blochmannia* recycles nitrogen: protein need halves, ants live far longer, and chambers are cut in wood rather than dug, so the cap grows on a different curve. | **Endosymbiont** — protein yield. |
| **Eciton** (army ant) | Nomadic. There is no permanent nest, the cap is tiny, and raids are offensive and constant — every raid won *adds* ants instead of costing them. Inverts the loop. | **Column Discipline** — hunting rate. |
| **Myrmecocystus** (honeypot) | Repletes: food is stored in living ants and the bank is capped by how many you hold. Storage becomes a thing you build. | **Crop Reserve** — the offline cap. |
| **Polyergus** (amazon) | Dulosis: you cannot lay a worker at all. Every non-soldier ant is captured brood from a raid you won. | **Raiding Instinct** — raid salvage. |

Atta is the one to build first. It is the only active that answers the
one-resource-wide measurement directly, and a production chain is a shape this
game has never had.

### Species-scoped trials

Trial clears are recorded per species. Playing Atta re-earns its trials as Atta,
and an Atta mastery pays only while you are Atta.

**This is the biggest save-shape change in the plan.** `game.challenges` and
`stats.bestTrial` both become per-species maps, and the migration writes every
existing clear against the generic species — which is exactly right, because the
first run is generic ants and that is what those clears were earned as.

It also only works because of a change that already shipped: 0.1.8.0 made
food-measured trial targets scale with the food mastery held, so a species
starting its trials from nothing meets the same trial a mastered one does. Before
that, a species-scoped reset would have made Sealed Nest and the Nanitic Line
unclearable all over again.

---

## The three matriline trials

Same rule as layer 1: each takes one thing away and gives that same thing back.

**None of the three pays a global food multiplier**, deliberately. Deep Cisterns
is the one mastery with *f* = 1 and it silently broke three of six trials until
0.1.8.0. **No new mastery may multiply all food.** That is the hardest rule in
this document.

### The Blight

*Ophiocordyceps unilateralis*, which is real and does exactly this.

- **Takes**: an infection spreads through the colony. An infected ant produces
  nothing and infects others at a rate that rises with how many are already
  infected. Exiling is the only cure.
- **Asks**: hold a population while the infected share stays under a threshold.
- **Loses**: the infected share passing a ceiling ends the run.
- **Gives back**: **Metapleural Gland** — every kind of ant loss is reduced,
  permanently. Raid deaths, training deaths, the lot. Not a food multiplier.
- **Why this one first**: exiling is currently a button nobody presses. It is one
  of the two irreversible acts the game refuses to automate, and it exists only
  to undo a mistake. This makes it the core loop of a trial without inventing a
  single new mechanic.

### The Slave-Maker

*Polyergus*, which raids other nests for brood and cannot feed itself.

- **Takes**: you cannot lay any worker caste. Only soldiers. Every other ant in
  the colony is captured brood from a raid you won.
- **Asks**: reach a population.
- **Gives back**: **Dulotic Instinct** — a won raid captures ants for good, in
  every colony afterwards.
- **Why**: it inverts the core loop, which no layer-1 trial does, and it gives
  the combat system a reason to exist outside defence. Most code of the three —
  raids have to produce ants rather than only protein.

### The Repletes

*Myrmecocystus*, whose repletes hang from the ceiling as living jars.

- **Takes**: food cannot be banked above what living repletes hold. Repletes
  produce nothing and store a fixed amount each.
- **Asks**: a banked-food figure, which is the one thing this debuff makes hard.
- **Gives back**: **Social Stomach** — the offline progress cap, currently eight
  hours, rises per level.
- **Why**: it attacks the closest thing the game has to a degenerate strategy.
  With laying on, banked food can never rise above the price of one egg, and
  Granary Instinct is a manual patch over that. This makes storage a thing you
  build rather than a number you set.

---

## Sizing, and the conflict in it

The budget is **40 hours** for layer 2. Six species is six matriline runs, so
that is about **6.5 hours per species**: roughly two hours of colony growth to
reach the gate, and about four and a half hours of trials.

At a median half-hour per trial level, four and a half hours is **nine levels**.

**This does not fit six trials at five levels.** All six layer-1 ladders take
22.3 hours measured; six species of that is **134 hours**, which is 3.3× the
budget. Something has to give, and this is the one decision in this document that
cannot be deferred, because it changes what gets built.

| option | measured size | what it costs |
|---|---|---|
| **Three trials per species, five levels** (recommended) | ~45h | Each species opens three of the nine trials, chosen to fit what it is — Atta gets Drought and Barren Brood, Polyergus gets the Slave-Maker and Endless Siege. Real identity per species, closest to budget. |
| Six trials per species, two levels | ~54h | Every species meets every trial, but each ladder is a stub and the deep levels — which is where the ramp lives — never happen. |
| Four species, six trials, five levels | ~89h | Half the species, all the depth. Over budget by 2.2×. |
| Six species, six trials, five levels | ~134h | What "species-scoped" says literally. Genre-normal for an idle game; 3.3× what you asked for. |

---

## The layer-2 currency

Layer 1 spends Royal Jelly, which is 10-HDA and accurate. Layer 2 needs its own.

**Haplotype** is the proposal. A haplotype is a set of alleles inherited
together, and mitochondrial haplotypes are literally how biologists trace a
matriline — so it is both the accurate word and the exact thematic fit. It buys
matriline upgrades, which raise passive effectiveness.

Alternatives if it reads too clinical: **Allele**, **Germline**, **Lineage
Marker**. Gemini proposed "Epigenetic Mutagen", which is neither accurate nor in
the voice this game uses.

---

## What has to change in the code

Rough order, smallest first.

1. **A regression harness in the repo.** Ladders all six trials, runs 48 hours of
   a mastered colony, fails if a target becomes unreachable or a rate goes NaN.
   Layer 2 adds more multipliers than anything so far; 0.1.8.0's bug was one
   multiplier quietly breaking three trials and it went unnoticed through a
   release.
2. **`js/species.js`** — the six species, their actives and passives, and
   `speciesActive(game)` as the single gate, the way `automationOn()` is.
3. **Save v8.** `game.challenges` and `stats.bestTrial` become per-species maps.
   Migration writes existing clears against the generic species.
4. **`js/matriline.js`** — the layer-2 reset, the upgrade tree, and Haplotype.
5. **The three matriline trials**, into `js/challenges.js`. Each is a `kind`, a
   `target`, an optional `fail` and a `mastery`, which is already the shape.
6. **Atta's chain**, which is the largest single piece and probably wants its own
   module.

---

## Open decisions

1. **The sizing conflict above.** Three trials per species at five levels is the
   recommendation; it needs a yes.
2. **Does the matriline reset clear Royal Jelly and the Royal Lineage?** Layer 1
   resets the colony and keeps the lineage. If layer 2 keeps the lineage too,
   every matriline starts with full automation and the founding phase is skipped
   forever. If it clears it, every matriline replays 4.9 hours of lineage before
   the species content starts, six times over, which is 29 hours of the 40-hour
   budget spent on layer-1 content.
3. **What does the Blight's infection actually spread on?** Time, population, or
   raids. Time is simplest; population makes growth itself the risk, which is a
   better trial and a harder balance.
4. **Do the passives stack multiplicatively?** Six passives at 100% each,
   boosted by matriline upgrades, is a compounding stack — which is the thing
   that broke the trials once already. They may need to be additive within a
   kind.
5. **Does Eciton break the population cap entirely?** A nomadic colony with no
   nest has no cap to raise, which means excavators do nothing — the same shape
   as Sealed Nest, and that trial's cap-bypass bug came from exactly this.

---

## What ships first

In order:

1. The regression harness, in the repo, runnable before a release.
2. The Blight, as a **layer-1** trial. It needs no species work, it makes exiling
   matter, and it proves the trial-authoring shape still takes a new `kind`
   cleanly before layer 2 depends on that.
3. Save v8 and the per-species records, with no species yet — the migration
   landing on its own is far safer than landing under a new layer.
4. `js/species.js` with **Atta only**, and the matriline reset.
5. The other five species, then the remaining two matriline trials.
