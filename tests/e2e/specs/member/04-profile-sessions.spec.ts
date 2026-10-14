import {
  test,
  expect,
  fetchAdminAuth,
  findOpenEvent,
  findPastEvent,
  PB_URL,
  type Auth,
} from '../../fixtures/index'
import { ProfilePage } from '../../pages/ProfilePage'

/**
 * Profile page ("Mon compte" → "Mes sessions"): unsubscribe flow, past-session
 * filtering and subscription guards. Runs as a throwaway plain member
 * (`member` / `memberPage`), deleted afterwards with its subscriptions;
 * sessions are discovered through the admin account (TEST_MEMBER).
 */

async function apiSubscribe(
  auth: Auth,
  userId: string,
  eventId: string,
  asStaff = false,
): Promise<Response> {
  return fetch(`${PB_URL}/api/collections/ut_subscriptions/records`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.token}`,
    },
    body: JSON.stringify({
      user: userId,
      event: eventId,
      is_event_admin: asStaff,
    }),
  })
}

async function subscriptionsOf(auth: Auth) {
  const res = await fetch(
    `${PB_URL}/api/collections/ut_subscriptions/records`,
    {
      headers: { Authorization: `Bearer ${auth.token}` },
    },
  )
  return ((await res.json()) as { items: { event: string }[] }).items
}

/** The dd/mm/yyyy date of a session, as the profile list shows it. */
async function listedDate(admin: Auth, eventId: string) {
  const { start_date } = (await fetch(
    `${PB_URL}/api/collections/ut_events/records/${eventId}?fields=start_date`,
    { headers: { Authorization: `Bearer ${admin.token}` } },
  ).then(r => r.json())) as { start_date: string }
  return `${start_date.slice(8, 10)}/${start_date.slice(5, 7)}/${start_date.slice(0, 4)}`
}

let admin: Auth

test.beforeEach(async () => {
  test.skip(!process.env.TEST_MEMBER_EMAIL, 'TEST_MEMBER_EMAIL not set')
  admin = await fetchAdminAuth()
})

test('member can unsubscribe from the profile sessions list', async ({
  member,
  memberPage,
}) => {
  const openEventId = await findOpenEvent(admin)
  test.skip(!openEventId, 'no event with an open subscription window')

  const res = await apiSubscribe(member, String(member.record.id), openEventId!)
  expect(res.ok).toBe(true)

  const profile = new ProfilePage(memberPage)
  await profile.gotoSessions()
  await expect(profile.sessionItems()).toHaveCount(1, { timeout: 8_000 })

  await profile.confirmUnsubscribe()

  await expect(profile.sessionItems()).toHaveCount(0, { timeout: 8_000 })
  expect(await subscriptionsOf(member)).toEqual([])
})

test('past sessions are not listed in the profile', async ({
  member,
  memberPage,
}) => {
  const openEventId = await findOpenEvent(admin)
  const pastEventId = await findPastEvent(admin)
  test.skip(
    !openEventId || !pastEventId,
    'needs an open and a terminated session',
  )
  const memberId = String(member.record.id)

  // An upcoming session, and a terminated one — only an admin may subscribe
  // someone to a terminated session (here as coach)
  expect((await apiSubscribe(member, memberId, openEventId!)).ok).toBe(true)
  expect((await apiSubscribe(admin, memberId, pastEventId!, true)).ok).toBe(
    true,
  )
  expect(await subscriptionsOf(member)).toHaveLength(2)

  const profile = new ProfilePage(memberPage)
  await profile.gotoSessions()

  await expect(
    memberPage.locator('.session-list-item', {
      hasText: await listedDate(admin, openEventId!),
    }),
  ).toHaveCount(1, { timeout: 8_000 })
  await expect(
    memberPage.locator('.session-list-item', {
      hasText: await listedDate(admin, pastEventId!),
    }),
  ).toHaveCount(0)
})

test('subscribing to a past event as participant is refused', async ({
  member,
}) => {
  const pastEventId = await findPastEvent(admin)
  test.skip(!pastEventId, 'no terminated event found')

  const res = await apiSubscribe(member, String(member.record.id), pastEventId!)
  expect(res.status).toBe(400)
  expect(await subscriptionsOf(member)).toEqual([])
})
