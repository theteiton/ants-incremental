# Devlog

Every release, newest first. Versions are `epoch.layer.feature.fix`:

- **epoch** — stays `0` until the game is finished. **1.0.0.0** is the release
  where the last planned prestige layer ships, somewhere around the fifth or
  sixth. Everything before that is the run-up to it.
- **layer** — which prestige layer the work belongs to. `0` is the founding
  game before any prestige existed, `1` is the Nuptial Flight and everything
  built on it, and the Matriline will be `2`.
- **feature** — a new system or feature inside that layer.
- **fix** — corrections, balance and interface work.

---

## 0.1.8.0 — 29 August 2026

**Trials you can actually reach, and a colony that says what it is short of.**

Six things, all of them from laddering every trial under a fixed policy and then
reading the result with Amdahl's Law in hand: a multiplier on a fraction *f* of
the work is worth at most 1/(1−f) overall, however large it is.

**Drought was gating three other trials and nothing said so.** Deep Cisterns is
the one mastery with *f* = 1 — it multiplies everything — so five levels of it is
×32 on every food figure in the game, and three of the six trials are measured in
food. Measured: with nothing else cleared, Sealed Nest could not clear level 1 at
any level of play (411/s against 2,500) and the Nanitic Line could not clear level
5 (a 32,798 ceiling against a 38,000 target); with Drought mastered, both cleared
in twenty to thirty *seconds* a level. There was no window in which either was a
trial. A food-measured target now scales with the food mastery held, which makes
them mastery-neutral, and the bases were recalibrated against a colony holding
nothing: 2,500 → 400 and 38,000 → 28,000. Sealed Nest now runs 2.0 / 4.0 / 12.2 /
38.0 / 36.0 minutes.

**The excavator dig-out rule was an unbounded cap bypass inside Sealed Nest.**
She is allowed past the cap because digging raises it, so everywhere else the
exemption closes behind itself. Sealed Nest sets that gain to zero and it never
closed — 1,631 ants against a cap of 30, and `managedCaste()` digging every tick
because the nest is permanently tight, so Standing Orders spent the trial laying
diggers that widened nothing. `capPerExcavator()` is the single source now and
both sites read it. The ordinary run is untouched, to the tenth of a minute.

**Sterile was decided by whether Nest Memory was switched off.** It spent an
allowance of two on the founders' food line, worth nothing two hours in, and
nothing refunds a level. It does not run inside Sterile any more. The trial is
now a genuine decision and a hard one: a player buying by gain-per-cost *right
now* still fails levels 4 and 5, because at minute two the founders' line really
is the best buy and worthless by minute sixty. Buying only the lines that keep
paying gives 26.6 / 26.2 / 32.6 / 84.1 / 277.4 minutes.

**The colony says what is binding.** A line under the brood names it — full nest,
full chambers, or no food for the next egg. This is the practical half of
Amdahl: an upgrade aimed anywhere but the binding constraint buys almost
nothing, which is why the "+150%" forager line delivers about +44%. The
saturation figure is sampled after the automation tops the brood up and *before*
the hatch loop; read afterwards the brood is always one egg short and never
reports as bound at all.

**An adaptation level that cannot pay says so.** `nanitic_food` can be pushed to
level 12, and each extended level costs millions of protein to move the rate by
×1.000003 — four founders against twenty thousand foragers. Only caste-scoped
food lines are tested; the first attempt compared every rate and greyed out
`protein_yield`, which pays in something the food rate cannot see.

**Relentless had never lost a raid.** 5.18× margin, 119W/0L over twelve hours on a
mastered colony — a label rather than a choice. The attacker now brings half
again as much of what Hardened Line taught you: 0.95× and 112W/3L. Swept at 1.25
(no change, 119W/0L) and 1.75 (collapse, 2W/3L). It scales with how mastered the
colony is, so a nest that has only just cleared the siege still enters at 1.20×.

Also: Sterile's card called its own reward "nothing else" while being the only
mastery that raises the max level of every line there is.

