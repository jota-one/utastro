# Load tests (k6)

Load tests to validate that the light VPS (1 CPU, 1 GB RAM, Astro SSR + PocketBase) can handle expected traffic during migration from the k8s Nuxt environment.

## Prerequisites

```bash
brew install k6
```

## Setup

### 1. Configure the test environment

```bash
cp tests/load/.env.example tests/load/.env
```

Edit `.env` with the URLs of the **test/staging instance** — never point at prod.

### 2. Set up test users

```bash
cp tests/load/test-users.example.json tests/load/test-users.json
```

Add real accounts that exist in the test DB. For stress tests (100 auth VUs), aim for 20–50 accounts — VUs rotate through the pool via modulo.

> Both files are in `.gitignore`. Never commit credentials.

### 3. Get test record IDs

In the PocketBase admin of the test instance, grab:

- An event `id` (not full, not cancelled) → `TEST_EVENT_ID` in `.env`
- An active city `id` → `TEST_CITY_ID` in `.env`

## Running the tests

k6 does not support `--env-file`. Use the provided wrapper script which sources `.env` before invoking k6.

### Smoke test — quick validation, 1 VU

```bash
./tests/load/run.sh smoke
```

### Load test — 100 VUs, ~5 min

```bash
./tests/load/run.sh load
```

### Stress test — up to 1000 VUs, ~7 min

```bash
./tests/load/run.sh stress
```

### With JSON output for post-analysis

```bash
./tests/load/run.sh load --out json=tests/load/results.json
```

## Scenarios covered

| Scenario      | Auth | Endpoints                                                                                                                                         |
| ------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| anonymous     | No   | `GET /fr` (SSR), `GET /api/collections/ut_cities/records`, `GET /api/collections/ut_events/records`, `GET /api/collections/ut_events/records/:id` |
| authenticated | Yes  | `/api/custom/auth/login`, `ut_subscriptions` (list/create/delete), `ut_city_watchers` (list/create/delete)                                        |

All write operations are immediately reversed so the test DB stays clean across runs.

## Thresholds

| Metric             | Load     | Stress |
| ------------------ | -------- | ------ |
| SSR pages p95      | < 2 s    | < 5 s  |
| PocketBase API p95 | < 500 ms | < 2 s  |
| Auth p95           | < 1 s    | < 1 s  |
| Error rate         | < 1%     | < 1%   |

## Interpreting results

### Key metrics

**`checks_succeeded`** — assertions on HTTP responses (status codes). Target: **100%** on smoke, **> 99%** on load/stress.

**`http_req_duration` by tag** — the most important numbers are `p(95)` (95th percentile), not the average:

- `{type:page}` — Astro SSR rendering time
- `{type:api}` — PocketBase reads (cities, events, subscriptions)
- `{type:auth}` — login endpoint

**`http_req_failed`** — TCP-level failures (connection refused, timeout). Any non-zero value under load is a red flag.

**`iteration_duration`** — full scenario duration per VU. Should stay stable during the sustain phase; a steady increase means the server is not keeping up.

### Reference baseline (local dev, smoke test)

| Metric             | Value   |
| ------------------ | ------- |
| Homepage SSR p95   | ~13 ms  |
| PocketBase API p95 | ~9 ms   |
| Auth (login)       | ~123 ms |

Expect ×10–×20 on the target VPS under concurrent load. A p95 of 200–500 ms for SSR pages is healthy.

### Warning signs

| Signal                                       | Likely cause                            |
| -------------------------------------------- | --------------------------------------- |
| `http_req_failed` spikes during sustain      | Server saturated, OOM, or process crash |
| `p(95)` grows steadily (no plateau)          | Memory leak or GC pressure              |
| `subscribe 200` / `unsubscribe 204` failures | SQLite write lock contention            |
| `login` latency > 1 s                        | PocketBase under CPU pressure           |
| `WARN Request Failed` in bursts              | Port exhaustion or connection pool full |

### Expected bottlenecks on the target VPS

- **Single CPU**: Astro SSR rendering is the primary bottleneck under heavy concurrent load
- **SQLite write lock**: concurrent subscriptions (`ut_subscriptions`) can cause contention — the stress test with 100 auth VUs will surface this
- **Shared memory**: 4 other Astro/PocketBase apps share the same server during pre-prod testing
