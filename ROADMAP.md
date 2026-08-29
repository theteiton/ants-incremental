# Roadmap

**This file is not canon.** `CLAUDE.md` and `GEMINI.md` hold what is settled and
`DEVLOG.md` holds what shipped. This one holds what is planned and what is still
undecided, and every line of it is arguable until it lands. When something here
ships, it moves into the canon files and comes out of this one.

Last updated 29 August 2026, against 0.2.1.0.

---

## Where the game stands

Layers 0, 1 and 2 are built.

| | measured |
|---|---|
| first run to 1,000 ants | 60.9m idle, 47.7m rallying |
| the Royal Lineage, all 13 adaptations | about 4.9 hours across 2 flights |
| all six trials, every level | about 22.3 hours |
| **layer 0 + layer 1, end to end** | **about 27 hours** |

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

## Next: the three matriline trials

Specced but not built. Same rule as layer 1: each takes one thing away and gives
that same thing back.

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

## Later

- **Widen the mid-game.** Ten of twelve upgrade lines still move the food rate by
  nothing. Atta proves a non-food bottleneck works; the generic line still has
  only one.
- **Layer 3.** Nothing designed. It should not be another multiplier tree.
