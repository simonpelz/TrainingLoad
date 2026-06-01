# Training Load

**See your fitness, fatigue & form — free, private, in your browser.**

A local replacement for the Strava / TrainingPeaks "Fitness & Freshness" chart.
Drop in a workout CSV and watch your **CTL (fitness)**, **ATL (fatigue)** and
**TSB (form)** curves, with a forecast of how your form recovers. Everything is
computed client-side — **your training data never leaves your browser.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
&nbsp;**[▶ Live demo](https://YOUR-USERNAME.github.io/TrainingLoad/)**

![Training Load dashboard](docs/screenshots/dashboard-dark.png)

---

## Features

- 📈 **CTL / ATL / TSB** computed with the standard recursive EWMA (τ = 42 / 7).
- 🔮 **Forecast** — projects your curves forward so you can see your form recover.
- 🟣 **Form, done right** — negative TSB is shown properly with a zero reference
  line (the thing most simple charts get wrong).
- 🗂️ **Drag-and-drop CSV** with automatic column detection, plus manual column
  mapping for any export format.
- 🎚️ Adjustable time constants, forecast horizon, series toggles and timeframe.
- 💾 Export the chart as **PNG** or the computed metrics as **CSV**.
- 🌗 Light & dark themes, responsive layout.
- 🔒 **100% private** — no upload, no account, no server, no analytics.

|  |  |
|---|---|
| ![Empty state](docs/screenshots/empty-state.png) | ![Light theme](docs/screenshots/dashboard-light.png) |

## How it works

For each calendar day, the app sums the TSS of all activities, fills rest days
with zero, and runs a recursive exponentially-weighted moving average:

```
alpha       = 1 − exp(−1 / tau)
value_today = value_yesterday + alpha · (tss_today − value_yesterday)
```

with `tau = 42` for **CTL** (chronic/fitness) and `tau = 7` for **ATL**
(acute/fatigue). **TSB** (form) = `CTL − ATL`: positive means fresh, negative
means fatigued. Both time constants are adjustable in the UI.

## Getting your data

The app needs a CSV with **a date column** and **a training-load (TSS) column**.
It auto-detects common names; if it can't, it asks you to pick the columns.

| Source | How |
|---|---|
| **TrainingPeaks** | Export your workouts — the file already has `WorkoutDay` and `TSS` columns and is detected automatically. |
| **Garmin Connect** | Export activities; if you record power/HR you'll have a training-load metric — map it to the TSS column. |
| **Strava** | Use the bulk export (`activities.csv`) and map **Relative Effort** to the TSS column. Units differ from true TSS, but the fitness/fatigue/form *trends* are still meaningful. |
| **Anything else** | Any CSV with a date and a numeric effort/load column works — just map them. |

> No data to hand? Click **"Try with sample data"** to explore with a realistic
> synthetic dataset.

## Run it locally

**Web app** (the product):

```bash
cd web
npm install
npm run dev          # http://localhost:5173
```

**Desktop app** (original Python/Tkinter version, offline):

```bash
cd desktop
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
sudo apt install python3-tk   # Debian/Ubuntu only
./run.sh
```

## Deploy

A GitHub Actions workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml))
builds `web/` and publishes it to GitHub Pages on every push to `main`. See the
publish steps below.

## Tech

Vite · React · TypeScript · Tailwind CSS · Apache ECharts · PapaParse. The
CTL/ATL/TSB engine lives in [`web/src/core/`](web/src/core) and is covered by
Vitest tests that assert parity with the Python implementation.

## Development

```bash
cd web
npm run lint     # eslint
npm test         # vitest
npm run build    # type-check + production build
```

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the project plan.

## License

[MIT](LICENSE) © Simon Pelz
