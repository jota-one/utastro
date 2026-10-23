/// <reference path="../pb_data/types.d.ts" />

// Store every account email trimmed and in lower case, as the app now does on
// sign-up and login (pb_hooks/users.pb.js, legacy_auth.pb.js): PocketBase
// compares emails case-sensitively, the legacy site did not. Addresses that
// would collide with another account once lowered are left as they are — a
// fresh import merges such duplicates.
migrate(
  app => {
    app
      .db()
      .newQuery(
        `UPDATE ut_users
         SET email = lower(trim(email))
         WHERE email != lower(trim(email))
           AND lower(trim(email)) IN (
             SELECT lower(trim(email)) FROM ut_users
             GROUP BY lower(trim(email)) HAVING count(*) = 1
           )`,
      )
      .execute()
  },
  () => {
    // the original case of the addresses is not kept
  },
)
