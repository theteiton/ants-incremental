# Devlog

Every release, newest first. Versions are `epoch.layer.feature.fix`:

- **epoch** — stays `0` until the game leaves beta. **1.0.0.0** is the release
  where every system in the game is finished, documented and balanced. It used
  to mean "the last planned prestige layer ships"; the game is open-ended now,
  with layers shipping until they stop being worth building, so that definition
  would never have fired. See `ROADMAP.md`.
- **layer** — which prestige layer the work belongs to. `0` is the founding
  game before any prestige existed, `1` is the Nuptial Flight and everything
  built on it, and the Matriline will be `2`.
- **feature** — a new system or feature inside that layer.
- **fix** — corrections, balance and interface work.

---

## 0.2.6.0 — 31 August 2026

**The harness moves into the repo, and five rewards that paid nothing start
paying.**

**`node test/run.mjs` is the gate.** Twenty suites, twenty-eight seconds, plain
node with no dependencies and no build step. It used to be a scratch directory
that died with the session, so every check had to be rebuilt before it could be
re-run — and between them these suites had already caught all five of layer 2's
bugs, three population-cap bypasses, the founders'-chambers trap and two buttons
painted their own background colour. `test/` never ships: it is not in the
itch.io zip and `index.html` does not load it.

**`pacing` is the suite that matters when balance moves.** It plays the ordinary
run on a fixed seed and fails when any milestone drifts more than 10%. It
reproduces the recorded idle row exactly. Nothing in this release moved it: every
milestone is inside 1.4%, most at 0.0%.

**Three matriline trials.** The Blight, the Slave-Maker and the Repletes —
layer 2's missing length. Measured at levels 1 / 3 / 5: Blight 29.7 / 26.4 /
46.9m, Slave-Maker 73.0 / 61.0 / 55.3m, Repletes 40.9 / 31.5 / 89.0m.

Two of them were broken in ways worth recording. **The Slave-Maker was
unwinnable** — 30 ants after ninety minutes at every level — because dulosis
means no excavator can ever be laid, so nothing raised the cap. That is the
Polyergus bug again: the trial borrowed her restriction without the capture that
makes it survivable. And **the Blight was not broken at all; the measurement
was.** It read LOST at levels 3 and 5 through three retunings, because the
simulated player never exiled and exiling is the Blight's only cure. A trial
whose loop is a player action cannot be measured by a policy that never takes it.

**Five rewards that paid nothing now pay.** Measured, all eight instincts and all
six species passives moved a growth run by ×0.98–×1.00. Four of the instincts are
correctly scoped to combat, protein and the offline cap, which a one-hour
measurement cannot see; the five that claimed to grow the colony and did not now
also cheapen an egg. Deep Chambers ×1.035, Quick Larvae ×1.042, Wide Brood
×1.062, Deeper Chambers ×1.069, Gongylidia ×1.086.

**Eciton can fly on her own terms.** Her nomadic cap was 1,400 purely to clear a
1,000-ant gate. The gate is half a hard cap now, so she flies at 700 — and
earns less for it, because the payout still divides by the flat figure. The
payout function returned zero below that figure and would have paid her nothing.

**Destroying takes a count**, not only a whole batch. Open since Akami's report.

## 0.2.5.1 — 31 August 2026

**Two buttons nobody could read, in any theme.**

The assistant's **Do** button set `color: var(--accent)` on top of the base
button's `background: var(--accent)`. Accent text on an accent background:
**1.00:1**, the text exactly its own colour, in dark, light and soil alike.
Dismiss was 1.02–1.51:1 beside it. The same omission had hit the Matriline
species picker, where it blanked out the species you had just chosen.

Both wrote the second half of the game's outline-button pattern and not the
first: `.caste-choice` and `.subtabs button` set `background: transparent`
before recolouring the text, and these two never did, so they kept the filled
accent background underneath. Their `border-color` did nothing either, the base
button being `border: none`.

**A third one, found while checking the first two.** Every outline button in the
game inherited `button:hover { background: var(--accent-soft) }`, and `--dim` on
that measures **1.06:1 in dark**, 1.41 in light, 1.29 in soil — so the caste
picker and every sub-tab bar went unreadable under the pointer, which is the
moment they are being read. They hover to `--hover` now.

