# ants-incremental (Gemini / Antigravity Instructions)

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
- Keep responses concise.

**When a request is ambiguous, ask one short question instead of guessing and building something large.**

Prefer the smallest change that works. A twenty-line diff I can read beats a two-hundred-line rewrite that does the same thing.

---

## Gemini & Antigravity specific guidelines

- **Environment**: User is on Windows (PowerShell). When suggesting or running local static servers, use `python -m http.server 8000`. Never install npm packages, bundlers, or toolchains.
- **Code modifications**: Use precise line-targeted replacements. Do not rewrite whole files when changing small parts.
- **Links**: Use clickable file links with `file://` scheme when referencing project files or symbols.
- **Planning**: For small, direct instructions, execute directly without unsolicited large plans. Always adhere strictly to the settled game design canon below.

---

## Two agents, one repo

Claude Code and Gemini/Antigravity both work in here. Take the work you are better at and hand the rest over — the wrong one of you doing a job badly costs more than the handoff does.

**Claude takes the maths.** Formulas, balance curves, cost exponents, anything multiplicative — the `(base + flat) × multipliers` model and the factor tag every new upgrade needs. Invariants that only surface when two files are read together: a gate that turns unreachable when a constant moves, a death order that compounds with a scaling term. Save shape, migrations, and the one-tab lock. Anything whose failure is silent, where the game keeps running and only the numbers are wrong.

**Gemini takes what is judged by eye.** Claude cannot screenshot this game — its browser pane keeps the page hidden, so `requestAnimationFrame` never fires and nothing paints; it checks layout by reading `getBoundingClientRect()`, which proves two rows line up and says nothing about whether the screen looks right. So sprite art in `js/sprites.js`, spacing, colour, anything that needs looking at. Also the bulk mechanical work — renames, CSS, moving DOM nodes, README prose.

**Either can take** a small self-contained mechanic. If it touches the brood array, the save, or a cost curve, it is Claude's.

**Neither runs while the other is running.** One at a time in this repo — otherwise plain git conflicts, and the canon below is shared state.

