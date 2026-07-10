/// <reference path="../pb_data/types.d.ts" />

// Presence sheet endpoints, mirroring the legacy Nuxt API: any staff
// (coach) or admin can list the attendees of a session, set their
// presence and validate the sheet. The collection rules stay narrow
// (participants only see/update their own subscriptions), these routes
// carry the staff-level access instead.

routerAdd(
  'GET',
  '/api/custom/events/{id}/attendees',
  e => {
    const role = e.auth ? e.auth.getString('role') : ''
    if (!['coach', 'admin', 'superadmin'].includes(role)) {
      throw new ForbiddenError('Staff only')
    }

    const event = $app.findRecordById('ut_events', e.request.pathValue('id'))
    const subscriptions = $app.findRecordsByFilter(
      'ut_subscriptions',
      'event = {:event} && is_event_admin = false',
      'id',
      0,
      0,
      { event: event.id },
    )

    const list = subscriptions
      .map(subscription => {
        let name = ''
        try {
          name = $app
            .findRecordById('ut_users', subscription.getString('user'))
            .getString('name')
        } catch {
          // orphan subscription: keep an empty name
        }
        return {
          subscription_id: subscription.id,
          name,
          presence: subscription.getBool('presence_checked')
            ? subscription.getBool('presence')
            : null,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    return e.json(200, { status: event.getString('attendees'), list })
  },
  $apis.requireAuth(),
)

routerAdd(
  'PUT',
  '/api/custom/subscriptions/{id}/presence',
  e => {
    const role = e.auth ? e.auth.getString('role') : ''
    if (!['coach', 'admin', 'superadmin'].includes(role)) {
      throw new ForbiddenError('Staff only')
    }

    const body = e.requestInfo().body
    if (typeof body?.presence !== 'boolean') {
      throw new BadRequestError('presence must be a boolean')
    }

    const subscription = $app.findRecordById(
      'ut_subscriptions',
      e.request.pathValue('id'),
    )
    subscription.set('presence', body.presence)
    subscription.set('presence_checked', true)
    $app.save(subscription)

    return e.json(200, { ok: true })
  },
  $apis.requireAuth(),
)

routerAdd(
  'PUT',
  '/api/custom/events/{id}/attendees-checked',
  e => {
    const role = e.auth ? e.auth.getString('role') : ''
    if (!['coach', 'admin', 'superadmin'].includes(role)) {
      throw new ForbiddenError('Staff only')
    }

    const event = $app.findRecordById('ut_events', e.request.pathValue('id'))
    event.set('attendees', 'checked')
    $app.save(event)

    return e.json(200, { ok: true })
  },
  $apis.requireAuth(),
)
