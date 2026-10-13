#!/usr/bin/env bash
set -euo pipefail

# Switchover of www.urban-training.ch from the legacy site to ut-astro, one
# step per subcommand so each can be run, checked and re-run on its own:
#
#   scripts/switchover.sh plan          the sequence, with who does what
#   scripts/switchover.sh status        where things stand (read-only)
#   scripts/switchover.sh preflight     everything needed is reachable
#   scripts/switchover.sh freeze        new site → maintenance page (Node off)
#   scripts/switchover.sh wait-dns      waits for urban-training.ch → new server
#   scripts/switchover.sh merge-pr      merges the infra switch PR, waits for www
#   scripts/switchover.sh stop-legacy   stops the legacy app: no more writes
#   scripts/switchover.sh export        exports the legacy data
#   scripts/switchover.sh import        imports it, reopens the site, smoke test
#   scripts/switchover.sh cleanup       deletes the exports and the server backup
#
# Rollback: `unfreeze` (Node back on) and `restart-legacy` (legacy app back on);
# the DNS change and the PR merge are reverted by hand.
#
# TARGET=never rehearses the steps that touch neither the DNS, the infra PR nor
# the legacy site (freeze, export, import, unfreeze) on never.urban-training.ch.

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
info() { printf "  %s\n" "$*"; }

# ─── Settings ────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
INFRA_REPO="${INFRA_REPO:-$PROJECT_ROOT/../infra}"
SSH_CONFIG="$INFRA_REPO/resources/ssh/config"

TARGET="${TARGET:-production}"
case "$TARGET" in
  production)
    # The app keeps its first name; www is its public address (jota-one/infra
    # apps.yaml, see the switch PR)
    APP_DOMAIN="next.urban-training.ch"
    SITE_URL="https://www.urban-training.ch"
    SSH_HOST="jota-apps-3-infomaniak"
    ;;
  never)
    APP_DOMAIN="never.urban-training.ch"
    SITE_URL="https://never.urban-training.ch"
    SSH_HOST="jota-apps-2-infomaniak"
    ;;
  *) err "Unknown TARGET $TARGET (production or never)" ;;
esac

APEX="urban-training.ch"
WWW="www.urban-training.ch"
INFRA_GH_REPO="jota-one/infra"
SWITCH_PR="${SWITCH_PR:-30}"
K8S_CONTEXT="ut-prod"
K8S_NS="urbantraining-production"
LEGACY_DEPLOYMENT="webapp-deployment"
RESOLVERS=(1.1.1.1 8.8.8.8 9.9.9.9)

SUFFIX="${APP_DOMAIN//./-}"
NODE_SERVICE="node-$SUFFIX.service"
PB_SERVICE="pb-$SUFFIX.service"
WATCH_PATH="pb-$SUFFIX-watch.path"

SSH=(ssh -n -T -F "$SSH_CONFIG" -o BatchMode=yes "$SSH_HOST")
KUBECTL=(kubectl --context "$K8S_CONTEXT" -n "$K8S_NS")

# ─── Helpers ─────────────────────────────────────────────────────────────────
production_only() {
  [[ "$TARGET" == "production" ]] || err "'$1' only applies to the production switchover"
}

# HTTP status of a URL, certificate checked; 000 when no answer
http_code() {
  curl -s -o /dev/null -m 10 -w '%{http_code}' "$1" 2>/dev/null || true
}

new_server_ip() {
  ssh -G -T -F "$SSH_CONFIG" "$SSH_HOST" 2>/dev/null | awk '/^hostname /{print $2}'
}

# Waits until a command succeeds, printing a dot per try
wait_for() {
  local description="$1" timeout="$2"
  shift 2
  local deadline=$(( $(date +%s) + timeout ))
  printf "  %s " "$description"
  until "$@"; do
    if [[ $(date +%s) -ge $deadline ]]; then
      printf "\n"
      return 1
    fi
    printf "."
    sleep 10
  done
  printf " ok\n"
}

