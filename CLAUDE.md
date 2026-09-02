# ants-incremental (Claude Instructions)

A browser-based ant colony incremental game. Hosted on GitHub Pages, played in a browser tab.

---

## Working style — read this first

**Do exactly what I asked. Nothing more.**

- One request = one change. If I ask for the egg counter, write the egg counter. Do not also add a settings menu, a dark mode toggle, an achievements panel, or a tooltip system.
- Do not "improve" or refactor code I did not ask you to touch. If you notice something worth changing, say so in one sentence and wait.
- Do not add features you think the game needs. Game design decisions are mine. If you have an idea, describe it in a sentence — do not implement it.
- Do not create new files without asking. Say which file you want to create and why, then wait.
- Do not add dependencies, libraries, CDN links, build tools, or config files without asking.
- Do not rewrite balance numbers, cost curves, or formulas unless I explicitly ask you to change balance.
- Do not add comments explaining what obvious code does.
- Do not write tests unless I ask.

**When a request is ambiguous, ask one short question instead of guessing and building something large.**

Prefer the smallest change that works. A twenty-line diff I can read beats a two-hundred-line rewrite that does the same thing.

---

## Claude-specific guidelines

- **CLI / Tools**: Keep bash/shell commands minimal and non-destructive. If running a static server, use `python -m http.server 8000`. Never install npm packages, bundlers, or toolchains.
- **Diffs**: Generate small, isolated, and readable diffs.
- **Focus**: Stay strictly within the scope of the user's prompt without introducing unsolicited boilerplate.

---

## Two agents, one repo

Claude Code and Gemini/Antigravity both work in here. Take the work you are better at and hand the rest over — the wrong one of you doing a job badly costs more than the handoff does.

**Claude takes the maths.** Formulas, balance curves, cost exponents, anything multiplicative — the `(base + flat) × multipliers` model and the factor tag every new upgrade needs. Invariants that only surface when two files are read together: a gate that turns unreachable when a constant moves, a death order that compounds with a scaling term. Save shape, migrations, and the one-tab lock. Anything whose failure is silent, where the game keeps running and only the numbers are wrong.

**Gemini takes what is judged by eye.** Claude cannot screenshot this game — its browser pane keeps the page hidden, so `requestAnimationFrame` never fires and nothing paints; it checks layout by reading `getBoundingClientRect()`, which proves two rows line up and says nothing about whether the screen looks right. So sprite art in `js/sprites.js`, spacing, colour, anything that needs looking at. Also the bulk mechanical work — renames, CSS, moving DOM nodes, README prose.

**Either can take** a small self-contained mechanic. If it touches the brood array, the save, or a cost curve, it is Claude's.

**Neither runs while the other is running.** One at a time in this repo — otherwise plain git conflicts, and the canon below is shared state.

**Whoever ships updates Current state in the same commit, in both files.** `CLAUDE.md` and `GEMINI.md` differ only in the title, the agent-specific block above, and which of the two the layout listing marks as "this file". Everything else is byte-identical on purpose: edit one, edit the other.


---

## Three documents, three jobs

`CLAUDE.md` and `GEMINI.md` hold what is **settled** — the design canon, the
measured numbers behind it, and the invariants that break if a constant moves.
`DEVLOG.md` holds what **shipped**, newest first. `ROADMAP.md` holds what is
**planned and still arguable**; nothing in it is canon until it lands, and when
it does it moves into these two files and comes out of the roadmap.

---

## Hard constraints

These are not preferences. Breaking them breaks the deployment.

- `index.html` lives at the repository root. Never move it into `src/`, `public/`, `dist/`, or anywhere else. GitHub Pages serves the root.
- No build step. No bundler, no transpiler, no npm scripts required to run the game. I must be able to open `index.html` and have it work.
- No frameworks. Vanilla HTML, CSS, and JavaScript only. No React, Vue, Svelte, jQuery, Tailwind, Bootstrap.
- No external CDN links, no fonts loaded from the network, no analytics. Everything ships from the repo.
- Plain `.js` files loaded with `<script type="module">`. No TypeScript.
- No server code. No backend. No API calls. The game is fully client-side and must work offline once loaded.

---

## File layout

```
index.html          entry point, root, do not move
style.css           all styling
js/game.js          state object, tick loop, exiling
js/prestige.js      prestige formulas, upgrades, flight reset
js/species.js       the six species: their actives, their passives
js/matriline.js     layer 2: the reset, the Haplotype, the matriline tree
js/instincts.js     what achievement tiers buy, and what they do
js/save.js          save keys, migrations, the one-tab lock, import and export
js/raids.js         combat strength, monsters, raid resolution, hunting
js/ants.js          castes, production, costs, upgrades
js/panels.js        shared fmt(), the inspector, ants and settings panels
js/prestige.js      prestige formulas, upgrades, flight reset
js/upgrades.js      upgrade panel, effect previews, lock text
js/achievements.js  achievement tracks, tiers, levels, achievement panel
js/challenges.js    the trials: debuff and reward curves, what each one does
js/library.js       the lexicon and the player-facing changelog
js/bestiary.js      the forty-nine creatures, their bands and the modifier words
js/hunt.js          the board, the march, held ground and the merged tiers
js/trophies.js      what is kept from what the colony beats
js/sprites.js       pixel art drawn onto canvas
js/ui.js            tab shell, header, brood controls, frame loop
test/               the regression harness -- plain node, no deps, never shipped
test/run.mjs        the gate: node test/run.mjs, or --slow for pacing and fuzz
CLAUDE.md           this file (instructions for Claude)
GEMINI.md           instructions for Gemini
ROADMAP.md          what is planned and not yet settled
DEVLOG.md           every release, newest first
README.md
```

Keep to this layout. Files are organized by feature domain. A file can comfortably grow to ~800–1,200 lines if it remains cohesive; when a major new system (e.g. prestige layers, automation) is introduced, suggest a new dedicated module (like `js/prestige.js`) before creating it.

---

## Code conventions

- Single global state object named `game`. All persistent values live inside it. No stray module-level mutable variables.
- One `tick(dt)` function drives all production. `dt` is seconds elapsed. Never assume a fixed frame rate.
- UI reads from `game` and renders. UI never mutates `game` directly — it calls functions in `game.js` or `ants.js`.
- Save with `localStorage` under the key `ants_save_v8`. Bump the version suffix when the save shape changes, and write a migration rather than silently wiping saves.
- Offline progress = elapsed wall-clock seconds since last save, capped, fed through the same `tick()`. Do not write a separate offline code path.
- Numbers: plain JavaScript numbers for now. When values exceed roughly `1e300`, tell me — we will discuss a big-number library then. Do not add one preemptively.
- Format displayed numbers through one shared `fmt()` function. Never format inline.
- Names in code match names in the game fiction: `reserves`, `eggs`, `nanitics`, `foragers`, `nurses`, `excavators`, `royalJelly`.

---

## Game design canon

This is settled. Do not redesign it. If you think something is wrong, say so in one sentence.

**Founding phase.** The game opens with a mated queen who has already landed. First click sheds her wings and grants a finite pool of `reserves` that never regenerates. She has four wings, so four nanitics — and the wings themselves survive the shed as something to work on. Eggs cost reserves. When the first workers emerge, reserves become permanently irrelevant.

**Nanitics.** The first worker generation is undersized and *unsustainable*. They are fed on the queen's dissolved flight muscle, so they work far above a forager's rate and fade as that runs out. This is intentional and biologically accurate — a founding generation really does work itself to death on borrowed resources — and it is not a balance bug.

**Castes differ in kind, not degree.** Never make a caste a strictly-better version of another one.

- Foragers — produce Food, the main currency
- Big Foragers — a rare oversized forager variant, never laid on purpose
- Nurses — increase the egg-to-worker conversion rate
- Excavators — increase the colony population cap
- Soldiers — fight raids, and bring back protein and food from what they kill

**Unlocks are gated by colony population, not by purchasing upgrades.** 16 ants unlocks Excavators, 64 unlocks Nurses, 256 unlocks Soldiers, 1,000 unlocks the Nuptial Flight.

**Prestige is the nuptial flight (Layer 1).** Unlocks at 1,000 population. Yields Royal Jelly based on population and raids won. Colony resets (food, ants, brood, standard upgrades, queen wings) while achievements, peaks, royal jelly, and prestige upgrades persist.

**No automation before prestige.** (Shedding her wings is automatic after the first flight; that is what prestige sells.) Nothing lays an egg, buys an upgrade, picks a caste or exiles an ant on the player's behalf. Every one of those stays a click. Automation is what prestige layer 1 upgrades will sell, so do not spend it early — passive production, hatching, raids and hunting are not automation, they are the game running.

---

## Current state

Last updated 25 August 2026. Published and playable at the Pages URL below.

**Built and working.** The founding phase plays end to end: the queen sheds her wings for 100 `reserves`, eggs cost 20 reserves each until the first worker emerges, the first four workers emerge as `nanitics` regardless of the caste chosen, and from then on eggs cost food and hatch into the selected caste. Foragers, excavators and nurses all do their jobs. Population gates at 16 / 64 / 256 are in.

**Prestige Layer 1 (Nuptial Flight)** is live. Gated at 1,000 population. The Nuptial tab sits between Achievements and Settings. Taking flight awards Royal Jelly based on `sqrt(peakPopulation / 1000) * (1 + raidsWon / 20)` and resets the colony into a new founding queen while keeping achievements, peak stats, Royal Jelly, and 8 Royal Lineage adaptations in `js/prestige.js`. Migration from save v5 to v6 is in. Two achievement tracks for flights and royal jelly are live.

**Egg cost is per caste**, each with its own curve — forager `1.5 x n^1.65`, excavator `15 x n^1.8`, nurse `60 x n^1.7`, soldier `200 x n^1.6`. One caste's count never moves another's price. The price counts eggs already in the brood as well as hatched ants, so laying a batch at once costs exactly what laying them one at a time would. Before that, a batch of 100 cost 50.5% less than the same 100 bought singly.

**Excavator dig-out rule.** At the population cap no egg could be laid at all, including the excavators that are the only way to raise the cap — a colony that filled its cap with foragers was permanently dead. Excavator eggs may now exceed the cap by up to 3 while they dig their own chambers. This rule was added to fix that softlock; change it and the softlock returns.

**Nanitics burn bright and fade.** Their base output is 6.0 against a forager's 1.0 and halves every twenty minutes, so the founding phase is a race to raise a real workforce before the founders are spent. They are capped at 4 — one per wing the queen shed — never scale with forager upgrades, and still die at the two-hour mark, but by then the decay has taken them to 1.6% and nobody notices: the cliff the old flat 0.9 ended on is gone. They also **hatch at double speed** and each one **tends the brood for a slot**, which is what a founding generation is actually for. The ants tab counts down what is left of them, in the cell that holds every other caste's Exile button — nanitics cannot be exiled, they leave on their own, so that space says when. It shows whether exiling is switched on or not.

**A caste row shows what that caste contributes, never the total.** The nurse row read `broodCapacity() - BASE_BROOD_SLOTS`, which was close enough while nurses were the only thing adding slots; the moment founders added four it credited the nurses with them and read `+5` for six nurses worth `1.5`. It reads `slotsPerNurse × nurses` now. Any row that reports a total will start lying the first time something else feeds the same number. Her 100 reserves still buy five eggs at 20 each, so the fifth hatches as the chosen caste rather than a nanitic.

**The four nanitic upgrades are gated 1 / 2 / 3 / 4**, because a four-ant generation can never satisfy a gate above four. The first two add flat food (+0.9, +1.2). **The last two buy time rather than output** — Living Larder and Borrowed Time each stretch the half-life, and the lifespan with it, because a multiplier on a decaying base is a trap purchase: you save 1,200 food for Borrowed Time and the ants it doubled are at 30% by the time you can afford it. Its name was always about lifespan. Extending the life alongside the half-life matters too, or a colony that paid to fade slower still lost its founders at two hours while they produced a quarter — handing back the exact cliff the decay removes.

**Brood slots.** Only a few eggs develop at once; the rest queue. Base is 3 slots, each nurse adds 0.25, each living nanitic adds 1, and the nurse upgrades raise the nurse figure. Incubation is 24s per egg, halved for the founding four. This exists because hatching speed was never the bottleneck — food was — so nurses were dead weight. Measured: a run that never buys nurses reaches 1,000 ants in 160 minutes with the brood saturated 99% of the time; buying them when the brood backs up reaches it in 108. Do not raise the base slot count much; every point of it makes nurses matter less, and at base 5 with 15s incubation they were worth 3 minutes across a whole run.

**The wings are the opening's only thing to do.** Shedding leaves four of them. One strips at a time — click, and it yields 80 food over ten seconds — and they are the only food that exists before the first nanitics emerge. The timing works out on its own: nothing is buyable during that window because the nanitic upgrades gate on nanitic *count*, so the food banks and pays out the instant the first three hatch and three upgrades unlock together. `foodPerSecond()` includes the wing so the header rate and the Formulas panel both show it, and `tick()` pays it only for `min(dt, wingStrip)` seconds — at an eight-hour absence the chunk is 48s against a 10s strip, and it would otherwise pay several times over.

**Food was never what the opening was short of, and measuring that killed the first design.** Wings, a 6.0 nanitic base and a 12.0 one all produced the same run: 1,000 ants at 111–117 minutes against a 114-minute baseline. **The first ten minutes are brood-throughput bound** — three slots at 24s is one ant per eight seconds whatever the bank says — so every food lever landed in the one phase that could not use it. What moved the opening was nanitics tending the brood (20 ants at 1m against 3m, 100 at 8m against 13m), and what moved the rest was the forager curve: rushing the opening front-loads `1.5 x n^exponent`, so the faster start alone pushed 1,000 ants *out* to 122m before the exponent came down from 1.75 to 1.65. Both were needed; neither works alone. The wings stayed because the ask was engagement, not speed, and they still deliver that — they simply do not show up in the table.

**Big Foragers.** A rare variant that hatches from ordinary forager eggs and cannot be laid deliberately. The k-th is guaranteed by the 3.5^k-th forager since the last one, with a chance that rises toward that threshold, so in practice the roll fires well before the guarantee — about ten appear over 750 forager hatches. Each produces 5x a forager's base and grows +5% per minute alive to a cap of 3x, so she starts strong and ages into something stronger. They are not exilable and stay hidden in the roster until the first one appears.

**Excavators are fewer, dearer and worth more, the way nurses are.** They were the cheapest population, the cheapest way past a gate and, with Gallery Wardens, cheap strength — Gyroth ranked them first of four and finished with a 5K cap he did not need. Each now holds 12 before upgrades and 58 after, against 6 and 29, and the curve is `100 x n^1.8` steepening to `n^2.2` past #17, which is where a colony first holds 1,000. Cap 1,000 costs 107,906 food against 108,330 before, so the first run and the prestige gate are untouched; cap 2,000 costs 2.4M against 739K, cap 5,000 costs 49M against 9.8M, and both need half as many excavators — which halves the Gallery Wardens strength that came free with them. Measured pacing barely moved: 1,000 ants at 129m against 126m, 2,000 at 210m against 201m. `eggPrice()` is the single source for the curve, because the cost and the "lay max" preview computed it separately and would have disagreed the moment an exponent broke.