**Whoever ships updates Current state in the same commit, in both files.** `CLAUDE.md` and `GEMINI.md` differ only in the title, the agent-specific block above, and which of the two the layout listing marks as "this file". Everything else is byte-identical on purpose: edit one, edit the other.

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
js/save.js          save keys, migrations, the one-tab lock, import and export
js/raids.js         combat strength, monsters, raid resolution, hunting
js/ants.js          castes, production, costs, upgrades
js/panels.js        shared fmt(), the inspector, ants and settings panels
js/prestige.js      prestige formulas, upgrades, flight reset
js/upgrades.js      upgrade panel, effect previews, lock text
js/achievements.js  achievement tracks, tiers, levels, achievement panel
js/sprites.js       pixel art drawn onto canvas
js/ui.js            tab shell, header, brood controls, frame loop
CLAUDE.md           instructions for Claude
GEMINI.md           this file (instructions for Gemini)
README.md
```

Keep to this layout. Files are organized by feature domain. A file can comfortably grow to ~800–1,200 lines if it remains cohesive; when a major new system (e.g. prestige layers, automation) is introduced, suggest a new dedicated module (like `js/prestige.js`) before creating it.

---

## Code conventions

- Single global state object named `game`. All persistent values live inside it. No stray module-level mutable variables.
- One `tick(dt)` function drives all production. `dt` is seconds elapsed. Never assume a fixed frame rate.
- UI reads from `game` and renders. UI never mutates `game` directly — it calls functions in `game.js` or `ants.js`.
- Save with `localStorage` under the key `ants_save_v6`. Bump the version suffix when the save shape changes, and write a migration rather than silently wiping saves.
- Offline progress = elapsed wall-clock seconds since last save, capped, fed through the same `tick()`. Do not write a separate offline code path.
- Numbers: plain JavaScript numbers for now. When values exceed roughly `1e300`, tell me — we will discuss a big-number library then. Do not add one preemptively.
- Format displayed numbers through one shared `fmt()` function. Never format inline.
- Names in code match names in the game fiction: `reserves`, `eggs`, `nanitics`, `foragers`, `nurses`, `excavators`, `royalJelly`.

---

## Game design canon

This is settled. Do not redesign it. If you think something is wrong, say so in one sentence.

**Founding phase.** The game opens with a mated queen who has already landed. First click sheds her wings and grants a finite pool of `reserves` that never regenerates. She has four wings, so four nanitics. Eggs cost reserves. When the first workers emerge, reserves become permanently irrelevant.

**Nanitics.** The first worker generation is undersized and weak. This is intentional and biologically accurate — it is not a balance bug.

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

Last updated 23 August 2026. Published and playable at the Pages URL below.

**Built and working.** The founding phase plays end to end: the queen sheds her wings for 100 `reserves`, eggs cost 20 reserves each until the first worker emerges, the first four workers emerge as `nanitics` regardless of the caste chosen, and from then on eggs cost food and hatch into the selected caste. Foragers, excavators and nurses all do their jobs. Population gates at 16 / 64 / 256 are in.

**Prestige Layer 1 (Nuptial Flight)** is live. Gated at 1,000 population. The Nuptial tab sits between Achievements and Settings. Taking flight awards Royal Jelly based on `sqrt(peakPopulation / 1000) * (1 + raidsWon / 20)` and resets the colony into a new founding queen while keeping achievements, peak stats, Royal Jelly, and 8 Royal Lineage adaptations in `js/prestige.js`. Migration from save v5 to v6 is in. Two achievement tracks for flights and royal jelly are live.

**Egg cost is per caste**, each with its own curve — forager `1.5 x n^1.75`, excavator `15 x n^1.8`, nurse `60 x n^1.7`, soldier `200 x n^1.6`. One caste's count never moves another's price. The price counts eggs already in the brood as well as hatched ants, so laying a batch at once costs exactly what laying them one at a time would. Before that, a batch of 100 cost 50.5% less than the same 100 bought singly.

**Excavator dig-out rule.** At the population cap no egg could be laid at all, including the excavators that are the only way to raise the cap — a colony that filled its cap with foragers was permanently dead. Excavator eggs may now exceed the cap by up to 3 while they dig their own chambers. This rule was added to fix that softlock; change it and the softlock returns.

**Nanitics die of old age at two hours.** Their base output is 0.9 against a forager's 1.0, which is high for ants described as feeble; it buys the fast opening. They are capped at 4 — one per wing the queen shed — and never scale with forager upgrades. Her 100 reserves still buy five eggs at 20 each, so the fifth hatches as the chosen caste rather than a nanitic.

**The four nanitic upgrades are gated 1 / 2 / 3 / 4**, because a four-ant generation can never satisfy a gate above four. Two add flat food to the base (+0.9, +1.2) and two multiply it (×1.5, ×2), giving 9.0 each at full upgrades. Four nanitics at 9.0 is 36/s, exactly what five at 7.2 delivered before, so the opening's ceiling did not move when the fifth nanitic did.

**Brood slots.** Only a few eggs develop at once; the rest queue. Base is 3 slots, each nurse adds 0.25 and the nurse upgrades raise that. Incubation is 24s per egg. This exists because hatching speed was never the bottleneck — food was — so nurses were dead weight. Measured: a run that never buys nurses reaches 1,000 ants in 160 minutes with the brood saturated 99% of the time; buying them when the brood backs up reaches it in 108. Do not raise the base slot count much; every point of it makes nurses matter less, and at base 5 with 15s incubation they were worth 3 minutes across a whole run.

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

**Upgrades** are split into two branches shown as sub-tabs on the Upgrades tab, Colony and Combat, with a coloured edge per branch. 29 one-time purchases — 21 Colony bought with food, 8 Combat of which five cost protein — each unlocked by a caste count, a total population, or surviving a raid. All of them are listed at all times: locked entries show what they need and how close you are, and separate toggles hide locked and owned entries. When those toggles hide everything the panel says why — an empty grid with no explanation reads as a broken tab, and a player with Hide owned ticked sees exactly that the moment they own all 29. Both toggles live on the Upgrades tab only — duplicating them in Settings was asked for and then asked against. Available ones show what they do to your *current* rates, because the raw percentages mislead — caste-food upgrades share one additive pool, so the "+150%" forager upgrade actually delivers about +44% overall.

**Achievements are tracks that keep levelling**, not one-off badges. Sixteen tracks — colony size, food, eggs, each caste, raids won, fighting strength, protein, upgrades — each with a ladder of thresholds. Three of them count upgrades — all, Colony only and Combat only — and their ladders are generated from how many upgrades actually exist, so they always finish on the real maximum (29 / 21 / 8 today) and stay correct when upgrades are added. Every threshold passed is a tier, tiers are the points, and every 5 points is an achievement level worth +3% food, +1% hatch speed and +5% Royal Jelly, capped at level 20. Tracks read peak values, so losing ants never takes a tier back, and the tab shows each track's next threshold.

**Every ladder now ends on a number a colony reaches.** They ran to 1e12 ants, 1e24 food and 80 big foragers — eleven of the sixteen tracks could not be finished and level 20 was unreachable, measured at 92 tiers and level 18 after fourteen simulated hours and six flights. The tops are set against a colony of about 10,000 ants and the rungs are dense where players actually stand, which is worth more than the range: the same run now scores 113 of 137 tiers and reaches level 20, and the same 3,000-ant colony that read level 13 reads 15. Two rules held while reshaping them. **No value may score fewer tiers than it did before** — shortening a ladder silently takes an achievement level, and with it the food and hatch bonuses, from a save that has already passed the old rungs. Swept across both ladders, every remaining crossover sits beyond anything reachable (1e9 ants, 1e13 food, 20 big foragers at roughly 690,000 forager hatches); the first two attempts failed this at 1,000 strength and 100 protein, which are ordinary mid-game numbers, because dropping a decade also dropped the rung underneath it. And **flights and royal jelly keep their old tops of 50 and 250**, because they are prestige-grind tracks rather than colony-size ones and a dedicated player really can pass them.

**Prestige Layer 1 (the Nuptial Flight)** unlocks at 1,000 *live* population and pays `3 × (population / 1000)^0.8 × (1 + raidsWon / 20) × achievement jelly bonus`, read from the colony standing at the moment of the flight. **The payout is not floored, and that matters more than the curve.** Under the old `floor(sqrt(...))` every flight paid exactly 1 whatever the colony did — tripling a run from 1,000 to 3,000 ants moved the raw value from 1.00 to 1.73 and still rounded to 1 — so pushing was punished, the optimum was to flight the instant the gate opened, and the 35-jelly tree took 35 identical flights over 18 hours. It now carries one decimal, and a 3,000-ant run genuinely pays 1.73 times a 1,000-ant one. Measured: a competent player completes the whole tree in **4.9 hours across 2 flights**. It must not read `peakPopulation`: that survives the reset, so paying on it let a player flight repeatedly with no ants and collect every time — measured at 25 jelly from 25 clicks on an empty colony, against a tree that costs 17. The flight clears food, protein, ants, brood, standard upgrades, raid counters and the queen's wings; Royal Jelly, the eight Royal Lineage adaptations, achievements, peak records, lifetime stats and settings all persist.

**Two clocks, and they are not the same.** `stats.playtime` is a lifetime total that survives every flight; `runTime` resets with the colony. The header reads `runTime` — it is labelled colony age, and a colony that has just been founded is not thirty hours old. Beside it sits **matriline**, the lifetime total, hidden until the first flight because before that it only repeats the colony age. Settings carries both, as *This colony* and *Matriline*. The nanitic lifespan reads `runTime`, because reading the lifetime clock meant every colony founded after the two-hour mark was born already too old — measured at 1 surviving nanitic and 1.90/s instead of 4 and 4.60/s, and worse with the prestige brood upgrades, since more eggs hatch into the same tick and die together.

**A flight must never take an achievement tier back.** The three upgrade tracks read `peakUpgrades`, and the raids track reads `stats.raidsWonTotal`, because `game.upgrades` and `raidsWon` both reset — without those, a flight cost 14 tiers and three achievement levels, shrinking the food and hatch bonuses permanently.

**Gates read high-water marks, and there are two of them.** `game.run.peak*` is the largest this colony has ever been and resets with the flight; `game.peak*` never falls. Caste unlocks, upgrade requirements, the raid unlock and `monsterPower` all read the **run** peak, so every colony re-earns Excavators at 16, Nurses at 64, Soldiers and raids at 256. Achievement tiers and the Settings record read the **all-time** peak, so nothing a flight does can take a tier back. Reading all-time for the gates meant a brand-new colony of zero ants was already past every gate with 22 of 29 upgrades open, being hit by a 1,712-power monster with 0 defence — the threat was scaled to the best colony the player ever had, not the one standing. Within a run the high-water mark still matters: with a live count a lost raid would hide upgrades mid-run, and the nanitic upgrades would become unbuyable the moment the founders died of old age.

**The layout is two columns on a wide screen.** The left is the status column, top to bottom: the queen, the raid box, then the inspector. The right is the column you act in: the brood above the tabs, and the brood panel is the same width as the tab panels below it. Below 1000px the whole thing stacks in that order.

**Every rate is `(base + flat) × multipliers`.** Hovering an upgrade shows its layer's formula with live numbers, the one factor that upgrade moves, and the before and after — `each forager = (base 1 + yield 1.25) × colony 1.25 × achievements 1.48 = 4.2/s`. Effects come in four kinds: `casteFlat` adds food to a caste's base, `casteFood` does the same but is stored as a share of that base, `casteMult` multiplies one caste, `globalFood` multiplies everything. A new upgrade must be tagged with the factor it moves or the formula stops matching the game. `fmtFactor()` prints those factors, because `fmt()` keeps three significant figures and would read a 1.25 multiplier as 1.3.

**Achievement tracks carry a dot and a pip ladder.** A track that gained a tier since you last pointed at *that track* shows a dot, cleared by hovering the row rather than by opening the tab — so the tab says which tracks moved, not merely that something did. Under each track is one pip per tier, filled for earned, so completed tiers read at a glance. `seen.tracks` records the per-track tier last looked at; a save written before it existed is seeded from current tiers, or every track lights at once.

**Protein and food are not comparable by their raw numbers.** Measured across a full run, one protein is worth between 5,700 and 18,400 food, and the ratio triples as foragers outscale the soldier count, so no fixed rate is honest. `foodPerProtein()` reads what the colony earns right now — hunting plus the raid's share against food plus the raid's food — and every protein cost is shown with its live equivalent, `2.00K protein (≈ 2.92M food)`. Sorting by price converts protein the same way, or the two currencies cannot share one order.

**The Upgrades tab sorts** by name either way, by price, and by the ants a gate needs, chosen from a control beside the hide toggles and saved with the colony. Sorting reorders the existing cards rather than rebuilding them.

**Achievements are two sub-tabs**, with the level and its bar above both. Tracks holds the sixteen ladders. Bonuses holds what the levels actually pay, one box each for food and hatch speed, and below them what a nuptial flight has unlocked.

**The queen sheds her wings by herself once she has flown.** This is the first automation in the game and the flight is what buys it — `autoShedUnlocked()` reads `flightsTaken`, and a Settings toggle turns it off. It does not lay an egg, buy an upgrade, pick a caste or exile an ant, so the rule that those stay clicks is intact.

**A Formulas panel sits in Settings**, not in a tab of its own — it is system information rather than something you act on. It lists every layer the colony runs on with live numbers: each producing caste's food, the population cap, brood slots, soldier strength, the next attacker and the hunting rate. Rows appear only when they mean something, so a colony with no soldiers is not told about hunting. `monsterPower` is printed there too, which is the only place the raid scaling is visible — `next attacker = base 1000 × (this colony 700 / 400)^1.05 × wins 1.35 = 2.43K`. Its growth per win reads `MONSTER_GROWTH` so the panel and the raid cannot drift apart.

**The inspector** sits at the bottom of the status column: hover any ant, upgrade or achievement track and it explains what the thing does and what it still needs. It keeps showing the last thing pointed at, so the text does not vanish when the mouse moves away or the tab changes.

**Interface** is four tabs — Ants, Upgrades, Achievements, Settings — with the brood sitting above them in the same column, so eggs can be laid from any tab. A dot marks Upgrades or Achievements when something new is waiting and clears when the tab is opened. Each caste and the queen have a pixel sprite drawn in JS onto a canvas; the brood shows one bar per tended egg, up to five, then a count of the slots working out of sight.

**Themes** are dark, light and soil, chosen in Settings and saved with the colony. Every colour comes from a variable on `:root` — including the background glow, the text on primary buttons, the card hover and the sticky header. Hard-coding the header cost the whole light theme: at `rgba(16, 11, 10, 0.92)` it stayed a near-black bar under dark-brown readout text, so food, rate and population were unreadable on two of the three themes. Hard-coding any of them breaks a theme: a fixed dark glow put a near-black blotch on the light background, fixed dark button text left 0.29 luminance against light-theme red, and a fixed `#2c1c19` hover turned an affordable upgrade card almost black the moment you pointed at it on light or soil. `--hover` is one step lighter than `--panel2` in each theme, so the card lifts rather than sinks whichever one is on.

