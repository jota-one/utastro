/// <reference path="../pb_data/types.d.ts" />

// Mirrors the legacy Nuxt API guards:
// - participants cannot subscribe to a session that already started
// - coaches cannot subscribe to a terminated session, unless they are admin
onRecordCreateRequest(e => {
  const eventId = e.record.getString('event')
  const event = e.app.findRecordById('ut_events', eventId)
  const now = new Date()
  const asStaff = e.record.getBool('is_event_admin')

  const parseDate = value => new Date(value.replace(' ', 'T'))

  if (asStaff) {
    const endDate = parseDate(event.getString('end_date'))
    const role = e.auth ? e.auth.getString('role') : ''
    const isAdmin = role === 'admin' || role === 'superadmin'
    if (endDate < now && !isAdmin) {
      throw new BadRequestError('Event is terminated')
    }
  } else {
    const startDate = parseDate(event.getString('start_date'))
    if (startDate < now) {
      throw new BadRequestError('Subscriptions closed')
    }
  }

  e.next()
}, 'ut_subscriptions')

// Keep the denormalized counters on ut_events in sync with the actual
// subscription records (the legacy Nuxt API computed them per request).
onRecordAfterCreateSuccess(e => {
  const eventId = e.record.getString('event')
  const event = e.app.findRecordById('ut_events', eventId)
  event.set(
    'subscription_count',
    e.app.countRecords(
      'ut_subscriptions',
      $dbx.hashExp({ event: eventId, is_event_admin: false }),
    ),
  )
  event.set(
    'staff_count',
    e.app.countRecords(
      'ut_subscriptions',
      $dbx.hashExp({ event: eventId, is_event_admin: true }),
    ),
  )
  e.app.save(event)
  e.next()
}, 'ut_subscriptions')

onRecordAfterDeleteSuccess(e => {
  const eventId = e.record.getString('event')
  const event = e.app.findRecordById('ut_events', eventId)
  event.set(
    'subscription_count',
    e.app.countRecords(
      'ut_subscriptions',
      $dbx.hashExp({ event: eventId, is_event_admin: false }),
    ),
  )
  event.set(
    'staff_count',
    e.app.countRecords(
      'ut_subscriptions',
      $dbx.hashExp({ event: eventId, is_event_admin: true }),
    ),
  )
  e.app.save(event)
  e.next()
}, 'ut_subscriptions')
