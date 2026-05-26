# Data import workflow

The site migrates data from the legacy urban-training MySQL database into PocketBase/SQLite. The process has two distinct phases.

## Phase 1 — Create table structures (migrations)

SQL structure exports from PHPMyAdmin live in `pb/sql_import_sources/*.sql`. Each SQL file is converted into a PocketBase migration that creates the auxiliary SQLite tables.

Migrations are in `pb/pb_migrations/`, named `{unix_timestamp}_{description}.js`.

Current import migrations:
| Migration | Tables created |
|-----------|---------------|
| `1734374880_import_hypercontent_users.js` | `hypercontent__users` |
| `1734376700_import_ut_userinfos.js` | `ut__userinfos` |
| `1779725110_import_sisi_tables.js` | all 10 `sisi__*` tables |

> `ut__regions` / `ut__regions_lang` were intentionally NOT migrated — region codes are hardcoded in `import_users.go` via a CASE statement.

### MySQL → SQLite conversion rules

- `ENGINE=InnoDB`, `CHARSET`, `COLLATE` → remove
- `int(10) UNSIGNED` → `INTEGER`
- `tinyint(1)` → `INTEGER`
- `varchar(N)`, `text` → `TEXT`
- `datetime` → `TEXT`
- `enum(...)` → `TEXT`
- `AUTO_INCREMENT` → `AUTOINCREMENT` on `INTEGER PRIMARY KEY`
- Foreign key constraints → drop entirely (SQLite ignores them anyway)
- Keep indexes as `CREATE INDEX IF NOT EXISTS`

## Phase 2 — Populate tables (JSON import)

JSON data exports from PHPMyAdmin live in `pb/sql_import_sources/*.json`. Run the `import-data` command once per file, from the `pb/` directory:

```bash
./pb-custom import-data --table=sisi__cities --file=sql_import_sources/sisi__cities.json
./pb-custom import-data --table=sisi__events --file=sql_import_sources/sisi__events.json
# ... one command per JSON file
```

The command handles the PHPMyAdmin JSON envelope format automatically (`type: "table"` wrapper).

## Phase 3 — Transform users

After `hypercontent__users` and `ut__userinfos` are populated, run:

```bash
./pb-custom import-users
```

This reads the auxiliary tables and inserts into the `ut_users` PocketBase collection, mapping role IDs, normalizing names, and enriching with address/profile data.

## Full sequence

```bash
# 1. Start PocketBase (runs migrations automatically)
./pocketbase serve --http=127.0.0.1:8091

# 2. Import all JSON data
./pb-custom import-data --table=hypercontent__users --file=sql_import_sources/hypercontent__users.json
./pb-custom import-data --table=ut__userinfos       --file=sql_import_sources/ut__userinfos.json
./pb-custom import-data --table=sisi__cities        --file=sql_import_sources/sisi__cities.json
./pb-custom import-data --table=sisi__city_watchers --file=sql_import_sources/sisi__city_watchers.json
./pb-custom import-data --table=sisi__event_types         --file=sql_import_sources/sisi__event_types.json
./pb-custom import-data --table=sisi__event_types_events  --file=sql_import_sources/sisi__event_types_events.json
./pb-custom import-data --table=sisi__event_types_lang    --file=sql_import_sources/sisi__event_types_lang.json
./pb-custom import-data --table=sisi__events        --file=sql_import_sources/sisi__events.json
./pb-custom import-data --table=sisi__events_lang   --file=sql_import_sources/sisi__events_lang.json
./pb-custom import-data --table=sisi__locations     --file=sql_import_sources/sisi__locations.json
./pb-custom import-data --table=sisi__locations_lang --file=sql_import_sources/sisi__locations_lang.json
./pb-custom import-data --table=sisi__subscriptions --file=sql_import_sources/sisi__subscriptions.json

# 3. Transform users into PocketBase collection
./pb-custom import-users
```
