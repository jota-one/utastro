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
- `TEST_MEMBER_*` — an **admin** account of the test DB. Specs use it to create their own throwaway accounts (`e2e+…@example.com`) and sessions, and delete them afterwards
- `TEST_CITY_SLUG` — slug of an enabled city (e.g. `lausanne`)

Sessions are discovered in the data (an open one, a past one…) or created for the test, so no session id needs to be configured. The suite expects a copy of the production data.

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

| File                        | What it covers                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------- |
| `01-navigation.spec.ts`     | Static pages load without console errors, root redirect, city and session pages                         |
| `02-registration.spec.ts`   | Sign-up form, activation email (Mailpit), activation link, login refused before and accepted after      |
| `03-authentication.spec.ts` | Login modal, logout, wrong password, pending account, legacy (SHA-1) passwords, password reset by email |
| `04-redirects.spec.ts`      | Former URLs redirected by Caddy — runs only against a deployed site (`BASE_URL=https://never…`)         |

### member/

| File                             | What it covers                                                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------- |
| `01-session-subscribe.spec.ts`   | Subscribe / unsubscribe, header counter, unsubscribe confirmation                                  |
| `02-session-constraints.spec.ts` | Full session (page and server), past session, city watch, anonymous visitor asked to log in        |
| `03-concurrent.spec.ts`          | 3 members race for the last spot of a dedicated session — exactly 1 wins                           |
| `04-profile-sessions.spec.ts`    | Unsubscribe from the profile, past sessions hidden, past session subscription refused              |
| `05-access-control.spec.ts`      | What a plain member cannot do: change their role, subscribe others or as coach, read others' data… |

### coach/

| File                  | What it covers                                                                |
| --------------------- | ----------------------------------------------------------------------------- |
| `01-presence.spec.ts` | Coach a session and leave it, attendance sheet for the session's coaches only |

### admin/

| File                 | What it covers                                         |
| -------------------- | ------------------------------------------------------ |
| `01-exports.spec.ts` | CSV exports: users, city watchers, session subscribers |

## Auth strategy

Tests that need authentication inject a fresh JWT directly into `localStorage` / `sessionStorage` before the page loads — no UI login needed per test. This makes the suite fast while testing the real app state.

## Interpreting results

**Green run**: all specs passed, feature set is intact.

**Red on `01-navigation`**: a page broke at the SSR level — check Astro build or PocketBase availability.

**Red on subscribe/unsubscribe**: check `SessionDetail.vue` hydration, PocketBase `ut_subscriptions` collection permissions.

**Red on `03-concurrent`**: more than one member got the last spot — check the `ut_subscriptions_capacity` SQLite trigger.

Open the HTML report for screenshots and traces on failures:

```bash
pnpm exec playwright show-report tests/e2e/reports
```
