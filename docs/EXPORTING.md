# How to export your training data

Training Load needs a CSV with two things:

1. a date column (one row per activity), and
2. a training-load column (TSS, or the closest equivalent your app provides).

The app auto-detects common column names. If it cannot, it shows two dropdowns
so you can pick the date and load columns yourself. Other columns are ignored.

> Note on screenshots: the slots below are placeholders. Add images to
> `docs/screenshots/exporting/` and replace the matching placeholder line with
> `![description](screenshots/exporting/your-image.png)`. The written steps are
> the source of truth; menu labels on these third-party sites change over time,
> so verify against what you see in your own account.

## Stitching multiple years together

Most apps only export about one year at a time. To see your full history:

1. Export each year (or each range) as its own CSV.
2. Drag all of them onto Training Load at once, or add them one at a time with
   the "Add CSV" button.
3. The app merges them by date and removes exact-duplicate activities, so
   overlapping ranges are not double-counted.
4. Use "Combined CSV" to download the stitched result as a single file you can
   keep as your master copy and re-upload later.

---

## TrainingPeaks

TrainingPeaks exports include `WorkoutDay` and `TSS` columns, which the app
detects automatically.

1. Sign in to TrainingPeaks on the web at trainingpeaks.com.
2. Open the date range you want to export (TrainingPeaks typically limits a
   single export to about one year, so repeat per year for longer history).
3. Use the export to CSV option for your workouts.
4. Save the file, then drag it onto Training Load.

> Screenshot placeholder: TrainingPeaks export-to-CSV option.

If your export does not include a `TSS` column, pick whichever load column it
does contain when the app prompts you.

---

## Strava

Strava does not record TSS. Its closest field is "Relative Effort" (formerly
"Suffer Score"), which you map to the TSS column when prompted. The units differ
from true TSS, but the fitness, fatigue and form trends are still meaningful.

1. Sign in to Strava on the web at strava.com.
2. Go to Settings, then "My Account".
3. Under "Download or Delete Your Account", choose "Get Started".
4. Request your archive. Strava emails you a download link (this can take a
   while).
5. Unzip the archive and find `activities.csv`.
6. Drag `activities.csv` onto Training Load. When prompted, set the date column
   to the activity date and the TSS column to "Relative Effort".

> Screenshot placeholder: Strava "Download or Delete Your Account" page.

---

## Garmin Connect

Garmin does not offer a simple one-click CSV of TSS across your whole history,
and its built-in "Training Load" is a different metric. A couple of options:

- If you train with power or heart rate and have a per-activity load metric you
  trust, export your activities and map that column to TSS when prompted.
- Otherwise, request your full account data export from Garmin (Account
  Management, then "Export Your Data"). This returns a large archive; you will
  need to extract a date and a load value into a simple CSV.

> Screenshot placeholder: Garmin "Export Your Data" page.

If this is awkward for your setup, the simplest path is often to use whichever
of your apps does provide a TSS-style number, export from there, and stitch the
years together as described above.

---

## What a valid file looks like

A minimal CSV the app accepts:

```
WorkoutDay,TSS
2024-01-01,80
2024-01-03,100
2024-01-05,60
```

Any extra columns (title, distance, heart rate, and so on) are fine and are
simply ignored.