The rule this settles: **a control's legibility must not depend on `--accent`**,
because the accent is the one palette entry whose character changes between
themes — deep red in dark, light orange in soil — and no single text colour
reads on all three. Selection is marked by the border, which needs 3:1 rather
than 4.5:1 and clears it everywhere.

Measured after, worst of the three themes: the Do button 12.01:1, Dismiss 4.77,
the chosen species 13.26, any outline button hovered 4.87. A new suite parses the
palettes straight out of `style.css` and checks twelve control-and-state pairs
against the WCAG floors, so a palette edit that breaks a control fails instead of
shipping. Seventeen suites green.

Left alone and recorded: the filled primary button is 3.87:1 in dark. That is
every button in the game, so it is a palette decision rather than a patch.

## 0.2.5.0 — 31 August 2026

**Seven findings from reading all of it, worst first.**

**A colony is food-bound sixty minutes out of sixty.** Sampled once a minute for
an hour, `colonyBottleneck()` never said anything else — the cap, the brood and
the store never bind, because the egg curve outruns the food rate by
construction. Twelve of the twenty-four species nodes paid in exactly those
things, so they paid nothing: Fire ant's branch measured ×0.97 of her own food
rate, Carpenter's ×0.96, Honeypot's ×1.04. Fifty Haplotype for no change the
colony could feel. Each of those nodes keeps the effect it had and gains a
second, a fifth off the brood, which is the one lever that reaches the binding
constraint without being the global food multiplier the design refuses. After:
×1.37, ×1.37, ×1.84, against Eciton's ×2.47 and Amazon's ×59.9. The same finding
is waiting on the four Instincts that pay in cap, brood and hatch speed.

**Leafcutter was losing 89% of her output to a default meant for a different
animal.** The caste shares ship at the generic optimum and the automation lays to
them whatever the line committed to: 5% nurses reached 1,433 ants in an hour,
15% reaches 3,551. A species may now state her own, applied when the matriline
commits. 15% rather than her raw peak of 20%, because at 20% she stops being
garden-bound and her own branch — which buys garden — falls to ×1.03.

**The founders' chambers were still a trap.** +2 brood slots for 500 food at
minute 118, worth 0.00 at minute 121. It reads the lifespan rather than the
clock, so with Long Burning cleared it never warns at all, and otherwise it names
the deadline and greys inside the last five minutes.

**Twenty of twenty-three achievement tracks grew fractional rungs** — "next:
27.899 big foragers", "679,458.586 eggs". Fixed for levels and flights two
releases ago and nowhere else. Swept across 9,623 values: nobody loses a tier.

**The Upgrades tab cost 700µs a frame, and 1,683µs sorted by price** — against
92µs for the whole of Achievements, which is the tab that had just been made
fast. Every visible card rebuilt a probe colony and recomputed four aggregates
against it, three times over, sixty times a second, to draw a line that says
"Cap 5,000 to 5,800". Now 211µs and 124µs.

**`foodPerProtein()` was read twice per comparison** in the price sort: 613µs a
frame against 8.5µs with the rate hoisted out of the comparator.

**And the stats bar** was still writing all twelve of its values and eight hidden
flags every frame, whichever tab was open — the fault fixed everywhere else last
release, left in the one place that draws on every frame.

Sixteen suites green. The ordinary run is untouched: with no species the egg
discount is exactly 1, and a generic colony measures 3,369 ants before these
changes and 3,377 after.

## 0.2.4.0 — 30 August 2026

**An assistant, dots that say how many, and the library working again.**

**Pressing a library category did nothing.** Paginating it by category left the
render dispatch still testing `libraryTab === "terms"` — and `libraryTab` holds a
group id now, so `renderLibrary()` never ran once. The panel was there and never
updated. Mine, from the release before this one.

**The guide is a standing assistant.** It used to retire once soldiers unlocked;
it now hands over from explaining the opening to pointing at the next thing worth
doing, with a small ant standing in the box. Where that thing is one safe click
it offers to make it: strip a wing, lay an egg, rally the foragers, buy the
best-value adaptation you can afford, dig out when the nest is full. It never
acts on its own, and it never offers anything irreversible — exiling, destroying,
flying and resetting a matriline stay yours, and so does shedding her wings,
which is the one deliberate first click the game opens on. There is a switch for
it in Settings.

