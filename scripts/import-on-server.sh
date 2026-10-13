#!/usr/bin/env bash
set -euo pipefail

# Imports the legacy data exported by scripts/export-mariadb.sh into a deployed
# site, on its VPS:
#   1. checks the exports locally and the site on the server (read-only)
#   2. uploads pb/json_import_sources and builds pb-custom from the deployed
#      release's pb-tools sources
#   3. after confirmation: stops the site, backs up pb_data, runs the imports,
#      purges the raw legacy data, restarts the site — and rolls back to the
#      backup if anything fails on the way
#   4. runs the read-only smoke test against the site
#
# Usage: scripts/import-on-server.sh <domain> [--fresh]
#   --fresh  start from an empty database (superusers kept) instead of
#            importing over the current one: what a production import does
#
# The site is down from the stop to the restart. Do not push to main (or merge
# into it) meanwhile: a deployment would restart PocketBase mid-import.

# ─── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { printf "${GREEN}✓${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}⚠${NC} %s\n" "$*"; }
err()  { printf "${RED}✗ Error:${NC} %s\n" "$*" >&2; exit 1; }
step() { printf "\n${CYAN}${BOLD}▶ %s${NC}\n" "$*"; }
ask()  { printf "${BLUE}?${NC} ${BOLD}%s${NC} " "$*"; }

# ─── Arguments ───────────────────────────────────────────────────────────────
DOMAIN="${1:-}"
FRESH=0
[[ "${2:-}" == "--fresh" ]] && FRESH=1
[[ -n "$DOMAIN" ]] || err "Usage: $0 <domain> [--fresh]"

# Server and PocketBase port of each site, as declared in jota-one/infra
# apps.yaml (host-on, pb.port). Override with SSH_HOST / PB_PORT.
case "$DOMAIN" in
  never.urban-training.ch) DEFAULT_HOST="jota-apps-2-infomaniak"; DEFAULT_PORT="8093" ;;
  next.urban-training.ch)  DEFAULT_HOST="jota-apps-3-infomaniak"; DEFAULT_PORT="8091" ;;
  *)                       DEFAULT_HOST="";                       DEFAULT_PORT="" ;;
esac
SSH_HOST="${SSH_HOST:-$DEFAULT_HOST}"
PB_PORT="${PB_PORT:-$DEFAULT_PORT}"
[[ -n "$SSH_HOST" && -n "$PB_PORT" ]] \
  || err "Unknown site $DOMAIN — set SSH_HOST and PB_PORT (see jota-one/infra apps.yaml)"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCES_DIR="$PROJECT_ROOT/pb/json_import_sources"
INFRA_REPO="${INFRA_REPO:-$PROJECT_ROOT/../infra}"
SSH_CONFIG="$INFRA_REPO/resources/ssh/config"
[[ -f "$SSH_CONFIG" ]] || err "SSH config not found: $SSH_CONFIG (set INFRA_REPO)"
SSH=(ssh -F "$SSH_CONFIG" -o BatchMode=yes "$SSH_HOST")

APP_ROOT="/srv/www/$DOMAIN"
SERVICE_SUFFIX="${DOMAIN//./-}"

printf "\n${BOLD}Legacy data import${NC}  → %s (%s)\n" "$DOMAIN" "$SSH_HOST"
printf "══════════════════════════════════════════════\n"
[[ $FRESH -eq 1 ]] && warn "Fresh import: the current database is replaced (backed up first)"

# ─── 1. Local exports ────────────────────────────────────────────────────────
step "Local exports"

# Same list as scripts/export-mariadb.sh
REQUIRED_TABLES=(
  hypercontent__users
  ut__userinfos
  sisi__cities
  sisi__city_watchers
  sisi__event_types
  sisi__event_types_events
  sisi__event_types_lang
  sisi__events
  sisi__events_lang
  sisi__locations
  sisi__locations_lang
  sisi__subscriptions
  ut__sponsors
  ut__sponsors_cities
  ut__sponsors_lang
)
for TABLE in "${REQUIRED_TABLES[@]}"; do
  [[ -s "$SOURCES_DIR/$TABLE.json" ]] || err "Missing export: $SOURCES_DIR/$TABLE.json (run scripts/export-mariadb.sh)"