**The queen can be named** in Settings and is addressed as Queen <name>. One queen per colony, always.

**Display rules.** `fmt()` keeps three significant figures — 1862 reads as 1.86K, not 1.9K — and rolls the suffix over when rounding carries (999999 is 1.00M, not 1000K). Costs read green when affordable and muted when not; red never means "you can afford this".

**Background tabs are credited.** `requestAnimationFrame` does not fire in a hidden tab, so the frame loop feeds the whole elapsed gap through `tick()` in chunks, clamped to the same eight hour cap as offline progress. Capping a frame at one second instead threw away 99.8% of a ten minute absence.

**Export and import are a panel, not a `prompt()`.** A finished colony's save code is enormous — measured at 12,412 characters for a 2,400-ant nest with its brood full, and 26,756 with a 300-egg queue. `window.prompt()` cannot carry that: browsers truncate the default value, a single-line box cannot be selected reliably, it is hopeless on a phone, and a sandboxed iframe without `allow-modals` returns null outright, which is what broke importing inside the itch.io embed. Both now open a modal with a textarea, a copy button that falls back to "it is selected, press Ctrl+C" where the clipboard API is not granted, and a character count so a short paste is obvious. A truncated code fails with a message naming that cause instead of a bare "not valid". Erasing the colony asks twice on the button itself for the same reason — `confirm()` returns false in a blocked embed, which made the button look dead.