dns_points_to_new_server() {
  local ip resolver
  ip="$(new_server_ip)"
  for resolver in "${RESOLVERS[@]}"; do
    [[ "$(dig +short @"$resolver" "$APEX" A | tail -1)" == "$ip" ]] || return 1
    [[ "$(dig +short @"$resolver" "$WWW" A | tail -1)" == "$ip" ]] || return 1
  done
}

site_frozen() { [[ "$(http_code "$1/")" == "503" ]]; }
site_open()   { [[ "$(http_code "$1/fr")" == "200" ]]; }

legacy_replicas() {
  "${KUBECTL[@]}" get deployment "$LEGACY_DEPLOYMENT" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || true
}

legacy_stopped() { [[ -z "$(legacy_replicas)" || "$(legacy_replicas)" == "0" ]]; }

confirm() {
  [[ "${ASSUME_YES:-0}" == "1" ]] && return 0
  ask "$1 Type yes to go on:"
  local answer
  read -r answer || answer=""
  [[ "$answer" == "yes" ]] || err "Aborted, nothing changed"
}

# ─── Steps ───────────────────────────────────────────────────────────────────
cmd_plan() {
  cat <<EOF

Switchover of $WWW (TARGET=$TARGET)

  1. preflight      script   everything needed is reachable
  2. freeze         script   $APP_DOMAIN shows the maintenance page
  3. DNS            YOU      Infomaniak, zone $APEX: A record of $APEX → $(new_server_ip) (TTL 300)
     wait-dns       script   waits for $APEX and $WWW to resolve to it everywhere
  4. merge-pr       script   after your go: merges $INFRA_GH_REPO#$SWITCH_PR, waits for $WWW over HTTPS
  5. stop-legacy    script   the legacy app is stopped: from now on nothing is written there
  6. export         script   legacy data exported (~20 s)
  7. import         script   imported on $APP_DOMAIN (~5 min), site reopened, smoke test on $SITE_URL
  8. check          YOU      log in with a legacy account and its old password
  9. cleanup        script   deletes the exports and the pre-import backup (personal data)

  Freeze for visitors: from step 2 to the end of step 7, about 15 minutes.
  Rollback before step 5: revert the DNS and the PR, then unfreeze.
  Rollback after step 5: also restart-legacy.

EOF
}

cmd_status() {
  step "Status ($TARGET)"
  info "new site     $APP_DOMAIN on $SSH_HOST ($(new_server_ip))"
  info "services     $("${SSH[@]}" "for u in $PB_SERVICE $NODE_SERVICE $WATCH_PATH; do printf '%s=%s ' \$u \$(systemctl is-active \$u); done" 2>/dev/null || echo "unreachable")"
  info "answers      https://$APP_DOMAIN/ → $(http_code "https://$APP_DOMAIN/")   $SITE_URL/ → $(http_code "$SITE_URL/")"
  if [[ "$TARGET" == "production" ]]; then
    local resolver
    for resolver in "${RESOLVERS[@]}"; do
      info "DNS $resolver  $APEX → $(dig +short @"$resolver" "$APEX" A | tail -1)   $WWW → $(dig +short @"$resolver" "$WWW" A | tail -1)"
    done
    info "switch PR    $(gh pr view "$SWITCH_PR" -R "$INFRA_GH_REPO" --json state,isDraft -q '"\(.state), draft: \(.isDraft)"' 2>/dev/null || echo "unknown")"
    info "legacy app   ready replicas: $(legacy_replicas || echo "?")"
  fi
}

