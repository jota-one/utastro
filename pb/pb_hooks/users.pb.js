/// <reference path="../pb_data/types.d.ts" />

// Keep emailVisibility=true on every ut_users record, whatever the creation
// path (admin dialog, site registration): PocketBase only matches
// non-superuser filters on `email` against visible emails, and the admin
// users search relies on it. Exposure stays limited by the collection view
// rule (own record or admin).
onRecordCreateRequest(e => {
  e.record.set('emailVisibility', true)
  e.next()
}, 'ut_users')
