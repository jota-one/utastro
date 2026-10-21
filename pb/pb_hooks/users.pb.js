/// <reference path="../pb_data/types.d.ts" />

// Keep emailVisibility=true on every ut_users record, whatever the creation
// path (admin dialog, site registration): PocketBase only matches
// non-superuser filters on `email` against visible emails, and the admin
// users search relies on it. Exposure stays limited by the collection view
// rule (own record or admin).
onRecordCreateRequest(e => {
  e.record.set('emailVisibility', true)
  // Stored trimmed and in lower case, whatever the creation path: PocketBase
  // compares emails case-sensitively, the legacy site did not (MariaDB)
  e.record.set('email', e.record.getString('email').trim().toLowerCase())
  e.next()
}, 'ut_users')

onRecordUpdateRequest(e => {
  e.record.set('email', e.record.getString('email').trim().toLowerCase())
  e.next()
}, 'ut_users')
