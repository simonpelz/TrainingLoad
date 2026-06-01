#!/usr/bin/env bash
DIR="$(cd "$(dirname "$0")" && pwd)"
source "$DIR/trainingload/bin/activate"
exec python "$DIR/training_load_app.py" "$@"
