/// <reference path="../pb_data/types.d.ts" />

// Grant admins/superadmins manage access on ut_users so the API returns the
// email field for every record (PocketBase hides email unless the requester
// is the owner, a superuser, or matches the manageRule). Without this the
// users CSV export gets empty emails.
const RULE = '@request.auth.role = "admin" || @request.auth.role = "superadmin"'

migrate(
  app => {
    const collection = app.findCollectionByNameOrId('ut_users')
    unmarshal({ manageRule: RULE }, collection)
    return app.save(collection)
  },
  app => {
    const collection = app.findCollectionByNameOrId('ut_users')
    unmarshal({ manageRule: null }, collection)
    return app.save(collection)
  },
)
