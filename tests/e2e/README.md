# E2E tests (Playwright)

Regression tests covering the 5 user personas. Selectors are based on **visible text and label elements** — not CSS classes or ARIA roles — so they survive Vue component refactors.

## Prerequisites

```bash
pnpm add -D @playwright/test
pnpm exec playwright install chromium
```

For registration and password reset email tests, install Mailpit and configure PocketBase SMTP:

```bash
brew install mailpit
mailpit   # starts on :8025 (web) and :1025 (SMTP)
```

In PocketBase admin → Settings → Mail → set SMTP host `localhost`, port `1025`, no auth.

## Setup

```bash
cp tests/e2e/.env.example tests/e2e/.env
```

Edit `.env`:

- `BASE_URL` / `PB_URL` — point to **local or staging**, never prod
- `TEST_MEMBER_*` — real accounts in the test DB
- `TEST_EVENT_ID_*` — pick IDs from PocketBase admin
- `TEST_CITY_SLUG` — slug of an enabled city (e.g. `lausanne`)

Both `.env` and auth state files are in `.gitignore`.

## Running tests

```bash
./tests/e2e/run.sh                          # all tests
./tests/e2e/run.sh --grep "navigation"     # filter by name
./tests/e2e/run.sh specs/anonymous         # specific folder
./tests/e2e/run.sh --ui                    # interactive UI mode (recommended for dev)
```

## Spec map

### anonymous/

| File                      | What it covers                                                                    |
| ------------------------- | --------------------------------------------------------------------------------- |
| `01-navigation.spec.ts`   | All static pages load, no console errors, root redirect                           |
| `02-registration.spec.ts` | New user form, success message, activation email (Mailpit), duplicate email error |

### member/

| File                           | What it covers                                                                    |
| ------------------------------ | --------------------------------------------------------------------------------- |
| `01-event-subscribe.spec.ts`   | Subscribe / unsubscribe, header counter increments/decrements, modal cancel       |
| `02-event-constraints.spec.ts` | Full event blocked, past event no button, city watch, anonymous redirect to login |
| `03-concurrent.spec.ts`        | 3 users race for the last spot — exactly 1 wins                                   |

### coach/, admin/, superadmin/ — TODO

## Auth strategy

Tests that need authentication inject a fresh JWT directly into `localStorage` / `sessionStorage` before the page loads — no UI login needed per test. This makes the suite fast while testing the real app state.

## Concurrent test setup (`03-concurrent`)

Before running this spec:

1. In PocketBase admin, find an event and set `subscription_count = max_subscriptions - 1`
2. Put that `id` in `TEST_EVENT_ID_LAST_SPOT`
3. Ensure the 3 member accounts are NOT already subscribed to it
4. After the run, reset the counts for the next run

## Interpreting results

**Green run**: all specs passed, feature set is intact.

**Red on `01-navigation`**: a page broke at the SSR level — check Astro build or PocketBase availability.

**Red on subscribe/unsubscribe**: check `DetailView.vue` hydration, PocketBase `ut_subscriptions` collection permissions.

**Red on `03-concurrent`**: SQLite write contention may be causing both users to succeed (or both to fail). Investigate PocketBase transaction handling on `ut_subscriptions`.

Open the HTML report for screenshots and traces on failures:

```bash
pnpm exec playwright show-report tests/e2e/reports
```
