import {
  test,
  expect,
  ensureFullEvent,
  fetchAuthToken,
  findOpenEvent,
  findPastEvent,
  findUnopenedEvent,
  PB_URL,
  type Auth,
} from '../../fixtures/index'
import { EventDetailPage } from '../../pages/EventDetailPage'

/**
 * Edge cases: full events, past events, city watch.
 * All target events are discovered dynamically.
 */

let auth: Auth

test.beforeEach(async () => {
  test.skip(!process.env.TEST_MEMBER_EMAIL, 'TEST_MEMBER_EMAIL not set')
  auth = await fetchAuthToken(
    process.env.TEST_MEMBER_EMAIL!,
    process.env.TEST_MEMBER_PASSWORD!,
  )
})

test('cannot subscribe to a full event — full message is shown', async ({
  memberPage,
}) => {
  // Uses a genuinely full event, or temporarily lowers max_subscriptions on
  // the most subscribed upcoming one (restored right after)
  const fullEvent = await ensureFullEvent(auth)
  test.skip(!fullEvent, 'no candidate event found or user cannot update events')

  try {
    await memberPage.goto('/fr')

    const event = new EventDetailPage(memberPage)
    await event.goto(fullEvent!.id)

    await expect(event.fullMessage()).toBeVisible()
    await expect(event.subscribeButton()).not.toBeVisible()
  } finally {
    await fullEvent!.restore()
  }
})

test('subscribe button is not shown for a past event', async ({
  memberPage,
}) => {
  const pastEventId = await findPastEvent(auth)
  test.skip(!pastEventId, 'no terminated event found')
  await memberPage.goto('/fr')

  const event = new EventDetailPage(memberPage)
  await event.goto(pastEventId!)

  await expect(event.subscribeButton()).not.toBeVisible()
  await expect(event.unsubscribeButton()).not.toBeVisible()
})

test('member can watch a city for news', async ({ memberPage }) => {
  // The watch button only appears when the subscription window is not open yet
  const unopenedEventId = await findUnopenedEvent(auth)
  test.skip(!unopenedEventId, 'no upcoming event with a closed window found')
  await memberPage.goto('/fr')

  const event = new EventDetailPage(memberPage)
  await event.goto(unopenedEventId!)

  await expect(event.watchCityButton()).toBeVisible({ timeout: 8_000 })
  await event.watchCityButton().click()

  try {
    // Confirmation text appears
    await expect(
      memberPage.getByText('Tu es abonné à', { exact: false }),
    ).toBeVisible({ timeout: 5_000 })
  } finally {
    // Cleanup: remove the created watcher, otherwise the button is hidden
    // on the next run
    const { city } = (await fetch(
      `${PB_URL}/api/collections/ut_events/records/${unopenedEventId}?fields=city`,
      { headers: { Authorization: `Bearer ${auth.token}` } },
    ).then(r => r.json())) as { city: string }
    const params = new URLSearchParams({
      filter: `user = "${auth.record.id}" && city = "${city}"`,
      fields: 'id',
    })
    const watchers = (await fetch(
      `${PB_URL}/api/collections/ut_city_watchers/records?${params}`,
      { headers: { Authorization: `Bearer ${auth.token}` } },
    ).then(r => r.json())) as { items: { id: string }[] }
    for (const watcher of watchers.items) {
      await fetch(
        `${PB_URL}/api/collections/ut_city_watchers/records/${watcher.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${auth.token}` },
        },
      )
    }
  }
})

test('anonymous user sees login prompt when clicking subscribe', async ({
  page,
}) => {
  const openEventId = await findOpenEvent(auth)
  test.skip(!openEventId, 'no event with an open subscription window')

  const event = new EventDetailPage(page)
  await event.goto(openEventId!)

  await event.subscribe()

  // Login modal or login form should appear
  await expect(
    page.getByRole('heading', { name: 'Connexion' }),
  ).toBeVisible({ timeout: 5_000 })
})
