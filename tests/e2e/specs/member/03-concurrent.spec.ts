import { test, expect } from '@playwright/test'
import { createAuthContext } from '../../fixtures/index'
import { EventDetailPage } from '../../pages/EventDetailPage'

/**
 * Race condition test: 3 members try to grab the last available spot simultaneously.
 * Only 1 should succeed; the other 2 must see the "full" message.
 *
 * Setup required:
 *   - TEST_EVENT_ID_LAST_SPOT: a event with exactly 1 spot remaining
 *     (set subscription_count = max_subscriptions - 1 in PocketBase admin before running)
 *   - TEST_MEMBER_EMAIL / PASSWORD, TEST_MEMBER_2_EMAIL / PASSWORD, TEST_MEMBER_3_EMAIL / PASSWORD
 *     (3 distinct accounts, none already subscribed to this event)
 *
 * After a run: reset the event count in PocketBase admin for the next run.
 */

const USERS = [
  {
    email: process.env.TEST_MEMBER_EMAIL!,
    password: process.env.TEST_MEMBER_PASSWORD!,
  },
  {
    email: process.env.TEST_MEMBER_2_EMAIL!,
    password: process.env.TEST_MEMBER_2_PASSWORD!,
  },
  {
    email: process.env.TEST_MEMBER_3_EMAIL!,
    password: process.env.TEST_MEMBER_3_PASSWORD!,
  },
]

test('only one user gets the last available spot', async ({ browser }) => {
  const eventId = process.env.TEST_EVENT_ID_LAST_SPOT
  test.skip(!eventId, 'TEST_EVENT_ID_LAST_SPOT not set')
  test.skip(
    USERS.some(u => !u.email || !u.password),
    'All 3 member credentials must be set',
  )

  // Create 3 authenticated browser contexts
  const contexts = await Promise.all(
    USERS.map(u => createAuthContext(browser, u.email, u.password)),
  )

  try {
    // Navigate all 3 to the event page simultaneously
    await Promise.all(
      contexts.map(({ page }) =>
        page
          .goto(`/fr/session/${eventId}`)
          .then(() => page.waitForLoadState('networkidle')),
      ),
    )

    // Verify all 3 see the subscribe button (spot still available)
    for (const { page } of contexts) {
      const event = new EventDetailPage(page)
      await expect(event.subscribeButton()).toBeVisible({ timeout: 8_000 })
    }

    // All 3 click subscribe at the same time
    await Promise.all(
      contexts.map(({ page }) =>
        page.locator('button', { hasText: "Je m'inscris!" }).click(),
      ),
    )

    // Wait for all pages to settle
    await Promise.all(
      contexts.map(({ page }) => page.waitForLoadState('networkidle')),
    )

    // Count outcomes
    const results = await Promise.all(
      contexts.map(async ({ page }) => {
        const event = new EventDetailPage(page)
        const subscribed = await event.isSubscribed()
        const full = await event
          .fullMessage()
          .isVisible()
          .catch(() => false)
        return { subscribed, full }
      }),
    )

    const subscribedCount = results.filter(r => r.subscribed).length
    const fullCount = results.filter(r => r.full || !r.subscribed).length

    expect(subscribedCount).toBe(1)
    expect(fullCount).toBe(2)
  } finally {
    await Promise.all(contexts.map(({ context }) => context.close()))
  }
})
