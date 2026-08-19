# ants-incremental

A browser-based ant colony incremental game. Vanilla HTML, CSS and JavaScript — no build step, no framework, no dependencies, no network calls. Everything runs in the tab.

## The game

You play a mated queen who has already landed. Her first act is to shed her wings, which frees a finite pool of body reserves — 100 units, and she will never get more. Those reserves buy her first eggs.

The first five workers to emerge are **nanitics**: undersized, feeble foragers. This is not a balance bug, it is how real founding colonies work. Once they are out, the reserves stop mattering forever and the colony feeds itself.

From there you choose what each egg becomes.

### Castes

| Caste | Role | Unlocks at |
|---|---|---|
| Forager | Gathers food, the main currency | start |
| Excavator | Digs chambers, raising the population cap | 25 ants |
| Nurse | Tends the brood, hatching eggs faster | 100 ants |
| Soldier | Defends against raids | 400 ants |

Castes differ in kind, not degree — none is a strictly better version of another. Unlocks are gated by colony population, never by purchases.

When the nest is full, only excavators can be laid: they dig the chambers they will occupy, which is how a capped colony grows again.

### Upgrades

Twenty one-time upgrades, each unlocked by reaching a certain number of a given caste — or, for a few, a total population. They sharpen caste output, widen the chambers each excavator digs, speed up hatching, or lift food production across the whole colony.

### Achievements

Twenty-seven achievements worth 82 points between them. Every 5 points earns an achievement level, and each level permanently grants **+3% food and +1% hatch speed**, up to level 16.

### Pace

Roughly two hours of play to a colony of 1,000 workers. The opening moves quickly, the climb to 100 tightens, and the long run to 1,000 holds a steady rhythm.

## Running it locally

The game loads its JavaScript as ES modules, so serve the folder over HTTP rather than opening the file directly:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`. Any static file server works.

## Layout

```
index.html     entry point
style.css      all styling
js/game.js     state object, tick loop, save/load
js/ants.js     castes, production, costs, upgrades
js/ui.js       DOM rendering and event handlers
```

## Saving

Progress is saved to `localStorage` under `ants_save_v2`, automatically every 10 seconds and when the tab closes. Time away is credited when you return, capped at 8 hours. Older `ants_save_v1` saves are migrated rather than wiped.

Note: two tabs open at once will overwrite each other's saves — whichever closes last wins.

## Not built yet

Prestige (the nuptial flight), raid events, and any offline-progress screen beyond the silent catch-up on load. Soldiers can be raised, but with no raids to defend against they currently do nothing.