**Only one tab writes the save.** Opening the game claims a `localStorage` lock keyed to that tab; the most recently opened tab owns it and every older tab stops saving, so a forgotten background tab can no longer overwrite real progress when it closes. The stale tab shows a red banner with a "Play here instead" button, which reclaims the lock and reloads from the authoritative save rather than pushing its own state over it. A lone tab with no lock present always saves, so a fresh browser is unaffected.

**Pacing.** Milestones under strong simulated play, so a human runs slower:

| ants | 20 | 50 | 100 | 250 | 500 | 1000 | 2000 |
|---|---|---|---|---|---|---|---|
| time | 3m | 7m | 13m | 29m | 51m | 80m | 166m |

The opening is slower than it was (20 ants in 2.9m against 1.6m) because brood slots cap early throughput. That is the price of nurses mattering — the two trade directly against each other.

Upgrade unlocks are spaced against measured caste counts so a reward lands every few minutes; the worst gap is about 15 minutes, down from 65.

**The tree ends, and the game says so.** With all twelve adaptations bought there is nothing left to spend Royal Jelly on, and a flight still pays around 25. Running out of content silently reads as a bug, so the Nuptial tab prints a line once the lineage is complete: what is banked, that jelly keeps gathering, and that deeper layers are being built for the beta. Keep it honest if more layers land — it is the last thing a finishing player reads.