done
LOGO_COUNT=$(find "$SOURCES_DIR/ut__sponsors_logos" -type f 2>/dev/null | wc -l | tr -d ' ')
[[ "$LOGO_COUNT" -gt 0 ]] || err "No sponsor logos in $SOURCES_DIR/ut__sponsors_logos"
OLDEST=$(find "$SOURCES_DIR" -maxdepth 1 -name '*.json' -exec stat -f '%Sm' -t '%Y-%m-%d %H:%M' {} \; | sort | head -1)
ok "${#REQUIRED_TABLES[@]} tables and $LOGO_COUNT logos, exported on $OLDEST"

# ─── 2. Server checks (read-only) ────────────────────────────────────────────
step "Server"

"${SSH[@]}" true 2>/dev/null || err "Cannot connect to $SSH_HOST (check the host key and $SSH_CONFIG)"
"${SSH[@]}" bash -s -- "$APP_ROOT" "$SERVICE_SUFFIX" <<'REMOTE' || err "Server checks failed"
set -euo pipefail
APP_ROOT="$1"; SUFFIX="$2"
cd "$APP_ROOT"
sudo -n true
command -v go >/dev/null
python3 -c "import sqlite3"
RELEASE="$(cat .gitref)"
[[ -d "$RELEASE/pb-tools" ]] || { echo "no pb-tools in release $RELEASE" >&2; exit 1; }
for UNIT in "pb-$SUFFIX.service" "node-$SUFFIX.service" "pb-$SUFFIX-watch.path"; do
  systemctl cat "$UNIT" >/dev/null
done
echo "release $RELEASE, pocketbase $(./pocketbase -v | tail -1 | awk '{print $3}')"
REMOTE
ok "Site found, services present"

# ─── 3. Upload exports and build pb-custom ───────────────────────────────────
step "Upload and build (the site keeps running)"

tar -czf - -C "$PROJECT_ROOT/pb" json_import_sources \
  | "${SSH[@]}" "rm -rf '$APP_ROOT/json_import_sources' && tar -xzf - -C '$APP_ROOT'"
ok "Exports uploaded to $APP_ROOT/json_import_sources"

"${SSH[@]}" "cd '$APP_ROOT' && cd \"\$(cat .gitref)/pb-tools\" && go build -o '$APP_ROOT/pb-custom' ." \
  || err "pb-custom build failed"
ok "pb-custom built from the deployed release"

# ─── 4. Confirmation ─────────────────────────────────────────────────────────
step "Confirmation"
printf "  %s goes down until the import is over (a few minutes).\n" "$DOMAIN"
printf "  Do not push to main meanwhile.\n"
ask "Type the domain to go on:"
read -r CONFIRM
[[ "$CONFIRM" == "$DOMAIN" ]] || err "Aborted — exports stay on the server, nothing else changed"

# ─── 5. Import ───────────────────────────────────────────────────────────────
step "Import"

"${SSH[@]}" bash -s -- "$APP_ROOT" "$SERVICE_SUFFIX" "$PB_PORT" "$FRESH" <<'REMOTE'
set -Eeuo pipefail
APP_ROOT="$1"; SUFFIX="$2"; PB_PORT="$3"; FRESH="$4"
cd "$APP_ROOT"

PB_SERVICE="pb-$SUFFIX.service"
NODE_SERVICE="node-$SUFFIX.service"
WATCH_PATH="pb-$SUFFIX-watch.path"
BACKUP="pb_data.before-import-$(date +%Y%m%d-%H%M%S)"
LEGACY_TABLES=(
  hypercontent__users ut__userinfos sisi__cities sisi__city_watchers
  sisi__event_types sisi__event_types_events sisi__event_types_lang
  sisi__events sisi__events_lang sisi__locations sisi__locations_lang
  sisi__subscriptions
)

start_site() {
  sudo systemctl start "$PB_SERVICE" "$NODE_SERVICE" "$WATCH_PATH"
}

