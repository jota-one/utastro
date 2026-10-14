# Switchover day

Moves `www.urban-training.ch` from the legacy Nuxt site to ut-astro. `scripts/switchover.sh` runs it one step per subcommand: each step checks its own result, and any step can be re-run.

```bash
scripts/switchover.sh plan     # the sequence below, with the live values
scripts/switchover.sh status   # where things stand, read-only
```

## Setup

- Production is the jota-one/infra app `next.urban-training.ch` on `jota-apps-3-infomaniak`. It keeps that name (folder, services, database); the switch PR ([jota-one/infra#30](https://github.com/jota-one/infra/pull/30), a draft until the day) adds `www.urban-training.ch` and `urban-training.ch` to it, redirects `urban-training.ch` and `next.urban-training.ch` to www, and sets `SITE_URL` for the email links.
- `www.urban-training.ch` is a CNAME to `urban-training.ch`: only the A record of `urban-training.ch` changes. Its TTL is 300 s.
- When Node is stopped, Caddy serves `public/maintenance.html` with a 503: that is the freeze. The uptime probe reports the site down (HTTP 503) meanwhile, as expected.
- Once the data is imported, the smoke test sends a password reset email to `TEST_MEMBER_EMAIL` of `tests/e2e/.env` (your account, which also exists on the legacy site): it proves the site sends its emails. `SMOKE_MAIL_TO` overrides that address; `preflight` shows the one used.
- Requirements on your machine: SSH to `jota-apps-3-infomaniak` (host key known), `kubectl` context `ut-prod`, `gh` logged in, the legacy sources in `../urban-training`, the MariaDB password in the Keychain. `preflight` checks them all.

## Sequence

| #   | Step          | Who    | What happens                                                                                                            |
| --- | ------------- | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| 1   | `preflight`   | script | everything above is reachable, the switch PR is open                                                                    |
| 2   | `freeze`      | script | Node stopped on next: maintenance page. PocketBase stays up for the provisioning                                        |
| 3   | DNS           | you    | Infomaniak manager, zone `urban-training.ch`: A record of `urban-training.ch` → `179.237.125.92`, TTL 300               |
|     | `wait-dns`    | script | waits until 1.1.1.1, 8.8.8.8 and 9.9.9.9 resolve both names to the new server, then 5 more minutes                      |
| 4   | `merge-pr`    | script | after your go: merges the switch PR, waits for the provisioning, then for www over HTTPS (maintenance page)             |
| 5   | `stop-legacy` | script | after your go: the legacy app is scaled to 0 — nothing can be written there anymore                                     |
| 6   | `export`      | script | legacy data exported (~30 s)                                                                                            |
| 7   | `import`      | script | `--fresh` import on next (~5 min), site reopened, smoke test on www                                                     |
| 8   | check         | you    | log in with a legacy account and its old password; the smoke test's reset email reached `SMOKE_MAIL_TO`, then delete it |
| 9   | `cleanup`     | script | after your go: deletes the exports and the pre-import backup (personal data)                                            |

The merge must come after the DNS: Caddy can only get the certificates of www and `urban-training.ch` once they point to the new server, and backs off for longer and longer after each failure.

Visitors see the maintenance page from step 2 (on the new DNS) to the end of step 7: about 15 minutes, most of it the DNS wait. The legacy site stays up for visitors still on the old DNS until step 5.

## Rollback

| Failed at | Do                                                                                      |
| --------- | --------------------------------------------------------------------------------------- |
| 2–4       | set the A record back to `85.217.160.26`, revert the PR if merged, `unfreeze`           |
| 5–7       | the same, plus `restart-legacy`; a failed import already restored the previous database |

`import` runs with `--keep-frozen`: if it fails, the previous database comes back but the site stays on the maintenance page instead of reopening empty.

## Rehearsal

`TARGET=never` runs `freeze`, `export`, `import`, `unfreeze` and `cleanup` against never.urban-training.ch; the DNS, PR and legacy steps refuse to run. Done on 2026-10-13: maintenance page from 17:39:24 to 17:45:15, export included, smoke test green.

```bash
TARGET=never scripts/switchover.sh freeze
TARGET=never DB_USER=joel scripts/switchover.sh export
TARGET=never scripts/switchover.sh import
TARGET=never scripts/switchover.sh cleanup
```

See [data-import.md](data-import.md) for the export and import themselves.
