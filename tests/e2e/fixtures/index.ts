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

const pbDate = (date: Date) => date.toISOString().replace('T', ' ').slice(0, 19)

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

/** An upcoming event with no participant spot left. */
export async function findFullEvent(auth: Auth) {
  const now = pbDate(new Date())
  return findEvent(
    auth,
    `start_date > "${now}" && subscription_publish_date < "${now}" && max_subscriptions > 0 && subscription_count >= max_subscriptions`,
  )
}

/**
 * Returns a full upcoming event, faking one if needed: when no event is
 * genuinely full, the most subscribed upcoming event gets its
 * max_subscriptions lowered to its current count (requires an admin test
 * user). Always await `restore()` afterwards.
 */
export async function ensureFullEvent(
  auth: Auth,
): Promise<{ id: string; restore: () => Promise<void> } | null> {
  const existing = await findFullEvent(auth)
  if (existing) {
    return { id: existing, restore: async () => {} }
  }

  const now = pbDate(new Date())
  const params = new URLSearchParams({
    filter: `start_date > "${now}" && subscription_publish_date < "${now}" && subscription_count > 0`,
    sort: '-subscription_count',
    fields: 'id,max_subscriptions,subscription_count',
    perPage: '1',
    skipTotal: '1',
  })
  const res = await fetch(
    `${PB_URL}/api/collections/ut_events/records?${params}`,
    { headers: { Authorization: `Bearer ${auth.token}` } },
  )
  const data = (await res.json()) as {
    items: { id: string; max_subscriptions: number; subscription_count: number }[]
  }
  const candidate = data.items[0]
  if (!candidate) {
    return null
  }

  const patch = async (maxSubscriptions: number) => {
    const patchRes = await fetch(
      `${PB_URL}/api/collections/ut_events/records/${candidate.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ max_subscriptions: maxSubscriptions }),
      },
    )
    return patchRes.ok
  }

  if (!(await patch(candidate.subscription_count))) {
    // non-admin test user cannot update events
    return null
  }
  return {
    id: candidate.id,
    restore: async () => {
      await patch(candidate.max_subscriptions)
    },
  }
}

/**
 * Returns an upcoming open event with exactly one participant spot left,
 * none of the given participants being subscribed to it: the event's
 * max_subscriptions is temporarily lowered to subscription_count + 1
 * (requires an admin test user). Always await `restore()` afterwards.
 */
export async function ensureLastSpotEvent(
  admin: Auth,
  participants: Auth[],
): Promise<{ id: string; restore: () => Promise<void> } | null> {
  const now = pbDate(new Date())
  const params = new URLSearchParams({
    filter: `start_date > "${now}" && subscription_publish_date < "${now}" && progress = "open" && max_subscriptions > subscription_count`,
    fields: 'id,max_subscriptions,subscription_count',
    perPage: '20',
    skipTotal: '1',
  })
  const res = await fetch(
    `${PB_URL}/api/collections/ut_events/records?${params}`,
    { headers: { Authorization: `Bearer ${admin.token}` } },
  )
  const data = (await res.json()) as {
    items: { id: string; max_subscriptions: number; subscription_count: number }[]
  }

  const userFilter = participants
    .map(p => `user = "${p.record.id}"`)
    .join(' || ')

  for (const candidate of data.items) {
    const subParams = new URLSearchParams({
      filter: `event = "${candidate.id}" && (${userFilter})`,
      fields: 'id',
      perPage: '1',
      skipTotal: '1',
    })
    const existing = (await fetch(
      `${PB_URL}/api/collections/ut_subscriptions/records?${subParams}`,
      { headers: { Authorization: `Bearer ${admin.token}` } },
    ).then(r => r.json())) as { items: unknown[] }
    if (existing.items.length > 0) {
      continue
    }

    const patch = async (maxSubscriptions: number) => {
      const patchRes = await fetch(
        `${PB_URL}/api/collections/ut_events/records/${candidate.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${admin.token}`,
          },
          body: JSON.stringify({ max_subscriptions: maxSubscriptions }),
        },
      )
      return patchRes.ok
    }

    if (!(await patch(candidate.subscription_count + 1))) {
      return null
    }
    return {
      id: candidate.id,
      restore: async () => {
        await patch(candidate.max_subscriptions)
      },
    }
  }
  return null
}

/**
 * Logs a test member in, creating and activating the account first when it
 * does not exist yet (full registration flow: create → verification email
 * via Mailpit → confirm). Requires Mailpit for the creation path.
 */
export async function ensureMemberAccount(
  email: string,
  password: string,
): Promise<Auth> {
  try {
    return await fetchAuthToken(email, password)
  } catch {
    // account missing (or wrong password) — try to create it
  }

  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const id = Array.from({ length: 15 })
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join('')
  await fetch(`${PB_URL}/api/collections/ut_users/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id,
      email,
      emailVisibility: true,
      password,
      passwordConfirm: password,
      role: 'user',
      name: `E2E ${email.split('@')[0]}`,
    }),
  })

  await fetch(`${PB_URL}/api/collections/ut_users/request-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const message = await waitForEmail(email)
  const token = new URL(extractLinkFromEmail(message)).searchParams.get('token')
  await fetch(`${PB_URL}/api/collections/ut_users/confirm-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })

  return fetchAuthToken(email, password)
}

/** Deletes the participant subscription of a user on an event, if any. */
export async function deleteSubscription(auth: Auth, eventId: string) {
  const params = new URLSearchParams({
    filter: `event = "${eventId}" && user = "${auth.record.id}" && is_event_admin = false`,
    fields: 'id',
  })
  const subs = (await fetch(
    `${PB_URL}/api/collections/ut_subscriptions/records?${params}`,
    { headers: { Authorization: `Bearer ${auth.token}` } },
  ).then(r => r.json())) as { items: { id: string }[] }
  for (const sub of subs.items) {
    await fetch(`${PB_URL}/api/collections/ut_subscriptions/records/${sub.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.token}` },
    })
  }
}

// ─── Custom fixtures ──────────────────────────────────────────────────────────

type Fixtures = {
  memberPage: Page
}

export const test = base.extend<Fixtures>({
  memberPage: async ({ page }, use) => {
    const email = process.env.TEST_MEMBER_EMAIL!
    const password = process.env.TEST_MEMBER_PASSWORD!
    await injectAuth(page, email, password)
    await use(page)
  },
})

export { expect }