**At the cap, the brood decides how far you can dig out.** The allowance was a flat 3 excavator eggs however many nurses you had. It is now the brood capacity, so nurses finally matter at the moment a capped colony is trying to grow.

**Big foragers are a pillar once the queen has flown.** They fade to about 4% of production because their count grows logarithmically while foragers grow linearly, and no multiplier fixes that shape — but a fixed step does. `bigForagerBonus()` pays 25x after the first flight: measured at 1,244 foragers they carry 74.8% of the colony's food, 48.0% at 4,000 and 31.6% at 8,000, so they dominate the early flight and the deep forager upgrades take it back later.

**Automation is bought with Royal Jelly, never handed over.** Three tier-one adaptations join the tree: **Nest Memory** (3) buys any adaptation the colony can reach and afford, and runs ahead of laying so upgrades get first claim on the food — it was limited to adaptations already owned once, which silently skipped the nine a player had never bought and read as broken; **Brood Instinct** (4) lays the chosen caste into every free slot; **Standing Orders** (6) chooses the caste itself, holding the share you set per caste and digging first whenever the nest is running out of room. Shedding her wings stays free with the first flight. Every one has a switch under Automation in Settings, and `automationOn()` is the single gate — unlocked, then not switched off.

**The laying switch lives in the brood panel, not in Settings**, because turning it off is a move you make during play rather than a preference you set once. With it on your food can never rise above the price of one egg — measured at a peak of 2,991 banked against a next egg of 3,071 — so any upgrade dearer than a single egg stays unbuyable until egg prices grow past it. Switching it off is how you bank for one, and the label says so.

**Granary Instinct (5 jelly) is the systematic answer to that ceiling.** It puts a food figure beside the laying switch that laying will not spend below, so the colony fills its brood out of the surplus and leaves the savings alone. Measured over fifteen minutes with laying on: without it, food peaks at 1,933 against a next egg of 1,997; with a 40,000 reserve set, it banks to 21,386 and lays nothing until it is above the line, then lays and stops exactly at it. Zero means no reserve, so the field is its own on and off. Eggs bought with the queen's reserves in the founding phase are never blocked, because that cost is not food.

**Automation never touches `game.nextCaste`.** Standing Orders decides what it lays through `autoCaste()` and lays that caste directly, so the caste you pick by hand survives and the Lay buttons keep working while it runs. Before this it overwrote your selection every tick.

Two rules keep them honest. **Brood Instinct tops up the tended slots only** and never builds a queue, because filling the queue would bury whatever the player lays by hand — the exact problem destroying eggs exists to undo. And **Standing Orders falls back to foragers once every share is met**; without that it kept laying whatever caste it last chose and overshot badly, measured at 29.5% nurses against a 10% target. With the fallback it holds 10.1% and 15.0% against targets of 10 and 15.

This is the rule in *No automation before prestige* being spent, as intended. Nothing exiles an ant or destroys an egg on the player's behalf, and nothing should: both are irreversible, and an automated mistake there is the silent kind.

**The brood chamber can be opened and read.** "See details" replaces the old destroy dialog with a window that lists what is actually in there: every tended egg with its caste, its `·fed` mark, a progress bar and the seconds left, then the queue behind them. The queue is not listed egg by egg — it is strict FIFO and it is laid in batches, so it collapses into runs (`#14–#46 · 33 × Forager`), which is what makes a 600-egg queue readable and matches how it was built. The window opens on the eggs waiting for a slot, which is exactly what the old button defaulted to. The ants tab carries the same information from the other side: each caste's count shows `+N pending` beneath it.

**Destroying is a range, and two saved settings decide which one.** *Scope* is waiting-only or any-egg-including-tended, and *direction* is this one and everything behind it, or this one and everything ahead of it. Picking a run always takes the whole batch — its first egg when reaching backwards, its last when reaching forwards — so "kill this batch and everything after it" is one click. **Waiting-only is the default and the tended rows say "protected"**, because a part-grown egg is incubation already paid for and destroying it is the irreversible mistake the feature exists to undo, not to cause; switching the scope back to waiting-only with a tended egg selected clears the selection rather than silently reinterpreting it. The dialog states what will go before you confirm — `Destroy 41 of 59 eggs — 33 forager, 8 nurse` — and a separate red line names how many are tended and how far the furthest had grown. Nothing is refunded, the same rule as exiling.

**One function mutates the brood.** `destroyEggRange(from, to)` clamps and splices; the old "take the last n" is a range like any other and goes through it. Two invariants live in the window rather than the model. The selection is stored as *which run*, not as an index, because eggs hatch while it is open and raw indices would slide onto different eggs underneath the player. And its rows are pooled and updated in place, never rebuilt, with selection bound to `mousedown` — this list redraws every frame while the window is open, and a node detached between mousedown and mouseup never receives its click, which is exactly what broke the upgrade cards.

It fixes the misclick; it does not fix priority, which is a separate feature — laying the wrong caste still means waiting or destroying. It also does not destroy part of a batch: runs are the unit, so trimming 10 eggs off a 400-egg queue is not yet possible.

**Exiling** removes ants from a caste with no refund. It is blocked when it would drop the cap below the current population, so excavators cannot be dumped to strand a colony above its cap. Nanitics cannot be exiled, a Settings toggle disables the feature, and it unlocks with the first forager. Because exiling lowers population, caste unlocks read a high-water mark — with a live count, exiling would re-lock castes already earned.

**Raids.** From 256 population a monster attacks every six minutes. Soldiers fight at 25 each from birth; every other caste fights at nothing until the Combat branch arms them — Alarm Pheromone gives foragers 1, Gallery Wardens gives excavators 10, Brood Defenders gives nurses 2, and big foragers fight at triple a forager. The branch only appears after the colony has survived its first attack, and the first three raids come at a quarter, half and three quarters strength so there is time to react. Win and the corpse is stripped for protein and a burst of food that runs through the same multipliers as foraging, so it keeps pace. Lose and ants die in order: soldiers first, then foragers, big foragers, nanitics, nurses, and excavators last so the population cap survives. Losses are capped at 20% of the colony and a lost raid still salvages some protein.

**A colony with no soldiers goes to ground instead of dying.** Losing the last soldier used to begin a death spiral: `DEATH_ORDER` kills soldiers first and foragers second, the timer never stopped, and salvage scaled with a defence that no longer existed — roughly ten raids from 1,000 ants to 107, twenty to 11, and Gyroth reached 80 defeats. Now `inHiding()` is true whenever raids are unlocked and the soldier count is zero: the raid timer holds at a full interval so nothing arrives, and `hidingPenalty()` halves all food while the workers keep to cover. Measured over two hours of neglect: 0 attacks, population held, foraging at exactly 0.50. Laying soldiers ends it with a full six minutes of grace. The debuff prints in the formula as `× hiding 0.50`, and the raid panel says what happened and how to end it. A colony that never raises an army is therefore choosing half food for permanent safety, which is a trade rather than a wall.

**Soldiers hunt between raids.** While no attack is near they are out of the nest bringing back protein every second; inside the last thirty seconds they come home and the hunting stops. Workers never leave, which is why they only ever fight defensively.

Monsters scale with peak population and grow 5% per raid won. Measured over a full run: 6% soldiers wins 19 of 32 raids and reaches 1,000 ants in about 80 minutes, 10% wins all 32, and a colony that never lays a soldier still gets to 1,000 on worker strength alone once the Combat branch is bought — slower and bloodier, but not a wall.

**Salvage is proportional to the fight you put up.** A lost raid returns protein scaled by how much defence you mustered, so a colony with no combat at all gets nothing from the corpse. Keep a losing colony able to recover if these numbers change.

**Protein** is the second resource, and raids and hunting produce it. Feeding the brood is a choice, not automatic: a toggle in the brood panel appears once protein exists, and while it is on each egg laid spends one protein and develops twice as fast. Turn it off, or run out, and eggs cost food alone at normal speed — so a colony that loses its soldiers is slowed rather than blocked. Fed eggs are marked in the brood slots. Protein also buys its own five-upgrade branch, gated on soldier count, covering fighting strength, protein yield, and three extra brood slots.

**Upgrades are twelve LINES with levels, not 29 one-time purchases.** Most of the old entries were the same upgrade at a bigger number — six forager yields, four excavator caps, four nurse slots — so each is one line now, and the flavour name, cost and gate of every old entry survives as a level of it. 12 lines, 29 defined levels, 21 Colony and 8 Combat, verified to produce magnitudes identical to the one-shot upgrades they replace. A line can be pushed **past** its defined levels, and that is what the trials sell: a trial declares a `mastery` type, and its cleared levels raise the cap on every line tagged with that type — Drought raises the three food lines, Endless Siege the four combat ones. Extended levels cost protein as well as food, which is the sink protein never had. They are deliberately worth less than the defined level they repeat: at full strength the colony line repeating ×2 five times was a ×32 global multiplier on its own and took population to 2.66M, twelve times what the same colony reaches without them. Split across two sub-tabs, Colony and Combat, with a coloured edge per branch, each level unlocked by a caste count, a total population, or surviving a raid. All of them are listed at all times: locked entries show what they need and how close you are, and separate toggles hide locked and owned entries. When those toggles hide everything the panel says why — an empty grid with no explanation reads as a broken tab, and a player with Hide owned ticked sees exactly that the moment every line is bought out. Both toggles live on the Upgrades tab only — duplicating them in Settings was asked for and then asked against. Available ones show what they do to your *current* rates, because the raw percentages mislead — caste-food upgrades share one additive pool, so the "+150%" forager upgrade actually delivers about +44% overall.

**Achievements are tracks that keep levelling**, not one-off badges. Sixteen tracks — colony size, food, eggs, each caste, raids won, fighting strength, protein, upgrades — each with a ladder of thresholds. Three of them count upgrades — all, Colony only and Combat only — and their ladders are generated from how many upgrades actually exist, so they always finish on the real maximum (29 / 21 / 8 today) and stay correct when upgrades are added. Every threshold passed is a tier, and **a tier is worth its own depth** — tier 1 pays 1 XP, tier 9 pays 9 — because the first rung of a track is a formality and the last is a grind. A level costs more than the one before it (`2 × n` XP, so level 5 costs 10 and level 30 costs 60). 181 tiers exist and they are worth 1,187 XP. **The cap is not a number to remember, it is derived**: one level above what every XP in the game can buy, which is 34 today against a highest reachable 33. That makes it a bound rather than a wall — there is always one more level in front of you, it can never be sat at, and it re-derives itself when a ladder is extended instead of having to be hand-edited. A hand-set cap of 20 was reached in half an hour and paid nothing for the rest of the run, which is the failure this rules out by construction. Under the old flat scoring, one point a tier and five points a level, a finished colony hit the cap in two hours; it now takes four. **A level, once reached, is never taken back** — `peakAchievementLevel` is a high-water mark seeded from whatever a save already carried, which makes any future reshaping of the ladders or the curve safe by construction. **A level pays a stated rate; the top is whatever the ladder reaches.** Food is ×1.0479 a level, hatch ×1.0274, jelly ×1.0643 — the rate is what a player feels, since every level is the same step up. At the cap of 34 that is ×4.91 food, ×4.68 at the highest level actually reachable. The cap is handed to `ants.js` by `achievements.js` rather than imported back, because that cycle would evaluate `achievements.js` before `UPGRADES` exists and throw.

**A level costs compounding XP.** `9 × (1.10^n − 1) / 0.10`, so level 1 costs 9 XP and level 33 costs 190. The old `n(n+1)` rose by a flat 2 XP a level, which is barely a curve once the ladders are long: at 235 tiers it would have run the cap out to 46 and the food top to ×8.7, undoing the reduction the 1.0479 rate was chosen for.

**The ladders are generated, not typed out.** Each states where it starts, where it tops out, and how far apart its rungs sit; `ladder()` fills in the rest and rounds to numbers a player recognises. The spacing is the interesting part and it comes from how fast that resource actually grows — measured on a finished colony, food accumulates ×2.13 an hour, protein ×1.92, fighting strength ×1.44 and everything population-linked ×1.32. A rung every two hours of late play means the step is that growth squared, so food rungs sit ×4.5 apart, protein ×3.4, strength ×2.05 and colony size ×1.7. Hand-typed ladders could not express that: they were all roughly decades or doublings whatever the resource did, which is why food and protein filled up within an hour while big foragers never moved. Four tracks — big foragers, protein, flights, trials — state a tighter step than their growth implies, because the old ladder was denser there and **no rung may ever be lost**. Swept across 1,452 values, no value scores fewer tiers than it did before. The trials ladder tops at every level of every *playable* trial rather than a fixed 5, which two open trials had already passed.

**A ladder does not end, and there is no level cap.** Measured, 13 of 23 tracks were dead by 24 hours — a full bar, "Every tier earned", paying nothing for the rest of the run. Past its stated rungs a ladder carries on at its own step, so a track always has a next rung and the readout is a tier count with no denominator. The level cap went with it: a level costs ×1.10 more XP than the last, so the ladder throttles itself — level 40 needs about ten times today's colony and level 50 about a thousand times, paying ×6.5 and ×10.4 food. Every cap the game has ever had was reached and then sat at.

**Past the designed top, each rung is `SOFTCAP_STEP` further from the last than the one before it.** The growth-driven tracks mostly police themselves — a step of growth-squared means every one earns half a tier an hour whatever its scale — but the tracks a player drives by hand do not. Exiling ants and destroying eggs are free and repeatable, and without a softcap they could be farmed for tiers forever. At 1.15 the extra rungs cost 10.8K exiles, then 77.6K, then 971K, then 6.2 billion: farmable in principle, pointless in practice.

**Six tracks watch things nothing else did**: soldiers trained, Phragmotic Guards raised, the deepest single upgrade line, matriline age, ants exiled and eggs destroyed. The last four are player choices rather than growth, so they state round numbers rather than measured ones, and they hold only 13% of the XP — a player who never exiles an ant still reaches level 34 of a cap of 36. Twenty-three tracks, 314 tiers.

**Generated ladders keep paying.** Before this, a finished colony had 12 of 17 tracks maxed by eight hours and its level stuck; now 3 of 23 are maxed at eight hours, 13 by a full day, and the level climbs 26 → 33 across it. The cost is pacing: denser early rungs mean more tiers sooner, so a first run to 1,000 ants lands at 59 minutes against the 80 it took before the achievement rework. The rate is the dial if that is too fast. Compounding is the incremental shape — the late levels are the ones worth chasing — and the tops sit about 25% above the old maximum. No level pays less than it did, which matters because these are live in saves. Tracks read peak values, so losing ants never takes a tier back, and the tab shows each track's next threshold.