**Upgrade cards are ordered by CSS, never by moving them.** `renderUpgrades()` re-appended all 29 cards every frame to apply the sort. `appendChild` on a node already in the tree removes it first, and Chromium then reassigns the pending click target to the removed node's parent — so the `click` fired on `#upgradeList` and the card's own handler never ran. An upgrade was only buyable if mousedown and mouseup both landed inside one 16ms frame, which is exactly what an autoclicker does and exactly what a hand does not; CoolRadGamer and sir_pinski both reported it as needing rapid clicking, and CoolRadGamer guessed the cause correctly. The sort now writes `style.order`, which reorders grid items without detaching them. Measured at 0 childList mutations across 10 renders, against 290 before. **Anything rendered every frame must mutate its nodes in place and never reparent them** — this is the failure mode to check first when a control needs clicking twice.

**A stuck header ate the clicks underneath it.** This was the *second* cause of "I cannot buy upgrades", and it is independent of the render bug. `header` is `position: sticky` and 101px tall, so anything scrolled into that band was hit-tested to the header rather than to itself and the click never arrived. Measured with `elementFromPoint` at the bottom of the Upgrades tab: 14 of the visible cards resolved to `HEADER` or `H1`, and the same held for the Lay buttons, the rally button, the tab bar and the caste chips. Because the header is 92% opaque the card underneath is still faintly visible, so it reads as a dead button rather than as something covered. Nothing in the header is interactive — it is an `h1` and a row of readouts — so it now carries `pointer-events: none` and every pointer falls through; measured at 0 blocked controls against 14. The two failures need different tests: the render bug needed a *fast* click, this one needs the control not to be near the top of the viewport. When a control will not take a click, check both.

