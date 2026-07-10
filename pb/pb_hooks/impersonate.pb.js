/// <reference path="../pb_data/types.d.ts" />

// Lets an admin obtain an auth token for any user ("se connecter en tant
// que"). The token is built directly instead of going through
// $apis.recordAuthResponse so no auth event fires — otherwise the
// impersonated user would receive a "Login from a new location" alert email.
routerAdd(
  'POST',
  '/api/custom/users/{id}/impersonate',
  e => {
    const role = e.auth ? e.auth.getString('role') : ''
    if (!['admin', 'superadmin'].includes(role)) {
      throw new ForbiddenError('Admins only')
    }

    const user = $app.findRecordById('ut_users', e.request.pathValue('id'))
    user.ignoreEmailVisibility(true)

    return e.json(200, { token: user.newAuthToken(), record: user })
  },
  $apis.requireAuth(),
)