**Every ladder now ends on a number a colony reaches.** They ran to 1e12 ants, 1e24 food and 80 big foragers — eleven of the sixteen tracks could not be finished and level 20 was unreachable, measured at 92 tiers and level 18 after fourteen simulated hours and six flights. The tops are set against a colony of about 10,000 ants and the rungs are dense where players actually stand, which is worth more than the range: the same run now scores 113 of 137 tiers and reaches level 20, and the same 3,000-ant colony that read level 13 reads 15. Two rules held while reshaping them. **No value may score fewer tiers than it did before** — shortening a ladder silently takes an achievement level, and with it the food and hatch bonuses, from a save that has already passed the old rungs. Swept across both ladders, every remaining crossover sits beyond anything reachable (1e9 ants, 1e13 food, 20 big foragers at roughly 690,000 forager hatches); the first two attempts failed this at 1,000 strength and 100 protein, which are ordinary mid-game numbers, because dropping a decade also dropped the rung underneath it. And **flights and royal jelly keep their old tops of 50 and 250**, because they are prestige-grind tracks rather than colony-size ones and a dedicated player really can pass them.

**Prestige Layer 1 (the Nuptial Flight)** unlocks at 1,000 *live* population and pays `3 × (population / 1000)^0.8 × (1 + raidsWon / 20) × achievement jelly bonus`, read from the colony standing at the moment of the flight. **The payout is not floored, and that matters more than the curve.** Under the old `floor(sqrt(...))` every flight paid exactly 1 whatever the colony did — tripling a run from 1,000 to 3,000 ants moved the raw value from 1.00 to 1.73 and still rounded to 1 — so pushing was punished, the optimum was to flight the instant the gate opened, and the 35-jelly tree took 35 identical flights over 18 hours. It now carries one decimal, and a 3,000-ant run genuinely pays 1.73 times a 1,000-ant one. Measured: a competent player completes the whole tree in **4.9 hours across 2 flights**. It must not read `peakPopulation`: that survives the reset, so paying on it let a player flight repeatedly with no ants and collect every time — measured at 25 jelly from 25 clicks on an empty colony, against a tree that costs 17. The flight clears food, protein, ants, brood, standard upgrades, raid counters and the queen's wings; Royal Jelly, the eight Royal Lineage adaptations, achievements, peak records, lifetime stats and settings all persist.

**Two clocks, and they are not the same.** `stats.playtime` is a lifetime total that survives every flight; `runTime` resets with the colony. The header reads `runTime` — it is labelled colony age, and a colony that has just been founded is not thirty hours old. Beside it sits **matriline**, the lifetime total, hidden until the first flight because before that it only repeats the colony age. Settings carries both, as *This colony* and *Matriline*. The nanitic lifespan reads `runTime`, because reading the lifetime clock meant every colony founded after the two-hour mark was born already too old — measured at 1 surviving nanitic and 1.90/s instead of 4 and 4.60/s, and worse with the prestige brood upgrades, since more eggs hatch into the same tick and die together.

**A flight must never take an achievement tier back.** The three upgrade tracks read `peakUpgrades`, and the raids track reads `stats.raidsWonTotal`, because `game.upgrades` and `raidsWon` both reset — without those, a flight cost 14 tiers and three achievement levels, shrinking the food and hatch bonuses permanently.

**Gates read high-water marks, and there are two of them.** `game.run.peak*` is the largest this colony has ever been and resets with the flight; `game.peak*` never falls. Caste unlocks, upgrade requirements, the raid unlock and `monsterPower` all read the **run** peak, so every colony re-earns Excavators at 16, Nurses at 64, Soldiers and raids at 256. Achievement tiers and the Settings record read the **all-time** peak, so nothing a flight does can take a tier back. Reading all-time for the gates meant a brand-new colony of zero ants was already past every gate with 22 of 29 upgrades open, being hit by a 1,712-power monster with 0 defence — the threat was scaled to the best colony the player ever had, not the one standing. Within a run the high-water mark still matters: with a live count a lost raid would hide upgrades mid-run, and the nanitic upgrades would become unbuyable the moment the founders died of old age.

**The layout is two columns, and everything persistent lives in the left one.** Queen, brood and inspector on the left; the tab bar and the tab itself on the right, starting at the top of the page. The brood used to sit *above* the tabs in the right column, which pushed every tab 551px down before it began — Ants was 4.2 screens and is now 1.1. Below 1000px it stacks.

**The columns stretch rather than start.** `align-items: stretch` is load-bearing: the inspector is `position: sticky; bottom` inside the status column, and with `start` the column ended where its content did, so the inspector ran out of column to stick to and scrolled away. Stretched, it holds the whole way down and can never reach across into the tab grid.

**Combat is three numbers in the stats bar and a tab of its own.** Fighters, next attacker and time to the next raid sit in the header — fighters reddens when it is below the attacker, the timer reddens inside the warning — and the Combat tab carries the record, the scales, the hunting rate and **who fights**, a per-caste breakdown that existed nowhere before. The raid panel it replaced was 249px in the left column.

**The stats bar is four ruled groups, not eleven readouts**: resources (food, food/s, protein, protein/s), colony (population, eggs), combat, lineage (jelly, colony age, matriline). The combat group hides as one before raids unlock rather than leaving an empty ruled-off section.

**Settings is five sub-tabs** — Colony, Automation, Formulas, Record, Save — the same pattern Achievements and Upgrades already use. It was one 2,282px column of everything; each sub-tab is now about 1.1 screens, and `renderFormulas()` only runs on the sub-tab that shows it.

**Every rate is `(base + flat) × multipliers`.** Hovering an upgrade shows its layer's formula with live numbers, the one factor that upgrade moves, and the before and after — `each forager = (base 1 + yield 1.25) × colony 1.25 × achievements 1.48 = 4.2/s`. Effects come in four kinds: `casteFlat` adds food to a caste's base, `casteFood` does the same but is stored as a share of that base, `casteMult` multiplies one caste, `globalFood` multiplies everything. A new upgrade must be tagged with the factor it moves or the formula stops matching the game. `fmtFactor()` prints those factors, because `fmt()` keeps three significant figures and would read a 1.25 multiplier as 1.3.

**Achievement tracks carry a dot and a pip ladder.** A track that gained a tier since you last pointed at *that track* shows a dot, cleared by hovering the row rather than by opening the tab — so the tab says which tracks moved, not merely that something did. Under each track is one pip per tier, filled for earned, so completed tiers read at a glance. `seen.tracks` records the per-track tier last looked at; a save written before it existed is seeded from current tiers, or every track lights at once.

**Protein and food are not comparable by their raw numbers.** Measured across a full run, one protein is worth between 5,700 and 18,400 food, and the ratio triples as foragers outscale the soldier count, so no fixed rate is honest. `foodPerProtein()` reads what the colony earns right now — hunting plus the raid's share against food plus the raid's food — and every protein cost is shown with its live equivalent, `2.00K protein (≈ 2.92M food)`. Sorting by price converts protein the same way, or the two currencies cannot share one order.

**The Upgrades tab sorts** by name either way, by price, and by the ants a gate needs, chosen from a control beside the hide toggles and saved with the colony. Sorting reorders the existing cards rather than rebuilding them.

**Achievements are two sub-tabs**, with the level and its bar above both. Tracks holds the sixteen ladders. Bonuses holds what the levels actually pay, one box each for food and hatch speed, and below them what a nuptial flight has unlocked.

**The queen sheds her wings by herself once she has flown.** This is the first automation in the game and the flight is what buys it — `autoShedUnlocked()` reads `flightsTaken`, and a Settings toggle turns it off. It does not lay an egg, buy an upgrade, pick a caste or exile an ant, so the rule that those stay clicks is intact.

**A Formulas panel sits in Settings**, not in a tab of its own — it is system information rather than something you act on. **Each formula is a total with its factors stacked underneath**, read down a column instead of parsed left to right; one `a × b × c × d × e` line was unreadable by the time a food rate had six terms. Factors are named by *kind* — `upgrades`, `achievements`, `trials`, `lineage` — and each expands to the individual sources, so the panel finally says *which* upgrades your ×1.88 is. Short labels are what let three cards sit side by side: the floor was set by card headers repeating the unit their title already gave, and dropping "93 **strength** each" to "93 each" took the minimum column from 278px to 235px. A first row shows **where the food comes from**, by caste, which is what a player actually wants from the panel. Rows appear only when they mean something, so a colony with no soldiers is not told about hunting. `monsterPower` is printed there too, which is the only place the raid scaling is visible — `next attacker = base 1000 × (this colony 700 / 400)^1.05 × wins 1.35 = 2.43K`. Its growth per win reads `MONSTER_GROWTH` so the panel and the raid cannot drift apart.

**The inspector** explains whatever you point at, and keeps showing the last thing so the text does not vanish when the mouse moves away. Everything is watched now, including every stats-bar readout and the queen and brood panels — before, only things in the right column answered.

**Hover-to-inspect only works if the inspector is visible without moving the mouse.** At the bottom of a 1,000px column it was not: reading a long note meant scrolling, and scrolling took the cursor off the thing being read about. It is sticky to the viewport on a desktop and stays in the flow on a phone, where a pinned strip would eat an 812px screen — phones get the detail inline on the cards instead. And because moving *toward* the inspector passes over other watched things, which swap the note before you arrive, **E opens whatever is currently shown at full size** over a blurred backdrop. A key needs no mouse movement at all. Escape closes it; it is ignored while a text field has focus.

**Interface** is seven tabs — Ants, Upgrades, Combat, Achievements, Nuptial, Trials, Settings — with the brood in the left column, so eggs can be laid from any tab. A dot marks Upgrades or Achievements when something new is waiting and clears when the tab is opened. Each caste and the queen have a pixel sprite drawn in JS onto a canvas; the brood shows one bar per tended egg, up to five, then a count of the slots working out of sight.

**Themes** are dark, light and soil, chosen in Settings and saved with the colony. Every colour comes from a variable on `:root` — including the background glow, the text on primary buttons, the card hover and the sticky header. Hard-coding the header cost the whole light theme: at `rgba(16, 11, 10, 0.92)` it stayed a near-black bar under dark-brown readout text, so food, rate and population were unreadable on two of the three themes. Hard-coding any of them breaks a theme: a fixed dark glow put a near-black blotch on the light background, fixed dark button text left 0.29 luminance against light-theme red, and a fixed `#2c1c19` hover turned an affordable upgrade card almost black the moment you pointed at it on light or soil. `--hover` is one step lighter than `--panel2` in each theme, so the card lifts rather than sinks whichever one is on.

**The queen can be named** in Settings and is addressed as Queen <name>. One queen per colony, always.

**`parseAmount()` is the inverse of `fmt()`.** The food-reserve field takes `25k`, `1.5M`, `1t`, `1e10`, `1,000,000` and whatever `fmt()` last showed there, using exactly the suffixes `fmt()` writes. Two rules keep it honest: the short form is only written back when it reads as the *same* number, or a reserve of 25,123 would redisplay as 25.1K and quietly become 25,100 the next time it was edited; and unreadable text returns NaN and is ignored rather than treated as zero, so a half-typed `1.` does not wipe the setting under the player's cursor.

**`shortAmount()` is what an editable field displays.** `fmt()` cannot do it: three significant figures turns 9,999,999K into 10.00B, a different number, and refusing the short form on that ground leaves a ten-digit string in a narrow box. `shortAmount()` walks down from the largest suffix and takes the first that reads back exactly, so `1000k` settles to `1M` and 25,123 to `25.123K`, and nothing ever drifts.

**Two broad late-declared CSS rules outrank any single-class selector.** `.panel p` scores (0,1,1) and `.modal-box` is declared at the bottom of the file, so a bare `.milestone` margin and a bare `.inspect-box` width were both silently thrown away — the milestone sat flush against the rally row, and the inspect modal came out phone-width on a desktop. When a style does not apply, check specificity against those two first.

**Display rules.** `fmt()` keeps three significant figures — 1862 reads as 1.86K, not 1.9K — and rolls the suffix over when rounding carries (999999 is 1.00M, not 1000K). Costs read green when affordable and muted when not; red never means "you can afford this".

**Background tabs are credited.** `requestAnimationFrame` does not fire in a hidden tab, so the frame loop feeds the whole elapsed gap through `tick()` in chunks, clamped to the same eight hour cap as offline progress. Capping a frame at one second instead threw away 99.8% of a ten minute absence.

**Export and import are a panel, not a `prompt()`.** A finished colony's save code is enormous — measured at 12,412 characters for a 2,400-ant nest with its brood full, and 26,756 with a 300-egg queue. `window.prompt()` cannot carry that: browsers truncate the default value, a single-line box cannot be selected reliably, it is hopeless on a phone, and a sandboxed iframe without `allow-modals` returns null outright, which is what broke importing inside the itch.io embed. Both now open a modal with a textarea, a copy button that falls back to "it is selected, press Ctrl+C" where the clipboard API is not granted, and a character count so a short paste is obvious. A truncated code fails with a message naming that cause instead of a bare "not valid". Erasing the colony asks twice on the button itself for the same reason — `confirm()` returns false in a blocked embed, which made the button look dead.

**Only one tab writes the save.** Opening the game claims a `localStorage` lock keyed to that tab; the most recently opened tab owns it and every older tab stops saving, so a forgotten background tab can no longer overwrite real progress when it closes. The stale tab shows a red banner with a "Play here instead" button, which reclaims the lock and reloads from the authoritative save rather than pushing its own state over it. A lone tab with no lock present always saves, so a fresh browser is unaffected.

**Pacing.** Milestones under strong simulated play, so a human runs slower:

| ants | 20 | 50 | 100 | 250 | 500 | 1000 | 2000 |
|---|---|---|---|---|---|---|---|
| idle | 1m | 4m | 8m | 28m | 54m | 93m | 145m |
| rallying | 1m | 3m | 6m | 18m | 38m | 64m | 99m |

Against a pre-wings baseline of 3m / 7m / 13m / 28m / 62m / 114m / 197m. The first flight lands at 93 minutes idle and 64 rallying, both inside the two-hour target.

The opening is slower than it was (20 ants in 2.9m against 1.6m) because brood slots cap early throughput. That is the price of nurses mattering — the two trade directly against each other.

Upgrade unlocks are spaced against measured caste counts so a reward lands every few minutes; the worst gap is about 15 minutes, down from 65.

**The tree ends, and the game says so.** With all twelve adaptations bought there is nothing left to spend Royal Jelly on, and a flight still pays around 25. Running out of content silently reads as a bug, so the Nuptial tab prints a line once the lineage is complete: what is banked, that jelly keeps gathering, and that deeper layers are being built for the beta. Keep it honest if more layers land — it is the last thing a finishing player reads.

**Upgrade cards are ordered by CSS, never by moving them.** `renderUpgrades()` re-appended all 29 cards every frame to apply the sort. `appendChild` on a node already in the tree removes it first, and Chromium then reassigns the pending click target to the removed node's parent — so the `click` fired on `#upgradeList` and the card's own handler never ran. An upgrade was only buyable if mousedown and mouseup both landed inside one 16ms frame, which is exactly what an autoclicker does and exactly what a hand does not; CoolRadGamer and sir_pinski both reported it as needing rapid clicking, and CoolRadGamer guessed the cause correctly. The sort now writes `style.order`, which reorders grid items without detaching them. Measured at 0 childList mutations across 10 renders, against 290 before. **Anything rendered every frame must mutate its nodes in place and never reparent them** — this is the failure mode to check first when a control needs clicking twice.