**The population gates moved in to 16 / 64 / 256.** They were 25 / 100 / 400, and the first thirteen minutes held exactly one decision — lay foragers — because Excavators were the first fork and they were 25 ants away. Measured under one fixed policy, old gates against new: 1,000 ants at 132m against 114m, 2,000 at 215m against 197m, with the opening (20 / 50 / 100 ants at 3m / 7m / 13m) untouched because it is brood-slot bound rather than gate bound.

**The raid gate moved with the soldier gate; the threat curve deliberately did not.** `monsterPower` divided by `RAID_UNLOCK`, so dropping that to 256 would silently have made every attacker about 60% stronger at any given population. `MONSTER_REFERENCE` is now its own constant pinned at 400 — the size of nest the base 1,000-power monster is tuned against — and both `monsterPower()` and the Formulas panel read it. A colony of any given size therefore meets exactly the attacker it met before; only the first one arrives sooner, at a quarter strength, against an army that now has room to exist. Keep the two constants separate: fusing them again re-couples difficulty to a gate that is a pacing decision.

**Rallying the foragers is the one thing a hand can do to the food rate.** A button in the brood panel puts foragers on ×3 for 30 seconds and then rests them for 90, so a player who works it holds about ×1.5 on average against an idler's ×1. Measured over six hours on one policy: 1,000 ants at 85m rallying against 114m not, and 2,000 at 144m against 197m. It is a multiplier on foragers alone, which means big foragers ride on it — they read `casteFoodPerSecond(game, "forager")` — and the founding nanitics do not, because they are not out on the trails to be called back. `foodFormula()` prints `× rally 3` while it runs; a formula that does not match the rate is worse than no formula. The cooldown starts when the boost ends, not when it starts. It is not automation: nothing presses it for the player.

**The colony says what it is growing towards.** A milestone line under the queen names the next gate and the distance to it — 16 for Excavators, 64 for Nurses, 256 for Soldiers and the first monster, 1,000 for the Nuptial Flight. The flight was the only gate in the game that hid its own existence: the Nuptial tab stays hidden until you reach 1,000, so the entire explanation of the game's first prestige lived inside a tab the player could not open, which Akami reported as the reason a first run would never push for it. The line reads the **run** high-water mark, the same figure the gates read, so a lost raid never walks it backwards. Past 1,000 it says every milestone is behind her and that deeper ones are being built, in the same spirit as the finished-lineage line on the Nuptial tab — running out of content silently reads as a bug.

**Not built.** Prestige layers beyond the first. A competent player finishes the whole Royal Lineage in about five hours, so that is the current edge of the game.

**When layer 2 lands, the lifetime clock is the Matriline.** Not the bloodline: ants have hemolymph rather than blood, in an open system with no hemoglobin, so nothing about them is red or vessel-borne. Colonies genuinely are matrilineal — every worker descends from the queen, and each new nest is founded by her daughter — so the Matriline is the accurate word for the line of queens, and the right home for the total-time figure the header stopped showing when colony age began resetting. Layer 1 keeps *Lineage*; the two read as related without colliding.

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

## The test loop

Every change ships to GitHub Pages at `https://theteiton.github.io/ants-incremental/`. Before saying a change is done, confirm the game still loads and the first sixty seconds still play. A change that breaks the opening is worse than no change.

---

## Summary

Small diffs. Ask before adding. Design decisions are mine.
