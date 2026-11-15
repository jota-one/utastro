/// <reference path="../pb_data/types.d.ts" />

// The default `users` collection is unused — accounts live in ut_users — yet it
// kept PocketBase's default rules: public sign-up and self-service updates.
// An account created there is a valid auth token for every rule that only
// checks `@request.auth.id != ""`. Lock it to superusers.

const BEFORE = {
  listRule: 'id = @request.auth.id',
  viewRule: 'id = @request.auth.id',
  createRule: '',
  updateRule: 'id = @request.auth.id',
  deleteRule: 'id = @request.auth.id',
}

migrate(
  app => {
    const users = app.findCollectionByNameOrId('users')
    users.listRule = null
    users.viewRule = null
    users.createRule = null
    users.updateRule = null
    users.deleteRule = null
    app.save(users)
  },
  app => {
    const users = app.findCollectionByNameOrId('users')
    Object.assign(users, BEFORE)
    app.save(users)
  },
)
