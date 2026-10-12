/// <reference path="../pb_data/types.d.ts" />

// Close two privilege escalations left open by the collection rules:
// - ut_users: a user could set their own `role` (e.g. to admin) on sign-up or
//   on their profile, and tamper with the legacy import fields
// - ut_subscriptions: any signed-in user could subscribe someone else, sign up
//   as coach without the coach role (staff only in legacy), or set presence
// Presence is written by the attendees hook routes, which bypass these rules.
migrate(
  app => {
    const ADMIN =
      '@request.auth.role = "admin" || @request.auth.role = "superadmin"'
    // A non-admin may send these fields only with their current value, so
    // the profile form can keep posting the whole record
    const unchanged = field =>
      `(@request.body.${field}:isset = false || @request.body.${field} = ${field})`
    const absent = field => `@request.body.${field}:isset = false`
    const LEGACY_FIELDS = ['legacy_id', 'legacy_password_sha1', 'soft_deleted']

    const users = app.findCollectionByNameOrId('ut_users')
    users.createRule = [
      ADMIN,
      [
        '(@request.body.role:isset = false || @request.body.role = "user")',
        ...LEGACY_FIELDS.map(absent),
      ].join(' && '),
    ]
      .map(rule => `(${rule})`)
      .join(' || ')
    users.updateRule = [
      ADMIN,
      [
        'id = @request.auth.id',
        unchanged('role'),
        ...LEGACY_FIELDS.map(unchanged),
      ].join(' && '),
    ]
      .map(rule => `(${rule})`)
      .join(' || ')
    app.save(users)

    const subscriptions = app.findCollectionByNameOrId('ut_subscriptions')
    subscriptions.createRule = [
      ADMIN,
      [
        '@request.auth.id != ""',
        '@request.body.user = @request.auth.id',
        '(@request.body.is_event_admin:isset = false || @request.body.is_event_admin = false || @request.auth.role = "coach")',
        absent('presence'),
        absent('presence_checked'),
      ].join(' && '),
    ]
      .map(rule => `(${rule})`)
      .join(' || ')
    subscriptions.updateRule = ADMIN
    app.save(subscriptions)
  },
  app => {
    const users = app.findCollectionByNameOrId('ut_users')
    users.createRule = ''
    users.updateRule =
      'id = @request.auth.id || @request.auth.role = "admin" || @request.auth.role = "superadmin"'
    app.save(users)

    const subscriptions = app.findCollectionByNameOrId('ut_subscriptions')
    subscriptions.createRule = '@request.auth.id != ""'
    subscriptions.updateRule = '@request.auth.id = user.id'
    app.save(subscriptions)
  },
)