**The assistant stands in the queen's panel**, rather than in a bar under the
header above both columns. Everything she points at — the wings, the rally, the
milestone — is in that panel already, so she was the one thing furthest from what
she was talking about. She spans its full width, under the queen and her text.

**The milestone line covers every layer.** It ended at 1,000 ants and then said
deeper milestones were being built for the beta, which two layers later was not
true. It now names the Royal Lineage, the Matriline's jelly gate, the species
being played and how far off finishing her, and how many of the six are banked.

Also: headings had no air above them anywhere, because `.panel h2` carried no top
margin at all. The Matriline tab showed it worst with three of them, but it was
the rule rather than the tab, so the fix is on `.panel h2` and every panel gets
it — seven headings across Combat, Achievements, Nuptial, Matriline and Settings.
The sixteen that are the first thing in their container still sit flush.

**The Achievements tab was writing 440 DOM nodes a frame.**

Buying an instinct felt like it stuck, and the maths was not the reason: all 23
tracks cost 3.6µs together and `checkAchievements` 7.8µs. What was slow was the
drawing. `renderAchievements` set the className of every one of the 317 pips and
about forty text nodes on every frame, changed or not — 440 unconditional writes,
26,400 a second, each a style invalidation in a browser.

`setText`, `setClass` and `setWidth` skip a write when the value has not moved.
On a still frame the tab now writes nothing at all. The same treatment went to
the Matriline, which was the next worst at roughly 212 writes a frame across six
species cards and thirty-four tree nodes, and to the Trials, Library, Upgrades,
Units, Prestige and Brood renders.

Worth being straight about: node cannot measure this. A property write is free
here and expensive in a browser. The write count is real and the fix is the
standard one, but whether it feels better is something only playing it will say.

**The number goes inside the dot.** `.badge` was a 7px circle with no font size
and nothing to centre against, so a count written into it spilled out below the
baseline. That is an argument about sizing, not about where the number belongs:
it is a 14px flex-centred circle now, growing to a pill for a second digit and
clamped at 99+, with `:empty` falling back to the plain dot. Same footprint,
and it says how many — so Upgrades, Achievements, Prestige, Library and Matriline
now show the counts they were already computing and discarding.

**The Achievements head says what there is to spend.** The spendable figure only
appeared on the Instincts page, so from any other sub-tab there was no way to
know what you were holding.

**And a fuzz run**, which is a kind of test this game did not have: 24,000 random
actions through the real click handlers, in orders nobody would choose, with the
invariants checked every 200 steps. Nothing threw, nothing went negative or NaN,
no population passed its cap, the brood tally never drifted, the instinct pool
was never overspent, and the colony still saved and reloaded at the end.

## 0.2.3.0 — 30 August 2026

**The first playtest of the Matriline, answered.**

The rest of what Gyroth, Feliza and Human of Humanity reported. The two worst
faults are in 0.2.2.1 below; these are the ones that needed building rather than
repairing.

**The queue can be reordered.** Pick a batch in the brood window and move it to
the front of the waiting queue — never ahead of a tended egg, because those have
incubation paid into them. Measured on the reported case, a thousand foragers
laid ahead of twenty nurses: the nurses move from position 1,006 to the front,
the tally stays exact and no tended egg shifts. Destroying was the only way out
before, and it refunds nothing.

**An opening guide.** One instruction at a time, state-driven so it survives a
reload and any order things are done in, and it retires itself once soldiers
unlock. Its second step is where nanitics come from, which three separate people
asked inside their first ten minutes.

**Harder raids pay for themselves.** All four difficulties stripped the same
spoils, so the hard three were a dare with nothing on the other side — which is
why the raid economy read as not worth the protein it costs. ×1, ×1.5, ×2.5, ×4.

**The library is a page per category**, and the tab now opens with its head like
every other tab does. It opened with the sub-tab bar instead, with the head
nested a level deeper, which is why it appeared to move and change colour when
clicked.

**Every instinct card was unclickable.** `buildInstincts(onBuy)` captured the
buyer as a parameter and `buildAchievements()` runs during ui.js's module scope,
before ui.js sets it — so what every card closed over was the initial no-op. The
Instincts page shipped in 0.2.1.0 and nothing on it could be bought. Found by
being asked to explain how they are bought, which is the sort of question that is
worth answering by reading the code rather than the intent.