## 0.1.7.1 — 28 August 2026

**Saying that four trials shipped, and laddering all six to see what happens.**

The player-facing changelog for 0.1.7.0 never mentioned the four trials it
opened. It listed the library, the brood fix and the batch field, and a player
reading it had no way to learn that Sealed Nest, Barren Brood, Sterile and the
Nanitic Line existed at all — nor the twenty-one named attackers, nor the raid
difficulty setting. It names all six trials now, a line each for what the trial
takes and what clearing it gives back. The `trial` and `mastery` library entries
went the same way: both named only Drought and the Endless Siege, and `mastery`
still claimed both rewards "double per level cleared" when Sterile pays ×1.25 and
Long Burning ×1.6. The version stays 0.1.7.0, because `UPDATES` carries feature
releases and correcting what an entry says is not one.

**Sterile's card called its own reward "nothing else".** `masteryLineText()`
lists the upgrade lines carrying a trial's mastery tag, and Sterile pays into
every line rather than into one kind of them — so nothing carries the tag, the
list came back empty, and the largest mastery in the game printed as nothing.
`cap`, `brood` and `nanitic` genuinely raise no line and still read that way.

**Then every trial was laddered 1 to 5 under one fixed policy**, driven by the
game's own automation. Three things came out of it, none of them fixed here.

Drought gates the rest and the game does not say so. Deep Cisterns is ×2 food a
level, three of the six trials are measured in food, and ×32 settles all three:
with no other trial cleared, Sealed Nest cannot clear level 1 at all (411/s
against 2,500), the Nanitic Line cannot clear level 5 (a 32,798 ceiling against a
38,000 target) and Sterile cannot clear 3, 4 or 5. With Drought mastered the same
runs clear in twenty to thirty *seconds* a level. There is no window in which
either is a trial.

The excavator dig-out rule is an unbounded cap bypass inside Sealed Nest.
Excavator eggs may exceed the cap because they dig their own chamber, which
closes behind itself everywhere else because each one raises the cap; Sealed Nest
sets that gain to zero, so it never closes — 1,631 ants against a cap of 30. And
`managedCaste()` digs whenever the nest is tight, which under Sealed Nest is
always, so Standing Orders spends the trial doing it unasked.

Sterile is decided by whether Nest Memory is switched off. At an allowance of
two, the automation spends both levels on `nanitic_food` and the colony stalls at
445 ants; spent by hand on the forager line the same colony clears in 91.6
minutes. Nothing refunds a level, so the choice is permanent and unstated.

What held: forty-eight hours of a mastered colony under Unchecked with no NaN, no
negative resource and no runaway, save round-trips exact, v6 migration intact,
bad save codes refused, every achievement ladder increasing through its softcap,
and the four raid difficulties at 659× / 234× / 8.6× / 5.2× — though none of them
ever loses a raid.

## 0.1.7.0 — 27 August 2026

**Every trial playable, a library, and a brood that does not freeze the tab.**

**Sealed Nest, Barren Brood, Sterile and the Nanitic Line** join Drought and the
Endless Siege, so all six are built. Each takes one thing away and pays it back:
cap, brood, the strength of every adaptation, and what a founder is worth. Sealed
Nest asks for a food rate rather than a headcount, because a colony that cannot
grow cannot be asked to grow.

The **Nanitic Line** was listed as blocked on per-ant ageing. It was not: a decay
that rises with the count needs no such thing. Two corrections made it work —
crowding had to bite on what a founder gathers rather than only on how fast she
fades, or the ×2 mastery beat it and the last level came in easier than the
first; and it had to ask for food *gathered* rather than a rate, because a rate
is met in the first minute by a handful of ants and the optimum there is few
ants. **Long Burning** stops the founders dying of old age from its first clear,
and every level after makes a founder better at everything she does. The upgrade
line that used to sell them time now sells them brood chambers, since the trial
hands the lifespan over for nothing.

