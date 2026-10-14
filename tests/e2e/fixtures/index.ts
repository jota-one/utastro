import {
  test as base,
  expect,
  type Page,
  type BrowserContext,
} from '@playwright/test'

export const PB_URL = process.env.PB_URL || 'http://localhost:8091'
const MAILPIT_URL = process.env.MAILPIT_URL || 'http://localhost:8025'

// ─── Auth helpers ────────────────────────────────────────────────────────────

export async function fetchAuthToken(email: string, password: string) {
  const res = await fetch(`${PB_URL}/api/custom/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(`Auth failed for ${email}: ${res.status}`)
  return res.json() as Promise<{
    token: string
    record: Record<string, unknown>
  }>
}

/**
 * Injects PocketBase + VueUse sessionStorage auth into the page BEFORE it loads.
 * Must be called before page.goto().
 */
export async function injectAuth(page: Page, email: string, password: string) {
  const { token, record } = await fetchAuthToken(email, password)
  await page.addInitScript(
    ({ token, record }) => {
      window.localStorage.setItem(
        'pocketbase_auth',
        JSON.stringify({ token, record }),
      )
      window.sessionStorage.setItem('ut_jwt', token)
    },
    { token, record },
  )
}

/**
 * Creates a new browser context with auth pre-injected.
 * Useful for concurrent tests with multiple simultaneous users.
 */
export async function createAuthContext(
  browser: import('@playwright/test').Browser,
  email: string,
  password: string,
): Promise<{ context: BrowserContext; page: Page }> {
  const { token, record } = await fetchAuthToken(email, password)
  const context = await browser.newContext()
  await context.addInitScript(
    ({ token, record }) => {
      window.localStorage.setItem(
        'pocketbase_auth',
        JSON.stringify({ token, record }),
      )
      window.sessionStorage.setItem('ut_jwt', token)
    },
    { token, record },
  )
  const page = await context.newPage()
  return { context, page }
}

// ─── Mailpit helpers ──────────────────────────────────────────────────────────

export interface MailpitMessage {
  ID: string
  Subject: string
  To: { Address: string }[]
  HTML: string
  Text: string
}

/**
 * Polls Mailpit until an email arrives for the given address (max ~10s).
 * Returns the latest message or throws if none found.
 */
export async function waitForEmail(
  toAddress: string,
  timeoutMs = 10_000,
): Promise<MailpitMessage> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const res = await fetch(`${MAILPIT_URL}/api/v1/messages?limit=10`)
    const data = await res.json()
    const match = (data.messages ?? []).find((m: MailpitMessage) =>
      m.To.some(t => t.Address.toLowerCase() === toAddress.toLowerCase()),
    )
    if (match) {
      // Fetch full message body
      const full = await fetch(`${MAILPIT_URL}/api/v1/message/${match.ID}`)
      return full.json()
    }
    await new Promise(r => setTimeout(r, 500))
  }
  throw new Error(`No email found for ${toAddress} in ${timeoutMs}ms`)
}

/** Deletes all messages in Mailpit — call in beforeEach to start clean. */
export async function clearMailpit() {
  await fetch(`${MAILPIT_URL}/api/v1/messages`, { method: 'DELETE' })
}

/** Extracts the first action URL from an email body (HTML or text). */
export function extractLinkFromEmail(message: MailpitMessage): string {
  const source = message.HTML || message.Text
  const matches = source.match(/https?:\/\/[^\s"<>]+/g) ?? []
  // Prefer the action link carrying a token; skip boilerplate URLs such as
  // the xhtml DOCTYPE or embedded images
  const link =
    matches.find(url => url.includes('token=')) ??
    matches.find(url => !url.includes('www.w3.org'))
  if (!link) throw new Error('No link found in email body')
  return link
}

// ─── Event discovery helpers ─────────────────────────────────────────────────
// Discover events dynamically instead of relying on aging TEST_EVENT_ID_*
// fixtures.

export type Auth = { token: string; record: Record<string, unknown> }

async function findEvent(auth: Auth, filter: string): Promise<string | null> {
  const params = new URLSearchParams({
    filter,
    fields: 'id',
    perPage: '1',
    skipTotal: '1',
  })
  const res = await fetch(
    `${PB_URL}/api/collections/ut_events/records?${params}`,
    { headers: { Authorization: `Bearer ${auth.token}` } },
  )
  const data = (await res.json()) as { items: { id: string }[] }
  return data.items[0]?.id ?? null
}

// Event dates are stored as naive Swiss local time (text fields, no zone),
// so compare them against the local wall-clock time, not UTC
const pbDate = (date: Date) =>
  date.toLocaleString('sv-SE', { timeZone: 'Europe/Zurich' }).slice(0, 19)

/** An event whose subscription window is open right now. */
export async function findOpenEvent(auth: Auth) {
  const now = pbDate(new Date())
  return findEvent(
    auth,
    `start_date > "${now}" && subscription_publish_date < "${now}" && progress = "open"`,
  )
}

/** An event terminated for more than the one-week staff grace window. */
export async function findPastEvent(auth: Auth) {
  const horizon = new Date()
  horizon.setDate(horizon.getDate() - 8)
  return findEvent(
    auth,
    `end_date != "" && end_date < "${pbDate(horizon)}" && start_date > "2020-01-01 00:00:00"`,
  )
}

/** An upcoming event whose subscription window has not opened yet. */
export async function findUnopenedEvent(auth: Auth) {
  const now = pbDate(new Date())
  return findEvent(
    auth,
    `start_date > "${now}" && subscription_publish_date > "${now}" && progress = "open"`,
  )
}

/**
 * Creates an upcoming session open for subscriptions, with `filled` of its
 * `capacity` spots taken by throwaway participants (requires an admin). The
 * session reuses the location, city and types of an existing open session so
 * its page renders like a real one. Always await `cleanup()` afterwards: it
 * deletes the participants (their subscriptions cascade) and then the
 * session — delete any other subscriber first.
 */
export async function createTestEvent(
  admin: Auth,
  { capacity, filled }: { capacity: number; filled: number },
): Promise<{ id: string; cleanup: () => Promise<void> }> {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${admin.token}`,
  }
  const templateId = await findOpenEvent(admin)
  if (!templateId) {
    throw new Error('No open session to copy location, city and types from')
  }
  const template = (await fetch(
    `${PB_URL}/api/collections/ut_events/records/${templateId}?fields=location,city,types`,
    { headers },
  ).then(r => r.json())) as { location: string; city: string; types: string[] }

  const start = new Date()
  start.setDate(start.getDate() + 3)
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  const publish = new Date()
  publish.setDate(publish.getDate() - 1)

  const created = await fetch(`${PB_URL}/api/collections/ut_events/records`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...template,
      start_date: pbDate(start),
      end_date: pbDate(end),
      subscription_publish_date: pbDate(publish),
      max_subscriptions: capacity,
      progress: 'open',
      attendees: 'todo',
      title_fr: 'E2E session',
      title_de: 'E2E session',
      title_en: 'E2E session',
    }),
  })
  if (!created.ok) {
    throw new Error(
      `Session creation failed: ${created.status} ${await created.text()}`,
    )
  }
  const { id } = (await created.json()) as { id: string }

  const participantEmails = Array.from({ length: filled }, (_, i) =>
    uniqueEmail(`filler-${i}`),
  )
  const cleanup = async () => {
    for (const email of participantEmails) {
      await deleteUserByEmail(admin, email)
    }
    await fetch(`${PB_URL}/api/collections/ut_events/records/${id}`, {
      method: 'DELETE',
      headers,
    })
  }

  try {
    for (const email of participantEmails) {
      const userId = await createUser(admin, { email, verified: true })
      const res = await fetch(
        `${PB_URL}/api/collections/ut_subscriptions/records`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            user: userId,
            event: id,
            is_event_admin: false,
          }),
        },
      )
      if (!res.ok) {
        throw new Error(
          `Subscription failed: ${res.status} ${await res.text()}`,
        )
      }
    }
  } catch (err) {
    await cleanup()
    throw err
  }
  return { id, cleanup }
}

