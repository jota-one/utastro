import { test, expect } from '@playwright/test'
import { RegistrationPage } from '../../pages/RegistrationPage'
import {
  clearMailpit,
  waitForEmail,
  extractLinkFromEmail,
} from '../../fixtures/index'

/**
 * New user registration flow:
 *   fill form → submit → success message → receive activation email → activate account
 *
 * Requires Mailpit running + PocketBase SMTP configured to localhost:1025.
 */

const MAILPIT_AVAILABLE = !!process.env.MAILPIT_URL

// Generate a unique email per run to avoid conflicts with prod data
const testEmail = `e2e+${Date.now()}@example.com`

test.beforeEach(async () => {
  if (MAILPIT_AVAILABLE) await clearMailpit()
})

test('registration form shows all required fields', async ({ page }) => {
  const reg = new RegistrationPage(page)
  await reg.goto()

  await expect(page.getByLabel('E-mail')).toBeVisible()
  await expect(page.getByLabel('Nom complet')).toBeVisible()
  await expect(page.getByLabel('NPA')).toBeVisible()
  await expect(page.getByLabel('Téléphone')).toBeVisible()
  await expect(page.getByLabel('Année de naissance')).toBeVisible()
  await expect(page.getByLabel('Genre')).toBeVisible()
  await expect(page.getByLabel('Canton')).toBeVisible()
})

test('submit button is disabled with empty form', async ({ page }) => {
  const reg = new RegistrationPage(page)
  await reg.goto()
  const submit = page.locator('button', { hasText: 'Envoyer mes informations' })
  await expect(submit).toBeDisabled()
})

test('full registration sends an activation email whose link works', async ({
  page,
}) => {
  test.skip(!MAILPIT_AVAILABLE, 'MAILPIT_URL not set — skipping email test')

  const reg = new RegistrationPage(page)
  await reg.goto()

  await reg.fill({
    email: testEmail,
    password: 'TestPassword123!',
    name: 'E2E Test User',
    zip: '1000',
    city: 'Lausanne',
    phone: '+41 79 000 00 00',
    birthYear: '1990',
    gender: 'Masculin',
    canton: 'VD',
  })

  await reg.submit()

  expect(await reg.isSuccessVisible()).toBe(true)
  // Success message must contain the submitted email address
  await expect(page.getByText(testEmail)).toBeVisible()

  // Activation email must arrive (same test: the beforeEach clears Mailpit,
  // so a separate test would never see this message)
  const email = await waitForEmail(testEmail)
  expect(email.Subject).toMatch(/activ/i)

  const activationLink = extractLinkFromEmail(email)
  await page.goto(activationLink)

  // After activation, user should land on the app (not an error page)
  const response = page.url()
  expect(response).not.toContain('error')
})

test('duplicate email shows an error', async ({ page }) => {
  const existingEmail = process.env.TEST_MEMBER_EMAIL
  test.skip(!existingEmail, 'TEST_MEMBER_EMAIL not set')

  const reg = new RegistrationPage(page)
  await reg.goto()

  await reg.fill({
    email: existingEmail!,
    password: 'TestPassword123!',
    name: 'Duplicate User',
    zip: '1000',
    city: 'Lausanne',
    phone: '+41 79 000 00 00',
    birthYear: '1985',
    gender: 'Féminin',
    canton: 'VD',
  })

  await reg.submit()

  // Should show an error, not the success message
  await expect(page.getByText('Ton compte a été créé!')).not.toBeVisible()
})
