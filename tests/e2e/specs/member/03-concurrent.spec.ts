import { test, expect } from '@playwright/test'
import {
  createAuthContext,
  createTestEvent,
  createUser,
  deleteUserByEmail,
  fetchAdminAuth,
  uniqueEmail,
} from '../../fixtures/index'
import { EventDetailPage } from '../../pages/EventDetailPage'

/**
 * Race condition test: 3 members try to grab the last available spot simultaneously.
 * Only 1 should succeed; the other 2 must see the "full" message.
 *
 * Runs on a dedicated session with a single spot left and three throwaway
 * members, all deleted afterwards. Requires TEST_MEMBER to be an admin.
 */

const PASSWORD = 'TestPassword123!'

test('only one user gets the last available spot', async ({ browser }) => {
  test.skip(!process.env.TEST_MEMBER_EMAIL, 'TEST_MEMBER_EMAIL not set')

  const admin = await fetchAdminAuth()
  const racerEmails = [0, 1, 2].map(i => uniqueEmail(`racer-${i}`))
  const lastSpotEvent = await createTestEvent(admin, { capacity: 3, filled: 2 })
  const eventId = lastSpotEvent.id

  try {
    for (const email of racerEmails) {
      await createUser(admin, { email, password: PASSWORD, verified: true })
    }

    // Create 3 authenticated browser contexts
    const contexts = await Promise.all(
      racerEmails.map(email => createAuthContext(browser, email, PASSWORD)),
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
          new EventDetailPage(page).subscribeButton().click(),
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
  } finally {
    // the winner's subscription goes with its account
    for (const email of racerEmails) {
      await deleteUserByEmail(admin, email)
    }
    await lastSpotEvent.cleanup()
  }
})