**How hard raids are is now a choice.** A mastered colony outguns the next
attacker by 348×, so rather than cut what a trial pays, the growth cap comes off
by choice: Sheltered, Unchecked, Hunted, Relentless — 348× / 198× / 7.5× / 4.6×,
unlocked by clearing the siege once.

**Twenty-one named attackers**, phorid fly to elder wyrm, drawn three-deep from
the band their strength falls in. The nest was previously attacked by a number.

**A Library tab**, because a playtester at 187,000 ants said he understood less
than half of what the game told him. 32 entries that appear as the colony meets
them and fill out once it has done them, plus a player-facing changelog beside
them.

**Laying a big batch froze the tab, and it was two bugs.** The "Lay max" label
recomputed its count every frame one egg at a time, and laying re-counted the
whole brood twice per egg. 60,000 eggs went from 5,236ms to 8ms.

Also: the shed instinct strips the wings as well, a batch lays whatever number
you type, numbers run to 10^63 with scientific notation offered in Settings, and
a ladder's top can no longer move — opening three trials shifted the trials
ladder's fifth rung and took a tier from anyone standing on it.

## 0.1.6.0 — 26 August 2026

**The achievement rework.**

Nothing about achievements was decided any more — the numbers were just typed in,
and they went stale the moment anything else moved. Three things now derive
themselves instead.

**The cap.** It is one level above what every XP in the game can buy — 36 today
against a highest reachable 35 — so it is a bound rather than a wall: there is
always one more level in front of you, it can never be sat at, and it recomputes
when a ladder changes. The hand-set 20 it replaces was reached in half an hour
and paid nothing for the rest of the run.

**The ladders.** Each track states where it starts, where it tops out and how far
apart its rungs sit, and `ladder()` fills in the rest, rounding to numbers a
player recognises. The spacing comes from how fast that resource actually grows:
measured on a finished colony, food accumulates ×2.13 an hour, protein ×1.92,
fighting strength ×1.44 and everything population-linked ×1.32. A rung every two
hours of late play makes the step that growth squared — so food rungs sit ×4.5
apart, protein ×3.4, colony size ×1.7. Hand-typed ladders could not express that;
they were all roughly decades or doublings whatever the resource did, which is
why food and protein filled up inside an hour while big foragers never moved.
Four tracks state a tighter step than their growth implies, because the old
ladder was denser there and **no rung may ever be lost** — swept across 1,452
values, nothing scores fewer tiers than it did.

**The level cost.** Compounding — `9 × (1.10ⁿ − 1) / 0.10`, so level 1 costs 9 XP
and level 33 costs 190. The old flat `n(n+1)` is barely a curve once the ladders
are long: at 314 tiers it would have run the cap past 45 and the food bonus with
it. The bonus is a stated ×1.0479 a level, ×5.14 at the highest reachable.

**No ladder ends, and there is no level cap.** 13 of 23 tracks were dead by 24
hours — a full bar paying nothing for the rest of the run. Past its stated rungs
a ladder carries on at its own step, so there is always a next one and the
readout is a tier count with no denominator. The level cap went with it: a level
costs ×1.10 more than the last, so it throttles itself — level 40 needs about ten
times today's colony, level 50 about a thousand times.

What stops one number running away is a **softcap**: past the designed top, each
rung sits 1.15× further from the last than the one before it. The growth-driven
tracks mostly police themselves, since a step of growth-squared means every one
earns half a tier an hour whatever its scale — but exiling ants and destroying
eggs are free and repeatable, and could otherwise be farmed forever. With the
softcap those extra rungs cost 10.8K exiles, then 77.6K, then 971K, then 6.2
billion.

**Six new tracks**, for the things nothing was watching: soldiers trained,
Phragmotic Guards raised, the deepest single upgrade line, matriline age, ants
exiled and eggs destroyed. The last four are player choices rather than growth,
so they state round numbers instead of measured ones — and they hold only 13% of
the XP, so a player who never exiles an ant still reaches level 34 of 36.

