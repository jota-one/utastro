/// <reference path="../pb_data/types.d.ts" />

// Prevent unverified users from authenticating via standard PocketBase endpoints.
// The custom login hook (legacy_auth.pb.js) enforces the same check explicitly.
migrate(
  app => {
    const collection = app.findCollectionByNameOrId('ut_users')
    unmarshal({ authRule: 'verified = true' }, collection)
    return app.save(collection)
  },
  app => {
    const collection = app.findCollectionByNameOrId('ut_users')
    unmarshal({ authRule: null }, collection)
    return app.save(collection)
  },
)
