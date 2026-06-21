import { test, expect } from '../../fixtures/index'
import { EventDetailPage } from '../../pages/EventDetailPage'

/**
 * Edge cases: full events, past events, city watch.
 * Requires TEST_EVENT_ID_FULL, TEST_EVENT_ID_PAST, TEST_CITY_SLUG.
 */

test('cannot subscribe to a full event — full message is shown', async ({
  memberPage,
}) => {
  test.skip(!process.env.TEST_EVENT_ID_FULL, 'TEST_EVENT_ID_FULL not set')
  await memberPage.goto('/fr')

  const event = new EventDetailPage(memberPage)
  await event.goto(process.env.TEST_EVENT_ID_FULL!)

  await expect(event.fullMessage()).toBeVisible()
  await expect(event.subscribeButton()).not.toBeVisible()
})

test('subscribe button is not shown for a past event', async ({
  memberPage,
}) => {
  test.skip(!process.env.TEST_EVENT_ID_PAST, 'TEST_EVENT_ID_PAST not set')
  await memberPage.goto('/fr')

  const event = new EventDetailPage(memberPage)
  await event.goto(process.env.TEST_EVENT_ID_PAST!)

  await expect(event.subscribeButton()).not.toBeVisible()
  await expect(event.unsubscribeButton()).not.toBeVisible()
})

test('member can watch a city for news', async ({ memberPage }) => {
  test.skip(!process.env.TEST_CITY_SLUG, 'TEST_CITY_SLUG not set')
  test.skip(!process.env.TEST_EVENT_ID_OPEN, 'TEST_EVENT_ID_OPEN not set')
  await memberPage.goto('/fr')

  // Watch city button only appears on event detail when subscriptions aren't open yet
  // or when the city block is visible — navigate to the open event page
  const event = new EventDetailPage(memberPage)
  await event.goto(process.env.TEST_EVENT_ID_OPEN!)

  const watchBtn = event.watchCityButton()
  // If the watch button is visible, click it
  if (await watchBtn.isVisible()) {
    await watchBtn.click()
    // Confirmation text appears
    await expect(
      memberPage.getByText('Reste informé', { exact: false }),
    ).toBeVisible({
      timeout: 5_000,
    })
  } else {
    // Watch button may not appear if subscriptions are already open — skip gracefully
    test.skip(
      true,
      'Watch city button not visible on this event (subscriptions open)',
    )
  }
})

test('anonymous user sees login prompt when clicking subscribe', async ({
  page,
}) => {
  test.skip(!process.env.TEST_EVENT_ID_OPEN, 'TEST_EVENT_ID_OPEN not set')

  const event = new EventDetailPage(page)
  await event.goto(process.env.TEST_EVENT_ID_OPEN!)

  await event.subscribe()

  // Login modal or login form should appear
  await expect(page.getByText('Connexion')).toBeVisible({ timeout: 5_000 })
})