/** Signs in TEST_MEMBER, which must be an admin or superadmin account. */
export function fetchAdminAuth(): Promise<Auth> {
  return fetchAuthToken(
    process.env.TEST_MEMBER_EMAIL!,
    process.env.TEST_MEMBER_PASSWORD!,
  )
}

/** A unique throwaway address, so a test never collides with a real user. */
export function uniqueEmail(tag: string) {
  const suffix = Math.random().toString(36).slice(2, 6)
  return `e2e+${tag}-${Date.now()}${suffix}@example.com`
}

/**
 * Creates a user through the admin API (bypasses the sign-up form and its
 * verification email). Any ut_users field can be set through `fields`.
 */
export async function createUser(
  admin: Auth,
  fields: Record<string, unknown>,
): Promise<string> {
  const password = (fields.password as string) ?? `Unused-${Date.now()}!`
  const res = await fetch(`${PB_URL}/api/collections/ut_users/records`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${admin.token}`,
    },
    body: JSON.stringify({
      emailVisibility: true,
      role: 'user',
      name: 'E2E User',
      ...fields,
      password,
      passwordConfirm: password,
    }),
  })
  if (!res.ok) {
    throw new Error(`User creation failed: ${res.status} ${await res.text()}`)
  }
  return ((await res.json()) as { id: string }).id
}

/** Deletes the user with this email, if it exists. */
export async function deleteUserByEmail(admin: Auth, email: string) {
  const params = new URLSearchParams({
    filter: `email = "${email}"`,
    fields: 'id',
  })
  const users = (await fetch(
    `${PB_URL}/api/collections/ut_users/records?${params}`,
    { headers: { Authorization: `Bearer ${admin.token}` } },
  ).then(r => r.json())) as { items: { id: string }[] }
  for (const user of users.items) {
    await fetch(`${PB_URL}/api/collections/ut_users/records/${user.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${admin.token}` },
    })
  }
}

/** Reads a user record through the admin API. */
export async function readUserByEmail(admin: Auth, email: string) {
  const params = new URLSearchParams({ filter: `email = "${email}"` })
  const users = (await fetch(
    `${PB_URL}/api/collections/ut_users/records?${params}`,
    { headers: { Authorization: `Bearer ${admin.token}` } },
  ).then(r => r.json())) as { items: Record<string, unknown>[] }
  return users.items[0] ?? null
}

/** Returns the HTTP status of a login attempt through the custom endpoint. */
export async function loginStatus(email: string, password: string) {
  const res = await fetch(`${PB_URL}/api/custom/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return res.status
}

// ─── Custom fixtures ──────────────────────────────────────────────────────────

export type Member = Auth & { email: string; password: string }

type Fixtures = {
  member: Member
  memberPage: Page
  adminPage: Page
}

export const test = base.extend<Fixtures>({
  // A throwaway plain member (role user) for the test, deleted afterwards
  // along with its subscriptions and watched cities
  // eslint-disable-next-line no-empty-pattern
  member: async ({}, use) => {
    const admin = await fetchAdminAuth()
    const email = uniqueEmail('member')
    const password = 'TestPassword123!'
    await createUser(admin, {
      email,
      password,
      verified: true,
      name: 'E2E Member',
    })
    const auth = await fetchAuthToken(email, password)
    await use({ ...auth, email, password })
    await deleteUserByEmail(admin, email)
  },
  // A page signed in as that member
  memberPage: async ({ page, member }, use) => {
    await injectAuth(page, member.email, member.password)
    await use(page)
  },
  // A page signed in as TEST_MEMBER, which must be an admin
  adminPage: async ({ page }, use) => {
    await injectAuth(
      page,
      process.env.TEST_MEMBER_EMAIL!,
      process.env.TEST_MEMBER_PASSWORD!,
    )
    await use(page)
  },
})

export { expect }
