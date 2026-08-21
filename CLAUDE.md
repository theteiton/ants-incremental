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
js/save.js          save keys, migrations, the one-tab lock, import and export
js/raids.js         combat strength, monsters, raid resolution, hunting
js/ants.js          castes, production, costs, upgrades
js/panels.js        shared fmt(), the inspector, ants and settings panels
js/upgrades.js      upgrade panel, effect previews, lock text
js/achievements.js  achievement tracks, tiers, levels, achievement panel
js/sprites.js       pixel art drawn onto canvas
js/ui.js            tab shell, header, brood controls, frame loop
CLAUDE.md           this file (instructions for Claude)
GEMINI.md           instructions for Gemini
README.md
```

Keep to this layout. Files are organized by feature domain. A file can comfortably grow to ~800–1,200 lines if it remains cohesive; when a major new system (e.g. prestige layers, automation) is introduced, suggest a new dedicated module (like `js/prestige.js`) before creating it.

---

## Code conventions

- Single global state object named `game`. All persistent values live inside it. No stray module-level mutable variables.
- One `tick(dt)` function drives all production. `dt` is seconds elapsed. Never assume a fixed frame rate.
- UI reads from `game` and renders. UI never mutates `game` directly — it calls functions in `game.js` or `ants.js`.
- Save with `localStorage` under the key `ants_save_v5`. Bump the version suffix when the save shape changes, and write a migration rather than silently wiping saves.
- Offline progress = elapsed wall-clock seconds since last save, capped, fed through the same `tick()`. Do not write a separate offline code path.
- Numbers: plain JavaScript numbers for now. When values exceed roughly `1e300`, tell me — we will discuss a big-number library then. Do not add one preemptively.
- Format displayed numbers through one shared `fmt()` function. Never format inline.
- Names in code match names in the game fiction: `reserves`, `eggs`, `nanitics`, `foragers`, `nurses`, `excavators`.

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

**Unlocks are gated by colony population, not by purchasing upgrades.** 25 ants unlocks Excavators, 100 unlocks Nurses, 400 unlocks Soldiers.

**Prestige is the nuptial flight.** Not built yet. Do not build it until I ask.

**No automation before prestige.** Nothing lays an egg, buys an upgrade, picks a caste or exiles an ant on the player's behalf. Every one of those stays a click. Automation is what prestige layer 1 upgrades will sell, so do not spend it early — passive production, hatching, raids and hunting are not automation, they are the game running.

---

## Current state

Last updated 20 August 2026. Published and playable at the Pages URL below.

**Built and working.** The founding phase plays end to end: the queen sheds her wings for 100 `reserves`, eggs cost 20 reserves each until the first worker emerges, the first four workers emerge as `nanitics` regardless of the caste chosen, and from then on eggs cost food and hatch into the selected caste. Foragers, excavators and nurses all do their jobs. Population gates at 25 / 100 / 400 are in.

**Egg cost is per caste**, each with its own curve — forager `1.5 x n^1.75`, excavator `15 x n^1.8`, nurse `60 x n^1.7`, soldier `200 x n^1.6`. One caste's count never moves another's price. The price counts eggs already in the brood as well as hatched ants, so laying a batch at once costs exactly what laying them one at a time would. Before that, a batch of 100 cost 50.5% less than the same 100 bought singly.

**Excavator dig-out rule.** At the population cap no egg could be laid at all, including the excavators that are the only way to raise the cap — a colony that filled its cap with foragers was permanently dead. Excavator eggs may now exceed the cap by up to 3 while they dig their own chambers. This rule was added to fix that softlock; change it and the softlock returns.

**Nanitics die of old age at two hours.** Their base output is 0.9 against a forager's 1.0, which is high for ants described as feeble; it buys the fast opening. They are capped at 4 — one per wing the queen shed — and never scale with forager upgrades. Her 100 reserves still buy five eggs at 20 each, so the fifth hatches as the chosen caste rather than a nanitic.

**The four nanitic upgrades are gated 1 / 2 / 3 / 4**, because a four-ant generation can never satisfy a gate above four. Two add flat food to the base (+0.9, +1.2) and two multiply it (×1.5, ×2), giving 9.0 each at full upgrades. Four nanitics at 9.0 is 36/s, exactly what five at 7.2 delivered before, so the opening's ceiling did not move when the fifth nanitic did.

**Brood slots.** Only a few eggs develop at once; the rest queue. Base is 3 slots, each nurse adds 0.25 and the nurse upgrades raise that. Incubation is 24s per egg. This exists because hatching speed was never the bottleneck — food was — so nurses were dead weight. Measured: a run that never buys nurses reaches 1,000 ants in 160 minutes with the brood saturated 99% of the time; buying them when the brood backs up reaches it in 108. Do not raise the base slot count much; every point of it makes nurses matter less, and at base 5 with 15s incubation they were worth 3 minutes across a whole run.

**Big Foragers.** A rare variant that hatches from ordinary forager eggs and cannot be laid deliberately. The k-th is guaranteed by the 3.5^k-th forager since the last one, with a chance that rises toward that threshold, so in practice the roll fires well before the guarantee — about ten appear over 750 forager hatches. Each produces 5x a forager's base and grows +5% per minute alive to a cap of 3x, so she starts strong and ages into something stronger. They are not exilable and stay hidden in the roster until the first one appears.

**Exiling** removes ants from a caste with no refund. It is blocked when it would drop the cap below the current population, so excavators cannot be dumped to strand a colony above its cap. Nanitics cannot be exiled, a Settings toggle disables the feature, and it unlocks with the first forager. Because exiling lowers population, caste unlocks read a high-water mark — with a live count, exiling would re-lock castes already earned.

**Raids.** From 400 population a monster attacks every six minutes. Soldiers fight at 25 each from birth; every other caste fights at nothing until the Combat branch arms them — Alarm Pheromone gives foragers 1, Gallery Wardens gives excavators 10, Brood Defenders gives nurses 2, and big foragers fight at triple a forager. The branch only appears after the colony has survived its first attack, and the first three raids come at a quarter, half and three quarters strength so there is time to react. Win and the corpse is stripped for protein and a burst of food that runs through the same multipliers as foraging, so it keeps pace. Lose and ants die in order: soldiers first, then foragers, big foragers, nanitics, nurses, and excavators last so the population cap survives. Losses are capped at 20% of the colony and a lost raid still salvages some protein.

**Soldiers hunt between raids.** While no attack is near they are out of the nest bringing back protein every second; inside the last thirty seconds they come home and the hunting stops. Workers never leave, which is why they only ever fight defensively.

Monsters scale with peak population and grow 5% per raid won. Measured over a full run: 6% soldiers wins 19 of 32 raids and reaches 1,000 ants in about 80 minutes, 10% wins all 32, and a colony that never lays a soldier still gets to 1,000 on worker strength alone once the Combat branch is bought — slower and bloodier, but not a wall.

**Salvage is proportional to the fight you put up.** A lost raid returns protein scaled by how much defence you mustered, so a colony with no combat at all gets nothing from the corpse. Keep a losing colony able to recover if these numbers change.

**Protein** is the second resource, and raids and hunting produce it. Feeding the brood is a choice, not automatic: a toggle in the brood panel appears once protein exists, and while it is on each egg laid spends one protein and develops twice as fast. Turn it off, or run out, and eggs cost food alone at normal speed — so a colony that loses its soldiers is slowed rather than blocked. Fed eggs are marked in the brood slots. Protein also buys its own five-upgrade branch, gated on soldier count, covering fighting strength, protein yield, and three extra brood slots.

**Upgrades** are split into two branches shown as sub-tabs on the Upgrades tab, Colony and Combat, with a coloured edge per branch. 29 one-time purchases — 21 Colony bought with food, 8 Combat of which five cost protein — each unlocked by a caste count, a total population, or surviving a raid. All of them are listed at all times: locked entries show what they need and how close you are, and separate toggles hide locked and owned entries. Both toggles live on the Upgrades tab only — duplicating them in Settings was asked for and then asked against. Available ones show what they do to your *current* rates, because the raw percentages mislead — caste-food upgrades share one additive pool, so the "+150%" forager upgrade actually delivers about +44% overall.

**Achievements are tracks that keep levelling**, not one-off badges. Fourteen tracks — colony size, food, eggs, each caste, raids won, fighting strength, protein, upgrades — each with a ladder of thresholds. Three of them count upgrades — all, Colony only and Combat only — and their ladders are generated from how many upgrades actually exist, so they always finish on the real maximum (29 / 21 / 8 today) and stay correct when upgrades are added. Every threshold passed is a tier, tiers are the points, and every 5 points is an achievement level worth +3% food and +1% hatch speed, capped at level 20. Tracks read peak values, so losing ants never takes a tier back, and the tab shows each track's next threshold. Measured over a full run, a 2,500-ant colony reaches 72 tiers and level 14.

**Gates read high-water marks, everywhere.** Caste unlocks, upgrade requirements and achievement tiers all use the largest count the colony has ever held, not the live one. Without this a lost raid hides upgrades mid-run, and the nanitic upgrades become unbuyable forever the moment the founders die of old age.

**The layout is two columns on a wide screen.** The left is the status column, top to bottom: the queen, the raid box, then the inspector. The right is the column you act in: the brood above the tabs, and the brood panel is the same width as the tab panels below it. Below 1000px the whole thing stacks in that order.

**Every rate is `(base + flat) × multipliers`.** Hovering an upgrade shows its layer's formula with live numbers, the one factor that upgrade moves, and the before and after — `each forager = (base 1 + yield 1.25) × colony 1.25 × achievements 1.48 = 4.2/s`. Effects come in four kinds: `casteFlat` adds food to a caste's base, `casteFood` does the same but is stored as a share of that base, `casteMult` multiplies one caste, `globalFood` multiplies everything. A new upgrade must be tagged with the factor it moves or the formula stops matching the game. `fmtFactor()` prints those factors, because `fmt()` keeps three significant figures and would read a 1.25 multiplier as 1.3.

**Achievement tracks carry a dot and a pip ladder.** A track that gained a tier since you last pointed at *that track* shows a dot, cleared by hovering the row rather than by opening the tab — so the tab says which tracks moved, not merely that something did. Under each track is one pip per tier, filled for earned, so completed tiers read at a glance. `seen.tracks` records the per-track tier last looked at; a save written before it existed is seeded from current tiers, or every track lights at once.

**The inspector** sits at the bottom of the status column: hover any ant, upgrade or achievement track and it explains what the thing does and what it still needs. It keeps showing the last thing pointed at, so the text does not vanish when the mouse moves away or the tab changes.

**Interface** is four tabs — Ants, Upgrades, Achievements, Settings — with the brood sitting above them in the same column, so eggs can be laid from any tab. A dot marks Upgrades or Achievements when something new is waiting and clears when the tab is opened. Each caste and the queen have a pixel sprite drawn in JS onto a canvas; the brood shows one bar per tended egg, up to five, then a count of the slots working out of sight.

**Themes** are dark, light and soil, chosen in Settings and saved with the colony. Every colour comes from a variable on `:root` — including the background glow and the text on primary buttons. Hard-coding either breaks a theme: a fixed dark glow put a near-black blotch on the light background, and fixed dark button text left 0.29 luminance against light-theme red.

**The queen can be named** in Settings and is addressed as Queen <name>. One queen per colony, always.

**Display rules.** `fmt()` keeps three significant figures — 1862 reads as 1.86K, not 1.9K — and rolls the suffix over when rounding carries (999999 is 1.00M, not 1000K). Costs read green when affordable and muted when not; red never means "you can afford this".

**Background tabs are credited.** `requestAnimationFrame` does not fire in a hidden tab, so the frame loop feeds the whole elapsed gap through `tick()` in chunks, clamped to the same eight hour cap as offline progress. Capping a frame at one second instead threw away 99.8% of a ten minute absence.

**Only one tab writes the save.** Opening the game claims a `localStorage` lock keyed to that tab; the most recently opened tab owns it and every older tab stops saving, so a forgotten background tab can no longer overwrite real progress when it closes. The stale tab shows a red banner with a "Play here instead" button, which reclaims the lock and reloads from the authoritative save rather than pushing its own state over it. A lone tab with no lock present always saves, so a fresh browser is unaffected.

**Pacing.** Milestones under strong simulated play, so a human runs slower:

| ants | 20 | 50 | 100 | 250 | 500 | 1000 | 2000 |
|---|---|---|---|---|---|---|---|
| time | 3m | 7m | 13m | 29m | 51m | 80m | 166m |

The opening is slower than it was (20 ants in 2.9m against 1.6m) because brood slots cap early throughput. That is the price of nurses mattering — the two trade directly against each other.

Upgrade unlocks are spaced against measured caste counts so a reward lands every few minutes; the worst gap is about 15 minutes, down from 65.

**Not built.** Prestige (the nuptial flight), and any automation, which belongs to prestige layer 1.

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
- Cancelling or destroying queued eggs, no refund. The brood is strict FIFO, so amsel's nurse eggs sat behind 600 forager eggs. Cancelling fixes the misclick; it does not fix priority, which is a separate feature.
- Scouts that forage outside the nest for protein — overlaps what soldiers already do between raids, so it needs its own constraint.
- More achievement bonus types. Deferred by decision until a few prestige layers exist.

---

## The test loop

Every change ships to GitHub Pages at `https://theteiton.github.io/ants-incremental/`. Before saying a change is done, confirm the game still loads and the first sixty seconds still play. A change that breaks the opening is worse than no change.

---

## Summary

Small diffs. Ask before adding. Design decisions are mine.
