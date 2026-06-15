import { test, expect } from '../../fixtures/index'
import { EventDetailPage } from '../../pages/EventDetailPage'

/**
 * Authenticated member: subscribe / unsubscribe flows and counter updates.
 * Requires TEST_MEMBER_EMAIL, TEST_MEMBER_PASSWORD, TEST_EVENT_ID_OPEN.
 */

test.beforeEach(async ({ memberPage }) => {
  test.skip(!process.env.TEST_EVENT_ID_OPEN, 'TEST_EVENT_ID_OPEN not set')
  test.skip(!process.env.TEST_MEMBER_EMAIL, 'TEST_MEMBER_EMAIL not set')
  // Navigate to homepage to establish event before going to detail
  await memberPage.goto('/fr')
})

test('member can subscribe to an open event', async ({ memberPage }) => {
  const event = new EventDetailPage(memberPage)
  await event.goto(process.env.TEST_EVENT_ID_OPEN!)

  await expect(event.subscribeButton()).toBeVisible()
  await event.subscribe()

  // Button must switch to unsubscribe
  await expect(event.unsubscribeButton()).toBeVisible({ timeout: 8_000 })
  expect(await event.isSubscribed()).toBe(true)

  // Cleanup: unsubscribe so we don't pollute the DB
  await event.confirmUnsubscribe()
  await expect(event.subscribeButton()).toBeVisible({ timeout: 8_000 })
})

test('header event counter increments after subscribing', async ({ memberPage }) => {
  const event = new EventDetailPage(memberPage)
  await event.goto(process.env.TEST_EVENT_ID_OPEN!)

  const before = await event.eventCounterText()

  await event.subscribe()
  await expect(event.unsubscribeButton()).toBeVisible({ timeout: 8_000 })

  const after = await event.eventCounterText()
  expect(Number(after)).toBeGreaterThan(Number(before))

  // Cleanup
  await event.confirmUnsubscribe()
})

test('header eventcounter decrements after unsubscribing', async ({ memberPage }) => {
  const event = new EventDetailPage(memberPage)
  await event.goto(process.env.TEST_EVENT_ID_OPEN!)

  // Subscribe first
  await event.subscribe()
  await expect(event.unsubscribeButton()).toBeVisible({ timeout: 8_000 })
  const subscribed = await event.eventCounterText()

  // Unsubscribe
  await event.confirmUnsubscribe()
  await expect(event.subscribeButton()).toBeVisible({ timeout: 8_000 })
  const unsubscribed = await event.eventCounterText()

  expect(Number(unsubscribed)).toBeLessThan(Number(subscribed))
})

test('unsubscribe modal shows confirmation dialog before removing', async ({ memberPage }) => {
  const event = new EventDetailPage(memberPage)
  await event.goto(process.env.TEST_EVENT_ID_OPEN!)

  await event.subscribe()
  await expect(event.unsubscribeButton()).toBeVisible({ timeout: 8_000 })

  // Click unsubscribe — modal must appear
  await event.unsubscribeButton().click()
  await expect(memberPage.getByText('Es-tu sûr de vouloir te désinscrire')).toBeVisible()

  // Cancel — should still be subscribed
  await memberPage.locator('button', { hasText: 'Annuler' }).click()
  await expect(event.unsubscribeButton()).toBeVisible()

  // Cleanup
  await event.confirmUnsubscribe()
})