**A stuck header ate the clicks underneath it.** This was the *second* cause of "I cannot buy upgrades", and it is independent of the render bug. `header` is `position: sticky` and 101px tall, so anything scrolled into that band was hit-tested to the header rather than to itself and the click never arrived. Measured with `elementFromPoint` at the bottom of the Upgrades tab: 14 of the visible cards resolved to `HEADER` or `H1`, and the same held for the Lay buttons, the rally button, the tab bar and the caste chips. Because the header is 92% opaque the card underneath is still faintly visible, so it reads as a dead button rather than as something covered. Nothing in the header is interactive — it is an `h1` and a row of readouts — so it now carries `pointer-events: none` and every pointer falls through; measured at 0 blocked controls against 14. The two failures need different tests: the render bug needed a *fast* click, this one needs the control not to be near the top of the viewport. When a control will not take a click, check both.

**The population gates moved in to 16 / 64 / 256.** They were 25 / 100 / 400, and the first thirteen minutes held exactly one decision — lay foragers — because Excavators were the first fork and they were 25 ants away. Measured under one fixed policy, old gates against new: 1,000 ants at 132m against 114m, 2,000 at 215m against 197m, with the opening (20 / 50 / 100 ants at 3m / 7m / 13m) untouched because it is brood-slot bound rather than gate bound.

**The raid gate moved with the soldier gate; the threat curve deliberately did not.** `monsterPower` divided by `RAID_UNLOCK`, so dropping that to 256 would silently have made every attacker about 60% stronger at any given population. `MONSTER_REFERENCE` is now its own constant pinned at 400 — the size of nest the base 1,000-power monster is tuned against — and both `monsterPower()` and the Formulas panel read it. A colony of any given size therefore meets exactly the attacker it met before; only the first one arrives sooner, at a quarter strength, against an army that now has room to exist. Keep the two constants separate: fusing them again re-couples difficulty to a gate that is a pacing decision.

**Rallying the foragers is the one thing a hand can do to the food rate.** A button in the brood panel puts foragers on ×3 for 30 seconds and then rests them for 90, so a player who works it holds about ×1.5 on average against an idler's ×1. Measured over six hours on one policy: 1,000 ants at 85m rallying against 114m not, and 2,000 at 144m against 197m. It is a multiplier on foragers alone, which means big foragers ride on it — they read `casteFoodPerSecond(game, "forager")` — and the founding nanitics do not, because they are not out on the trails to be called back. `foodFormula()` prints `× rally 3` while it runs; a formula that does not match the rate is worse than no formula. The cooldown starts when the boost ends, not when it starts. It is not automation: nothing presses it for the player.

**The colony says what it is growing towards.** A milestone line under the queen names the next gate and the distance to it — 16 for Excavators, 64 for Nurses, 256 for Soldiers and the first monster, 1,000 for the Nuptial Flight. The flight was the only gate in the game that hid its own existence: the Nuptial tab stays hidden until you reach 1,000, so the entire explanation of the game's first prestige lived inside a tab the player could not open, which Akami reported as the reason a first run would never push for it. The line reads the **run** high-water mark, the same figure the gates read, so a lost raid never walks it backwards. Past 1,000 it says every milestone is behind her and that deeper ones are being built, in the same spirit as the finished-lineage line on the Nuptial tab — running out of content silently reads as a bug.

**The caste-share defaults are at the measured optimum, and a short measurement would have moved them the wrong way.** Ranked by population at five hours with Standing Orders driving, `nurse 5 / soldier 8` tops the table at 10,716 and the next three sit inside 0.4% of it — noise. But a *two-hour* sweep crowns `6 / 5` instead, reaching 1,000 ants in 20.0m against 22.4m, and that colony finishes five hours on **21W/27L**: monsters grow 5% per win *and* scale with the colony, so a thin army is fine right up until it is not. `6 / 3` ends 9W/39L. The band, not the peak, is what matters: under 7% soldiers wins the early raids and loses the late ones, over 10% never loses one and costs the ants that would have fed it, and nurses past about 7% are ants that do not forage now that the founders tend the brood. **Excavators want no share at all** — the cap-pressure rule digs exactly when the nest is tight, and a 5% excavator share builds cap 25,121 for 8,215 ants and costs 23% of the colony. **Foragers do nothing below about 85%**, because they naturally sit near that share and a met target never wins a deficit: 0%, 70% and unset are the same run. At 80% they start winning early contests and reach the flight gate 10% sooner for the same raid record; at 90% they outbid soldiers, the army falls to 6.2% and the first raid loss moves from 250m to 191m. The Settings ratio fields print all four figures, because none of them are guessable from play and the failure arrives an hour after the mistake.

**Trials are the layer-1 challenges, and Royal Jelly buys the door.** **The Trials** is the thirteenth adaptation at 8 jelly, so the tree that used to end with "there is nothing left here to buy" now ends by opening a tab. Entering one founds a colony under conditions that should kill it. All six are playable: Drought, Sealed Nest, Barren Brood, Endless Siege, Sterile and the Nanitic Line. Every card states its debuff, its target and both its rewards as numbers, and the hover lists what a trial takes, what comes with you, what clears it and what clearing pays — players could not tell that the lineage stays behind at all, and asked.

**The lineage's automation comes with you; its strength does not.** `prestige_1`–`8` return neutral inside a trial, `prestige_9`–`12` do not. **Everything earned on the Achievements tab still pays**, including the ×25 for big foragers — it is earned rather than bought, and the Bonuses page saying the colony knows how to feed an oversized forager while it silently did not was a contradiction. It is also the single biggest lever in the feature: nine big foragers carry 79–86% of a trial colony's food, and un-suppressing them took level 1 from 96 minutes to 19. Tedium is not difficulty, and six trials of manual laying is not a challenge — it is the same challenge six times with the fun removed. `prestige.js` reads `game.challenge` directly for that check rather than importing `challenges.js`, which imports it back.

**Each trial asks for the thing it is about, and the debuff carries the difficulty.** The target no longer moves between levels of one trial, but it does differ between trials: asking a combat trial for 600 ants tested growth rather than the siege, and you could clear it by outrunning the attacks. Drought asks for 600 ants; Endless Siege asks you to win 15 raids without the nest falling. Drought runs `0.25 × 0.36^level` and stops at **five levels**, then the trial is mastered and closes rather than grinding on. Measured across three seeds: 28–30m, 32–34m, 34–37m, 39–41m, 42–46m — five sittings inside an hour with a real ramp.

**Clearing pays twice, and the halves are deliberately different shapes.** The trial itself pays `1.1^levels cleared`; the achievement — **Deep Cisterns**, its own box on the Bonuses page — pays `2^deepest level reached`, read from a lifetime stat so no reset can take it back. **Both apply inside trials as well as outside, or there is no race**: each level would be strictly harder with nothing to meet it and the ladder would stall at two. Net difficulty runs 25.0%, 19.8%, 15.7%, 12.4%, 9.8%.

**The debuff scale has to beat the doubling.** At `0.44` the drought and the ×2 mastery cancelled almost exactly and level 5 came in *no harder* than level 1 — a ladder whose last rung is the easiest. `0.36` restores the ramp.

**A trial's reward has two halves and the cards only named one.** Clearing a
level pays its achievement — Deep Cisterns, Hardened Line — and *also* raises the
max level of every upgrade line that trial pays into: Drought lifts the three
food lines, Endless Siege the four combat ones. That second half went unmentioned
on the card and in the hover, so a large part of what clearing is worth was
invisible. Both now say it, and the line names are read from the `mastery` tags
rather than written out, so they cannot drift when a line is added or retagged.

**Each trial gives back the thing it took.** Drought starves the colony and pays in food; Sealed Nest would pay in population cap, Barren Brood in brood slots, Endless Siege in soldier strength. A trial declares `mastery: { type, step, name, desc }` and the bonus box, the hover, the card line and the formula term all follow from it — only the consuming site needs wiring per type. **Sterile's restriction is the twenty-nine bought upgrades**, not the lineage, because every trial already leaves the lineage behind and Akami spotted that this left Sterile with no identity of its own.

**One place takes food away.** `hidingPenalty` used to sit inside `globalFoodMultiplier`, a penalty hidden among the boosts. It now lives in `foodPenalty()` with the trial debuff, and that is the single term any future debuff plugs into. The formula prints both halves — `× trials 1.69 × drought 0.14` — because a rate the formula does not explain is worse than no formula.

**No alate leaves a trial.** `doFlight()` refounds the colony, which clears `game.challenge` as a side effect, so a colony that pushed past 1,000 inside a trial could have left through the Nuptial tab and been paid jelly for it. `flightReady()` returns false while one is running and the Nuptial tab says why.

**A trial is claimed, never taken.** Meeting 600 ants shows a Claim button rather than dissolving the colony where it stands — a nest that vanished the moment it crossed a threshold would be a nasty surprise in the middle of a run. Entering and abandoning both arm on the button itself, the same two-step the erase button uses, because `confirm()` returns false inside a blocked embed. `refoundColony()` is now the one function that founds a new colony; the flight, entering a trial and leaving one all call it and differ only in what they set afterwards. Cleared levels survive flights and live in `game.challenges`.

**Not built.** Prestige layers beyond the second. A competent player finishes the Royal Lineage in about five hours and then has Drought to climb, so that is the current edge of the game.

**Soldiers have ranks, and every grade fights harder and hunts worse.** Soldier, Major (×3 strength, hunts at 50%), Supermajor (×9, 15%) and Phragmotic Guard (×25, never hunts — her head is a living door, which is a real ant). That trade is what keeps the rule that a caste is never a strictly better version of another one: an army of nothing but guards fields enormous strength and brings home no protein, which is the protein that trained it. Every rank counts as a soldier for egg price, upgrade gates and achievement tracks, or promoting one would discount the next soldier egg and re-lock Combat upgrades the army had already passed.

**Veterancy is free but capped at Major.** Surviving a raid promotes 3% of the rank and file. Measured without a ceiling it was a disaster — 4% a raid over 118 raids turned the whole army elite on its own, 13.2K guards of 28.1K bodies fielding 37.5M against a 2.8M attacker. Supermajor and Guard are bought only in the **Units** menu, with protein, and training kills 10 / 20 / 35% of the batch. Free progress has to have a roof or the paid ladder above it is decoration.

**A won raid now costs soldiers**, scaled by how close it was — overmatch and you walk away nearly whole, barely hold and you are chewed down. That is what makes a rank worth buying rather than a number worth meeting.

**The Units menu is bought with a trial, not a resource.** It opens when Endless Siege is cleared once: the trial that demands soldiers is the one that teaches the colony to make better ones. Combat is three sub-tabs now — Overview, Units, Trade.

**Endless Siege.** Attacks from 16 ants, one every ninety seconds, and soldiers unlock at 16 too or it is unwinnable by construction. Win 15 raids and **one defeat ends the run**. It pays **Hardened Line**, ×2 soldier strength a level. Three things had to be fixed for it to work at all, and each looked like balance until it was measured: hiding stopped the siege dead (lose three, shut the nest, grow in peace — every level cleared in twelve minutes), the ×2 soldier mastery outran a 1.3 level scale so level 5 came in *easier* than level 1, and the 20% loss cap tuned for six-minute gaps is far too gentle at ninety seconds. The scale is 2.8 against the doubling, a defeat costs half the nest, and a siege gets a five-step run-up because the ordinary three-step ramp put a cliff at raid four. `SIEGE_BASE` is 120, measured: 30% soldiers clears level 1, 45% clears levels 1–4, 60% clears all five, and 45% *with ranks trained hard* also clears all five — two real routes to finishing. Training only pays on a thin cushion; a player who waits for a 1.8× margin never trains at all.

**The raid clock belongs to the trial.** Entering a trial refounds the colony, which reset `raidTimer` to the ordinary 360s, so the first attack of a ninety-second siege arrived six minutes late and only the raids after it used the trial's clock. It is clamped to `raidInterval(game)` every tick, which also covers a save that predates the trial.

**Monster growth per win is capped at 25 wins.** It compounded forever, so a colony that kept winning met a threat no army could hold: measured over 24 hours, defence parked at 0.95–0.97 of the threat for hours, the colony lost 192 raids in a row and fell from 152K ants to 41K. There is a cliff — at 40 (identical to uncapped) the colony stalls at 33 wins and spends 69% of the run gone to ground; at 25 it wins 118 of 118. **Hiding also triggers on three straight defeats**, not only on the last soldier dying, because a colony losing every raid with an army still standing got no reprieve at all.

**Food and protein trade in the rendering pit**, at the live `foodPerProtein()` rate keeping 80% each way, so a round trip returns 64% and there is no loop. Neither side credits the lifetime *gathered* totals: crediting them let a player cycle food through protein to farm the Food gathered ladder, losing food but banking tiers.

**An inspector note is toned by the section it sits under** — what a thing costs you reads as a cost, what it pays reads as a gain. The renderer reads the ALL-CAPS headers the note already writes, so it applies to every note at once rather than to the trials alone.

**The stats bar must not reflow as the numbers change.** Measured across 155 viewport widths: the four groups swung between 1,264px and 1,450px of intrinsic width purely because `fmt()` changes character count, and the row count flipped at 36 of them. Each value now reserves what it can ever need, in `ch` so it follows the font size, with `tabular-nums` so the digits do not jitter inside it — 0 of 155 afterwards.

**Every trial is playable.** Six of them: Drought, Sealed Nest, Barren Brood, Endless Siege, Sterile and the Nanitic Line. Each takes one thing away and pays that same thing back, and each declares a `kind` for its debuff, a `target` for what it asks, an optional `fail` condition and a `mastery` for what clearing it is worth — so a trial is data plus one hook per kind rather than a special case. **Sealed Nest** lets excavators dig nothing and shrinks the base nest each attempt, so it asks for a food *rate*: a colony that is not allowed to grow cannot be asked for a headcount. **Barren Brood** gives nurses no slots and runs the chambers colder each attempt, making growth time-bound rather than food-bound. **Sterile** allows only 10 / 7 / 4 / 2 / 0 bought adaptation levels at once and pays back with +1 max level on *every* line and ×1.25 to every adaptation's effect — the only mastery that gives back the strength of what you buy. Measured across five levels: Barren Brood 12–50m, Sealed Nest 10–34m, Sterile 19–69m.

**The Nanitic Line was never as blocked as the note said.** Its shape is that every egg hatches as a founder and each founder shortens every other founder's half-life, and a decay that rises with the count needs no per-ant ageing at all. Nothing dies of old age inside it — the colony shares one clock, so a lifespan would end every ant at the same instant — they fade towards nothing instead. Two things had to change to make it work. Crowding bites on what a founder *gathers* as well as on how fast she fades, because a shorter half-life is a weaker lever than a doubled output and lost to the ×2 mastery every time, leaving the last level easier than the first. And it asks for **food gathered by this one colony**, which needed a new per-run counter: a rate is met in the first minute by a handful of ants, and the optimum here is *few* ants. What each level really sets is how much can be extracted before the line burns out — 279K / 203K / 130K / 77K / 43K against a 38,000 target. It is the shortest trial in the game at about three minutes a level, and it stays short because the half-life is twenty minutes and nothing extends it any more; a longer sitting means a longer half-life inside the trial, not more crowding.

