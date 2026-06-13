#!/usr/bin/env bash
set -euo pipefail

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

# ─── Cleanup ─────────────────────────────────────────────────────────────────
PIDS=()
cleanup() {
  [[ ${#PIDS[@]} -eq 0 ]] && return
  printf "\n"
  ok "Closing tunnels..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT

# ═════════════════════════════════════════════════════════════════════════════
printf "\n${BOLD}MariaDB → JSON Export${NC}  (urban-training prod)\n"
printf "══════════════════════════════════════════════\n\n"

# ─── 1. Binaries ─────────────────────────────────────────────────────────────
step "Checking binaries"

# kubectl
if ! command -v kubectl &>/dev/null; then
  err "kubectl not found — install with: brew install kubectl"
fi
ok "kubectl $(kubectl version --client -o yaml 2>/dev/null | awk '/gitVersion/{print $2; exit}')"

# mysql-client
if ! command -v mysql &>/dev/null; then
  warn "mysql not found in PATH"
  if ! brew list mysql-client &>/dev/null 2>&1; then
    printf "  Installing mysql-client via brew...\n"
    brew install mysql-client || err "Failed to install mysql-client"
  fi
  MYSQL_BIN="$(brew --prefix mysql-client)/bin"
  export PATH="$MYSQL_BIN:$PATH"
  if ! grep -q "mysql-client/bin" ~/.zshrc 2>/dev/null; then
    printf '\nexport PATH="%s:$PATH"  # mysql-client\n' "$MYSQL_BIN" >> ~/.zshrc
    ok "mysql-client PATH added to ~/.zshrc"
  fi
fi
ok "mysql $(mysql --version | awk '{print $3}')"

# python3 (TSV → JSON conversion)
if ! command -v python3 &>/dev/null; then
  err "python3 not found — install with: brew install python"
fi
ok "$(python3 --version)"

# ─── 2. urban-training repo ──────────────────────────────────────────────────
step "urban-training repo"

ask "Repo path [../urban-training]:"
read -r UT_REPO
UT_REPO="${UT_REPO:-../urban-training}"

[[ -d "$UT_REPO" ]] || err "Directory not found: $UT_REPO"
PMA_SCRIPT="$UT_REPO/k8s/scripts/pma-prod.sh"
[[ -f "$PMA_SCRIPT" ]] || err "Script not found: $PMA_SCRIPT"
[[ -x "$PMA_SCRIPT" ]] || chmod +x "$PMA_SCRIPT"
ok "Repo: $(realpath "$UT_REPO")"

# ─── 3. kubectl context ──────────────────────────────────────────────────────
step "Kubernetes context"

ask "kubectl context [ut-prod]:"
read -r K8S_CONTEXT
K8S_CONTEXT="${K8S_CONTEXT:-ut-prod}"

kubectl config use-context "$K8S_CONTEXT" \
  || err "Failed to activate context: $K8S_CONTEXT"
ok "Context: $K8S_CONTEXT"

K8S_NS="urbantraining-production"

# ─── 4. MariaDB credentials ──────────────────────────────────────────────────
step "MariaDB credentials"

printf "  1) istvan\n  2) joel\n"
ask "User [1]:"
read -r USER_CHOICE

case "${USER_CHOICE:-1}" in
  1|istvan) DB_USER="istvan" ;;
  2|joel)   DB_USER="joel" ;;
  *) err "Invalid choice: $USER_CHOICE" ;;
esac

KEYCHAIN_SERVICE="urban-training-mariadb"
KEYCHAIN_KEY="___$(echo "$K8S_CONTEXT" | tr '[:lower:]-' '[:upper:]_')_$(echo "$DB_USER" | tr '[:lower:]' '[:upper:]')"

DB_PASS=$(security find-generic-password -s "$KEYCHAIN_SERVICE" -a "$KEYCHAIN_KEY" -w 2>/dev/null || true)

if [[ -n "$DB_PASS" ]]; then
  ok "Password loaded from Keychain ($KEYCHAIN_KEY)"
else
  ask "Password for $DB_USER:"
  read -rs DB_PASS
  printf "\n"
  [[ -n "$DB_PASS" ]] || err "Password cannot be empty"
  security add-generic-password -s "$KEYCHAIN_SERVICE" -a "$KEYCHAIN_KEY" -w "$DB_PASS" \
    && ok "Password saved to Keychain ($KEYCHAIN_KEY)" \
    || warn "Failed to save password to Keychain"
fi

# ─── 5. Kubernetes tunnels ───────────────────────────────────────────────────
step "Kubernetes tunnels"

# phpMyAdmin (scale up + port-forward on :8888)
ok "Starting phpMyAdmin (localhost:8888)..."
bash "$PMA_SCRIPT" &>/dev/null &
PIDS+=($!)

# Direct port-forward to MariaDB on :3307
DB_LOCAL_PORT=3307
MARIADB_PF_PID=""

start_mariadb_portforward() {
  [[ -n "$MARIADB_PF_PID" ]] && kill "$MARIADB_PF_PID" 2>/dev/null || true
  kubectl -n "$K8S_NS" port-forward service/mariadb "${DB_LOCAL_PORT}:3306" &>/dev/null &
  MARIADB_PF_PID=$!
  PIDS+=($MARIADB_PF_PID)
  printf "  Waiting for port %d" "$DB_LOCAL_PORT"
  for i in $(seq 1 20); do
    if (echo >/dev/tcp/127.0.0.1/$DB_LOCAL_PORT) 2>/dev/null; then
      printf " — ready\n"
      return 0
    fi
    printf "."
    sleep 1
  done
  printf "\n"
  err "Timeout: port ${DB_LOCAL_PORT} unreachable after 20s (check kubectl permissions for service/mariadb in namespace $K8S_NS)"
}

ok "Port-forwarding service/mariadb → localhost:${DB_LOCAL_PORT}..."
start_mariadb_portforward

# ─── 6. Connection test ──────────────────────────────────────────────────────
step "MariaDB connection"

DB_HOST="127.0.0.1"
DB_NAME="urbantraining-production"

export MYSQL_PWD="$DB_PASS"
MYSQL="mysql -h $DB_HOST -P $DB_LOCAL_PORT -u $DB_USER --connect-timeout=5"

$MYSQL -e "SELECT 1" "$DB_NAME" &>/dev/null \
  || err "Connection failed (host=$DB_HOST:$DB_LOCAL_PORT user=$DB_USER db=$DB_NAME)"
ok "Connected to $DB_NAME"

# ─── 7. Table selection ──────────────────────────────────────────────────────
step "Table selection"

ALL_TABLES=$($MYSQL -N -e "SHOW TABLES" "$DB_NAME")
TABLE_COUNT=$(printf "%s" "$ALL_TABLES" | grep -c . || true)
ok "${TABLE_COUNT} tables available"

SELECTED_TABLES=()
if command -v fzf &>/dev/null; then
  while IFS= read -r line; do
    SELECTED_TABLES+=("$line")
  done < <(printf "%s" "$ALL_TABLES" | fzf \
    --multi \
    --prompt="Select tables (TAB to multi-select, ENTER to confirm): " \
    --height=40% \
    --layout=reverse \
    --border)
else
  printf "\n"
  i=1
  while IFS= read -r t; do
    printf "  %3d) %s\n" "$i" "$t"
    i=$((i + 1))
  done <<< "$ALL_TABLES"
  printf "\n"
  ask "Tables to export (e.g. 1,3,5 or all):"
  read -r SELECTION
  if [[ "$SELECTION" == "all" ]]; then
    while IFS= read -r line; do
      SELECTED_TABLES+=("$line")
    done <<< "$ALL_TABLES"
  else
    IFS=',' read -ra NUMS <<< "$SELECTION"
    for n in "${NUMS[@]}"; do
      n="${n// /}"
      line=$(sed -n "${n}p" <<< "$ALL_TABLES")
      [[ -n "$line" ]] && SELECTED_TABLES+=("$line")
    done
  fi
fi

[[ ${#SELECTED_TABLES[@]} -gt 0 ]] || err "No tables selected"
ok "${#SELECTED_TABLES[@]} table(s) selected"

# ─── 8. JSON export ──────────────────────────────────────────────────────────
step "JSON export"

# Port-forward may have dropped during interactive selection — reconnect if needed
if ! $MYSQL -e "SELECT 1" "$DB_NAME" &>/dev/null; then
  warn "Connection lost, reconnecting..."
  start_mariadb_portforward
  $MYSQL -e "SELECT 1" "$DB_NAME" &>/dev/null || err "Reconnection failed"
  ok "Reconnected"
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
EXPORT_DIR="$PROJECT_ROOT/pb/json_import_sources"
mkdir -p "$EXPORT_DIR"
ok "Output directory: $EXPORT_DIR"
printf "\n"

for TABLE in "${SELECTED_TABLES[@]}"; do
  [[ -z "$TABLE" ]] && continue
  OUT="$EXPORT_DIR/${TABLE}.json"
  printf "  %-45s" "$TABLE"

  if $MYSQL --batch -e "SELECT * FROM \`${TABLE}\`" "$DB_NAME" \
      | python3 -c "
import sys, csv, json, re

table_name = sys.argv[1]
db_name = sys.argv[2]

def unescape(val):
    if val == 'NULL':
        return None
    return re.sub(r'\\\\(.)', lambda m: {'n':'\n','t':'\t','r':'\r','\\\\':'\\\\','0':'\x00'}.get(m.group(1), m.group(1)), val)

def jd(obj):
    return json.dumps(obj, ensure_ascii=False, default=str, separators=(',', ':'))

reader = csv.DictReader(sys.stdin, delimiter='\t')
rows = [{k: unescape(v) for k, v in row.items()} for row in reader]

print('[')
print(jd({'type':'header','version':'5.2.3','comment':'Export to JSON plugin for phpMyAdmin'}) + ',')
print(jd({'type':'database','name':db_name}) + ',')
print('{\"type\":\"table\",\"name\":' + jd(table_name) + ',\"database\":' + jd(db_name) + ',\"data\":')
print('[')
for i, row in enumerate(rows):
    print(jd(row) + (',' if i < len(rows) - 1 else ''))
print(']')
print('}')
print(']')
" "$TABLE" "$DB_NAME" > "$OUT" 2>/dev/null; then
    ROW_COUNT=$(python3 -c "
import json
with open('$OUT') as f:
    data = json.load(f)
table = next(e for e in data if e.get('type') == 'table')
print(len(table['data']))
" 2>/dev/null || echo "?")
    printf "${GREEN}%s rows${NC}\n" "$ROW_COUNT"
  else
    printf "${RED}failed${NC}\n"
  fi
done

printf "\n"
ok "Export complete → $EXPORT_DIR"
