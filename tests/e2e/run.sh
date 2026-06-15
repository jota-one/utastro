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
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

pnpm exec playwright test "$@"
