/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("ut_users_collection")

  // update collection data
  unmarshal({
    "deleteRule": "@request.auth.roles.slug ?= \"admin\"",
    "listRule": "@request.auth.roles.slug ?= \"admin\"",
    "updateRule": "id = @request.auth.id || @request.auth.roles.slug ?= \"admin\"",
    "viewRule": "id = @request.auth.id || @request.auth.roles.slug ?= \"admin\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("ut_users_collection")

  // update collection data
  unmarshal({
    "deleteRule": null,
    "listRule": null,
    "updateRule": null,
    "viewRule": null
  }, collection)

  return app.save(collection)
})
