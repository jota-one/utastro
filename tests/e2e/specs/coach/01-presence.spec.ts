import { test, expect, type Browser } from '@playwright/test'
import {
  createAuthContext,
  createUser,
  deleteUserByEmail,
  fetchAdminAuth,
  fetchAuthToken,
  findOpenEvent,
  PB_URL,
  uniqueEmail,
  type Auth,
} from '../../fixtures/index'
import { EventDetailPage } from '../../pages/EventDetailPage'

/**
 * Coach: signs up to coach a session, then checks the presence of its
 * participants. Uses a throwaway coach and participant created through the
 * admin API (TEST_MEMBER must be an admin), both deleted afterwards along
 * with their subscriptions.
 */

const PASSWORD = 'TestPassword123!'

let admin: Auth
let eventId: string | null
const coachEmail = uniqueEmail('coach')
const participantEmail = uniqueEmail('participant')
let participant: Auth

test.beforeAll(async () => {
  test.skip(!process.env.TEST_MEMBER_EMAIL, 'TEST_MEMBER_EMAIL not set')
  admin = await fetchAdminAuth()
  eventId = await findOpenEvent(admin)
  test.skip(!eventId, 'no event with an open subscription window')

  await createUser(admin, {
    email: coachEmail,
    password: PASSWORD,
    verified: true,
    role: 'coach',
    name: 'E2E Coach',
  })
  await createUser(admin, {
    email: participantEmail,
    password: PASSWORD,
    verified: true,
    name: 'E2E Participant',
  })
  participant = await fetchAuthToken(participantEmail, PASSWORD)
  const res = await fetch(
    `${PB_URL}/api/collections/ut_subscriptions/records`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${participant.token}`,
      },
      body: JSON.stringify({
        user: participant.record.id,
        event: eventId,
        is_event_admin: false,
      }),
    },
  )
  expect(res.ok, 'participant subscription').toBe(true)
})

test.afterAll(async () => {
  // deleting the users cascades to their subscriptions
  await deleteUserByEmail(admin, coachEmail)
  await deleteUserByEmail(admin, participantEmail)
})

async function readParticipantSubscription() {
  const params = new URLSearchParams({
    filter: `event = "${eventId}" && user = "${String(participant.record.id)}"`,
    fields: 'presence,presence_checked',
  })
  const { items } = (await fetch(
    `${PB_URL}/api/collections/ut_subscriptions/records?${params}`,
    { headers: { Authorization: `Bearer ${admin.token}` } },
  ).then(r => r.json())) as {
    items: { presence: boolean; presence_checked: boolean }[]
  }
  return items[0]
}

async function openAsCoach(browser: Browser) {
  const { context, page } = await createAuthContext(
    browser,
    coachEmail,
    PASSWORD,
  )
  await page.goto('/fr')
  await new EventDetailPage(page).goto(eventId!)
  return { context, page }
}

test('a coach signs up to coach a session and can leave it', async ({
  browser,
}) => {
  const { context, page } = await openAsCoach(browser)
  const strip = page.locator('.coach-strip').first()
  try {
    const staffCount = async () =>
      Number(await strip.locator('.count .counter').innerText())
    const before = await staffCount()

    await strip.locator('button', { hasText: 'Coacher cette session' }).click()
    await expect(
      strip.locator('button', { hasText: 'Se désinscrire (coach)' }),
    ).toBeVisible({ timeout: 8_000 })
    await expect.poll(staffCount).toBe(before + 1)

    await strip.locator('button', { hasText: 'Se désinscrire (coach)' }).click()
    await page.locator('button', { hasText: 'Confirmer' }).click()
    await expect(
      strip.locator('button', { hasText: 'Coacher cette session' }),
    ).toBeVisible({ timeout: 8_000 })
    await expect.poll(staffCount).toBe(before)
  } finally {
    await context.close()
  }
})

test('a coach of the session checks the presence of a participant', async ({
  browser,
}) => {
  const { context, page } = await openAsCoach(browser)
  const strip = page.locator('.coach-strip').first()
  try {
    // only the coaches of the session get the attendance sheet
    await expect(strip.locator('.presence-check-button')).toHaveCount(0)
    await strip.locator('button', { hasText: 'Coacher cette session' }).click()
    await strip.locator('.presence-check-button').click()

    const sheet = page.locator('.presence-checker')
    await expect(
      sheet.getByText('Feuille de présence', { exact: true }),
    ).toBeVisible()
    const row = sheet.locator('.attendee', { hasText: 'E2E Participant' })
    await expect(row).toBeVisible()

    await row.locator('button.present').click()
    await expect(row).toHaveClass(/is-present/)
    await expect
      .poll(readParticipantSubscription)
      .toEqual({ presence: true, presence_checked: true })

    await row.locator('button.absent').click()
    await expect(row).toHaveClass(/is-absent/)
    await expect
      .poll(readParticipantSubscription)
      .toEqual({ presence: false, presence_checked: true })
  } finally {
    await context.close()
  }
})
