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

  // Tell apart an address waiting for its activation, so the sign-up form can
  // offer a new link. Accounts imported from the legacy app are not verified
  // either until their first login, but they carry the old password hash.
  let existing = null
  try {
    existing = $app.findAuthRecordByEmail(
      'ut_users',
      e.record.getString('email'),
    )
  } catch {
    // free address
  }
  if (
    existing &&
    !existing.getBool('verified') &&
    !existing.getString('legacy_password_sha1')
  ) {
    throw new BadRequestError('Failed to create record.', {
      email: new ValidationError(
        'account_not_activated',
        'This account is not activated yet.',
      ),
    })
  }

  e.next()
}, 'ut_users')

onRecordUpdateRequest(e => {
  e.record.set('email', e.record.getString('email').trim().toLowerCase())
  e.next()
}, 'ut_users')
