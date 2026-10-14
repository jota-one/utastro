# Data import

The legacy urban-training data (MariaDB, on the old site's Kubernetes cluster) is imported into PocketBase in two steps: an **export** from your machine, then an **import on the site's VPS**. Both are scripted.

```bash
scripts/export-mariadb.sh                                    # 1. export, ~20 s
scripts/import-on-server.sh never.urban-training.ch --fresh  # 2. import, ~5 min
```

## How it works

1. `scripts/export-mariadb.sh` exports the 15 legacy tables the import reads to `pb/json_import_sources/*.json`, and copies the sponsor logos from the legacy sources (`../urban-training/public/img/sponsor/`) to `pb/json_import_sources/ut__sponsors_logos/`.
2. `pb-custom`, a PocketBase binary with extra commands (`pb-tools/`), loads the JSON files into raw tables (`hypercontent__*`, `sisi__*`, `ut__userinfos`, created by migrations), then transforms them into the app collections:

| Command           | Fills                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| `import-all-data` | the raw tables, one JSON file each                                                                                    |
| `import-users`    | `ut_users` — one account per email (legacy duplicates merged, highest role kept), legacy SHA-1 hash kept for login    |
| `import-cities`   | `ut_cities`, `ut_city_watchers`                                                                                       |
| `import-events`   | `ut_event_types`, `ut_locations`, `ut_events`, `ut_subscriptions` (subscriptions of merged accounts are carried over) |
| `import-sponsors` | `ut_sponsors` and their logos                                                                                         |

Every command except `import-users` empties its collections first and can be re-run. `import-users` only inserts (`INSERT OR IGNORE`): it never updates an account that already exists, so re-importing users means starting from an empty database (`--fresh`).

Imported accounts keep their legacy password: on first login the `legacy_auth` hook checks it against the SHA-1 hash, stores it as a regular PocketBase password, clears the hash and marks the account verified.

`pb-custom` refuses to run while PocketBase serves the same database (SQLite lock contention silently drops rows): it checks port 8091, or `PB_IMPORT_PORT`.

## 1. Export

Requirements: `kubectl` with the `ut-prod` context, `mysql` (installed through brew if missing), your MariaDB password (asked once, then kept in the macOS Keychain), and an up-to-date `../urban-training` checkout for the logos.

```bash
scripts/export-mariadb.sh
```

Three questions, each with a default: the urban-training path, the kubectl context, the database user. The table list is fixed; the script fails if a table is missing, cannot be exported or reads back as invalid JSON. Previous exports are deleted first.

The script also starts phpMyAdmin on the legacy cluster and stops it when it exits. Check it is back to 0 replicas afterwards (`kubectl -n urbantraining-production get deployment phpmyadmin`).

## 2. Import on the server

```bash
scripts/import-on-server.sh <domain> [--fresh]
```

The server and PocketBase port of `never` and `next` are known; for another site pass `SSH_HOST` and `PB_PORT` (see `apps.yaml` in jota-one/infra). SSH goes through `../infra/resources/ssh/config` (`INFRA_REPO` to change it).

| Step                  | Site | What happens                                                                                                                                                   |
| --------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Checks                | up   | local exports present, server reachable, release and services found                                                                                            |
| Upload and build      | up   | exports sent over SSH, `pb-custom` built on the server from the deployed release's `pb-tools`                                                                  |
| Confirmation          | up   | type the domain to go on; aborting changes nothing but the uploaded exports                                                                                    |
| Stop and back up      | down | PocketBase, Node and the deployment watcher stopped; `pb_data` copied — or, with `--fresh`, set aside and replaced by an empty schema (superusers copied over) |
| Import                | down | the five commands, one log each in `pb_logs/import-*.log`                                                                                                      |
| Check, purge, restart | down | counts printed, essential collections and the capacity trigger checked, raw legacy tables emptied and the database compacted, exports deleted from the server  |
| Smoke test            | up   | `tests/e2e/specs/smoke` against the site                                                                                                                       |

**Any failure while the site is down restores the backup and restarts the site.** The previous database stays in `pb_data.before-import-<date>` until you delete it.

Do not push to the site's branch during the import (`main` for next, `develop` for never): a deployment would replace the release while the import runs.

Afterwards, log in by hand with a legacy account and its old password.

### Measured on never (2026-10-13)

58,426 accounts, 15,878 sessions, 241,098 subscriptions, 40,132 city watchers. About 4 min of downtime, most of it in `import-events` (2 min 44) and `import-all-data` (1 min 09). On switchover day, freeze the old site from the export to the new site's restart: about 6 minutes.

## 3. Clean up

The exports and the backup hold a full copy of the legacy personal data, old password hashes included. Once the import is checked:

```bash
rm -rf pb/json_import_sources/*                              # local exports
ssh jota-apps-2-infomaniak 'rm -rf /srv/www/never.urban-training.ch/pb_data.before-import-*'
```

## Local development

To load the exports into your local database, with your PocketBase stopped:

```bash
pnpm pb:build   # builds pb/pb-custom
pnpm ut:import  # the five commands against pb/pb_data
```

## Troubleshooting

- **Accents unreadable in the exports**: the MariaDB client falls back to latin1 without a UTF-8 locale. The script forces `utf8mb4`; if you query by hand, pass `--default-character-set=utf8mb4`.
- **"PocketBase appears to be running on port …"**: stop the server first, or point `PB_IMPORT_PORT` at the right port.
- **"Skipping … no table"** in `import-all-data`: a JSON file without a raw table. Add a migration creating the table if the data is needed.
