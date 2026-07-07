/// <reference path="../pb_data/types.d.ts" />

// Let admins/superadmins list every city watcher and subscription (not just
// their own) so the city CSV exports return data. Regular users stay limited
// to their own records.
const ADMIN = '@request.auth.role = "admin" || @request.auth.role = "superadmin"'
const OWNER = '@request.auth.id = user.id'

const targets = ['ut_city_watchers', 'ut_subscriptions']

migrate(
  app => {
    targets.forEach(name => {
      const collection = app.findCollectionByNameOrId(name)
      unmarshal({ listRule: `${OWNER} || ${ADMIN}` }, collection)
      app.save(collection)
    })
  },
  app => {
    targets.forEach(name => {
      const collection = app.findCollectionByNameOrId(name)
      unmarshal({ listRule: OWNER }, collection)
      app.save(collection)
    })
  },
)
