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