cmd_preflight() {
  step "Preflight ($TARGET)"
  local tool
  for tool in curl dig kubectl gh ssh pnpm; do
    command -v "$tool" >/dev/null || err "$tool not found"
  done
  ok "Tools present"

  "${SSH[@]}" true 2>/dev/null || err "Cannot connect to $SSH_HOST (host key?)"
  "${SSH[@]}" "sudo -n true && systemctl cat $PB_SERVICE $NODE_SERVICE $WATCH_PATH >/dev/null" \
    || err "Services of $APP_DOMAIN not found on $SSH_HOST, or no sudo"
  ok "Server $SSH_HOST and the $APP_DOMAIN services"

  "${KUBECTL[@]}" get deployment "$LEGACY_DEPLOYMENT" >/dev/null 2>&1 \
    || err "Legacy deployment $LEGACY_DEPLOYMENT not reachable (kubectl context $K8S_CONTEXT)"
  ok "Legacy cluster reachable ($LEGACY_DEPLOYMENT: $(legacy_replicas) ready)"

  [[ -d "$PROJECT_ROOT/../urban-training/public/img/sponsor" ]] \
    || err "Legacy sources not found in ../urban-training (sponsor logos)"
  ok "Legacy sources present (sponsor logos)"

  if [[ "$TARGET" == "production" ]]; then
    gh auth status >/dev/null 2>&1 || err "gh is not logged in"
    [[ "$(gh pr view "$SWITCH_PR" -R "$INFRA_GH_REPO" --json state -q .state)" == "OPEN" ]] \
      || err "$INFRA_GH_REPO#$SWITCH_PR is not open"
    ok "Switch PR $INFRA_GH_REPO#$SWITCH_PR open"
  fi
  ok "Ready"
}

cmd_freeze() {
  step "Freeze $APP_DOMAIN"
  # the deployment watcher would restart the app on a push: keep it off too
  "${SSH[@]}" "sudo systemctl stop $WATCH_PATH $NODE_SERVICE"
  wait_for "maintenance page on https://$APP_DOMAIN" 120 site_frozen "https://$APP_DOMAIN" \
    || err "https://$APP_DOMAIN does not show the maintenance page"
  ok "Frozen: Node stopped, PocketBase kept for the provisioning"
}

cmd_unfreeze() {
  step "Unfreeze $APP_DOMAIN"
  "${SSH[@]}" "sudo systemctl start $PB_SERVICE $NODE_SERVICE $WATCH_PATH"
  wait_for "site back on https://$APP_DOMAIN" 120 site_open "https://$APP_DOMAIN" \
    || err "https://$APP_DOMAIN does not answer"
  ok "Site open"
}

cmd_wait_dns() {
  production_only wait-dns
  step "DNS"
  info "In the Infomaniak manager, zone $APEX: set the A record of $APEX to $(new_server_ip), TTL 300."
  info "$WWW is a CNAME to $APEX and follows. Leave the MX, TXT and other records alone."
  wait_for "waiting for ${RESOLVERS[*]}" 3600 dns_points_to_new_server \
    || err "DNS not propagated after an hour"
  info "Letting the resolvers' caches expire (TTL 300)..."
  sleep 300
  ok "$APEX and $WWW resolve to the new server"
}

