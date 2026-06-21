/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('ut_users')

    const isAdmin = '@request.auth.role = "admin" || @request.auth.role = "superadmin"'

    collection.listRule   = isAdmin
    collection.viewRule   = `id = @request.auth.id || ${isAdmin}`
    collection.createRule = isAdmin
    collection.updateRule = `id = @request.auth.id || ${isAdmin}`
    collection.deleteRule = isAdmin

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('ut_users')

    collection.listRule   = '@request.auth.roles.slug ?= "admin"'
    collection.viewRule   = 'id = @request.auth.id || @request.auth.roles.slug ?= "admin"'
    collection.createRule = '@request.auth.roles.slug ?= "admin"'
    collection.updateRule = 'id = @request.auth.id || @request.auth.roles.slug ?= "admin"'
    collection.deleteRule = '@request.auth.roles.slug ?= "admin"'

    app.save(collection)
  },
)
