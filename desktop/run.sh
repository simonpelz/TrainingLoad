#!/usr/bin/env bash
# Launch the Training Load desktop app.
# The app auto-loads ./default.csv from the *current working directory* if present,
# so run this from wherever your data lives (e.g. the repo root).
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$DIR/.." && pwd)"

# Use a virtualenv if one exists (repo-root "trainingload" or "desktop/.venv"),
# otherwise fall back to whatever python3 is on PATH.
if [ -f "$ROOT/trainingload/bin/activate" ]; then
    source "$ROOT/trainingload/bin/activate"
elif [ -f "$DIR/.venv/bin/activate" ]; then
    source "$DIR/.venv/bin/activate"
fi

exec python "$DIR/training_load_app.py" "$@"
