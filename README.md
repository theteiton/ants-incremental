# ants-incremental

A browser-based ant colony incremental game. Vanilla HTML, CSS and JavaScript — no build step, no framework, no dependencies, no network calls. Everything runs in the tab.

**[▶ Play it here](https://theteiton.github.io/ants-incremental/)** — nothing to download or install.

## The game

You play a mated queen who has already landed. Her first act is to shed her wings, which frees a finite pool of body reserves — 100 units, and she will never get more. Those reserves buy her first eggs.

She shed four wings, so the first four workers to emerge are **nanitics**: undersized, feeble foragers. This is not a balance bug, it is how real founding colonies work. Once they are out the reserves stop mattering forever, the colony feeds itself, and the nanitics themselves die of old age two hours later.

From there you choose what each egg becomes.

### Castes

| Caste | Role | Unlocks at |
|---|---|---|
| Forager | Gathers food, the main currency | start |
| Excavator | Digs chambers, raising the population cap | 25 ants |
| Nurse | Tends the brood, so more eggs develop at once | 100 ants |
| Soldier | Fights raids, and hunts between them for protein | 400 ants |
| Big Forager | A rare oversized variant — never laid on purpose | chance |

Castes differ in kind, not degree — none is a strictly better version of another, and each one feeds a different constraint. Unlocks are gated by colony population, never by purchases.

**Big Foragers** hatch by chance from ordinary forager eggs, roughly ten across a full run. Each produces five foragers' worth of food and grows stronger the longer she lives, up to triple.

**Exiling** sends ants of a caste away for good, with no refund. It is blocked when it would strand the colony above its own population cap.

When the nest is full only excavators can be laid: they dig the chambers they will occupy, which is how a capped colony grows again.

### The brood

Only a few eggs develop at once — the rest queue. Nurses widen the brood, which is what makes them worth raising: hatching speed alone was never the bottleneck, throughput is. A colony that never buys a nurse takes about twice as long to reach 1,000 ants as one that buys them when the brood backs up.

### Raids and protein

From 400 ants a monster attacks every six minutes. Soldiers fight hard from birth; every other caste fights at nothing until the **Combat** upgrades arm them, and that branch only appears once you have survived your first attack. The first three raids come at a quarter, half and three quarters strength, so there is room to react.

Win and the corpse is stripped for **protein** and a burst of food. Lose and ants die — soldiers first, then foragers, with excavators last so the population cap survives — capped at a fifth of the colony.

Between raids the soldiers are out hunting, bringing protein back every second, and they come home when an attack is close. Protein feeds the brood: while it lasts each egg hatches twice as fast, and it buys a branch of upgrades that food cannot.

Ignoring soldiers entirely is slow and bloody rather than fatal — a colony can defend itself on worker strength alone once the Combat branch is bought.

### Upgrades

Twenty-nine one-time purchases across two branches, **Colony** and **Combat**, shown as sub-tabs. Every upgrade is listed at all times: locked ones say exactly what they still need, and available ones show what they will do to your *current* rates rather than a percentage that reads larger than it is.

Every rate in the game is built the same way — a base that upgrades add flat amounts to, multiplied by whatever scales the whole thing — and hovering an upgrade shows that formula with live numbers, naming the one factor it moves:

```
each forager = (base 1 + yield 1.25) × colony 1.25 × achievements 1.48 = 4.2/s
adds 0.50 to forager yield → 1.25 → 1.75
```

### Achievements

Fourteen tracks that keep levelling rather than one-off badges — colony size, food, eggs, each caste, raids won, fighting strength, protein and upgrades. Every threshold passed is a tier, and every 5 tiers is an achievement level worth **+3% food and +1% hatch speed**, up to level 20. Tracks read your peak values, so a bad raid never takes a tier back.

Each track carries a ladder of pips, one per tier and filled for the ones you have earned, so you can see how far up every ladder you are without clicking. A track that has gained a tier since you last looked at it shows a dot, and the dot clears when you point at that track — so the tab tells you *which* achievement you just earned, not merely that you earned one.

### Pace

Measured under strong simulated play, so a human runs slower:

| ants | 20 | 50 | 100 | 250 | 500 | 1000 | 2000 |
|---|---|---|---|---|---|---|---|
| time | 3m | 7m | 13m | 29m | 51m | **80m** | 166m |

## Interface

Five tabs — Ants, Upgrades, Achievements, Nuptial, Settings — with the brood above them so eggs can be laid from anywhere. On a wide screen it is two columns: the queen, the raid box and an inspector on the left; the brood and the tabs on the right.

The **inspector** explains whatever the mouse is pointing at — an ant, an upgrade, an achievement track — including what it still needs, and it keeps showing the last thing you pointed at.

Every caste has a pixel sprite drawn in JavaScript onto a canvas. Three themes (dark, light, soil) live in Settings, along with the queen's name, save export and import, and a hard reset.

## Prestige: The Nuptial Flight

At **1,000 ants**, the **Nuptial** tab unlocks. Taking flight releases winged alates to mate and start a new royal dynasty:
- Earns **Royal Jelly** scaled by population and raids won.
- Resets live food, ants, brood, queen wings, and colony upgrades.
- Retains all achievements, peak records, Royal Jelly, and **Royal Lineage adaptations** (prestige upgrades).

## Running it locally

The published page above is the easiest way to play. To run a working copy, serve the folder over HTTP rather than opening the file directly — the game loads its JavaScript as ES modules, which browsers will not load from a `file://` path:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`. Any static file server works.

## Layout

```
index.html          entry point
style.css           all styling
js/game.js          state object, tick loop, exiling
js/prestige.js      prestige formulas, upgrades, flight reset
js/save.js          save keys, migrations, the one-tab lock, import and export
js/ants.js          castes, production, costs, upgrades
js/raids.js         combat strength, monsters, raid resolution, hunting
js/achievements.js  achievement tracks, tiers, levels
js/upgrades.js      upgrade panel and effect previews
js/panels.js        shared formatting, the inspector, ants and settings panels
js/sprites.js       pixel art drawn onto canvas
js/ui.js            tab shell, header, brood controls, frame loop
```

## Saving

Progress is saved to `localStorage` under `ants_save_v6`, automatically every 10 seconds and when the tab closes. Time away is credited when you return, capped at 8 hours, and time spent in a background tab is credited the same way. Every older save version migrates rather than being wiped.

Only one tab writes the save. The most recently opened tab owns it and older ones stop writing, so a forgotten background tab can no longer bury real progress when it closes; the stale tab offers a button to take over.

## Not built yet

Automation (which belongs to subsequent prestige expansions). Nothing lays an egg, buys an upgrade or picks a caste for you.
