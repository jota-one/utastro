/// <reference path="../pb_data/types.d.ts" />

// 1782066402_fix_ut_users_rules.js inadvertently overwrote the open createRule
// from 1782000000_fix_ut_users_create_rule.js. Re-apply empty string to allow
// unauthenticated self-registration.
migrate(
  app => {
    const collection = app.findCollectionByNameOrId('ut_users')
    unmarshal({ createRule: '' }, collection)
    return app.save(collection)
  },
  app => {
    const collection = app.findCollectionByNameOrId('ut_users')
    const isAdmin =
      '@request.auth.role = "admin" || @request.auth.role = "superadmin"'
    unmarshal({ createRule: isAdmin }, collection)
    return app.save(collection)
  },
)