The result is a ladder that keeps paying. A finished colony used to have 12 of 17
tracks maxed by eight hours with its level stuck; it now has 3 of 23 maxed at
eight hours, 13 by a full day, and climbs 26 → 33 across it. The cost is pacing:
denser early rungs mean more tiers sooner, so a first run to 1,000 ants lands
around 59 minutes against the 80 it took before.

## 0.1.5.1 — 26 August 2026

**Saying what clearing a trial is actually worth.**

A trial pays in two halves — its own achievement, and another rung on every
upgrade line it pays into — and the cards only ever named the first. Clearing a
level of Drought lifts the cap on the three food lines, and Endless Siege on the
four combat ones; neither the card nor the hover mentioned it, so a large part of
the reward was invisible. The line names come from the `mastery` tags rather than
being written out, so they cannot drift.

Also: the full-size inspector had lost every line break. `paintNote` splits a
note into one span per line, and the full-size view was built by reading the
sidebar's `textContent` back out, which concatenates spans with nothing between
them. It takes the note as written now.

## 0.1.5.0 — 26 August 2026

**Soldiers get ranks, upgrades get levels, and the second trial opens.**

The 29 one-time upgrades became **12 lines with 29 levels** — most of them were
always the same upgrade at a bigger number. Every level keeps the exact cost,
gate and magnitude of the entry it replaces, so the balance did not move. A line
can be pushed past its defined levels, and that is what the trials now sell:
Drought raises the three food lines, Endless Siege the four combat ones, and
extended levels cost protein as well as food. Save v7 migrates every old id to
its rung. The three upgrade achievement tracks count **levels** rather than
lines, or merging would have dropped their tops from 29 to 12 and silently taken
tiers — and achievement levels — off every live save.

**Soldiers now have four grades**, and every grade fights harder and hunts
worse: Soldier, Major, Supermajor, and the Phragmotic Guard whose head is a
living door. Surviving a raid promotes 3% of the rank and file into Majors for
free; everything above that is bought with protein in the new **Units** menu and
kills 10–35% of the batch. A won raid now costs soldiers too, scaled by how
close it was.

**Endless Siege** is the second playable trial: attacks from 16 ants every ninety
seconds, win 15, and one defeat ends the run. It unlocks the Units menu — the
trial that demands soldiers is the one that teaches the colony to make better
ones. Measured at `SIEGE_BASE` 120: 30% soldiers clears level 1, 45% clears
levels 1–4, 60% clears all five, and 45% with ranks trained hard also clears all
five.

**Achievement tiers are now worth their own depth** — tier 1 pays 1 XP, tier 9
pays 9 — and each level costs more than the last. The cap fell out at two hours
under flat scoring; level 30 now costs 930 of the 1,187 XP that exist. A level
once reached is never taken back, which is a high-water mark on the save rather
than a property of the curve, so reshaping either is safe by construction.

**The ladders were reshaped with it**, 142 tiers becoming 181. The old tops were
set against a colony of 10,000 ants, and a finished player now clears fifteen of
the seventeen tracks inside the first hour — only flights and royal jelly were
left unfinished. Every change is an append above the old top rung: swept across
every old and new threshold, zero values score fewer tiers than before, because
shortening a ladder silently takes food and hatch bonuses off a live colony.

**Each trial asks for the thing it is about.** Asking a combat trial to raise 600
ants tested growth rather than the siege — you could clear it by outrunning the
attacks. Drought still asks for a colony; Endless Siege asks you to hold the
gate. The cards had been printing Drought's food penalty whatever trial they
described, so a siege announced a food cut it never applied.

**Interface.** The details panel can be unpinned in Settings, for players who did
not want it following the page. Its notes are no longer one flat colour: each
line is toned by the section it sits under, so what a thing costs you reads as a
cost and what it pays reads as a gain — driven by the ALL-CAPS headings the notes
already wrote, so it applies to upgrades and achievement tracks too, not only
trials. What a trial pays now leads with the change itself, before and after with
the running total, instead of listing two rewards and leaving you to multiply
them. Combat became three sub-tabs — Overview, Units, Trade.

