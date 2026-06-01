# Training Load

See your **Fitness, Fatigue, and Form** from your training data — a free,
private replacement for the Strava / TrainingPeaks "Fitness & Freshness" chart.

Point it at one or more activity CSV exports and it plots:

- **CTL — Fitness** (Chronic Training Load): your long-term fitness, a slow
  exponentially-weighted average of daily training stress (τ = 42 days).
- **ATL — Fatigue** (Acute Training Load): your short-term tiredness, a fast
  average of recent stress (τ = 7 days).
- **TSB — Form** (Training Stress Balance): `CTL − ATL`. Positive = fresh and
  ready; negative = fatigued.
- **TSS** — the raw daily Training Stress Score, drawn as bars.

It also **forecasts** the curves forward so you can see how your form recovers
over the coming days.

## Two ways to use it

| | What | Status |
|---|---|---|
| [`web/`](web/) | **Browser app** — drag in a CSV, see your curves. Runs entirely client-side; your data never leaves your browser. Will be hosted on GitHub Pages. | 🚧 In progress (scaffolded) |
| [`desktop/`](desktop/) | **Python desktop app** (Tkinter + Matplotlib). The original, offline option. | ✅ Working |

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the plan.

## How it works

For each calendar day, sum the `TSS` of all activities, fill rest days with
zero, and run a recursive EWMA:

```
alpha       = 1 − exp(−1 / tau)
value_today = value_yesterday + alpha * (tss_today − value_yesterday)
```

with `tau = 42` for CTL (fitness) and `tau = 7` for ATL (fatigue);
`TSB = CTL − ATL`. Both time constants are adjustable.

## Input data

Any CSV with at least two columns works:

- `WorkoutDay` — the date of the activity
- `TSS` — the Training Stress Score (missing/blank = 0)

Other columns are ignored, so a raw **TrainingPeaks activity export** works
as-is, and multiple files merge by date.

> Personal training CSVs are intentionally **git-ignored** — this repo contains
> only the app, never your data.

## Run the desktop app

```bash
cd desktop
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# On Debian/Ubuntu, tkinter is a separate system package:
sudo apt install python3-tk
./run.sh            # or: python training_load_app.py
```

If a `default.csv` exists in the working directory it loads automatically on
startup. Then click **Load CSV(s)…** to pick your own export(s).

## Run the web app

```bash
cd web
npm install
npm run dev         # http://localhost:5173
```

See [`web/README.md`](web/README.md) for details.

## License

[MIT](LICENSE) © Simon Pelz
