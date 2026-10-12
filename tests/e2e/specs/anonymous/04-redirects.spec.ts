import { test, expect } from '@playwright/test'

/**
 * Former URLs redirected by Caddy (jota-one/infra, `caddy` key of the app in
 * apps.yaml): the old Nuxt redirects, the dropped sponsors page and the
 * session list page. Caddy only fronts the deployed sites, so this spec runs
 * against one of them, e.g.
 *   BASE_URL=https://never.urban-training.ch ./tests/e2e/run.sh specs/anonymous/04-redirects.spec.ts
 */

const REDIRECTS: [string, string][] = [
  // former Nuxt URLs
  ['/fr/home', '/fr'],
  ['/de/home', '/de'],
  ['/en/home', '/en'],
  ['/fr/entreprises', '/fr'],
  ['/de/entreprises', '/de'],
  ['/en/entreprises', '/en'],
  ['/de/inscription', '/de/anmeldung'],
  ['/en/inscription', '/en/subscription'],
  ['/fr/inscription/ville', '/fr/inscription'],
  ['/de/inscription/ville', '/de/anmeldung'],
  ['/en/inscription/ville', '/en/subscription'],
  ['/fr/advantages', '/fr'],
  ['/de/advantages', '/de'],
  ['/en/advantages', '/en'],
  ['/fr/photos', '/fr'],
  ['/de/photos', '/de'],
  ['/en/photos', '/en'],
  ['/de/contact', '/de/kontakt'],
  ['/fr/member', '/fr/mon-compte'],
  ['/de/member', '/de/mein-konto'],
  ['/en/member', '/en/my-account'],
  // dropped sponsors page
  ['/fr/sponsors', '/fr'],
  ['/de/sponsors', '/de'],
  ['/de/sponsoren', '/de'],
  ['/en/sponsors', '/en'],
  // session list, which has no page of its own
  ['/fr/session', '/fr/inscription'],
  ['/fr/session/', '/fr/inscription'],
  ['/de/session', '/de/anmeldung'],
  ['/de/session/', '/de/anmeldung'],
  ['/en/session', '/en/subscription'],
  ['/en/session/', '/en/subscription'],
]

const baseUrl = process.env.BASE_URL || 'http://localhost:4321'
const isLocal = /\/\/(localhost|127\.0\.0\.1)/.test(baseUrl)

test.describe('former URLs', () => {
  test.skip(
    isLocal,
    'redirects are served by Caddy, run against a deployed site',
  )

  for (const [from, to] of REDIRECTS) {
    test(`${from} → ${to}`, async ({ request }) => {
      const res = await request.get(from, { maxRedirects: 0 })
      expect(res.status()).toBe(301)
      expect(new URL(res.headers().location, baseUrl).pathname).toBe(to)

      const target = await request.get(to)
      expect(target.status()).toBe(200)
    })
  }

  test('a session page is not redirected', async ({ request }) => {
    const res = await request.get('/fr/session/unknown-id', { maxRedirects: 0 })
    expect(res.status()).not.toBe(301)
  })
})