Fixed on the way: the per-win monster growth compounded forever, so a winning
colony met a threat no army could hold (192 straight losses, 152K ants down to
41K); hiding needed the last soldier dead, so a colony losing every raid got no
reprieve; entering a trial left the raid clock at six minutes, so the first siege
attack arrived six minutes late; and the stats bar reflowed between one row and
two purely because `fmt()` changed character count. Protein finally has a sink,
and food and protein trade in the rendering pit at a rate no round trip can
exploit — and neither direction credits the lifetime *gathered* totals, because
crediting them let a player cycle food through protein to farm the Food gathered
ladder, losing food but banking tiers.

## 0.1.4.0 — 25 August 2026

**Five-level trials, and a UI that fits on a screen.**

Drought stops at five levels and is then mastered, rather than grinding on. It
runs `0.25 × 0.36^level`, measured across three seeds at 28–30m, 32–34m, 34–37m,
39–41m and 42–46m.

Clearing pays twice, in two deliberately different shapes: the trial pays
`1.1^levels cleared`, and its own achievement — **Deep Cisterns** — pays
`2^deepest level reached` from a lifetime stat no reset can take back. Both apply
inside trials as well as outside, or each level would be strictly harder with
nothing to meet it. Each trial gives back the thing it took, so the five still to
come pay in cap, brood and soldiers.

**Every achievement bonus now pays inside a trial**, including the ×25 for big
foragers. They are earned rather than bought, and the Bonuses page claiming the
colony knew how to feed an oversized forager while it silently did not was a
contradiction. It is also the single biggest lever in the feature: nine big
foragers carry 79–86% of a trial colony's food, and un-suppressing them took
level 1 from 96 minutes to 19.

Sterile's restriction became the twenty-nine bought upgrades rather than the
lineage — every trial already leaves the lineage behind, which left Sterile with
nothing of its own.

Achievement levels compound instead of adding: food `1.035^level`, hatch
`1.02^level`, jelly `1.047^level`. Level 20 pays ×1.99, ×1.49 and ×2.51 against
×1.60, ×1.20 and ×2.00. No level pays less than it did.

Interface: everything persistent moved into the left column, so a tab starts at
the top of the page instead of 551px down behind the brood — Ants went from 4.2
screens to 1.1, Settings the same. Combat became three stats-bar readouts plus a
tab carrying *who fights*. The stats bar became four ruled groups. Settings
became five sub-tabs. Formulas stack their factors in a column, name them by
kind, and expand to the individual upgrades behind each. The inspector is sticky
on a desktop, in the flow on a phone, and **E** opens it full size.

## 0.1.3.0 — 24 August 2026

**The Trials open at the end of the lineage.**

A thirteenth adaptation at 8 Royal Jelly turns the end of the Royal Lineage from
"there is nothing left here to buy" into a tab. A trial founds a colony under
conditions that should kill it; the lineage's automation comes along, its
strength does not. `hidingPenalty` left `globalFoodMultiplier`, where it was a
penalty hidden among the boosts, and joined the trial debuff in `foodPenalty()` —
the single term any future debuff plugs into.

Fixed on the way: a colony that pushed past 1,000 inside a trial could take a
nuptial flight, silently leaving the trial *and* being paid jelly for it.

## 0.1.2.0 — 24 August 2026

**The founding generation gets something to do and something to lose.**

The queen's four wings survive the shed. One strips at a time for food, and they
are the only food that exists before the first workers emerge. Nanitics stop
being feeble: fed on her dissolved flight muscle they start at 6.0 against a
forager's 1.0 and halve every twenty minutes, hatch at double speed, and each
tends a brood chamber. Living Larder and Borrowed Time buy them time rather than
output, because a multiplier on a decaying base is a trap purchase.