Also: one name per species rather than a Latin and a common one; **Hide maxed**
instead of Hide owned; the inspector no longer pinned over the brood by default;
dots on Tracks and Instincts; and Long Burning no longer implies a founder that
never fades.

## 0.2.2.1 — 30 August 2026

**The first playtest of the Matriline.**

Gyroth, Feliza and Human of Humanity played 0.2.2.0. Most of what follows is
theirs; the two worst faults were things no one could have seen without playing
a veteran save into the new layer.

**A matriline reset was taking 25 achievement tiers back.** The rule that a reset
must never cost a tier existed for the nuptial flight and was not carried up a
layer: the flights track read `prestige.flightsTaken` and the royal jelly track
read `prestige.royalJellyTotal`, and a matriline reset zeroes both. Measured on a
colony with 30 flights and 160,000 jelly, that was 8 tiers from one track and 17
from the other — which also shrinks the pool the Instincts are bought from. Both
read lifetime counters now, seeded on load so no save loses anything.

**"I don't like losing 160K royal jelly."** Retained Royalty kept a share capped
at the price of the lineage, so 160,000 became 43 for a node costing ten
Haplotype. The cap existed to stop the next matriline's gate being free — but the
gate and the wallet were the same field doing two jobs. The wallet is kept
uncapped; `royalJellyTotal`, which is what the gate measures, resets to nothing.

**"The matriline doesn't record the flights I have gained before."** It did not:
`matriline.flights` duplicated `prestige.flightsTaken`, and on a save that
predates layer 2 it started at zero. Thirty flights paid 4 Haplotype where they
should have paid 43.

**"I can't look at the egg details at 208K."** Measured at 208,006 eggs in 2,080
batches: 2,078 rows and 68ms a frame. But the rows were only half of it —
`broodCount()` is O(eggs) and `casteStock()` reaches it for every layable caste
every tick, so the tick alone cost 13.4ms at that size. The tally is counted once
and invalidated explicitly by the six places that add or remove an egg, verified
against a fresh walk 3,424 times. `pendingByCaste` 4.25 → 0.003ms,
`colonyBottleneck` 2.6 → 0.004ms, one tick 13.4 → 1.19ms. The window lists the
first 40 batches and stops walking once it has them.

**"The library dot never goes away."** `markSeen("library")` sat inside
`renderLibrary()`, which only runs on the terms sub-tab, so leaving the tab on
*What changed* never cleared it.

**"There is no way to go beyond 30."** There is — clears are per species now, so
the ceiling is 210 — but the softcap was generating fractional rungs (43.77,
73.46) on a count of whole trials, which reads as broken. Whole numbers now.

**"You don't need two names, Solenopsis and Fire ant."** Agreed. The common name
is the name; the Latin moved into the flavour line. And the header clock is
*matriline age*, because the word was doing duty as both a clock and a layer.

Also: **Hide owned** is **Hide maxed**, which is what it does, and the trials card
no longer says "All for good" of a reward that is half permanent and half not —
it says which half is which.

## 0.2.2.0 — 29 August 2026

**What happened while you were away.**

The colony kept working unwatched and the one-line note could not say the thing
that matters most: **how much of the absence actually counted**. Away for thirty
hours against an eight-hour cap is twenty-two hours the colony did not work, and
the line read "while you were away — 8h" as though that were the whole story.

The report says both figures, names what the cap cost, and names Crop Reserve and
Full Crop as the two things that lengthen it. Under it: food gathered, protein
rendered, ants hatched, the nest before and after, raids won and lost, and what
the colony is short of now — or, if she went to ground while you were gone, that
instead.

**The catch-up is not animated; the reveal is.** `load()` applies the whole
absence in one pass before any of this runs, so the colony is already in its
final state and what sweeps is the display — a clock running 0s to 8h over 1.6
seconds, eased so it rushes the middle and settles at the end, with the figures
counting up to numbers that are already true. Deferring the real ticks across
frames would let the player lay an egg halfway through the catch-up and land
somewhere the instant path never would, which is a divergence with no upside.

Measured on the real animation, driven frame by frame: 0s → 6h 0m across the
sweep, landing exactly on the true figure. A Skip button jumps to the end.

Gated at five minutes, with a switch in Settings under Colony rules — a
tab-switch should not produce a modal, and under five minutes the one-line note
still says what was gathered.

