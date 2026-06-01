# TrainingLoad → Web Product Roadmap

## Vision

A free, **private, browser-based** Fitness / Fatigue / Form tracker. Drop in a
TrainingPeaks / Strava / Garmin CSV export and instantly see your CTL (fitness),
ATL (fatigue) and TSB (form) curves plus a forecast.

**All computation happens client-side — your data never leaves your browser.**
No upload, no account, no server. Hosted as a static site on GitHub Pages so
anyone can use it from a URL. The original Python desktop app is kept as the
offline / power-user option.

## Tech stack

| Concern  | Choice | Why |
|----------|--------|-----|
| Build    | Vite + React + TypeScript | Fast, static output, GitHub-Pages-friendly |
| Charts   | Apache ECharts (`echarts-for-react`) | Handles 2,500+ daily points, built-in zoom/pan, correct negative axes |
| CSV      | PapaParse | Robust with quoted TrainingPeaks exports, streaming, BOM-safe |
| Styling  | Tailwind CSS + shadcn/ui | Clean, designable component system |
| Deploy   | GitHub Actions → GitHub Pages | Push-to-deploy, zero ops |
| Storage  | IndexedDB (opt-in) | Remember last dataset locally; never a server |

## Repo layout (monorepo)

```
TrainingLoad/
├─ web/            ← Vite app (the product)
│  └─ src/core/    ← CTL/ATL/TSB engine in TS + tests
├─ desktop/        ← existing Python app
├─ docs/           ← roadmap, screenshots, CSV-export guides
├─ .github/workflows/deploy.yml
├─ README.md  LICENSE
```

## The science

For each calendar day, sum the TSS of all activities; fill rest days with 0; run
a recursive EWMA:

```
alpha       = 1 - exp(-1 / tau)
value_today = value_yesterday + alpha * (tss_today - value_yesterday)
```

with `tau = 42` for CTL (fitness) and `tau = 7` for ATL (fatigue).
`TSB = CTL - ATL` (form). Both time constants are user-adjustable.

## Work packages

### WP0 — Foundation & restructure · *small*
LICENSE (MIT), move Python app → `desktop/`, update `.gitignore`, scaffold
`web/` (Vite + TS + Tailwind + shadcn), eslint/prettier, CI skeleton.

### WP1 — Core engine in TypeScript + parity tests · *medium*
Port `ewma` / CTL / ATL / TSB / daily-aggregate / forecast to TS, with
golden-value tests asserting parity with the Python implementation. CSV parsing
(PapaParse) with auto-detect + manual column mapping so Strava / Garmin /
TrainingPeaks all work. Ship a synthetic sample dataset (lets visitors try the
app without exposing private data).

### WP2 — MVP UI · *medium–large*
- File drag-drop + "Try with sample data" empty state
- Status card: current Fitness / Fatigue / Form in plain language with a gauge
- Main chart: TSS bars + CTL/ATL/TSB lines + dotted forecast, **correct
  negative-TSB axis** (fixes the desktop clipping bug), zero line, rich hover
  tooltip, legend toggles, timeframe presets + custom range, zoom/pan
- Controls: τ_CTL / τ_ATL / forecast horizon
- Export chart PNG + computed CSV
- Responsive (works on phone), light/dark theme

### WP3 — Design polish & branding · *medium*
Visual system & semantic colors (fitness / fatigue / form), logo + favicon,
form-zone shading (TSB bands: fresh / optimal / high-risk), micro-interactions,
accessibility pass, README hero image + GIF.

### WP4 — Deploy & docs · *small*
GitHub Actions → Pages (optional custom domain), README with live demo link +
hero GIF, "how to export your data" guides for TrainingPeaks / Strava / Garmin,
CONTRIBUTING.

### WP5 — Stretch features · *large, later*
Planned-workout forecasting (add future TSS instead of zeros), ramp-rate /
monotony / strain, saved datasets (IndexedDB), installable PWA (offline),
optional Strava OAuth import (the one feature needing a small serverless proxy),
activity-type breakdown.

### WP6 — Desktop app cleanup · *small, parallel/optional*
Fix the three confirmed bugs and then either keep the desktop app maintained or
mark it "legacy, see web app":
1. **TSB clipping** — y-axis defaults to `ymin = 0`, hiding negative form (the
   most important freshness signal).
2. **Thread-unsafe hover** — hover annotations fire from a `threading.Timer`
   that touches Matplotlib/Tk off the main thread; use `widget.after()`.
3. **Double-index CSV export** — `save_csv` calls `reset_index()` *and*
   `to_csv(index=True)`, producing duplicate index columns.

**Critical path to a live v1:** WP0 → WP1 → WP2 → WP3 → WP4.
WP5 / WP6 anytime after.

## Decisions (defaults)

- **Chart library:** ECharts (perf + features) over Recharts (simpler/prettier).
- **License:** MIT.
- **Brand:** keep "Training Load Viewer", refine tagline.
- **Layout:** monorepo (`web/` + `desktop/`).
