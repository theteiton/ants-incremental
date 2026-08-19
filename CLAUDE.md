# ants-incremental

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
js/game.js          state object, tick loop, save/load, exiling
js/ants.js          castes, production, costs, upgrades
js/panels.js        tab panel rendering, shared fmt()
js/sprites.js       pixel art drawn onto canvas
js/ui.js            tab shell, header, brood controls, frame loop
CLAUDE.md           this file
README.md
```

Keep to this layout. If a file grows past roughly 400 lines, tell me and suggest a split — do not split it yourself.

---

## Code conventions

- Single global state object named `game`. All persistent values live inside it. No stray module-level mutable variables.
- One `tick(dt)` function drives all production. `dt` is seconds elapsed. Never assume a fixed frame rate.
- UI reads from `game` and renders. UI never mutates `game` directly — it calls functions in `game.js` or `ants.js`.
- Save with `localStorage` under the key `ants_save_v3`. Bump the version suffix when the save shape changes, and write a migration rather than silently wiping saves.
- Offline progress = elapsed wall-clock seconds since last save, capped, fed through the same `tick()`. Do not write a separate offline code path.
- Numbers: plain JavaScript numbers for now. When values exceed roughly `1e300`, tell me — we will discuss a big-number library then. Do not add one preemptively.
- Format displayed numbers through one shared `fmt()` function. Never format inline.
- Names in code match names in the game fiction: `reserves`, `eggs`, `nanitics`, `foragers`, `nurses`, `excavators`.

---

## Game design canon

This is settled. Do not redesign it. If you think something is wrong, say so in one sentence.

**Founding phase.** The game opens with a mated queen who has already landed. First click sheds her wings and grants a finite pool of `reserves` that never regenerates. Eggs cost reserves. When the first workers emerge, reserves become permanently irrelevant.

**Nanitics.** The first worker generation is undersized and weak. This is intentional and biologically accurate — it is not a balance bug.

**Castes differ in kind, not degree.** Never make a caste a strictly-better version of another one.

- Foragers — produce Food, the main currency
- Nurses — increase the egg-to-worker conversion rate
- Excavators — increase the colony population cap
- Soldiers — reduce losses from raid events

**Unlocks are gated by colony population, not by purchasing upgrades.** 25 ants unlocks Excavators, 100 unlocks Nurses, 400 unlocks Soldiers.

**Prestige is the nuptial flight.** Not built yet. Do not build it until I ask.

---

## Current state

Last updated 19 August 2026. Published and playable at the Pages URL below.

**Built and working.** The founding phase plays end to end: the queen sheds her wings for 100 `reserves`, eggs cost 20 reserves each until the first worker emerges, the first five workers emerge as `nanitics` regardless of the caste chosen, and from then on eggs cost food and hatch into the selected caste. Foragers, excavators and nurses all do their jobs. Population gates at 25 / 100 / 400 are in.

**Egg cost is per caste**, each with its own curve — forager `1.5 x n^1.75`, excavator `15 x n^1.8`, nurse `60 x n^1.7`, soldier `200 x n^1.6`. One caste's count never moves another's price. The price counts eggs already in the brood as well as hatched ants, so laying a batch at once costs exactly what laying them one at a time would. Before that, a batch of 100 cost 50.5% less than the same 100 bought singly.

**Exiling** removes ants from a caste with no refund. It is blocked when it would drop the cap below the current population, so excavators cannot be dumped to strand a colony above its cap. Nanitics cannot be exiled, a Settings toggle disables the feature, and it unlocks with the first forager. Because exiling lowers population, caste unlocks read a high-water mark — with a live count, exiling would re-lock castes already earned.

**Nanitics die of old age at two hours.** Their base output is 0.9 against a forager's 1.0, which is high for ants described as feeble; it buys the fast opening. They stay capped at 5 and never scale with forager upgrades.

**Interface** is four tabs — Ants, Upgrades, Achievements, Settings — with the queen and brood controls pinned above them so eggs can be laid from any tab. Theme is red. Each caste and the queen have a pixel sprite drawn in JS onto a canvas.

**Upgrades.** 20 one-time food purchases, each unlocked by a caste count, plus three by total population. All of them are listed at all times: locked entries show what they need and how close you are, and a toggle hides them. Available ones show what they do to your *current* rates, because the raw percentages mislead — caste-food upgrades share one additive pool, so the "+150%" forager upgrade actually delivers about +44% overall.

**Achievements.** 27 achievements worth 82 points total. Every 5 points is one achievement level; each level grants +3% food and +1% hatch speed, to a maximum of level 16.

**Excavator dig-out rule.** At the population cap no egg could be laid at all, including the excavators that are the only way to raise the cap — a colony that filled its cap with foragers was permanently dead. Excavator eggs may now exceed the cap by up to 3 while they dig their own chambers. This rule was added to fix that softlock; change it and the softlock returns.

**Background tabs are credited.** `requestAnimationFrame` does not fire in a hidden tab, so the frame loop feeds the whole elapsed gap through `tick()` in chunks, clamped to the same eight hour cap as offline progress. Capping a frame at one second instead threw away 99.8% of a ten minute absence.

**Pacing.** Incubation is 10s. Milestones under strong simulated play, so a human runs slower:

| ants | 20 | 50 | 100 | 250 | 500 | 1000 |
|---|---|---|---|---|---|---|
| time | 1.6m | 5.5m | 11.7m | 33m | 64m | 101m |

Upgrade unlocks are spaced against measured caste counts so a reward lands every few minutes; the worst gap is about 15 minutes, down from 65.

**Not built.** Prestige (the nuptial flight) and raid events.

**Soldiers are inert.** They gate at 400 and have an achievement, but with no raids they produce nothing. Their row in the Ants tab says so rather than letting anyone buy them blind.

**Nurses have diminishing returns by construction.** Hatch *rate* is linear in nurse count, so hatch *time* is hyperbolic: the first nurse cuts 2.0s, the tenth 0.22s, the twentieth 0.07s. Not a bug, but it reads as broken. Making nurses raise brood capacity instead of speed is the open idea.

**Known issue.** Two tabs open at once clobber each other's saves — whichever unloads last wins.

---

## The test loop

Every change ships to GitHub Pages at `https://theteiton.github.io/ants-incremental/`. Before saying a change is done, confirm the game still loads and the first sixty seconds still play. A change that breaks the opening is worse than no change.

---

## Summary

Small diffs. Ask before adding. Design decisions are mine.