The library gained an **Offline progress** entry, which it had never had: what
the cap is, that away time runs through the same tick as everything else, and
that Crop Reserve and the Full Crop instinct both lengthen it. It expands once
the colony has actually come back to a working nest, read from a new
 counter rather than guessed from playtime.

## 0.2.1.1 — 29 August 2026

**Faster, and checked end to end.**

An optimisation pass and a full error sweep. No behaviour changed: the ordinary
run still paces at 1.2 / 3.1 / 7.1 / 22.8 / 41.4 / 60.9 / 87.9 minutes, to the
tenth of a minute, which is the whole point of the exercise.

**The effect walks are cached on `game.upgrades` identity.** They are O(lines ×
levels), and `foodPerSecond` reaches `globalFoodMultiplier` once per caste, so one
food rate was doing that walk nine times for an identical answer. The upgrades
object is replaced rather than mutated when a level is bought, so its identity is
an exact key.

Measured at 60,000 ants: `colonyBottleneck` 22.8 → 4.7µs, `foodPerSecond` 14.4 →
6.6, `combatPower` 7.7 → 4.1, one tick 57.7 → 34.9ms per thousand, and the pure
part of a render frame 0.078 → 0.027ms. The upgrade panel's previews went 0.70 →
0.29ms once the probes stopped being a fresh cache key every frame — they were
briefly 2.02ms, which is worse than no cache at all and is the more useful half of
that lesson.

**The game was never near its budget.** A frame costs well under a millisecond of
sixteen. This is headroom for the layers still to come, not a fix for anything a
player could feel, and it is worth saying so rather than implying otherwise.

**Two bugs, both found by sweeping rather than by playing.** `LIBRARY` had two
entries with the id `matriline` — the lifetime clock and the layer — so the second
shadowed the first and the discovered count was permanently one short. And
`renderMatriline` hid its reset box by reaching through `el("matDesc")
.parentElement`, which breaks silently the moment the markup nests differently.

**What was checked.** `ui.js` imported against a DOM built from the real
`index.html`, so every panel's build path actually runs: no exception, and every
element id it looks up exists. Then every tab, all six sub-tab bars and every
clickable card fired — no exception anywhere. All fifteen modules' imports
resolve. Every id table is unique and well formed. All fourteen CSS variables are
defined on `:root` and redefined in both themes. Saves from **v1 through v8** all
migrate, land on v8 and keep ticking; garbage, truncated and empty codes are
refused rather than thrown. Forty-eight hours of a mastered colony and
twenty-four of each of the six species: no NaN, no negative resource, no
population above its cap.

## 0.2.1.0 — 29 August 2026

**What the line keeps.**

Three changes, all about what survives when the matriline becomes something else.

**A mastery is earned once and kept by every line.** Reading it per species meant
food mastery fell from ×32 to ×1 the moment a line committed to a new species,
which punished the player for using the layer at all. Clearing a trial unlocks
its bonus and does nothing else; the per-species record still decides what a
species is finished on, so the ladders are still worth replaying and no longer
have to be. That also settles what the colony trials are for: a menu you take
from for the mastery this line is short of, not six ladders to grind.

**Each species has its own tab of adaptations**, four each, bought with Haplotype
and held for good, paying only while that species is playing. That is what keeps
their buffs from reading as one pile — and the species check enforcing it is
load-bearing, because Eciton and Polyergus share a capture key outright and each
one's branch had been silently buying the other's.

**Achievement tiers finally buy something.** Eight permanent instincts priced at
232 against a measured tier count of 131 at one hour and 192 at forty-eight, so a
player buys about five of eight early and finishes the set over a long game.
Spending never lowers the level: the level is computed from XP, and nothing in
`instincts.js` touches XP.

That last one exists because of a measurement. The six species passives — the
entire permanent reward of layer 2 — were worth **nothing** to a growth run: level
25 alone reaches 1,000 ants in 28.2m, level 25 with three species finished takes
30.2m, and with all six, 30.2m, identical to three. Every one of them paid into
combat, protein, salvage or the offline cap, and none touched food → eggs → ants,
which is the whole game. The rule that no reward may multiply all food was right
and I over-applied it; four of the eight instincts are scoped to cap, brood and
hatch instead.