**Long Burning gives back exactly what the Nanitic Line takes.** The first clear stops the founders dying of old age in every colony afterwards. Every level after that makes a founder better at *everything* she does rather than at foraging alone — she gathers and she tends the brood, so both scale. ×1.6 a level, because it multiplies several things at once.

**The founders' line buys chambers, not time.** Living Larder and Borrowed Time used to stretch the half-life and the lifespan with it; Long Burning hands the lifespan over free, which left them selling something a trial gives away. Each now adds to what a founder tends — 1 → 1.5 → 2.5 chambers, taking four founders from 7 brood slots to 13. It is also no longer the trap the old line was written to avoid, because chambers do not decay while you save for them. The id stays `nanitic_vigour`: saves store levels against it, and the migration from the retired `nanitic_3` and `nanitic_4` maps onto it.

**How hard raids are is a choice, and the bonuses were left alone.** A colony that has mastered every trial outguns the next attacker by about 350×, because the soldier mastery and the adaptation strength both compound while the threat only follows the nest's size. Cutting what a trial pays is the wrong lever — it is earned — so the ceiling comes off by choice instead. Four settings on the Combat tab, unlocked by clearing Endless Siege once: **Sheltered** (the default, growth capped at 25 wins), **Unchecked** (never capped), **Hunted** (uncapped, and the attacker knows what Hardened Line has taught you) and **Relentless** (as Hunted, with a steeper nest-size exponent). Measured on a mastered colony: 348× / 198× / 7.5× / 4.6×. Uncapping alone barely helps, because the win term is linear against multiplicative masteries — it is a slow burn that only matters over a very long run.

**The nest is attacked by something, not by a number.** Twenty-one named attackers with descriptions, drawn from the band their strength falls in and three deep so there is variety: real ant predators — phorid fly, antlion, assassin bug, army ant raiders, pangolin, aardvark, giant anteater — for as long as the colony is a plausible size, and then basilisks, wyverns, chimeras and dragons once a nest holds millions. The raid report names what broke through.

**The Library is the answer to "I understand less than half of that".** A playtester who had reached 187,000 ants said exactly that, and the explanations were not missing — they lived in hover text he had no reason to point at. Its own tab, unlocked by the colony's first achievement tier, holding 32 entries in six groups. An entry becomes *known* when the thing it describes is available and *expands* once the colony has actually done it, so a short definition arrives in time to be useful and the full one arrives when there is something to attach it to. Nothing undiscovered is listed at all. Beside it sits **What changed**, a player-facing changelog — deliberately not the devlog, which records why a decision was made and what was measured for whoever maintains the game.

**The changelog has to name what shipped, or for the player the release did not
happen.** 0.1.7.0's entry listed the library and the brood fix and never
mentioned that four trials had opened — Sealed Nest, Barren Brood, Sterile and
the Nanitic Line — nor the twenty-one named attackers, nor the raid difficulty
setting. A player reading it had no way to learn the trials existed. It names all
six now, a line each for what a trial takes away and what clearing it gives back,
and the `trial` and `mastery` library entries were widened to match: both listed
only Drought and the Endless Siege, and `mastery` still said "both double per
level cleared" when two of the six do not double at all. **A version already on
the list keeps its number**, so correcting what an entry *says* does not re-fire
the tab dot for anyone who has read it — only a new feature release moves
`latestVersion()`, and `UPDATES` has never carried a `.1` fix entry.

**Sterile's card called its own reward "nothing else", and it is the largest one
in the game.** `masteryLineText()` builds that half of the sentence from
`linesWithMastery(type)`, which finds the lines carrying a trial's `mastery` tag.
Sterile pays into *every* line rather than into one kind of them, so no line
carries the `upgrades` tag, the list came back empty, and the card printed "and
nothing else" for the one mastery that raises the max level of all twelve.
`cap`, `brood` and `nanitic` really do raise no line and still read that way;
`upgrades` is named explicitly now. A mastery whose type tags no line is the case
to check whenever one is added.

**Laying a large batch froze the tab, and it was two bugs.** `affordableEggs()` ran *every frame* to label the "Lay max (N)" button by walking one egg at a time, so a colony that could afford 187,000 eggs did 187,000 iterations a frame before anything was clicked. And `layEggs` re-counted the whole brood twice per egg, making laying quadratic: 60,000 eggs took 5.2 seconds. The price of a run of eggs now has a closed form — the sum of `base × n^exponent` is close enough to the integral of the same curve that the midpoint rule is exact to a fraction of a percent — bisected instead of counted, with small runs summed exactly because the rule is at its worst on the first few eggs. 60,000 eggs now take 8ms, and the label is free. The tick loop also stopped walking every queued egg to skip all but the tended ones.

**Numbers run to 10^63**, and Settings offers scientific notation outright rather than handing it over unannounced when the suffixes run out. `parseAmount()` reads back every suffix `fmt()` writes, verified exact.

**The instinct to shed strips the wings too.** It only ever shed them, which left four wings to click by hand every time a colony was founded — two different acts, both called "wings", one automated. Four clicks on a ten-second timer is a chore rather than a decision once she has flown before.

**A batch lays whatever number you type.** The old fixed ×10 meant clicking it over and over; the field takes `250` or `2k` and is saved with the colony.

**A ladder's top must never move.** `ladder()` interpolates between its start and its top, so raising the top shifts every rung underneath it — and opening three more trials took the trials ladder from "five levels per playable trial" to 25, moving its fifth rung from 5 to 6 and taking a tier from anyone standing on it. The top counts all six trials now, built or not, so it cannot move again. Stepping from the start instead was tried and broke sixteen other values; the narrower fix was correct.

**When layer 2 lands, the lifetime clock is the Matriline.** Not the bloodline: ants have hemolymph rather than blood, in an open system with no hemoglobin, so nothing about them is red or vessel-borne. Colonies genuinely are matrilineal — every worker descends from the queen, and each new nest is founded by her daughter — so the Matriline is the accurate word for the line of queens, and the right home for the total-time figure the header stopped showing when colony age began resetting. Layer 1 keeps *Lineage*; the two read as related without colliding.

---

## The Hunt — prestige-independent, and the second constraint

**Held ground multiplies foraging, which is what makes combat part of the game
rather than beside it.** The colony spends 79.4% of its food on foragers and
15.8% on soldiers, and until now the soldiers bought nothing the colony grows
on. Territory is the bridge: the army takes ground, the ground feeds the nest.

**The board is thirty cells and has no edge.** Six sectors by five rings, drawn
on a canvas. Clear all thirty and the circle **merges into the nest**
permanently, a fresh thirty appear outside it, and everything in them is
`TIER_SCALE` harder. Combat gets the shape the achievement ladders already have:
an endless climb with a fixed-size readout.

**Territory is bounded on purpose, and the bound is measured.** A full board is
**×1.720** — `CELL_YIELD` 0.008 per ring, so the far cells are worth more — and
merged tiers pay `TIER_YIELD × sqrt(tier)`, which is ×3.72 at twenty-five
circles. Both together stay inside the **×4.85 Amdahl ceiling** for the forager
share, so the map can never become the whole game however long it is played.
Square root rather than linear is the whole reason: tiers do not stop.

**Held ground IS the nest, so a monster walking into it starts a defence battle
where it stands.** There is no separate "it reached the centre". That is what
makes expansion self-balancing without a hand-tuned penalty: a longer frontier
is more perimeter to be attacked along.

**One march at a time, and the soldiers sent cannot defend.** `resolveRaid`
multiplies the home defence by `1 - marchShare(game)`, so committing three
quarters of the army to a deep cell leaves a quarter at home. That is the
decision the game was short of.

**Spawning stops at `MAX_ON_BOARD`.** Measured, a colony that simply never
marched filled 27 of 30 cells in an hour, which is exactly the wall of red the
design refused — a full board reads as "you have already lost" rather than as
somewhere to go. Capped at ten, the pressure is real and the board stays legible.

---

## The bestiary and the trophies

**Forty-nine creatures in five bands, times five modifier words — 245
encounters** against the twenty-one bare names before. `bestiary.js` imports
nothing, for the same reason `species.js` and `instincts.js` do not: `raids.js`
and `hunt.js` both need it.

**`monsterChoices` sorts by power rather than trusting array order.** The list is
grouped by band so it reads well, which means it is NOT in power order, and
slicing it raw offered a colony of 200 power a Land Kraken.

**A modifier must add variety, not difficulty, and the raw weights added 22%.**
The weighted mean of the power multipliers is 1.219 — so every attacker in the
game was quietly harder, and measured it pushed 2,000 ants from 66.2m to 74.3m.
Worse, the mean differs per band because a band caps which modifiers it can
carry: Small Things averaged 0.84 and myth 1.219, so the same change made the
early game easier and the late game harder at once. **Each band is normalised to
a mean of exactly 1.0000**, spread untouched.

**Variance still costs time, and that is a real finding.** Even mean-neutral, the
rallying row moved 47.7 → 50.0m and 66.2 → 73.0m, because the loss function is
convex: winning by a wider margin gains nothing while losing costs up to a fifth
of the colony. It shows on the rallying row and not the idle one because a
rallying colony runs closer to the edge. **The idle row is untouched at +0.2%
and +0.6%**, and the rallying figures are recorded as the new baseline.

**Fifty trophies, five grades tall, three ways to earn one.** The modifier words
are grades of one trophy rather than 250 entries. The first kill always gives it,
so a fight is never wasted; every kill after rolls for the grade the creature
actually wore; and a kill count raises it anyway as a floor — measured, 600
unlucky kills still reach grade 4. **A band caps the grade it can drop**, so a
Phorid Fly is grade 2 for ever however lucky or persistent you are, and the
ladder is climbed by hunting further out rather than farming what is nearest.

**Trophies pay into strength, protein, hunting speed and territory — and that is
safe only because of the Hunt.** A combat reward was inert while combat bought
nothing the colony grows on; territory changes that. It is still not a global
food multiplier. **A band gives a KIND and a trophy gives a value within it**, so
there are five effects to measure rather than fifty, which is the safeguard
against fifty inert rewards. At every trophy and every top grade: strength
×5.44, protein ×2.58, territory ×2.07, myth ×3.07. The myth band was ×7.60 at
first and had to come down, because it multiplies four things at once.

**Trophies and merged tiers survive every reset**, the standing board does not.
A trophy is what the line has ever beaten, like an achievement; a merged circle
was taken permanently; the ground under a colony that has flown away is not its
ground any more.

---

## Prestige Layer 2 — the Matriline

**The first run is common ants; a matriline reset is where the line commits to a
species.** Layer 0 and layer 1 are played as no particular species and are
untouched by any of this — measured, the ordinary run still paces at
1.2 / 3.1 / 7.1 / 22.8 / 41.4 / 60.9 / 87.9 minutes, to the tenth of a minute.

**The gate is the finished lineage plus a Royal Jelly total, and trials cut that
total down.** `MATRILINE_JELLY_BASE` is 120, each mastered trial level takes 3
off it, and the floor is 30. So clearing trials is never forced and always worth
it: the fast road to layer 2 rather than a wall in front of it.

**A matriline reset clears everything layer 1 gave the line** — the jelly, all
thirteen adaptations — and hands back only what the matriline tree has bought the
right to inherit. That is what the tree's first purchases are for; without them a
second matriline replays four and a half hours of finished content. The reset
re-grants the inherited adaptations by **id**, so `automationUnlocked()` keeps
working unchanged. `autoShed` is the exception, because it has no adaptation id
of its own — it reads `flightsTaken` — so `autoShedUnlocked()` asks
`inheritedPrestige()` as well.

**`refoundColony()` must keep `game.matriline`.** It is the layer above the
colony and above the flight. Without it the reset wiped the species it had just
committed to, along with the tree that paid for the inheritance — and every
symptom looked like a different bug: the species would not commit, the shed was
not inherited, the garden never widened, and all six species measured identically.
One missing line in the surviving set.

**Every species has an active half and a passive half, and they are not the same
kind of thing.** The active rewrites a mechanic and runs only while that species
is being played. The passive is a plain modifier and pays at full strength for
ever once the species is finished, chosen or not — so no matriline is wasted and
no choice is regretted. Matriline upgrades lift the **bonus** part of a passive
rather than the whole figure, so ×1.5 at scale 2 is ×2.0 and an unfinished
species is always exactly 1. Both halves apply inside trials: a trial suppresses
what the lineage *bought* and keeps what the colony *is*, and in layer 2 the
species is what the colony is.

**The six, and what each was measured at.** One hour, matched automation, against
a generic colony that reaches about 1.5e5 food/s:

| species | active | measured |
|---|---|---|
| **Atta** | foragers bring leaves; only the garden turns them into food, and nurses widen it | peaks ×1.59 of the generic best at **20% nurses**, ×0.01 at the generic 5% |
| **Solenopsis** | polygyne — cap ×1.5, +2 brood, a lost raid costs ×1.7 | 1,650 ants |
| **Camponotus** | protein per egg halved, excavator cap ×1.5, founders fade at half speed | 1,787 ants |
| **Eciton** | nomadic — excavators dig nothing, cap 1,400 flat, raids at ×0.4 the interval, wins capture | 1,400 ants, 18 wins |
| **Myrmecocystus** | food banked only in living ants, 800 each | 1,666 ants, the store sitting full |
| **Polyergus** | dulosis — only soldiers can be laid; every worker is captured brood | 337 ants, 9 wins |

**Atta's garden is one term in `foodPenalty()`, and the comparison is in ants
rather than in food.** A food-denominated throttle would have to read
`foodPerSecond`, which reads the penalty, which reads the throttle. `GARDEN_YIELD`
is 2 and `GARDEN_PER_NURSE` is 4, both measured: at yield 3 she peaks at ×4.73
of the generic best, which is a buff rather than a rewrite; at 1.6 she peaks at
×0.24 and is never worth playing; at 2 she peaks at ×1.59 with a fifth of the
colony nursing. **The response is that sharp because it compounds** — half the
rate in the first ten minutes is a fraction of the colony an hour later — so the
bottleneck line has a `garden` case, and it has to: without the colony saying
which way the constraint runs, the cliff is a trap rather than a puzzle.

**Three cap-bypass bugs, all the same shape, all found by measurement.** An ant
added outside the laying path does not meet the cap check. Eciton's captures
walked her column to 859 ants against a nomadic cap of 500, so captures are
clamped to the room left. Polyergus then could not grow at all — 30 ants in a
nest built for 30, winning every raid — because dulosis means no excavator can
ever be laid and nothing raised the cap; so a quarter of every capture is
somebody else's diggers, exempt from the room check for the same reason a laid
excavator is. And that made her exponential: each captured digger raised the cap,
which raised the next capture, measured at **107,233 ants at four hours** against
about 6,600 for every other species. `CAPTURE_DIGGER_CAP` is 4, so the nest grows
by a fixed amount per raid **won** and the growth is linear in raids, which is
what dulosis should be.

