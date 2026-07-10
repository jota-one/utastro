/// <reference path="../pb_data/types.d.ts" />

// PocketBase only matches non-superuser filters on the `email` field of
// auth collections against records with emailVisibility=true, so the admin
// users search silently ignored the email term. Exposure stays limited to
// the ut_users view rule (own record or admin).
migrate(
  app => {
    app.db().newQuery('UPDATE ut_users SET emailVisibility = 1').execute()
  },
  app => {
    app.db().newQuery('UPDATE ut_users SET emailVisibility = 0').execute()
  },
)
