import { test, expect } from '@playwright/test'
import {
  createAuthContext,
  ensureMemberAccount,
  fetchAuthToken,
  findOpenEvent,
  PB_URL,
  type Auth,
} from '../../fixtures/index'

/**
 * Access control of a plain member (role `user`) against the PocketBase API
 * and the admin SPA. The spec signs in TEST_MEMBER_2 / TEST_MEMBER_3 (created
 * on the fly when missing, needs Mailpit) as plain members, and TEST_MEMBER
 * as the admin used to read back state and restore it.
 */

const ADMIN = {
  email: process.env.TEST_MEMBER_EMAIL!,
  password: process.env.TEST_MEMBER_PASSWORD!,
}
const MEMBER = {
  email: process.env.TEST_MEMBER_2_EMAIL!,
  password: process.env.TEST_MEMBER_2_PASSWORD!,
}
const OTHER_MEMBER = {
  email: process.env.TEST_MEMBER_3_EMAIL!,
  password: process.env.TEST_MEMBER_3_PASSWORD!,
}

function api(path: string, auth: Auth | null, init: RequestInit = {}) {
  return fetch(`${PB_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? { Authorization: `Bearer ${auth.token}` } : {}),
    },
  })
}

const post = (path: string, auth: Auth | null, body: unknown) =>
  api(path, auth, { method: 'POST', body: JSON.stringify(body) })

const patch = (path: string, auth: Auth | null, body: unknown) =>
  api(path, auth, { method: 'PATCH', body: JSON.stringify(body) })

async function readUser(admin: Auth, id: string) {
  const res = await api(`/api/collections/ut_users/records/${id}`, admin)
  return (await res.json()) as Record<string, unknown>
}

/** Deletes a subscription created by a test that should have been refused. */
async function discardSubscription(res: Response, admin: Auth) {
  if (!res.ok) {
    return
  }
  const { id } = (await res.json()) as { id: string }
  await api(`/api/collections/ut_subscriptions/records/${id}`, admin, {
    method: 'DELETE',
  })
}

let admin: Auth
let member: Auth
let otherMember: Auth
let memberId: string
let otherMemberId: string
let openEventId: string | null

test.beforeAll(async () => {
  test.skip(
    [ADMIN, MEMBER, OTHER_MEMBER].some(u => !u.email || !u.password),
    'TEST_MEMBER, TEST_MEMBER_2 and TEST_MEMBER_3 credentials must be set',
  )
  admin = await fetchAuthToken(ADMIN.email, ADMIN.password)
  member = await ensureMemberAccount(MEMBER.email, MEMBER.password)
  otherMember = await ensureMemberAccount(
    OTHER_MEMBER.email,
    OTHER_MEMBER.password,
  )
  expect(member.record.role, 'TEST_MEMBER_2 must be a plain member').toBe(
    'user',
  )
  memberId = String(member.record.id)
  otherMemberId = String(otherMember.record.id)
  openEventId = await findOpenEvent(admin)
})

test.describe('member account', () => {
  test('cannot give themselves another role', async () => {
    const res = await patch(
      `/api/collections/ut_users/records/${memberId}`,
      member,
      { role: 'admin' },
    )
    try {
      expect(res.ok).toBe(false)
      expect((await readUser(admin, memberId)).role).toBe('user')
    } finally {
      await patch(`/api/collections/ut_users/records/${memberId}`, admin, {
        role: 'user',
      })
    }
  })

  test('cannot tamper with legacy import fields', async () => {
    const res = await patch(
      `/api/collections/ut_users/records/${memberId}`,
      member,
      { legacy_password_sha1: 'da39a3ee5e6b4b0d3255bfef95601890afd80709' },
    )
    expect(res.ok).toBe(false)
  })

  test('can still update their own profile', async () => {
    const original = await readUser(admin, memberId)
    // the profile form posts the whole record, role included
    const res = await patch(
      `/api/collections/ut_users/records/${memberId}`,
      member,
      { name: 'E2E renamed', role: original.role },
    )
    try {
      expect(res.ok).toBe(true)
      expect((await readUser(admin, memberId)).name).toBe('E2E renamed')
    } finally {
      await patch(`/api/collections/ut_users/records/${memberId}`, admin, {
        name: original.name,
      })
    }
  })

  test('sign-up cannot pick a role other than user', async () => {
    const email = `e2e+role-${Date.now()}@example.com`
    const res = await post('/api/collections/ut_users/records', null, {
      email,
      password: 'TestPassword123!',
      passwordConfirm: 'TestPassword123!',
      role: 'admin',
      name: 'E2E role escalation',
    })
    if (res.ok) {
      const { id } = (await res.json()) as { id: string }
      await api(`/api/collections/ut_users/records/${id}`, admin, {
        method: 'DELETE',
      })
    }
    expect(res.ok).toBe(false)
  })
})

test.describe('member subscriptions', () => {
  test.beforeEach(() => {
    test.skip(!openEventId, 'no event with an open subscription window')
  })

  test('cannot subscribe as coach', async () => {
    const res = await post(
      '/api/collections/ut_subscriptions/records',
      member,
      {
        user: member.record.id,
        event: openEventId,
        is_event_admin: true,
      },
    )
    await discardSubscription(res, admin)
    expect(res.ok).toBe(false)
  })

  test('cannot subscribe another user', async () => {
    const res = await post(
      '/api/collections/ut_subscriptions/records',
      member,
      {
        user: otherMember.record.id,
        event: openEventId,
        is_event_admin: false,
      },
    )
    await discardSubscription(res, admin)
    expect(res.ok).toBe(false)
  })

  test('cannot mark their own presence', async () => {
    const created = await post(
      '/api/collections/ut_subscriptions/records',
      member,
      { user: member.record.id, event: openEventId, is_event_admin: false },
    )
    expect(created.ok).toBe(true)
    const { id } = (await created.json()) as { id: string }
    try {
      const res = await patch(
        `/api/collections/ut_subscriptions/records/${id}`,
        member,
        { presence: true, presence_checked: true, is_event_admin: true },
      )
      expect(res.ok).toBe(false)
    } finally {
      await api(`/api/collections/ut_subscriptions/records/${id}`, member, {
        method: 'DELETE',
      })
    }
  })

  test('a coach can subscribe as coach', async () => {
    await patch(`/api/collections/ut_users/records/${otherMemberId}`, admin, {
      role: 'coach',
    })
    try {
      const coach = await fetchAuthToken(
        OTHER_MEMBER.email,
        OTHER_MEMBER.password,
      )
      const res = await post(
        '/api/collections/ut_subscriptions/records',
        coach,
        {
          user: coach.record.id,
          event: openEventId,
          is_event_admin: true,
        },
      )
      await discardSubscription(res, admin)
      expect(res.ok).toBe(true)
    } finally {
      await patch(`/api/collections/ut_users/records/${otherMemberId}`, admin, {
        role: 'user',
      })
    }
  })
})

test.describe('already restricted', () => {
  test('a member only sees their own user record', async () => {
    const res = await api('/api/collections/ut_users/records?perPage=5', member)
    const { items } = (await res.json()) as { items: { id: string }[] }
    expect(items.every(u => u.id === member.record.id)).toBe(true)
  })

  test('an anonymous visitor sees no user record', async () => {
    const res = await api('/api/collections/ut_users/records?perPage=5', null)
    const { items } = (await res.json()) as { items: unknown[] }
    expect(items).toHaveLength(0)
  })

  test('a member only sees their own subscriptions', async () => {
    const res = await api(
      '/api/collections/ut_subscriptions/records?perPage=50',
      member,
    )
    const { items } = (await res.json()) as { items: { user: string }[] }
    expect(items.every(s => s.user === member.record.id)).toBe(true)
  })

  test('a member cannot update an event', async () => {
    test.skip(!openEventId, 'no event with an open subscription window')
    const res = await patch(
      `/api/collections/ut_events/records/${openEventId}`,
      member,
      { title: 'E2E tampered' },
    )
    expect(res.ok).toBe(false)
  })

  test('a member cannot read the attendance sheet', async () => {
    test.skip(!openEventId, 'no event with an open subscription window')
    const res = await api(`/api/custom/events/${openEventId}/attendees`, member)
    expect(res.status).toBe(403)
  })

  test('a member cannot impersonate another user', async () => {
    const res = await post(
      `/api/custom/users/${otherMemberId}/impersonate`,
      member,
      {},
    )
    expect(res.status).toBe(403)
  })

  test('a member opening the admin is sent back to the site', async ({
    browser,
  }) => {
    const { context, page } = await createAuthContext(
      browser,
      MEMBER.email,
      MEMBER.password,
    )
    try {
      await page.goto('/admin/users')
      await expect(page).not.toHaveURL(/\/admin/, { timeout: 8_000 })
    } finally {
      await context.close()
    }
  })
})
