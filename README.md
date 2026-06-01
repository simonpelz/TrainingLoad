# Training Load Viewer

A small, self-contained desktop app that shows your **Fitness, Fatigue, and Form**
from training data — a free, local replacement for the Strava / TrainingPeaks
"Fitness & Freshness" chart.

Point it at one or more activity CSV exports and it plots:

- **CTL — Fitness** (Chronic Training Load): your long-term fitness, a slow
  exponentially-weighted average of daily training stress (τ = 42 days).
- **ATL — Fatigue** (Acute Training Load): your short-term tiredness, a fast
  average of recent stress (τ = 7 days).
- **TSB — Form** (Training Stress Balance): `CTL − ATL`. Positive = fresh and
  ready; negative = fatigued.
- **TSS** — the raw daily Training Stress Score, drawn as bars.

It also **forecasts** the curves forward (assuming you do nothing) so you can see
how your form will recover over the coming days.

## How it works

For each calendar day the app sums the `TSS` of all activities, fills rest days
with zero, and runs a recursive EWMA:

```
alpha = 1 − exp(−1 / tau)
value_today = value_yesterday + alpha * (tss_today − value_yesterday)
```

with `tau = 42` for CTL and `tau = 7` for ATL. Both time constants are
adjustable in the UI.

## Input data

The app reads CSV files that have at least these two columns:

- `WorkoutDay` — the date of the activity (any format pandas can parse)
- `TSS` — the Training Stress Score for that activity (missing/blank = 0)

Any other columns are ignored, so a raw **TrainingPeaks activity export** works
as-is. Multiple files can be loaded at once and are merged by date.

> Your personal training CSVs are intentionally **git-ignored** — this repo
> contains only the app, never your data.

## Install

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# On Debian/Ubuntu, tkinter is a separate system package:
sudo apt install python3-tk
```

## Run

```bash
python training_load_app.py
```

or use the helper script:

```bash
./run.sh
```

Then click **Load CSV(s)…** and select your activity export(s). If a file named
`default.csv` exists in the working directory it is loaded automatically on
startup.

## Using the viewer

- **τ_CTL / τ_ATL** — change the fitness/fatigue time constants, then
  **Recompute & Plot**.
- **Future days** — how far to project the curves forward.
- **TSS / CTL / ATL / TSB** checkboxes — toggle each series on or off.
- **View** dropdown / **Start–End** date pickers — zoom to a timeframe.
- **Scale Y to TSS / TSB** — adjust the y-axis range.
- Hover over the chart for exact daily values.
- **Save CSV** exports the computed daily metrics; **Save Plot PNG** exports the
  current chart.

## License

Not yet specified.