Measuring killed the first version of this. Wings at 80 food, wings at 400,
nanitic base 6.0 and 12.0 all produced the same run — the first ten minutes are
brood-throughput bound, so every food lever landed in the one phase that could
not use it. What moved it was nanitics tending the brood, plus the forager egg
exponent coming down from 1.75 to 1.65.

1,000 ants: 114m → 93m idle, 64m rallying.

## 0.1.1.2 — 23 August 2026

**Clicks get through the sticky header.**

The second, independent cause of "I cannot buy upgrades". The header is
`position: sticky` and 101px tall, so anything scrolled into that band was
hit-tested to the header and never received the click — 14 of the visible cards
at the bottom of the Upgrades tab. Nothing in the header is interactive, so it
now passes every pointer through. The header background also stopped being
hard-coded, which had left it a near-black bar on the light theme.

## 0.1.1.1 — 23 August 2026

**Acting on the itch.io playtest feedback.**

`renderUpgrades()` re-appended all 29 cards every frame; `appendChild` on an
attached node removes it first, and Chromium then reassigns the pending click
target to its parent, so the click fired on the list and never on the card. Only
a click with mousedown and mouseup inside one 16ms frame got through — which is
what an autoclicker does and a hand does not. The sort now writes `style.order`.

Also: gates moved in to 16 / 64 / 256, the rally button arrived, a milestone line
names the next gate including the flight, achievement ladders were reshaped to
end on numbers a colony reaches, and the brood chamber became a window you can
read and destroy ranges from.

`MONSTER_REFERENCE` was split from `RAID_UNLOCK` so moving the raid gate did not
silently make every attacker 60% stronger.

## 0.1.1.0 — 22 August 2026

**Automation, sold rather than given.**

Nest Memory, Brood Instinct, Standing Orders and Granary Instinct join the Royal
Lineage. A Formulas panel in Settings shows every layer with live numbers. Egg
destruction, save export and import out of `prompt()` and into a panel, the
upgrade sort, protein priced in food, the records page, and the Matriline as the
lifetime clock.

A beaten colony now goes to ground instead of being ground to nothing: with no
soldiers the raids stop and foraging halves, which is a trade rather than a death
spiral.

## 0.1.0.0 — 21 August 2026

**Prestige Layer 1: the Nuptial Flight.**

At 1,000 ants the queen takes flight, the colony disperses, and Royal Jelly buys
the Royal Lineage. Achievements, peaks and jelly survive; everything else does
not. Gates were scoped to the run rather than to the player's whole history — a
brand-new colony was otherwise past every gate and facing a monster scaled to the
best nest the player had ever had.

## 0.0.4.0 — 20 August 2026

**Raids, soldiers and protein.**

A monster attacks on a timer. Soldiers fight from birth and hunt between attacks;
every other caste fights at nothing until the Combat branch arms them. Protein
feeds the brood and buys its own upgrades. Feeding the brood is a choice rather
than something the game does for you.

Also: achievements rebuilt as levelling tracks, the inspector, four nanitics,
formula-driven upgrade previews, the status and action columns, and a one-tab
save lock so a forgotten background tab cannot bury real progress.

## 0.0.3.0 — 19 August 2026

**Nurses, brood slots and the Big Forager.**

Nurses stopped being dead weight: only a few eggs develop at once and nurses
widen that, so throughput rather than hatch speed is the constraint. Big Foragers
hatch by chance from ordinary forager eggs and grow stronger with age.

Also: per-caste egg costs, exiling, tabs, sprites, themes, a named queen, and
credit for time spent in a background tab.

## 0.0.2.0 — 19 August 2026

**Upgrades, achievements and the cap softlock.**

One-time purchases in two branches, achievement tracks, and the excavator dig-out
rule — a colony that filled its cap with foragers was previously dead for good.

## 0.0.1.0 — 18 August 2026

**The founding phase.**

A mated queen who has already landed. Shedding her wings frees a finite pool of
reserves, those buy the first eggs, and the first four workers emerge as
nanitics whatever caste you chose. Foragers, excavators and nurses do their jobs.
