import { test, expect, type Page } from '@playwright/test'
import { LoginForm } from '../../pages/LoginForm'

/**
 * Read-only smoke test of a deployed site: run it on next before the DNS
 * switch, then on www right after.
 *   BASE_URL=https://next.urban-training.ch ./tests/e2e/run.sh specs/smoke
 * It never logs in, submits a form or writes anything, so it is safe on
 * production. It expects real data: a site without cities or upcoming
 * sessions fails.
 */

const baseUrl = process.env.BASE_URL || 'http://localhost:4321'
const isLocal = /\/\/(localhost|127\.0\.0\.1)/.test(baseUrl)
// Deployed sites serve PocketBase under /api on the same domain
const apiUrl = isLocal ? process.env.PB_URL || 'http://localhost:8091' : baseUrl

const PAGES: Record<'fr' | 'de' | 'en', string[]> = {
  fr: [
    '',
    '/contact',
    '/inscription',
    '/inscription/formulaire',
    '/formulaire-coach',
    '/mon-compte',
  ],
  de: [
    '',
    '/kontakt',
    '/anmeldung',
    '/anmeldung/formular',
    '/formular-coach',
    '/mein-konto',
  ],
  en: [
    '',
    '/contact',
    '/subscription',
    '/subscription/form',
    '/form-coach',
    '/my-account',
  ],
}
const CITY_PARENT = { fr: 'inscription', de: 'anmeldung', en: 'subscription' }

// third-party noise that says nothing about the site itself
const IGNORED_CONSOLE = [/favicon/i, /plausible/i, /analytics/i]

/** Collects console errors and failed same-origin requests while a page loads. */
function watchPage(page: Page) {
  const problems: string[] = []
  page.on('console', msg => {
    // errors raised inside third-party frames (e.g. the Facebook widget)
    const source = msg.location().url
    if (source && !source.startsWith(baseUrl)) {
      return
    }
    if (
      msg.type() === 'error' &&
      !IGNORED_CONSOLE.some(pattern => pattern.test(msg.text()))
    ) {
      problems.push(`console: ${msg.text()}`)
    }
  })
  page.on('response', res => {
    if (res.status() >= 400 && res.url().startsWith(baseUrl)) {
      problems.push(`${res.status()} ${res.url()}`)
    }
  })
  return problems
}

async function apiList(path: string, params: Record<string, string>) {
  const res = await fetch(
    `${apiUrl}/api/collections/${path}/records?${new URLSearchParams(params)}`,
  )
  expect(res.ok, `${path} API`).toBe(true)
  return ((await res.json()) as { items: Record<string, string>[] }).items
}

test('the API answers', async ({ request }) => {
  const res = await request.get(`${apiUrl}/api/health`)
  expect(res.status()).toBe(200)
})

test('the root redirects to the French home page', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/fr\/?$/)
})

for (const [lang, paths] of Object.entries(PAGES)) {
  for (const path of paths) {
    test(`/${lang}${path} loads cleanly`, async ({ page }) => {
      const problems = watchPage(page)
      const res = await page.goto(`/${lang}${path}`)
      expect(res?.status()).toBe(200)
      await page.waitForLoadState('networkidle')
      await expect(page.locator('header').first()).toBeVisible()
      expect(problems).toEqual([])
    })
  }
}

test('a city page lists its sessions', async ({ page }) => {
  const [city] = await apiList('ut_cities', {
    filter: 'enabled = true',
    fields: 'slug',
    perPage: '1',
  })
  expect(city, 'at least one enabled city').toBeTruthy()

  for (const lang of ['fr', 'de', 'en'] as const) {
    const problems = watchPage(page)
    const res = await page.goto(`/${lang}/${CITY_PARENT[lang]}/${city.slug}`)
    expect(res?.status()).toBe(200)
    await page.waitForLoadState('networkidle')
    expect(problems).toEqual([])
  }
})

test('an upcoming session page shows the session', async ({ page }) => {
  const now = new Date()
    .toLocaleString('sv-SE', { timeZone: 'Europe/Zurich' })
    .slice(0, 19)
  const [event] = await apiList('ut_events', {
    filter: `start_date > "${now}" && progress = "open"`,
    sort: 'start_date',
    fields: 'id',
    perPage: '1',
  })
  expect(event, 'at least one upcoming session').toBeTruthy()

  const problems = watchPage(page)
  const res = await page.goto(`/fr/session/${event.id}`)
  expect(res?.status()).toBe(200)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.session-detail h1')).not.toBeEmpty()
  expect(problems).toEqual([])
})

test('pages call their own API, not another site', async ({ page }) => {
  // in development PocketBase runs on its own port, by design
  test.skip(isLocal, 'only meaningful on a deployed site')
  const apiCalls: string[] = []
  page.on('request', req => {
    if (req.url().includes('/api/collections/')) {
      apiCalls.push(req.url())
    }
  })
  await page.goto('/fr')
  await page.waitForLoadState('networkidle')
  await page.goto('/fr/inscription')
  await page.waitForLoadState('networkidle')

  expect(apiCalls.length, 'the pages load data from the API').toBeGreaterThan(0)
  for (const url of apiCalls) {
    expect(new URL(url).origin).toBe(new URL(apiUrl).origin)
  }
})

test('the login modal opens', async ({ page }) => {
  await page.goto('/fr')
  const login = new LoginForm(page)
  await login.open()
  await expect(login.form().getByLabel('Identifiant')).toBeVisible()
  await expect(login.form().getByLabel('Mot de passe')).toBeVisible()
})

test('activation and password reset pages answer without a token', async ({
  page,
}) => {
  // an expired or already used link
  await page.goto('/fr/inscription/activation?token=expired')
  await expect(
    page.getByText('Le délai d’activation du compte a expiré'),
  ).toBeVisible()
  await page.goto('/fr/profil/reinitialisation')
  await expect(
    page.getByText('Le délai d’activation du compte a expiré'),
  ).toBeVisible()
})
