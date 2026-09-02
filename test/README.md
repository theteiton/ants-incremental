# The regression harness

Plain `node`. No dependencies, no build step, no config — the same rule the game
itself follows. Nothing here ships to the player; `test/` is not in the itch.io
zip and is not loaded by `index.html`.

```bash
node test/run.mjs
```

That is the gate. It runs the fast suites in about twenty seconds. Add `--slow`
for the two that simulate hours of play, or name one suite to run it alone:

```bash
node test/run.mjs --slow
node test/run.mjs pacing
```

## Why this exists

Claude cannot screenshot this game, so everything that is not judged by eye has
to be judged by measurement. Between them these suites have caught, among other
things: all five of the bugs in prestige layer 2, three separate population-cap
bypasses, the founders'-chambers trap purchase, two buttons whose text was the
same colour as their own background, and an achievement ladder that would have
taken tiers away from saves that had already earned them.

They used to live in a scratch directory and die with the session, which meant
every one of those checks had to be rebuilt before it could be re-run.

## How it works

`dom.mjs` builds a DOM shim from the **real `index.html`**, so `js/ui.js` can be
imported and its whole module-scope build path actually runs. That is the
closest thing to "does the game load" available without a browser, and it is
what catches a missing element id or a handler wired to something that is not
there. `harness.mjs` adds a seeded RNG, a policy-driven player that drives the
game's own automation, and the per-tick invariant check.

The shim is deliberately thin. It has no CSS, no layout and no class selectors,
so anything about **appearance** is out of its reach and still needs a person to
look at it. The one visual property it can check is contrast, because that is
arithmetic on the palette rather than a matter of taste.

## The suites

| suite | what it would catch |
|---|---|
| `new-colony` | the opening minutes not playing at all |
| `save-load` | a save that will not round-trip |
| `migrations` | an old save losing something on load |
| `tabs` | a tab that throws when opened |
| `static-data` | a duplicate id, a broken data table |
| `invariants` | a NaN, a negative resource, a population past its cap |
| `brood-tally` | the cached brood count drifting from the real queue |
| `egg-promote` | reordering the queue past a tended egg |
| `away-report` | offline progress paying the wrong amount |
| `instincts` | spending that lowers the achievement level, or an overspent pool |
| `library` | an entry that never becomes discoverable |
| `badges` | a tab dot that counts wrong |
| `assistant` / `assistant-steps` | the assistant offering something irreversible |
| `render-writes` | a render writing DOM that has not changed |
| `contrast` | a control unreadable in any of the three themes |
| `pacing` *(slow)* | **how long the game takes, against the canon table** |
| `fuzz` *(slow)* | 24,000 random actions through the real click handlers |

## `pacing` is the one to watch

It plays the ordinary run — no lineage, no species, the shipped caste shares, on
a fixed seed — and compares every milestone against the table in `CLAUDE.md`.
It fails when a milestone moves more than 10%.

**A failure there is not necessarily a bug.** It means the change altered how
long the game takes, which is a design decision: it has to be deliberate,
explained, and written into the canon table — not discovered by a player.