cmd_merge_pr() {
  production_only merge-pr
  step "Switch PR $INFRA_GH_REPO#$SWITCH_PR"
  dns_points_to_new_server || err "The DNS does not point to the new server yet: Caddy could not get the certificates"
  confirm "Merge $INFRA_GH_REPO#$SWITCH_PR (www and $APEX served by the new server)?"

  gh pr ready "$SWITCH_PR" -R "$INFRA_GH_REPO" >/dev/null 2>&1 || true
  gh pr merge "$SWITCH_PR" -R "$INFRA_GH_REPO" --merge >/dev/null
  local sha run
  sha="$(gh pr view "$SWITCH_PR" -R "$INFRA_GH_REPO" --json mergeCommit -q .mergeCommit.oid)"
  ok "Merged (${sha:0:7})"

  wait_for "provisioning run started" 300 bash -c \
    "gh run list -R '$INFRA_GH_REPO' --workflow 'Provision infra' --commit '$sha' --json databaseId -q '.[0].databaseId' | grep -q ."
  run="$(gh run list -R "$INFRA_GH_REPO" --workflow 'Provision infra' --commit "$sha" --json databaseId -q '.[0].databaseId')"
  info "Provisioning: https://github.com/$INFRA_GH_REPO/actions/runs/$run"
  gh run watch "$run" -R "$INFRA_GH_REPO" --exit-status --interval 20 >/dev/null || err "Provisioning failed"
  ok "Provisioned"

  wait_for "certificate and maintenance page on $WWW" 600 site_frozen "https://$WWW" \
    || err "https://$WWW does not answer over HTTPS"
  [[ "$(curl -s -o /dev/null -m 10 -w '%{http_code} %{redirect_url}' "https://$APEX/fr")" == "301 https://$WWW/fr" ]] \
    || warn "$APEX does not redirect to $WWW yet"
  ok "$WWW served by the new server (maintenance page), $APEX redirects to it"
}

cmd_stop_legacy() {
  production_only stop-legacy
  step "Stop the legacy app"
  dns_points_to_new_server || warn "The DNS does not point to the new server: visitors would get errors"
  confirm "Stop the legacy app? Nothing can be written there afterwards."
  "${KUBECTL[@]}" scale deployment "$LEGACY_DEPLOYMENT" --replicas=0 >/dev/null
  wait_for "legacy pods gone" 300 legacy_stopped || err "The legacy app is still running"
  ok "Legacy app stopped (restart-legacy to undo)"
}

cmd_restart_legacy() {
  production_only restart-legacy
  step "Restart the legacy app"
  "${KUBECTL[@]}" scale deployment "$LEGACY_DEPLOYMENT" --replicas=1 >/dev/null
  "${KUBECTL[@]}" rollout status deployment "$LEGACY_DEPLOYMENT" --timeout=300s >/dev/null \
    || err "The legacy app does not come back"
  ok "Legacy app running"
}

cmd_export() {
  step "Export"
  if [[ "$TARGET" == "production" ]]; then
    legacy_stopped || err "The legacy app still runs: stop-legacy first, or the export misses the last writes"
  fi
  UT_REPO="$PROJECT_ROOT/../urban-training" K8S_CONTEXT="$K8S_CONTEXT" \
    "$SCRIPT_DIR/export-mariadb.sh"
}

cmd_import() {
  step "Import"
  SITE_URL="$SITE_URL" "$SCRIPT_DIR/import-on-server.sh" "$APP_DOMAIN" --fresh --yes --keep-frozen
  ok "Switchover data step done — check a login with a legacy account and its old password"
}

cmd_cleanup() {
  step "Clean up the personal data"
  local backups
  backups="$("${SSH[@]}" "cd /srv/www/$APP_DOMAIN && ls -d pb_data.before-import-* pb_data.failed 2>/dev/null" || true)"
  info "local:  $PROJECT_ROOT/pb/json_import_sources ($(du -sh "$PROJECT_ROOT/pb/json_import_sources" | cut -f1))"
  info "server: ${backups:-nothing} on $SSH_HOST"
  confirm "Delete them? The pre-import backup is the last way back to the previous database."
  rm -rf "$PROJECT_ROOT/pb/json_import_sources/"*
  if [[ -n "$backups" ]]; then
    "${SSH[@]}" "cd /srv/www/$APP_DOMAIN && rm -rf pb_data.before-import-* pb_data.failed"
  fi
  ok "Exports and backups deleted"
}

cmd_smoke() {
  BASE_URL="$SITE_URL" "$PROJECT_ROOT/tests/e2e/run.sh" specs/smoke
}

# ─── Main ────────────────────────────────────────────────────────────────────
COMMAND="${1:-plan}"
shift || true
[[ "${1:-}" == "--yes" ]] && ASSUME_YES=1

case "$COMMAND" in
  plan)           cmd_plan ;;
  status)         cmd_status ;;
  preflight)      cmd_preflight ;;
  freeze)         cmd_freeze ;;
  unfreeze)       cmd_unfreeze ;;
  wait-dns)       cmd_wait_dns ;;
  merge-pr)       cmd_merge_pr ;;
  stop-legacy)    cmd_stop_legacy ;;
  restart-legacy) cmd_restart_legacy ;;
  export)         cmd_export ;;
  import)         cmd_import ;;
  cleanup)        cmd_cleanup ;;
  smoke)          cmd_smoke ;;
  *)              err "Unknown command: $COMMAND (see the header of $0)" ;;
esac
