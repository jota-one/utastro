import {
  test,
  expect,
  fetchAuthToken,
  findOpenEvent,
  findPastEvent,
  PB_URL,
  type Auth,
} from '../../fixtures/index'
import { ProfilePage } from '../../pages/ProfilePage'

/**
 * Profile page ("Mon compte" → "Mes sessions"): unsubscribe flow, past-session
 * filtering and subscription guards.
 * Requires TEST_MEMBER_EMAIL and TEST_MEMBER_PASSWORD. Events are discovered
 * dynamically so the spec does not depend on aging TEST_EVENT_ID_* fixtures.
 */

async function apiSubscribe(
  auth: Auth,
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
      user: auth.record.id,
      event: eventId,
      is_event_admin: asStaff,
    }),
  })
}

async function apiUnsubscribe(auth: Auth, subscriptionId: string) {
  await fetch(
    `${PB_URL}/api/collections/ut_subscriptions/records/${subscriptionId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.token}` },
    },
  )
}

let auth: Auth

test.beforeEach(async () => {
  test.skip(!process.env.TEST_MEMBER_EMAIL, 'TEST_MEMBER_EMAIL not set')
  auth = await fetchAuthToken(
    process.env.TEST_MEMBER_EMAIL!,
    process.env.TEST_MEMBER_PASSWORD!,
  )
})

test('member can unsubscribe from the profile sessions list', async ({
  memberPage,
}) => {
  const openEventId = await findOpenEvent(auth)
  test.skip(!openEventId, 'no event with an open subscription window')

  const res = await apiSubscribe(auth, openEventId!)
  expect(res.ok).toBe(true)
  const { id: subscriptionId } = (await res.json()) as { id: string }

  const profile = new ProfilePage(memberPage)
  await profile.gotoSessions()

  try {
    await expect(profile.unsubscribeButton()).toBeVisible({ timeout: 8_000 })
    const before = await profile.sessionItems().count()

    await profile.confirmUnsubscribe()

    await expect(async () => {
      expect(await profile.sessionItems().count()).toBeLessThan(before)
    }).toPass({ timeout: 8_000 })
  } finally {
    // Cleanup in case the unsubscribe failed
    await apiUnsubscribe(auth, subscriptionId)
  }
})

test('past sessions are not listed in the profile', async ({ memberPage }) => {
  const pastEventId = await findPastEvent(auth)
  test.skip(!pastEventId, 'no terminated event found')

  // Only admins may subscribe as coach to a terminated event; skip otherwise
  const res = await apiSubscribe(auth, pastEventId!, true)
  test.skip(!res.ok, 'test member may not subscribe to past events')
  const { id: subscriptionId } = (await res.json()) as { id: string }

  try {
    const profile = new ProfilePage(memberPage)
    await profile.gotoSessions()

    // The past session must not appear even though the subscription exists
    const eventDetail = await fetch(
      `${PB_URL}/api/collections/ut_events/records/${pastEventId}`,
      { headers: { Authorization: `Bearer ${auth.token}` } },
    ).then(r => r.json() as Promise<{ start_date: string }>)
    const day = eventDetail.start_date.slice(8, 10)
    const month = eventDetail.start_date.slice(5, 7)
    const year = eventDetail.start_date.slice(0, 4)

    await expect(
      memberPage.locator('.session-list-item', {
        hasText: `${day}/${month}/${year}`,
      }),
    ).toHaveCount(0)
  } finally {
    await apiUnsubscribe(auth, subscriptionId)
  }
})

test('subscribing to a past event as participant is refused', async () => {
  const pastEventId = await findPastEvent(auth)
  test.skip(!pastEventId, 'no terminated event found')

  const res = await apiSubscribe(auth, pastEventId!, false)
  expect(res.status).toBe(400)
})
