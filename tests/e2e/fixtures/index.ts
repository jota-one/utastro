import { test as base, expect, type Page, type BrowserContext } from '@playwright/test'

const PB_URL = process.env.PB_URL || 'http://localhost:8091'
const MAILPIT_URL = process.env.MAILPIT_URL || 'http://localhost:8025'

// ─── Auth helpers ────────────────────────────────────────────────────────────

async function fetchAuthToken(email: string, password: string) {
  const res = await fetch(`${PB_URL}/api/custom/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(`Auth failed for ${email}: ${res.status}`)
  return res.json() as Promise<{ token: string; record: Record<string, unknown> }>
}

/**
 * Injects PocketBase + VueUse sessionStorage auth into the page BEFORE it loads.
 * Must be called before page.goto().
 */
export async function injectAuth(page: Page, email: string, password: string) {
  const { token, record } = await fetchAuthToken(email, password)
  await page.addInitScript(
    ({ token, record }) => {
      window.localStorage.setItem('pocketbase_auth', JSON.stringify({ token, record }))
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
      window.localStorage.setItem('pocketbase_auth', JSON.stringify({ token, record }))
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
export async function waitForEmail(toAddress: string, timeoutMs = 10_000): Promise<MailpitMessage> {
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

/** Extracts the first URL from an email body (HTML or text). */
export function extractLinkFromEmail(message: MailpitMessage): string {
  const source = message.HTML || message.Text
  const match = source.match(/https?:\/\/[^\s"<>]+/)
  if (!match) throw new Error('No link found in email body')
  return match[0]
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