**Under dulosis the soldier is priced on the forager curve.** She is not an army
raised on top of a workforce, she *is* the workforce and the only egg the queen
can lay. At 200 × n^1.6 the colony reached 21 ants in an hour and then spiralled
into losing every raid, which is the one thing this species cannot survive.
`eggPrice()` stays the single source for the curve; `eggCurve()` only chooses
which one, and `game` is an optional trailing argument so nothing that does not
care has to pass it.

**Eciton's nomadic cap must clear the flight gate.** At 500 she could never reach
1,000 live ants, so she could never take a nuptial flight, so she could never
earn Haplotype or finish herself by flying. It is 1,400.

**Trial clears are recorded per species**, in `game.challenges[species][trial]`
and `stats.bestTrial[species][trial]`, so an Atta mastery pays only while the
line is Atta. `stats.challengeLevels` stays a single global lifetime count,
because the achievement track reads it and **a track must never lose a tier
because the line changed species**. Save v8 folds every existing clear under the
generic key, which is exactly right: the first run is common ants and that is
what those clears were earned as.

**This only works because 0.1.8.0 made food-measured trial targets scale with the
food mastery held.** A species starting its trials from nothing meets the same
trial a mastered one does; before that change, a species-scoped reset would have
made Sealed Nest and the Nanitic Line unclearable all over again.

**Finishing a species takes 20 points and there are three roads to it** — 2 for a
trial level cleared as it, 1 for a nuptial flight as it, 4 for each of its own
two adaptations. Trials are the fast road (10 levels finishes it), flights the
patient one (20 of them), and the branch can never be the whole answer because
there are only two nodes. A player who dislikes one road is never stuck on it.

**Haplotype is paid on what the matriline did, not on the colony standing** — the
same reason the flight reads live population rather than the peak: a figure that
survives the reset can be collected against twice. `4 × flights^0.7 × (1 + trial
levels / 8)`, measured at 6.5 for a thin matriline and 88.8 for a deep one
against a tree costing 199.


**A mastery is earned once and kept by every line.** `bestTrialLevel()` reads the
deepest level *any* species has reached, so it is a high-water mark across the
whole game and no reset walks it back. Reading it per species made every
matriline a cliff: measured, food mastery fell from ×32 to ×1 the moment the line
committed to a new species, which punished the player for using the layer.
**Clearing a trial unlocks its bonus and does nothing else.** The per-species
record still exists as `speciesTrialLevel()` and still decides what a species is
finished on — it just does not gate the bonus.

**The colony trials are a menu, not a ladder.** A new species starts every
layer-1 ladder from nothing and is not meant to climb all six; the player takes
the ones that line is short of. Drought and the Nanitic Line pay food, the
Endless Siege pays fighting strength, Sealed Nest pays room, Barren Brood pays
chambers, Sterile pays into every adaptation line. Three of the nine at five
levels is about 45 hours across six matrilines; all six ladders six times over is
134 measured hours, which is a wall whether or not it was meant as one. The
Trials tab says this outright while a species is playing.

**Each species has its own tab of adaptations, and that is what keeps their buffs
apart.** Four nodes each, bought with Haplotype, held for good, paying only while
that species is being played. `branchApplies()` is load-bearing rather than
decoration: without the species check, Second Queen raised the cap of whatever
line was actually playing, and Eciton and Polyergus share the `captureMult` key
outright, so each one's branch silently bought the other's — measured, a mastered
Eciton column held 3,150 against a nomadic cap of 2,100. **A new species node
must either use a key no other species uses, or be covered by that check.**

**Instincts are what achievement tiers buy**, in `js/instincts.js`. Tiers were
pure scoring — they fed XP, XP fed a level, the level paid three fixed bonuses,
and nothing ever spent them; the deferred note for this has been in these files
since the 20 August playtest and two layers now exist. Eight nodes costing 232
against a measured tier count of 131 at one hour and 192 at forty-eight, so a
player buys about five of eight early and finishes the set over a long game.

**Spending never lowers the achievement level.** The level is computed from XP
and the XP from tiers, neither of which `instincts.js` touches; a cost is
subtracted only from the pool that file reports. **Four of the eight move the
growth loop** — cap, brood, hatch, cap again — which is precisely what the species
passives turned out not to do. Measured, level 25 with no species finished
reaches 1,000 ants in 28.2m; with three species finished, 30.2m; with all six,
30.2m, identical to three, because every passive paid into combat, protein,
salvage or the offline cap and none touched food → eggs → ants. The rule that no
mastery may multiply all food was right and was over-applied: a reward scoped to
cap or brood moves a large fraction of the loop without being a global multiplier.

**`js/instincts.js` imports nothing**, for the same reason `species.js` does not:
`ants.js` cannot import `achievements.js` without evaluating it before `UPGRADES`
exists. Anything `ants.js` or `raids.js` must read has to live in a leaf module.

**A re-export is not an import.** `export { foodPerProtein } from "./raids.js"`
creates no local binding, so Myrmecocystus holding Overflow threw
`foodPerProtein is not defined` inside `tick()` — a crash that fires for one
species holding one node, and the 24-hour species sweep is what caught it. The
same trap had already cost a pass on `sterileActive` and on `capPerExcavator`.
When a symbol is used rather than merely forwarded, it needs a real `import`.

**Polyergus grows only by war, and the slope is `CAPTURE_DIGGER_CAP`.** Each
captured digger is worth up to 58 cap once the excavator line is deep, and she
wins 299 raids in a day, so the constant is the whole difference between a
species and a runaway: measured at 24 hours fully mastered, 4 gives 103,476 ants
against about 24,000 for the field, and 2 gives 51,889. Her growth is linear in
raids won either way — the cap is what sets how steep that line is.

---

**The effect walks are cached on `game.upgrades` identity.** `rawSumEffect` and
`productEffect` are O(lines × levels held), and `foodPerSecond` reaches
`globalFoodMultiplier` once per caste — so a single food rate did that walk nine
times over for an identical answer. `game.upgrades` is **replaced** rather than
mutated when a level is bought, so its object identity is an exact cache key: a
different object means different levels. A WeakMap holds it, so the upgrade
panel's probe objects are collected rather than accumulated.

**A cache key that is fresh every frame is worse than no cache.** The upgrade
panel builds a probe per line per frame, and each one was a brand new key: the
panel went from 0.70ms a frame to **2.02ms**, because every probe allocated a
Map, filled it, and dropped it. The fix is that the probe has to be fresh — it is
measured against the colony standing now — but the *levels map inside it* does
not, so those are held stable per line-and-level until something is bought.
0.29ms after, against 0.70 before any of this.

**Measured at 60,000 ants**, before → after: `colonyBottleneck` 22.8 → 4.7µs,
`foodPerSecond` 14.4 → 6.6, `combatPower` 7.7 → 4.1, `broodCapacity` 3.1 → 1.7,
`populationCap` 2.8 → 1.0; one tick 57.7 → 34.9ms per thousand; the pure part of a
render frame 0.078 → 0.027ms. **The game was never near its budget** — a frame
costs under a millisecond of sixteen — so this is headroom for the layers still
to come rather than a fix for anything a player could feel.

**`colonyBottleneck` was the most expensive single call in the game** at 22.8µs,
because it runs every frame and asked for the population cap five times over and
chose the automation caste before it knew whether it needed one. It is the same
answer, asked once.

**A hidden upgrade card is not rendered.** The preview copies the whole game
object and recomputes the food rate, the cap, the brood and the fighting strength
against it; with a branch filter or Hide owned on, most of the twelve are hidden
and none of that work is read.

**Two entries may never share an id.** `LIBRARY` had two called `matriline` — the
lifetime clock, from before layer 2, and the layer itself — so the second
shadowed the first in the index and the discovered count was permanently one
short of the list. The clock is `matrilineAge` now. Every id table in the game is
swept for this.

**Nothing reaches for `parentElement` to find a panel.** `renderMatriline` hid its
reset box through `el("matDesc").parentElement`, which is a silent break the
moment the markup nests differently. The box has its own id.

---

**The whole game is 7.6 hours of active play, measured end to end.** One policy
from the first click to all six species finished, identical across three seeds:
0.78h to the first 1,000 ants, 1.44h to a complete Royal Lineage across five
flights, 6.67h with every trial mastered, and **7.6h with all six species
finished**. Not two days, and not the 27 hours the per-trial table implies.

**Per-trial times measured one trial at a time do not add up to a playthrough.**
Each of those was taken from a colony holding no other mastery, so they compose
into a number nothing experiences. Inside one run the masteries compound and the
back half of the ladder collapses: Drought 117 minutes for five levels, Endless
Siege 115, Barren Brood 78 — then **the Nanitic Line in 1.4 minutes, Sealed Nest
in 0.5, and Sterile in 2.4, for five levels each**. Any figure quoted for a trial
has to say what the colony was holding when it was taken.

**A trial's target scales with one mastery; the colony entering it has grown by
everything.** 0.1.8.0 made the food-measured targets scale with `masteryFood`,
which fixed the case where Drought made them impossible-then-trivial — but it
under-shot, because by the fourth trial the colony also holds an achievement
level worth ×4.07 food, every upgrade line bought out, and the cap and brood
masteries. Sealed Nest is scaled and still clears in half a minute. **The general
fix is to ask for a fraction of what this colony would produce undebuffed**,
which is self-scaling against every source at once rather than against one of
them.

**Layer 2 is 0.9 hours against a 40-hour budget, because a mastered colony flies
in about a minute.** Finishing a species is twenty points and a nuptial flight is
worth one, so twelve flights is twelve minutes; two branch nodes cover eight
points more. The point costs were priced as though a flight were an event. Any
layer-2 length has to be built on something that takes real time, and in this
game the only thing that does is a trial.

---

**Coming back is a report, not a line.** The colony keeps working while nobody
is watching, and the one-line note could not say the thing that matters most:
**how much of the absence actually counted**. Away for thirty hours against an
eight-hour cap is twenty-two hours the colony did not work, and the line read
"while you were away — 8h" as though that were the whole story. The window says
both figures, names what the cap cost, and names Crop Reserve and Full Crop as
the two things that lengthen it.

**The catch-up is not animated; the reveal is.** `load()` applies the whole
absence in one pass before any of this runs, so the colony is already in its
final state and what sweeps is the display — a clock running 0s to 8h over 1.6
seconds and the figures counting up to numbers that are already true. Deferring
the real ticks across frames would let the player lay an egg halfway through the
catch-up and land somewhere the instant path never would, which is a divergence
with no upside. **Anything that animates progress must animate a settled result.**

**`lastAway` carries `requested` as well as `seconds`.** The first is the wall
clock, the second is what the cap allowed; the pair is the whole point of the
window. It also carries the population before and after, whether the colony went
to ground, and a `seen` flag — the report is opened from `renderAway()`, which
runs every frame, so without that it would reopen forever.

**It is gated at five minutes and has a switch.** A tab-switch should not produce
a modal, and a player who does not want one should not have to close it every
session. Under five minutes the one-line note still says what was gathered.

---

**A matriline reset must not take an achievement tier back either.** The rule
existed for the nuptial flight and was not carried up a layer: the flights track
read `prestige.flightsTaken` and the royal jelly track read
`prestige.royalJellyTotal`, and a matriline reset zeroes both. Measured on a
colony with 30 flights and 160,000 jelly banked, a reset cost **25 tiers** — 8
from one track and 17 from the other — which also shrinks the pool the Instincts
are bought from. Both now read `stats.flightsEver` and `stats.jellyEver`, seeded
on load so no existing save loses anything. **Any figure a layer resets is the
wrong thing for a track to read.**

**Retained Royalty keeps the money; the gate resets regardless.** It used to keep
a share of the jelly capped at the price of the lineage, so a player holding
160,000 kept 43 of it for a node costing ten Haplotype. It now keeps an uncapped
share of the balance, and `royalJellyTotal` — the figure the next matriline's
gate is measured against — resets to nothing instead. The two were the same field
doing two jobs, which is why capping the one broke the other.

**Haplotype counts the flights already taken.** `matriline.flights` duplicated
`prestige.flightsTaken` — `doFlight()` incremented both and the reset zeroed both
— except on a save that predates layer 2, where the matriline's copy started at
zero and a player with thirty flights behind him was paid as though he had taken
one. It reads the larger of the two.

**The brood tally is counted once, not walked per call.** `broodCount()` is
O(eggs) and `casteStock()` reaches it for every layable caste on every tick and
every frame. Measured at a 208,000-egg queue: `pendingByCaste` 4.25ms a frame,
`colonyBottleneck` 2.6ms, and one tick **13.4ms** — which is what made the brood
details window unopenable at that size. A cached tally takes those to 0.003,
0.004 and 1.19ms. **Invalidation is explicit** — `touchBrood()` from all six
places that add or remove an egg — because inferring it from `eggs.length` is
wrong: a lay and a hatch inside one tick return to the same length with different
contents. Verified by walking the queue fresh and comparing, 3,424 times across
laying, hatching, range destruction, a save round trip, a flight and a matriline
reset.

**The brood window lists the front of the queue, not all of it.** At 208,006 eggs
in 2,080 batches it built 2,078 rows at 68ms a frame. It lists 40 and stops
walking once it has them; the rest is a count.

**A track counting whole things must not grow fractional rungs.** The trials
ladder ran 30, then 43.77, 73.46, 141.77, which reads as broken on a number that
can only ever be an integer. The softcap rounds up for tracks measured in levels
or flights.

**The library dot cleared in the wrong place.** `markSeen("library")` sat inside
`renderLibrary()`, which only runs on the terms sub-tab — so a player who left
the tab on *What changed* never cleared it, and it read as a badge that never
goes away. It is marked when the tab is opened, whichever sub-tab is showing.

**One name per species.** Both a Latin name and a common one meant two things to
learn for one animal. The common name is the name; the Latin survives in the
flavour line, where it reads as colour rather than as a second label. The header
clock is *matriline age* for the same reason: the word was doing duty as both a
clock and a prestige layer.

---

**The opening guide became a standing assistant.** It used to retire at
soldiers; now it hands over from explaining to pointing, and where the next thing
is one safe click it offers to make it. **It never acts on its own and never
offers anything irreversible** — exiling, destroying eggs, taking the flight and
beginning a matriline are all left to the player, because an assistant that does
those is exactly the automated mistake the game refuses to make. The button is a
shortcut for a click you were going to make, so the rule that nothing lays an egg
or buys an upgrade on your behalf still holds. Shedding her wings has no button
either: it is the one deliberate first click the game opens on.

**The assistant stands in the queen's panel.** It sat under the header, above
both columns, which put the one thing telling you what to do next furthest from
the things it was telling you to do — the wings, the rally and the milestone are
all in that panel. It is a full-width third flex child of `.queen-panel`, so it
spans the panel under both the sprite and the text column rather than being
squeezed into the narrow half beside the queen.