**One crash, caught by the species sweep.** `export { foodPerProtein } from
"./raids.js"` creates no local binding, so Myrmecocystus holding Overflow threw
inside `tick()`. It fires for exactly one species holding exactly one node, which
is why nothing but a sweep would have found it.

Polyergus was trimmed twice on the way: her two new adaptations compound with
each other, and at a digger cap of 4 she reached 103,476 ants against about
24,000 for the field. At 2 she lands near twice it, which is what a species that
grows only by war should be.

## 0.2.0.0 — 29 August 2026

**The Matriline.**

The second prestige layer. The first run is common ants, exactly as it always
was; a matriline reset is where the line commits to a species and plays it out.

**The gate is the finished lineage plus a Royal Jelly total, and every trial
level the line has ever mastered cuts that total down** — 120 down to a floor of
30, three per level. Clearing trials is never forced and always worth it, which
is the shape asked for: the fast road to layer 2 rather than a wall in front of
it.

**The reset clears everything layer 1 gave the line** and hands back only what the
matriline tree has bought the right to inherit. That is what the tree's first
purchases are for; without them a second matriline replays four and a half hours
of finished content.

**Six species, each with two halves that are not the same kind of thing.** The
active half rewrites a mechanic and runs only while you are playing it; the
passive half pays at full strength for ever once the species is finished,
whichever line comes next. No matriline is wasted and no choice is regretted.
Atta farms a fungus and cannot eat what she carries; Polyergus lays nothing but
soldiers and takes her workers from raids; Eciton has no nest at all; Solenopsis
lays from several queens; Camponotus recycles nitrogen and cuts her chambers from
wood; Myrmecocystus keeps her whole store in the bodies of living ants.

**Atta is the one that answers the measurement.** On an ordinary colony a day in,
foragers carry 84.6% of all food and ten of the twelve adaptation lines move the
rate by exactly nothing — the game is one resource wide. Under Atta the garden is
the constraint and nurses are what widen it, so for the first time the thing the
colony is short of is not food. `GARDEN_YIELD` 2 and `GARDEN_PER_NURSE` 4 are
measured against the generic line: at yield 3 she peaks at ×4.73, which is a buff
rather than a rewrite; at 1.6 she peaks at ×0.24 and is never worth playing; at 2
she peaks at ×1.59 with a fifth of the colony nursing and runs ×0.01 if you play
her like a common colony. The response is that sharp because it compounds, so the
bottleneck line gained a `garden` case — without the colony saying which way the
constraint runs, the cliff is a trap rather than a puzzle.

**Trial clears are recorded per species**, so an Atta mastery pays only while the
line is Atta. Save v8 folds every existing clear under the common line, which is
exactly right. It only works because 0.1.8.0 made food-measured trial targets
scale with the food mastery held: a species starting its trials from nothing now
meets the same trial a mastered one does.

**Five bugs, all found by measuring rather than by reading.**

`refoundColony()` did not keep `game.matriline`, so the reset wiped the species
it had just committed to. Every symptom looked like a different bug — the species
would not commit, the shed was not inherited, the garden never widened, all six
species measured identically — and it was one missing line in the surviving set.

Three cap bypasses, all the same shape: an ant added outside the laying path does
not meet the cap check. Eciton's captures walked her column to 859 against a cap
of 500. Clamping them then left Polyergus unable to grow at all — 30 ants in a
nest built for 30, winning every raid — because dulosis means no excavator can
ever be laid, so a quarter of every capture is now somebody else's diggers. That
made her exponential, at **107,233 ants against about 6,600 for everyone else**,
because each captured digger raised the cap that sized the next capture; the
digger count is capped flat, so the nest grows a fixed amount per raid won and
the growth is linear in raids, which is what dulosis should be.

And the species branch nodes leaked across species. Second Queen raised the cap of
whatever line you were actually playing, and Eciton and Polyergus share the
capture key outright, so each one's branch silently bought the other's.

Also: under dulosis the soldier is priced on the forager curve, because she is not
an army raised on top of a workforce — she is the workforce, and at the soldier
price the colony reached 21 ants in an hour and then spiralled. Eciton's nomadic
cap is 1,400 rather than 500, because at 500 she could never reach the flight gate
and so could never earn anything at all.

The ordinary run is untouched to the tenth of a minute: 1.2 / 3.1 / 7.1 / 22.8 /
41.4 / 60.9 / 87.9 minutes, the same as before the layer existed.

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
