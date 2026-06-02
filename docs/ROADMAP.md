# TrainingLoad Web Product Roadmap

## Vision

A free, private, browser-based fitness, fatigue and form tracker. Drop in a
TrainingPeaks, Strava or Garmin CSV export and instantly see your CTL (fitness),
ATL (fatigue) and TSB (form) curves plus a forecast.

All computation happens client-side, so your data never leaves your browser.
There is no upload, no account and no server. It is hosted as a static site on
GitHub Pages so anyone can use it from a URL. The original Python desktop app is
kept as the offline option.

## Tech stack

| Concern | Choice | Why |
|---------|--------|-----|
| Build | Vite, React, TypeScript | Fast, static output, friendly to GitHub Pages |
| Charts | Apache ECharts (`echarts-for-react`) | Handles 2,500+ daily points, built-in zoom and pan, correct negative axes |
| CSV | PapaParse | Robust with quoted TrainingPeaks exports, streaming, BOM-safe |
| Styling | Tailwind CSS with shadcn/ui | Clean, designable component system |
| Deploy | GitHub Actions to GitHub Pages | Push to deploy, zero ops |
| Storage | IndexedDB (opt-in) | Remembers the last dataset locally, never on a server |

## Repo layout (monorepo)

```
TrainingLoad/
  web/            Vite app (the product)
    src/core/     CTL/ATL/TSB engine in TS plus tests
  desktop/        existing Python app
  docs/           roadmap, screenshots, CSV-export guides
  .github/workflows/deploy.yml
  README.md  LICENSE
```

## The science

For each calendar day, sum the TSS of all activities, fill rest days with zero,
and run a recursive EWMA:

```
alpha       = 1 - exp(-1 / tau)
value_today = value_yesterday + alpha * (tss_today - value_yesterday)
```

with `tau = 42` for CTL (fitness) and `tau = 7` for ATL (fatigue). Form is
`TSB = CTL - ATL`. Both time constants are user-adjustable.

## Work packages

### WP0: Foundation and restructure (small)
Add the MIT license, move the Python app into `desktop/`, update `.gitignore`,
scaffold `web/` (Vite, TS, Tailwind, shadcn), add eslint and prettier, and a CI
skeleton.

### WP1: Core engine in TypeScript with parity tests (medium)
Port the ewma, CTL, ATL, TSB, daily-aggregate and forecast functions to
TypeScript, with golden-value tests asserting parity with the Python
implementation. Add CSV parsing (PapaParse) with auto-detect and manual column
mapping so Strava, Garmin and TrainingPeaks all work. Ship a synthetic sample
dataset so visitors can try the app without exposing private data.

### WP2: MVP UI (medium to large)
- File drag-and-drop with a "Try with sample data" empty state.
- Status card showing current fitness, fatigue and form in plain language.
- Main chart: TSS bars, CTL/ATL/TSB lines, dashed forecast, a correct
  negative-TSB axis (fixing the desktop clipping bug), a zero line, a rich hover
  tooltip, series toggles, timeframe presets and zoom.
- Controls for the time constants and forecast horizon.
- Export the chart as PNG and the metrics as CSV.
- Responsive layout with light and dark themes.

### WP3: Design polish and branding (medium)
A visual system with semantic colors for fitness, fatigue and form, a logo and
favicon, form-zone shading (TSB bands for fresh, optimal and high-risk),
micro-interactions, an accessibility pass, and a README hero image.

### WP4: Deploy and docs (small)
GitHub Actions to Pages with an optional custom domain, a README with the live
demo link and screenshots, "how to export your data" guides for TrainingPeaks,
Strava and Garmin, and a CONTRIBUTING file.

### WP5: Stretch features (large, later)
Planned-workout forecasting (adding future TSS rather than zeros), ramp rate,
monotony and strain, saved datasets in IndexedDB, an installable offline PWA, an
optional Strava import (the one feature that would need a small serverless
proxy), and an activity-type breakdown.

### WP6: Desktop app cleanup (small, optional)
Fix the three confirmed bugs, then either keep the desktop app maintained or
mark it as legacy in favour of the web app:

1. TSB clipping. The y-axis defaults to `ymin = 0`, which hides negative form,
   the most important freshness signal.
2. Thread-unsafe hover. Hover annotations fire from a `threading.Timer` that
   touches Matplotlib and Tk off the main thread; use `widget.after()` instead.
3. Double-index CSV export. `save_csv` calls `reset_index()` and then
   `to_csv(index=True)`, producing duplicate index columns.

The critical path to a live v1 is WP0, WP1, WP2, WP3 and WP4 in order. WP5 and
WP6 can happen any time after.

## Decisions (defaults)

- Chart library: ECharts, for performance and features, over Recharts.
- License: MIT.
- Brand: keep the "Training Load" name and refine the tagline.
- Layout: a monorepo with `web/` and `desktop/`.
