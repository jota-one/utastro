import { createHash } from 'node:crypto'
import { test, expect } from '@playwright/test'
import {
  createUser,
  deleteUserByEmail,
  extractLinkFromEmail,
  fetchAdminAuth,
  loginStatus,
  readUserByEmail,
  uniqueEmail,
  waitForEmail,
  type Auth,
} from '../../fixtures/index'
import { LoginForm } from '../../pages/LoginForm'

/**
 * Login through the header modal, logout, login errors, accounts imported
 * from the legacy app (SHA-1 password) and the password reset flow.
 * Every account is a throwaway one created through the admin API (TEST_MEMBER
 * must be an admin) and deleted afterwards. The reset flow needs Mailpit.
 */

const PASSWORD = 'TestPassword123!'
const MAILPIT_AVAILABLE = !!process.env.MAILPIT_URL

let admin: Auth
const createdEmails: string[] = []

test.beforeAll(async () => {
  test.skip(!process.env.TEST_MEMBER_EMAIL, 'TEST_MEMBER_EMAIL not set')
  admin = await fetchAdminAuth()
})

test.afterAll(async () => {
  for (const email of createdEmails) {
    await deleteUserByEmail(admin, email)
  }
})

async function newAccount(tag: string, fields: Record<string, unknown> = {}) {
  const email = uniqueEmail(tag)
  createdEmails.push(email)
  await createUser(admin, {
    email,
    verified: true,
    password: PASSWORD,
    ...fields,
  })
  return email
}

test.describe('login modal', () => {
  test('a member logs in, stays logged in after a reload, then logs out', async ({
    page,
  }) => {
    const email = await newAccount('login')
    const login = new LoginForm(page)

    await page.goto('/fr')
    await login.open()
    await login.login(email, PASSWORD)
    await expect(login.logoutButton()).toBeVisible({ timeout: 8_000 })

    await page.reload()
    await expect(login.logoutButton()).toBeVisible({ timeout: 8_000 })

    await login.logoutButton().click()
    await expect(login.loginButton()).toBeVisible({ timeout: 8_000 })
    await page.reload()
    await expect(login.loginButton()).toBeVisible({ timeout: 8_000 })
  })

  test('a wrong password shows an error and keeps the visitor logged out', async ({
    page,
  }) => {
    const email = await newAccount('wrong-password')
    const login = new LoginForm(page)

    await page.goto('/fr')
    await login.open()
    await login.login(email, 'NotThePassword1!')

    await expect(
      login.form().getByText('Login ou mot de passe incorrect'),
    ).toBeVisible()
    await expect(login.logoutButton()).not.toBeVisible()
  })

  test('an account not activated yet is told to activate it', async ({
    page,
  }) => {
    const email = await newAccount('pending', { verified: false })
    const login = new LoginForm(page)

    await page.goto('/fr')
    await login.open()
    await login.login(email, PASSWORD)

    await expect(
      login.form().getByText('Ce compte est en attente de validation'),
    ).toBeVisible()
    await expect(login.logoutButton()).not.toBeVisible()
  })
})

test.describe('accounts imported from the legacy app', () => {
  // The legacy app stored sha1(password) as hex, computed by Node's crypto
  const LEGACY_PASSWORDS = [
    { label: 'ASCII', password: 'Legacy-Password-42' },
    { label: 'accented', password: 'Pâquerette-été-2019' },
    { label: 'emoji', password: 'Clé🔑secrète' },
    { label: 'short', password: 'abc1' },
  ]

  for (const { label, password } of LEGACY_PASSWORDS) {
    test(`logs in with an old ${label} password, which is then migrated`, async ({
      page,
    }) => {
      const email = await newAccount(`legacy-${label}`, {
        verified: false,
        legacy_password_sha1: createHash('sha1').update(password).digest('hex'),
      })
      const login = new LoginForm(page)

      await page.goto('/fr')
      await login.open()
      await login.login(email, password)
      await expect(login.logoutButton()).toBeVisible({ timeout: 8_000 })

      // the legacy hash is replaced by a regular password on first login
      const user = await readUserByEmail(admin, email)
      expect(user?.legacy_password_sha1).toBe('')
      expect(user?.verified).toBe(true)
      expect(await loginStatus(email, password)).toBe(200)
      expect(await loginStatus(email, 'NotThePassword1!')).toBe(401)
    })
  }

  test('a wrong password is refused and keeps the legacy hash', async () => {
    const legacyHash = createHash('sha1')
      .update('Legacy-Password-42')
      .digest('hex')
    const email = await newAccount('legacy-wrong', {
      verified: false,
      legacy_password_sha1: legacyHash,
    })

    expect(await loginStatus(email, 'NotThePassword1!')).toBe(401)
    expect((await readUserByEmail(admin, email))?.legacy_password_sha1).toBe(
      legacyHash,
    )
  })
})

test.describe('password reset', () => {
  test.beforeEach(() => {
    test.skip(!MAILPIT_AVAILABLE, 'MAILPIT_URL not set')
  })

  test('a member resets a forgotten password from the login modal', async ({
    page,
  }) => {
    const email = await newAccount('reset')
    const newPassword = 'BrandNewPassword456!'
    const login = new LoginForm(page)

    await page.goto('/fr')
    await login.open()
    await login.requestPasswordReset(email)
    await expect(
      login.form().getByText('Nous t’avons envoyé un e-mail'),
    ).toBeVisible()

    const message = await waitForEmail(email)
    const link = extractLinkFromEmail(message)
    const baseUrl = process.env.BASE_URL || 'http://localhost:4321'
    expect(
      link.startsWith(`${baseUrl}/fr/profil/reinitialisation?token=`),
    ).toBe(true)

    await page.goto(link)
    await page
      .getByLabel('Nouveau mot de passe', { exact: true })
      .fill(newPassword)
    await page
      .getByLabel('Confirmation du nouveau mot de passe')
      .fill(newPassword)
    await page.locator('button', { hasText: 'Valider' }).click()
    await expect(
      page.getByText('Ton mot de passe a été mis à jour!'),
    ).toBeVisible()

    expect(await loginStatus(email, newPassword)).toBe(200)
    expect(await loginStatus(email, PASSWORD)).toBe(401)
  })

  test('a reset link can only be used once', async ({ page }) => {
    const email = await newAccount('reset-once')
    const res = await fetch(
      `${process.env.PB_URL || 'http://localhost:8091'}/api/collections/ut_users/request-password-reset`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      },
    )
    expect(res.ok).toBe(true)
    const link = extractLinkFromEmail(await waitForEmail(email))

    for (const [attempt, password] of [
      [1, 'FirstNewPassword1!'],
      [2, 'SecondNewPassword2!'],
    ] as const) {
      await page.goto(link)
      await page
        .getByLabel('Nouveau mot de passe', { exact: true })
        .fill(password)
      await page
        .getByLabel('Confirmation du nouveau mot de passe')
        .fill(password)
      await page.locator('button', { hasText: 'Valider' }).click()
      if (attempt === 1) {
        await expect(
          page.getByText('Ton mot de passe a été mis à jour!'),
        ).toBeVisible()
      } else {
        await expect(
          page.getByText('Ton mot de passe a été mis à jour!'),
        ).not.toBeVisible()
      }
    }

    expect(await loginStatus(email, 'FirstNewPassword1!')).toBe(200)
    expect(await loginStatus(email, 'SecondNewPassword2!')).toBe(401)
  })
})
