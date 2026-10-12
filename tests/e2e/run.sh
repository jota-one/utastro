#!/usr/bin/env bash
# Usage: ./tests/e2e/run.sh [playwright options]
# Examples:
#   ./tests/e2e/run.sh                              # run all tests
#   ./tests/e2e/run.sh --grep "navigation"          # run matching tests
#   ./tests/e2e/run.sh specs/anonymous              # run a specific folder
#   ./tests/e2e/run.sh --ui                         # open Playwright UI mode

set -euo pipefail

ENV_FILE="$(dirname "$0")/.env"
if [[ -f "$ENV_FILE" ]]; then
  # Variables already set win, so a run can target another site:
  #   BASE_URL=https://next.urban-training.ch ./tests/e2e/run.sh specs/smoke
  while IFS='=' read -r key value; do
    if [[ $key =~ ^[A-Z_][A-Z0-9_]*$ && -z ${!key+set} ]]; then
      export "$key=$value"
    fi
  done < "$ENV_FILE"
fi

pnpm exec playwright test "$@"
