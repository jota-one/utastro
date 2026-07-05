import { test, expect } from '@playwright/test'
import { fetchAuthToken, findOpenEvent } from '../../fixtures/index'

/**
 * Verifies that all public static pages load without errors.
 * Does not require authentication or test data.
 */

const STATIC_PAGES = [
  { name: 'Homepage', path: '/fr' },
  { name: 'Contact', path: '/fr/contact' },
  { name: 'Sponsors', path: '/fr/sponsors' },
  { name: 'Inscription (city list)', path: '/fr/inscription' },
  { name: 'Subscription form', path: '/fr/inscription/formulaire' },
]

for (const { name, path } of STATIC_PAGES) {
  test(`${name} loads without error`, async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    const response = await page.goto(path)
    expect(response?.status(), `${name} returned non-2xx`).toBeLessThan(400)

    // No JS errors (ignore known third-party noise)
    const fatalErrors = consoleErrors.filter(
      e => !e.includes('favicon') && !e.includes('analytics'),
    )
    expect(fatalErrors, `Console errors on ${name}`).toHaveLength(0)
  })
}

test('Root / redirects to /fr', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/fr/)
})

test('Dynamic city page loads', async ({ page }) => {
  const citySlug = process.env.TEST_CITY_SLUG
  test.skip(!citySlug, 'TEST_CITY_SLUG not set')
  const response = await page.goto(`/fr/inscription/${citySlug}`)
  expect(response?.status()).toBeLessThan(400)
})

test('Dynamic event detail page loads', async ({ page }) => {
  test.skip(!process.env.TEST_MEMBER_EMAIL, 'TEST_MEMBER_EMAIL not set')
  const auth = await fetchAuthToken(
    process.env.TEST_MEMBER_EMAIL!,
    process.env.TEST_MEMBER_PASSWORD!,
  )
  const eventId = await findOpenEvent(auth)
  test.skip(!eventId, 'no event with an open subscription window')
  const response = await page.goto(`/fr/session/${eventId}`)
  expect(response?.status()).toBeLessThan(400)
  await page.waitForLoadState('networkidle')
  // Event title or date must appear (scoped: the Astro dev toolbar injects
  // its own h1 elements)
  await expect(page.locator('.session-detail h1')).not.toBeEmpty()
})
