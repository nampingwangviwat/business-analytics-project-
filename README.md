# OIKOS — Dealership Profit Analyzer

Offline desktop tool that answers one question for a dealership manager:
**change a number, and see what happens to profit and to the number of cars you need to sell.**

No signup, no accounts, no server. Everything runs and saves on the machine it's installed on.

## Run it

```bash
npm install     # also puts the bundled Chart.js in node_modules
npm start       # opens the Electron window
npm test        # verifies the calculation logic (25 checks, no framework)
```

## Package installers

```bash
npm run build           # current platform
npm run build:win       # or :mac / :linux
```

Installers land in `build/`. Pushing a `v*` tag runs the same build on all three
platforms in GitHub Actions and attaches the installers to a Release. Actions
does not host anything — it only packages.

## How the pieces connect

| File | Job |
| --- | --- |
| `main.js` | Window + file system. Handles `save-scenario`, `load-scenarios`, `delete-scenario`, `export-pdf`. No UI, no math. |
| `preload.js` | The only bridge. Exposes exactly four methods as `window.api`. |
| `src/js/calculations.js` | All the math. Pure functions, no DOM — this is the file to test and to trust. |
| `src/js/chart.js` | Draws and redraws the break-even chart. |
| `src/js/scenarios.js` | Save / load / delete, via `window.api`. |
| `src/js/ui.js` | Every DOM event and every piece of text on screen. No math. |
| `src/js/app.js` | Starts everything on `DOMContentLoaded`. |
| `src/js/export.js` | Scaffolded, not yet implemented (see below). |

Scenario data is written to `data/scenarios.json` in development and to the
per-user app-data folder once packaged, because install folders are read-only
on Windows and macOS.

## What's built (MVP)

- Input form: fixed costs, average price, average variable cost, cars sold, cars expected, profit goal
- Live calculation on every keystroke — contribution margin, break-even units and revenue, profit or loss, status
- Break-even chart with loss zone, profit zone, the break-even point, and a marker for where the dealership is now
- Save, load, and delete named scenarios as local JSON

## Deliberately not built yet

What-if sliders, before/after comparison table, multi-scenario comparison view,
PDF and CSV export, multi-vehicle and sensitivity analysis, any account or sync.
The sidebar entries and export buttons for these are visible but disabled, so the
shape of the finished app is legible without pretending the features exist.

## One thing worth checking with the dealership

The numbers in the reference mockup don't reconcile: a $78,000 price against a
$50,350 variable cost gives a $27,650 margin, which breaks even at 5 cars, not 47.
The 47 in the mockup implies a margin near $2,650 — which is also what the mockup's
own "profit per vehicle" tile shows. The app ships with defaults that reproduce the
mockup's headline figures consistently (price $78,000, variable cost $75,350,
margin $2,650, break-even 48). Ask the manager which figure is real before the demo.
