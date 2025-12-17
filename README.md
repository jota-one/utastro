# ut-astro: Astro + PocketBase + Vue Admin

A full-stack app combining Astro static/server-side rendering with a custom PocketBase backend and embedded Vue admin interface.

## Quick Start

### Prerequisites

- **Node.js** 24.11.1+ (see `volta` in `package.json`)
- **Go** 1.23+ (for building the custom PocketBase binary)
- **pnpm** (or npm/yarn)

### Setup

```bash
# Install dependencies
pnpm install

# Build the custom PocketBase binary (includes import commands)
pnpm pb:build

# Start dev server (Astro on 4321, PocketBase on 8091)
pnpm dev
pnpm db  # in another terminal
```

## Available Scripts

```bash
# Frontend
pnpm dev              # Start Astro dev server (http://127.0.0.1:4321)
pnpm build            # Build Astro site for production
pnpm preview          # Preview production build locally

# Backend / PocketBase
pnpm db               # Start PocketBase binary (http://127.0.0.1:8090/_/)
pnpm pb:build         # Build the custom pb-custom binary (Go)
pnpm migrate:up       # Apply pending migrations
pnpm migrate:down     # Revert last migration

# Code quality
pnpm lint             # Run oxlint type-aware checks
pnpm format           # Format code with oxfmt
```

## Project Structure

```
.
├── src/                   # Astro pages and Vue components
│   ├── admin/            # Vue admin SPA (router base: /admin/)
│   │   ├── components/   # Vue components
│   │   ├── composables/  # Data access composables
│   │   ├── router/       # Vue Router setup
│   │   └── views/        # Admin page views
│   ├── pages/            # Astro pages (server or static)
│   └── config/           # Runtime config (apiBaseUrl)
├── pb/                    # PocketBase backend
│   ├── main.go           # Custom PocketBase entry point
│   ├── go.mod, go.sum    # Go dependencies (reproducible builds)
│   ├── pb-custom         # Compiled binary (not in git)
│   ├── pb_migrations/    # SQL/JS migration files
│   ├── commands/         # Go custom CLI commands
│   ├── pb_data/          # Runtime data (database, .db not in git)
│   └── sql_import_sources/ # Raw export files for bulk imports
├── package.json          # npm/pnpm scripts and node deps
└── tsconfig.json         # TypeScript config
```

## PocketBase Setup

### Collections

- **ut_users** (auth collection)
  - Core fields: email, password, name, role, legacy_id
  - Extended fields: street, npa, city, region, gender, birthdate, accept_* flags
  - Built from legacy data via migrations + import commands

### Importing Data

Raw data (table exported as JSON from phpMyAdmin) are processed via custom Go commands:

```bash
cd pb

# 1) Import raw tables from JSON exports
./pb-custom import-data --table=hypercontent__users --file=sql_import_sources/hypercontent__users.json --chunk-size=1000
./pb-custom import-data --table=ut__userinfos --file=sql_import_sources/ut__userinfos.json --chunk-size=1000

# 2) Populate ut_users collection (combines import + enrichment)
./pb-custom import-users
# Skip enrichment with userinfos if needed:
# ./pb-custom import-users --skip-userinfos
```

### Import data (one-time or reset)

```bash
# If resetting the database:
cd pb
rm -rf pb_data    # wipe

# restart the db (will apply the migrations)
pnpm db

# Then import data:
cd pb
./pb-custom import-data --table=hypercontent__users --file=sql_import_sources/hypercontent__users.json
./pb-custom import-data --table=ut__userinfos --file=sql_import_sources/ut__userinfos.json
./pb-custom import-users
```

## Environment

- **Env file**: `.env.local` (git-ignored)
- **Public config**: `src/config/index.ts` exposes `apiBaseUrl` from `PUBLIC_PB_BASE_URI`
- **Default local**: `PUBLIC_PB_BASE_URI=http://localhost:8090` (set via `.env` or shell)


## Troubleshooting

- **"command not found: go"**: Install Go 1.23+
- **"command not found: pnpm"**: Install pnpm globally or use npm/yarn
- **PocketBase UI shows old schema**: Restart the `pnpm db` process

## References

- [Astro Docs](https://docs.astro.build)
- [PocketBase Docs](https://pocketbase.io/docs)
- [Vue 3 Docs](https://vuejs.org)