**The milestone line covers every layer now.** It stopped at 1,000 ants and then
said deeper milestones were being built for the beta, which stopped being true
two layers ago. Past the flight it names the Royal Lineage, then the Matriline's
jelly gate, then the species being played and how far off finishing her it is,
then how many of the six are banked.

**`libraryTab` holds a group id, so nothing may test it against `"terms"`.**
Paginating the library by category left the render dispatch checking for the old
value, so `renderLibrary()` never ran and pressing a category did nothing at all
— the panel was visible and simply never updated. A tab whose identifier changes
meaning has to be swept for every place that compared against the old one.

**`.panel h2` carried no top margin at all**, so every heading after the first in
every panel landed flush against whatever grid or paragraph came before it. The
Matriline tab showed it worst with three of them, but it was the rule and not the
tab — the fix belongs on `.panel h2`, not on `#tab-matriline`. Seven headings
gain the space: Who fights, Unlocked by the flight, Royal Lineage Adaptations,
The species, Matriline adaptations, Her majesty and Appearance. The other sixteen
are the first thing in their container and still sit flush, and so does any
heading following the panel head or the sub-tab bar, both of which carry their
own bottom margin. **Scoping a fix to the tab it was noticed on leaves the same
bug everywhere else.**

**A render that runs every frame must not write a value that has not changed.**
The Achievements tab set the className of all **317 pips** and about forty text
nodes on every frame whether or not any of them differed — 440 unconditional DOM
writes, 26,400 a second at 60fps, each one a style invalidation in a browser.
That is what made buying an instinct feel like it stuck. `setText`, `setClass`
and `setWidth` in `panels.js` skip the write when the value is the same, and the
same treatment is applied to the Matriline, Trials, Library, Upgrades, Units,
Prestige and Brood renders. On a still frame the count is now zero.

**This is not a cost the harness can measure.** A property write is free in node;
what it costs is style and layout in a real browser. The write *count* is
measurable and the fix is the standard one, but the improvement has to be
confirmed by playing it.

**The number goes inside the dot.** `.badge` was a 7px circle with no font size
and no way to centre anything, so a count written into it spilled out below the
baseline — which is not an argument against putting it there, only against the
sizing. It is a 14px flex-centred circle now, growing to a pill for a second
digit, clamped at 99+, and `:empty` falls back to the plain 7px dot for anything
with nothing to count. Same footprint as the dot, and it says how many.

**A tab dot that has a count should show it.** Upgrades, Achievements, Prestige,
Library and Matriline all computed a number and then threw it away to draw a bare
dot. One `setBadge()` decides what every one of them says, so they cannot drift.

**The head says what there is to spend.** The spendable figure only existed on the
Instincts page, so a player on any other sub-tab could not see what they were
holding. The Achievements head reads *"137 tiers earned · 129 points to spend on
instincts (8 spent) · 340 XP to level 22"*.

**Fuzzing found nothing, which is worth recording.** 24,000 random actions driven
through the real click handlers — laying, exiling, destroying, promoting,
flighting, entering and abandoning trials, matriline resets, buying every kind of
upgrade, switching tabs mid-action — with the invariants checked every 200 steps:
no exception, no negative or NaN resource, no population past its cap, no brood
tally drift, no overspent instinct pool, and the colony still exported and
imported afterwards.

**A handler must read the live callback, not close over it.** Every instinct card
was unclickable: `buildInstincts(onBuy)` captured the buyer as a parameter, and
`buildAchievements()` runs during ui.js's module scope — before ui.js calls
`setInstinctBuyer`, so what every card closed over was the initial no-op, for
ever. It is the third click bug in this game and the third different cause: a
detached node, a sticky header eating the pointer, and now a stale closure. When
a control does nothing, check all three.

**An outline button is two rules, and writing only the second one paints text
onto its own colour.** The pattern is `background: transparent; color: --dim;
border: 1px solid --line` with a modifier that sets `color: --text;
border-color: --accent`. `.caste-choice` and `.subtabs button` have both halves.
`.species-pick` and the assistant's buttons had only the modifier, so they kept
the base button's `background: var(--accent)` and painted **accent text onto an
accent background — 1.00:1, in all three themes**, on the assistant's only action
and on the species you had just picked. `border-color` on those rules did nothing
either, because the base button is `border: none`.

**A control's legibility must never depend on `--accent`.** It is the one palette
entry whose character changes between themes — a deep red at 0.11 luminance in
dark against a light orange at 0.31 in soil — so no single text colour reads on
it everywhere: `--btn-text` measures 3.87 / 5.61 / 6.39 and white measures 4.83 /
5.93 / **2.92**. Colour marks a selection with the **border**, which needs only
3:1 as a non-text element and clears it in every theme; the text stays `--text`
at 12:1 or better.

**Every outline button in the game went unreadable at the moment it was being
read.** They inherited `button:hover { background: var(--accent-soft) }`, and
`--dim` on that is **1.06 in dark, 1.41 in light, 1.29 in soil** — so the caste
picker, every sub-tab bar, the species picker and the assistant all blanked out
under the pointer. They hover to `--hover` now, which is one step off the panel
in each theme and holds 4.87:1 at worst.

**Contrast is measured, not eyeballed.** A suite parses the three palettes out of
`style.css` and checks twelve control-and-state pairs against the WCAG floors —
4.5:1 for text, 3:1 for borders — so a palette edit that breaks a control fails
rather than shipping. It also refuses any rule that sets `color` and `background`
to the same variable, which is the exact fault above. **This is the one kind of
visual check that does not need a screenshot**, and the rest still does.

**The filled primary button is 3.87:1 in dark** — `--btn-text` on `--accent`,
below the 4.5 floor for body text. It is every button in the game and the
established look, so it is recorded here rather than changed.

**Three matriline trials, and the two that reused an existing mechanic were the
cheap ones.** The Blight, the Slave-Maker and the Repletes. Same rule as layer 1
— each takes one thing away and gives that same thing back — and none of the
three pays a global food multiplier, which is still the hardest rule in these
files. Measured, levels 1 / 3 / 5 with a colony holding nothing: Blight 29.7 /
26.4 / 46.9m, Slave-Maker 73.0 / 61.0 / 55.3m, Repletes 40.9 / 31.5 / 89.0m.

**The Slave-Maker was unwinnable by construction, which is the Polyergus bug in
a new coat.** Measured at 30 ants after ninety minutes at every level: under
dulosis no excavator can ever be laid, so nothing raises the cap and the nest
sits at its base for ever. The species survives it because she also *captures*;
the trial imposed the restriction without the thing that makes it survivable.
`speciesCapture()` now takes the larger of the species' own share and the
trial's. **A trial that borrows a species' restriction has to borrow whatever
makes that species viable, or it is not the same mechanic.**

**The Blight looked unwinnable and the measurement was what was wrong.** It ran
LOST at levels 3 and 5 through three separate attempts at retuning the spread
rate — because the simulated player never exiled, and **exiling is the Blight's
only cure and its entire loop**. It was measuring a colony being watched as it
died. With a curing policy it clears every level. `handCure()` is part of the
harness now: **a trial whose loop is a player action cannot be measured by a
policy that never takes it.**

**Metapleural Gland is the one mastery that shrinks rather than grows.**
`masteryOf` raises the step to the power of the level, so a step below 1 works
unchanged — 0.72 a level, floored at 0.05 so a reduction can never turn a loss
into a gain. It cuts every kind of ant loss, and that has to mean every kind:
raid deaths and the 10/20/35% a training batch loses alike, or the wording is a
lie.

**A colony is not food-bound because nothing else binds — it is food-bound
because meeting everything else is cheap.** The food budget is foragers 79.4%,
soldiers 15.8%, excavators 2.4%, nurses 2.3%, upgrades 0.1%, so Amdahl bounds a
free population cap at ×1.02 and a free brood the same. Measured against that:
**all eight instincts and all six species passives moved a growth run by
×0.98–×1.00**. Four of the instincts are correctly scoped elsewhere — combat,
protein, the offline cap and what survives a reset — and a one-hour measurement
structurally cannot see any of those. The five that claimed to grow the colony
and did not now also cheapen an egg: Deep Chambers ×1.035, Quick Larvae ×1.042,
Wide Brood ×1.062, Deeper Chambers ×1.069, Gongylidia ×1.086. Fully stacked
against the species nodes the discount reaches ×2.27 on the forager share,
inside the ×4.85 ceiling.

**`eggBase()` is the single source and now reads three of them** — matriline
nodes, instincts and finished-species passives. `eggBatchCost()` sums the curve
in closed form and would miss any of them, so the single price and the "lay max"
preview would disagree the moment one moved.

**A species with a hard ceiling cannot be asked for the same headcount as one
without.** Eciton's nomadic cap was 1,400 for no reason except clearing a
1,000-ant gate — the gate driving the design rather than the other way round,
and she was the only species for whom flying meant filling 71% of everything she
could ever hold. `speciesFlightGate()` asks half of a hard cap, so she flies at
700 and the cap is free to be tuned on its own merits. **The payout deliberately
still divides by `PRESTIGE_UNLOCK`**, so she flies sooner and earns less each
time. `royalJellyEarned` returned **0** below the flat figure and had to be
given the gate, or her flights would have paid nothing at all.

**Destroying takes a count now, not only a run.** An "at most" field, counted
outward from the egg that was picked — reaching back takes that egg and the next
n behind it, reaching forward takes it and the n ahead. Empty or unreadable
means no limit, which is exactly what the window did before. Open since Akami
reported it.

**The harness lives in the repo now, and `node test/run.mjs` is the gate.** It
used to be a scratch directory that died with the session, so every check had to
be rebuilt before it could be re-run — and between them these suites had already
caught all five of layer 2's bugs, three separate population-cap bypasses, the
founders'-chambers trap, two buttons painted their own background colour, and a
ladder that would have taken tiers from saves that had earned them. Eighteen
suites, about twenty-five seconds, no dependencies and no build step. `test/` is
never shipped: it is not in the itch.io zip and `index.html` does not load it.

**`pacing` is the suite that matters when balance moves.** It plays the ordinary
run on a fixed seed with the automation standing in for a competent hand — the
policy the canon table was measured under — and fails when any milestone drifts
more than 10%. It reproduces the recorded idle row exactly: 1.2 / 3.1 / 7.1 /
22.8 / 41.4 / 60.9 / 87.9. **A failure there is not automatically a bug**; it
means the change altered how long the game takes, which has to be deliberate,
explained and written into the table rather than discovered by a player.

**The rallying row now has all seven figures.** Only the 1,000-ant one was ever
recorded — 47.7m, which the harness reproduces exactly — because the older full
row in the pacing table predates the achievement rework and was superseded
without being re-taken. Measured 31 August 2026: **1.2 / 2.7 / 6.0 / 16.6 / 29.3
/ 47.7 / 66.2**.

**The shim cannot see appearance, and that has not changed.** It is built from
the real `index.html` so `ui.js` runs its whole build path, but it has no CSS, no
layout and no class selectors. Contrast is the one visual property it checks,
because that is arithmetic on the palette rather than a matter of taste.

**The colony spends 79% of its food on foragers, and that number is the ceiling
on every reward in the game.** Measured across two hours of automated play, the
whole food budget goes: **foragers 79.4%, soldiers 15.8%, excavators 2.4%,
nurses 2.3%, upgrades 0.1%**. Amdahl bounds a reward at `1/(1-f)` of the share it
touches, so making the population cap **free** is worth at most ×1.02, and a free
brood ×1.02 as well. Only the forager share is worth anything, at ×4.85.

**This is not the same as saying the cap never binds** — an earlier note here
said that and it was too simple. Cap *utilisation* sits at 86–89% for the whole
run, because Standing Orders digs whenever the nest gets tight. The cap binds
constantly; it is just that **satisfying it is cheap**, so a gift of room saves
2.4% of the budget and no more. `colonyBottleneck()` reads *food-bound* sixty
minutes out of sixty for the same reason: whatever else is tight, the colony is
always about one second short of the next egg.

**So every node that paid in room paid nothing at all:**
Solenopsis, Camponotus and Myrmecocystus each spent three of their four
adaptations on cap or storage, and their whole branch measured **×0.97, ×0.96
and ×1.04** — fifty Haplotype for no change the colony could feel. The three
that worked (Atta ×19.7, Eciton ×2.6, Polyergus ×59.9) all touch something that
genuinely binds. **The egg price is the food sink**, so a discount on it is the
one lever that reaches the binding constraint without being the global food
multiplier the design has always refused. Each of those nodes keeps the effect
it had and gains a second one, a fifth off the brood, for the same reason in
every case — more queens laying, galleries already carved, a full granary.
Measured after: ×1.37, ×1.37, ×1.84, against Eciton's ×2.47. **This also means
the four Instincts that pay in cap, brood and hatch speed are worth less than
they look**, and that is the same finding waiting to be acted on.

**`eggBase()` is the single source for what an egg costs, discount included.**
`eggBatchCost()` sums the curve in closed form from `curve.base` and would have
missed the multiplier outright — the single price and the "lay max" preview
would have disagreed the moment a species cheapened the brood, which is exactly
how those two drifted apart once before. Verified equal across four castes, four
stock levels and three batch sizes.

**A species may state its own caste shares, and Atta had to.** The shipped
defaults are at the *generic* optimum, and the automation goes on laying to them
whatever the line has committed to: measured, Leafcutter at the default 5%
nurses reached 1,433 ants and 1.5e5 food/s in an hour, and 3,647 and 1.4e6 at
20%. The default was costing her **89% of her output**, and the bottleneck line
said *garden-bound, nurses widen the garden* the entire time — it simply could
not reach the setting that was fighting it. `speciesRatios()` is applied when the
matriline commits, which is where the colony is refounded and everything else
about it is set. She is set to **15%, not her raw peak of 20%**: at 20% she stops
being garden-bound and her own branch, which buys garden, falls to ×1.03. At 15%
it is worth ×1.66 and she still starts competitive. **A default that makes a
species tree pointless is no better than one that makes the species pointless.**

**The founders' chambers were still a trap, in the last five minutes.** Measured,
the card offered +2 brood slots for 500 food at minute 118 and was worth 0.00 at
minute 121. `levelIsSpent()` only covered the caste-scoped food lines, so nothing
greyed it, and `previewUpgrade()` handled the founders being *already* gone but
not about to be. It reads the **lifespan, not the clock**, because with Long
Burning cleared they never die and the purchase is good for ever. The preview
names the deadline while it still matters and the card greys inside the last five
minutes.

**Rounding a softcap rung up is safe for a whole-thing track and only for one.**
The fractional-rung fix was scoped to levels and flights, which left twenty of
twenty-three tracks still doing it — *"next: 27.899 big foragers"*, *"56.869
upgrades bought"*, *"679,458.586 eggs"*. The test is not which track it was
noticed on but whether the quantity can be a fraction at all, so the four that
genuinely can are named and everything else counts whole things. Ceiling can only
remove values lying strictly between the old rung and the next integer, and for a
quantity that is always whole there are none — which is why food, protein,
fighting strength and royal jelly are left alone, where it really would take a
tier from somebody standing between the two. Swept across 9,623 values: no value
scores fewer tiers than before, every ladder still strictly increasing.

