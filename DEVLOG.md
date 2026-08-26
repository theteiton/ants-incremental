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

## 0.1.5.1 — 26 August 2026

**Saying what clearing a trial is actually worth, and a level cap that derives
itself.**

The achievement cap is no longer a number to remember. It is one level above
what every XP in the game can buy — 34 today, against a highest reachable 33 —
so it is a bound rather than a wall: there is always one more level in front of
you, it can never be sat at, and it re-derives itself when a ladder is extended.
A hand-set cap of 20 was reached in half an hour and then paid nothing for the
rest of the run; this rules that out by construction.

The same fix went to the bonus. What the **top** of the ladder pays is now the
number written down — ×10 food, ×2.5 hatch, ×6 jelly — and the per-level rate
derives from it and the cap. It used to be a hand-set rate with the top falling
out of it, which quietly broke whenever the cap moved: extending the ladders
pushed the cap 30 to 34 and the food bonus ×2.81 to ×3.11 as a side effect nobody
chose. Raising the top raises every level with it, so a first run to 1,000 ants
went from 80 minutes to 57 — back-loading the curve would keep the opening, but
it cuts the bonus at middle levels that are live in saves, and no level may ever
pay less than it did.

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
