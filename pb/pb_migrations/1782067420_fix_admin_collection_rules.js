/// <reference path="../pb_data/types.d.ts" />

// Grants admin/superadmin users create/update/delete access to core collections.
// list/view remain public (used by the public-facing site).

migrate(
  (app) => {
    const isAdmin = '@request.auth.role = "admin" || @request.auth.role = "superadmin"'

    const collections = ['ut_cities', 'ut_event_types', 'ut_events', 'ut_locations']

    for (const name of collections) {
      const col = app.findCollectionByNameOrId(name)
      col.createRule = isAdmin
      col.updateRule = isAdmin
      col.deleteRule = isAdmin
      app.save(col)
    }
  },
  (app) => {
    const collections = ['ut_cities', 'ut_event_types', 'ut_events', 'ut_locations']

    for (const name of collections) {
      const col = app.findCollectionByNameOrId(name)
      col.createRule = null
      col.updateRule = null
      col.deleteRule = null
      app.save(col)
    }
  },
)
