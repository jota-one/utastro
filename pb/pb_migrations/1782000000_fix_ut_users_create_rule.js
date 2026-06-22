/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("ut_users_collection")

  // Allow anyone to self-register (empty string = public, null = superusers only)
  unmarshal({ "createRule": "" }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("ut_users_collection")

  unmarshal({ "createRule": null }, collection)

  return app.save(collection)
})