# Any failure from here on puts the backup back and restarts the site
rollback() {
  echo "✗ Import failed — restoring $BACKUP" >&2
  sudo systemctl stop "$PB_SERVICE" || true
  if [[ -d "$BACKUP" ]]; then
    rm -rf pb_data.failed && mv pb_data pb_data.failed 2>/dev/null || true
    mv "$BACKUP" pb_data
  fi
  start_site
  echo "✗ Site restarted on its previous data (failed import kept in pb_data.failed)" >&2
  exit 1
}

echo "→ Stopping the site"
# the watcher restarts PocketBase on deployments: keep it off meanwhile
sudo systemctl stop "$WATCH_PATH" "$NODE_SERVICE" "$PB_SERVICE"
trap rollback ERR

if [[ "$FRESH" == "1" ]]; then
  echo "→ Moving the current database to $BACKUP"
  mv pb_data "$BACKUP"
  install -d -m 755 -o "$(stat -c %U "$BACKUP")" -g "$(stat -c %G "$BACKUP")" pb_data
  echo "→ Creating the schema"
  ./pocketbase migrate up --dir pb_data --migrationsDir pb_migrations >/dev/null
  echo "→ Copying the superusers"
  python3 - "$BACKUP/data.db" pb_data/data.db <<'PY'
import sqlite3, sys
src, dst = sys.argv[1], sys.argv[2]
db = sqlite3.connect(dst)
db.execute("ATTACH DATABASE ? AS old", (src,))
db.execute("DELETE FROM _superusers")
db.execute("INSERT INTO _superusers SELECT * FROM old._superusers")
db.commit()
print(f"  {db.execute('SELECT COUNT(*) FROM _superusers').fetchone()[0]} superuser(s)")
PY
else
  echo "→ Backing up the database to $BACKUP"
  cp -a pb_data "$BACKUP"
fi

echo "→ Importing"
export PB_IMPORT_PORT="$PB_PORT"
for COMMAND in import-all-data import-users import-cities import-events import-sponsors; do
  echo "  $COMMAND"
  ./pb-custom "$COMMAND" --dir pb_data > "pb_logs/$COMMAND.log" 2>&1 \
    || { tail -20 "pb_logs/$COMMAND.log" >&2; false; }
done

echo "→ Checking and purging the raw legacy data"
python3 - pb_data/data.db "${LEGACY_TABLES[@]}" <<'PY'
import sqlite3, sys
db = sqlite3.connect(sys.argv[1])
counts = {t: db.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
          for t in ("ut_users", "ut_cities", "ut_city_watchers", "ut_events",
                    "ut_locations", "ut_subscriptions", "ut_sponsors")}
for table, count in counts.items():
    print(f"  {table:18} {count}")
if not db.execute("SELECT 1 FROM sqlite_master WHERE type='trigger' AND name='ut_subscriptions_capacity'").fetchone():
    sys.exit("capacity trigger missing after import")
if min(counts[t] for t in ("ut_users", "ut_cities", "ut_events", "ut_subscriptions")) == 0:
    sys.exit("an essential collection is empty")
# The raw tables hold a full copy of the legacy personal data, old password
# hashes included: keep the (empty) tables, drop their content
for table in sys.argv[2:]:
    db.execute(f"DELETE FROM {table}")
db.commit()
db.execute("VACUUM")
db.close()
PY

trap - ERR
rm -rf json_import_sources
echo "→ Restarting the site"
start_site
for _ in $(seq 1 30); do
  curl -fs "http://127.0.0.1:$PB_PORT/api/health" >/dev/null && break
  sleep 1
done
curl -fs "http://127.0.0.1:$PB_PORT/api/health" >/dev/null || { echo "✗ PocketBase does not answer" >&2; exit 1; }
echo "✓ Site back up — previous database kept in $APP_ROOT/$BACKUP"
REMOTE
ok "Import done"

# ─── 6. Smoke test ───────────────────────────────────────────────────────────
step "Smoke test"
if BASE_URL="https://$DOMAIN" "$PROJECT_ROOT/tests/e2e/run.sh" specs/smoke; then
  ok "Smoke test green on $DOMAIN"
else
  warn "Smoke test failed on $DOMAIN — check before going further"
fi

printf "\n"
ok "Done. Check a login with a legacy account and password by hand."