**The Upgrades tab was the most expensive thing in the game and had never been
measured.** For every visible card, every frame, it built a probe colony and
recomputed the food rate, the cap, the brood and the fighting strength against it
— three times over, because `levelIsSpent`, `previewUpgrade` and `formulaLines`
each built their own. **700µs a frame on the default sort and 1,683µs on the
price sort**, against 92µs for the whole Achievements tab, which is the one that
had just been optimised. A preview that reads *"Cap 5,000 to 5,800"* does not
need recomputing sixty times a second: it is on a 250ms clock, and recomputed at
once whenever a purchase or a filter changes what it would say. **211µs and
124µs** after.

**`foodPerProtein()` is the single most expensive call in the game** at ~15µs,
and `comparableCost()` reached it twice per comparison — so sorting twelve lines
by price cost **613µs a frame against 8.5µs** with the rate read once. It reads
the colony, not the upgrade, so it is the same number for every line in one pass.
It is now read once per render and handed down; the exported functions keep their
standalone fallback.

**The stats bar was the last thing writing unconditionally.** Twelve values and
eight hidden flags on every frame whichever tab was open — the exact fault fixed
everywhere else, left in the busiest place in the game, because the sweep went
tab by tab and the header belongs to none of them.

**Feedback answered on 30 August 2026.** Gyroth, Feliza and Human of Humanity
played 0.2.2.0. What their reports turned into:

**A harder raid setting has to be worth choosing.** All four difficulties paid
the same spoils, so the three hard ones were a dare with no other side to it —
which is why the whole raid economy read as not worth the protein. Each carries a
`spoils` multiplier now: ×1, ×1.5, ×2.5, ×4. A bigger thing through the door is a
bigger thing to render.

**The queue can be reordered, not only destroyed.** `promoteEggRange()` moves a
batch to the front of the *waiting* part and never ahead of a tended egg: those
have incubation paid into them, and reordering them would throw that away, which
is the thing this exists to avoid. Measured on the reported case — a thousand
foragers laid ahead of twenty nurses — the nurses move from position 1,006 to the
front of the queue with the tally exact and the tended eggs untouched.

**The opening says one thing at a time.** A playtester called the game
overwhelming as soon as the wings came off, which it was: seven tabs and no
instruction. `tutorialStep()` is state-driven rather than a script, so it
survives a reload and any order the player does things in, and it **retires
itself** once soldiers unlock rather than becoming furniture. Its second step is
where nanitics come from, which was the first thing three separate people asked.

**The library is a page per category.** At 38 entries one scroll already meant
hunting for the group you wanted, and it only grows.

**Every tab opens with its `panel-head`.** The library opened with the sub-tab
bar and buried its head a level deeper inside the terms panel, so it sat at a
different height with a differently painted head than the tabs either side of
it — which is what a playtester saw as the tab moving and changing colour when he
clicked it. Structure first, then decoration: a tab that is built differently
from its neighbours will look different from them.

**The inspector is no longer pinned by default.** Sticky is what makes
hover-to-inspect work without moving the mouse, and it is also a panel that never
leaves the screen — reported as sitting over the brood. It stays a setting; the
default is off.

---

## Playtest feedback — 23 August 2026

From the itch.io comments: CoolRadGamer, Akami and sir_pinski.

**Done.** The upgrade-click bug (both CoolRadGamer and sir_pinski), the milestone line naming the next gate including the flight (Akami), earlier gates at 16 / 64 / 256 and the rally button, both against sir_pinski's "there weren't any sort of real decisions to me", achievement ladders that can actually be finished, the theme-breaking upgrade hover, and the brood details window with pending counts on the ants tab (Akami).

**Big foragers are not rare by accident, and Akami is exactly on the curve.** The k-th needs `round(3 × 3.5^k)` forager hatches since the last, with a chance ramping to that guarantee. Simulated over 2,000 runs of the real roll, the mean at 5,000 forager hatches is **11.69**; Akami reported 12 at 5k foragers. Exiling and rebuilding cannot help, because `foragersSinceBig` counts hatches rather than live ants and the threshold reads `game.bigForagers.length` — the answer to the question asked is no, and the game should say so somewhere.

**Still open, in the order they matter.**

- **Sub-batch destroying.** The details window works in runs, so a 400-egg batch goes whole or not at all. Trimming a queue to length needs either a count field on the selection or a way to split a run.
- The nurse sprite's egg reads as a white shield. Art is being redrawn by hand, so leave it.
- amsel's pheromone ant that boosts other castes. Not designed.

---

## Playtest feedback — 19 August 2026

Raised in Discord by Feliza, Gyroth and amsel. Most is now done; what remains is listed at the end.

**Done.** Number precision (1862 reads as 1.86K), the founding phase naming Nanitic instead of Forager, affordable costs in green and owned not in red, a hide-owned toggle with both toggles living only on the Upgrades tab, dots on the Upgrades and Achievements tabs, wide-screen layout, light and soil themes, a nameable queen, per-egg brood bars, the nurse rework, and Big Foragers.

**Still open.**

- The nurse sprite's egg reads as a white shield. Art is being redrawn by hand, so leave it.
- amsel also floated a pheromone ant that boosts other castes. Not designed.

---

## Playtest feedback — 20 August 2026

Gyroth and amsel both reached 1K+ ants. Done since: four nanitics, achievement dots and pip ladders, "Feed the brood protein" (the old wording read as something eating the eggs), the feed toggle moved above the slots it changes, the exile button moved right so every sprite and count lines up, and the formula display on upgrades.

**Still open, in the order they matter.**

- **The raid death spiral.** `monsterPower` scales on `peakPopulation`, which never falls, and `DEATH_ORDER` kills soldiers first and foragers second — the fighters, then the earners. Salvage is proportional to defence, so a collapsed colony salvages nothing. From 1,000 ants it is roughly ten raids to 107 and twenty to 11, with the timer never stopping; Gyroth reached 80 defeats. Banked food does rebuild, because egg cost follows `casteStock` down, but nothing in the UI says so. Needs threat that decays, a raid pause below some population, or a salvage floor.
- **Excavators are over-tuned.** At 29 cap each they are the cheapest population, the cheapest way past a gate and, with Gallery Wardens, cheap strength: excavator #172 costs 158K against forager #2430 at 1.26M. Gyroth ranked them first of four and finished with a 5K cap he did not need.
- **Big foragers fade.** Their count grows logarithmically — each threshold is 3.5× the last — while foragers grow linearly, so at 2.43K foragers eight of them are about 4% of production. Raising their multiplier does not fix that shape.
- Scouts that forage outside the nest for protein — overlaps what soldiers already do between raids, so it needs its own constraint.
- More achievement bonus types. Deferred by decision until a few prestige layers exist.

---

**A trial cannot be gated behind another trial by accident.** Deep Cisterns pays
×2 food a level and multiplies *everything*, so a mastered Drought is ×32 on
every food figure in the game — and three of the six trials are measured in
food. Measured, that made Sealed Nest and the Nanitic Line clear in twenty to
thirty *seconds* a level, while a colony that had not cleared Drought could not
clear Sealed Nest level 1 at any level of play (411/s against a 2,500 target) nor
the Nanitic Line's level 5 (a 32,798 ceiling against a 38,000 target). There was
no window in which either was a trial. **A food-measured target now scales with
`masteryFood(game)`**, which makes those trials mastery-neutral: what they ask is
what this colony manages under its own debuff, not what a previous trial handed
it. Only the food-measured kinds scale — a headcount is bounded by the cap and a
raid count by the clock, and neither moves with a food multiplier. The bases were
recalibrated against a colony holding nothing: `SEALED_TARGET_RATE` 2,500 → 400
and `CALLOW_TARGET_FOOD` 38,000 → 28,000. Measured after, with a player buying by
value: Sealed Nest 2.0 / 4.0 / 12.2 / 38.0 / 36.0m, Sterile 26.6 / 26.2 / 32.6 /
84.1 / 277.4m, Endless Siege at 60% soldiers 23.1–23.5m a level, Barren Brood
26–62m, the Nanitic Line still the short one at 1.6–2.5m. Sealed Nest's ramp is
two-step rather than five because `SEALED_SCALE` 0.40 against a ×2 cap mastery
leaves the nest at 0.8^level; steepening that is the lever if five steps are
wanted.

**An excavator may only dig past the cap where digging raises it.** `broodSlots()`
lets excavator eggs exceed the cap because she digs the chamber she will occupy,
and outside a trial the exemption closes behind itself since each one raises the
cap. Sealed Nest sets that gain to nothing, so it never closed — measured, 1,631
ants against a cap of 30, every one of them producing no food in the one trial
scored on a food rate. `capPerExcavator()` is now the single source for that
figure, and both `broodSlots()` and `managedCaste()` read it: the dig-out
exemption is refused when it is zero, and Standing Orders stops choosing
excavators when digging cannot help. Outside a trial nothing moved — the ordinary
run still paces at 1.2 / 3.1 / 7.1 / 22.8 / 41.4 / 60.9 / 87.9 minutes.

**Nest Memory does not run inside Sterile.** The trial is about which few
adaptation levels the colony holds, and the automation spent the whole allowance
on whatever was cheapest the moment it could — measured, both of an allowance of
two on `nanitic_food`, worth nothing two hours in, and nothing gives a level
back. Sterile was decided by whether the player thought to switch it off, which
it never said. With it off the trial is a real decision: a player buying by
gain-per-cost *right now* still falls for it (74.8 / 100.5 / 218.6m and then two
failures), because at minute two the founders' line genuinely is the best buy and
worthless by minute sixty; a player who buys only the lines that keep paying gets
26.6 / 26.2 / 32.6 / 84.1 / 277.4m. `automationOn()` stays the single gate.

**The colony says what is actually holding it back.** A line under the brood names
the one binding constraint — a full nest, full chambers, or no food for the next
egg — because every upgrade is a multiplier on some fraction of the work and one
aimed anywhere else buys almost nothing. That is Amdahl's bound, and the game had
always known the answer without saying it: the "+150%" forager line delivers
about +44% overall. Brood saturation is a sixty-second rolling figure in
`run.broodFull`, **sampled after `runAutomation()` and before the hatch loop** —
read after hatching the brood is always one egg short and never reports as bound
at all. Brood-bound means full chambers *and* cap room *and* the food for another
egg; full chambers with an empty bank is being short of food.

**An adaptation level that cannot pay says so.** Past its designed rungs,
`nanitic_food` can be pushed to level 12 and every extended level costs millions
of protein to move the colony's rate by ×1.000003 — four founders cannot be more
than a rounding error against twenty thousand foragers, and clearing Sterile
makes it worse by raising the cap on every line at once. A card is greyed and
says so when an *extended* level of a **caste-scoped food line** moves the rate by
under 0.1%. Only `casteFlat`, `casteFood` and `casteMult` are tested: a line
paying in cap, brood, combat strength or raid protein moves nothing the food rate
can see, and reading its flat ×1.000000 as spent greyed out `protein_yield`,
which was working perfectly. `globalFood` is excluded for the opposite reason —
it multiplies all of the work, so its bound is infinite.

**Relentless can be lost.** A fully mastered colony held a 5.18× margin and went
119W/0L over twelve hours, so the hardest setting in the game had never once lost
a raid — a label rather than a choice. `seesMastery` goes 1 → 1.5, so the attacker
brings half again as much of what Hardened Line taught you. Swept: at 1.25 the
margin is 2.19× and still 119W/0L, at 1.5 it is 0.95× and 112W/3L, at 1.75 the
colony collapses to 2W/3L. Because the term scales with how mastered the colony
is, one that has only just cleared the siege still enters at 1.20× and 78W/0L.

---

## Measured 28 August 2026 — the trial ladder, before the fixes above

Every trial laddered from level 1 to 5 under one fixed policy, driven by the
game's own automation so the real code paths run. Nothing below is fixed yet.

**The trials are gated behind Drought and nothing says so.** Deep Cisterns pays
×2 food a level, so a mastered Drought is ×32 on every food figure in the game —
and three of the six trials are measured in food. With no other trial cleared,
Drought and Barren Brood both clear all five levels (Barren at 35 / 32 / 32 / 47
/ 79m) and Endless Siege clears four; but **Sealed Nest cannot clear level 1**
(the rate tops out at 411/s against a 2,500 target, 16% of it), **the Nanitic
Line cannot clear level 5** (its ceiling is 32,798 food against a 38,000 target),
and **Sterile cannot clear levels 3, 4 or 5** (463–552 ants against 600). With
Drought mastered the same runs clear Sealed Nest in 24–36 *seconds* a level and
the Nanitic Line in 18–30 seconds. There is no window in which either is a
trial: impossible before Drought, a formality after. The measured 10–34m and
12–50m in *Every trial is playable* above were taken on a colony that already
held masteries; a first-time player meets neither number.

**The excavator dig-out rule is an unbounded cap bypass inside Sealed Nest.**
`broodSlots()` lets excavator eggs exceed the cap because an excavator digs the
chamber she will occupy — outside a trial the exemption closes behind itself,
since each one raises the cap. Sealed Nest sets that gain to zero, so it never
closes: measured, hand-laying reached **1,631 ants against a cap of 30**. Worse,
`managedCaste()` returns `excavator` whenever `cap - pop < max(8, pop × 0.12)`,
which under Sealed Nest is permanently true, so Standing Orders does it unasked —
49 of 75 ants after four hours were excavators, in the one trial measured on a
food rate. The check counts digging eggs, not the population already over.

**Sterile is decided by whether the player switches Nest Memory off.** At level 4
the allowance is two bought levels. Nest Memory spends both on `nanitic_food`,
which is worth nothing two hours in: 445 ants at three hours, never clears. The
same colony with those two levels spent by hand on the forager line clears in
**91.6 minutes**. Nothing gives an upgrade level back, so the allocation is
permanent for that run, and the trial never says the choice was made.

**Everything above this line was fixed in 0.1.8.0.** What follows was sound at
the time and still is.

**What was measured and is sound.** Forty-eight hours of a fully mastered colony
under Unchecked: no NaN, no negative resource, no runaway — level 35, 479W/0L,
food/s 1.04e13, and every per-minute invariant held. Save export and import
round-trip exactly, a v6 save migrates, and truncated or garbage codes are
refused rather than thrown. The four raid difficulties measure 659× / 234× / 8.6×
/ 5.2× defence against threat on a mastered colony, the shape the settings
promise — though none of the four ever actually loses a raid. Every achievement
ladder is strictly increasing through its softcap, and the library's predicates
survive both a blank colony and a fully mastered one.

**The pacing table above predates the achievement rework.** Measured now, the
same policy reaches 1,000 ants at 60.9m idle and 47.7m rallying against the 93m
and 64m recorded there. 0.1.6.0 says the rework moved it; the table was not
moved with it.

---

## The test loop

Every change ships to GitHub Pages at `https://theteiton.github.io/ants-incremental/`. Before saying a change is done, confirm the game still loads and the first sixty seconds still play. A change that breaks the opening is worse than no change.

---

## Summary

Small diffs. Ask before adding. Design decisions are mine.
