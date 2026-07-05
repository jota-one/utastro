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
