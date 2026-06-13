#!/usr/bin/env bash
# Usage: ./tests/load/run.sh <script> [k6 options]
# Example: ./tests/load/run.sh smoke
#          ./tests/load/run.sh load --out json=tests/load/results.json

set -euo pipefail

SCRIPT="${1:-smoke}"
shift 2>/dev/null || true

ENV_FILE="$(dirname "$0")/.env"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

k6 run "$@" "$(dirname "$0")/${SCRIPT}.js"
