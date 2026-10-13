import {
  test,
  expect,
  PB_URL,
  fetchAdminAuth,
  type Auth,
} from '../../fixtures/index'

/**
 * Admin CSV import of sessions: upload → preview (per-cell errors, language
 * merge, recurrence, unselecting a row) → import (duplicates skipped) → the
 * sessions actually created. Runs on a throwaway location and activity type,
 * with sessions in 2031, all deleted afterwards. Uses the `memberPage`
 * fixture, whose TEST_MEMBER account is an admin.
 */

const LOCATION_XID = 'e2e-import-location'
const TYPE_XID = 'e2e-import-type'

let admin: Auth
let cityId: string
let locationId: string
let typeId: string

async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`${PB_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${admin.token}`,
    },
  })
  if (!res.ok) {
    throw new Error(
      `${init.method ?? 'GET'} ${path}: ${res.status} ${await res.text()}`,
    )
  }
  return res.status === 204 ? null : res.json()
}

const create = (collection: string, body: unknown) =>
  api(`/api/collections/${collection}/records`, {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<{ id: string }>

async function testEvents() {
  const params = new URLSearchParams({
    filter: `location = "${locationId}"`,
    sort: 'start_date',
    perPage: '100',
  })
  const { items } = (await api(
    `/api/collections/ut_events/records?${params}`,
  )) as {
    items: Record<string, any>[]
  }
  return items
}

async function deleteTestEvents() {
  for (const event of await testEvents()) {
    await api(`/api/collections/ut_events/records/${event.id}`, {
      method: 'DELETE',
    })
  }
}

// One line per row of the file; the comment says what the preview must do
const CSV = [
  'start_date,end_date,max_subscriptions,location,lang,activity,title,description,recurrence,end_recurrence',
  // the same session in two languages: merged into one
  `2031-03-04 18:30,2031-03-04 19:30,20,${LOCATION_XID},fr,${TYPE_XID},Séance E2E,Description en français,,`,
  `2031-03-04 18:30,2031-03-04 19:30,20,${LOCATION_XID},de,${TYPE_XID},E2E Training,Beschreibung auf Deutsch,,`,
  // weekly until April 1st: four sessions
  `2031-03-11 18:30,2031-03-11 19:30,25,${LOCATION_XID},fr,${TYPE_XID},Récurrente E2E,Chaque semaine,7,2031-04-01`,
  // three rows in error, not importable
  `04.03.2031 18:30,2031-03-04 19:30,20,${LOCATION_XID},fr,${TYPE_XID},Date invalide E2E,,,`,
  `2031-03-05 18:30,2031-03-05 19:30,20,e2e-unknown-location,fr,${TYPE_XID},Lieu inconnu E2E,,,`,
  `2031-03-06 18:30,2031-03-06 19:30,20,${LOCATION_XID},fr,${TYPE_XID},Fin invalide E2E,,7,30.04.2031`,
  // an unknown activity type is flagged but does not block the row
  `2031-03-07 18:30,2031-03-07 19:30,20,${LOCATION_XID},fr,"${TYPE_XID},e2e-unknown-type",Type inconnu E2E,,,`,
  // same start, end, location and capacity as a session already there
  `2031-03-08 18:30,2031-03-08 19:30,20,${LOCATION_XID},fr,${TYPE_XID},Doublon E2E,,,`,
  // unselected in the preview
  `2031-03-09 18:30,2031-03-09 19:30,20,${LOCATION_XID},fr,${TYPE_XID},Décochée E2E,,,`,
].join('\n')

test.describe('Admin CSV import of sessions', () => {
  test.beforeAll(async () => {
    test.skip(!process.env.TEST_MEMBER_EMAIL, 'TEST_MEMBER_EMAIL not set')
    admin = await fetchAdminAuth()
    const { items } = (await api(
      `/api/collections/ut_cities/records?${new URLSearchParams({ filter: 'enabled = true', perPage: '1', fields: 'id' })}`,
    )) as { items: { id: string }[] }
    cityId = items[0].id
    locationId = (
      await create('ut_locations', {
        xid: LOCATION_XID,
        city: cityId,
        enabled: true,
        label_fr: 'Lieu E2E',
        label_de: 'Ort E2E',
        label_en: 'E2E place',
      })
    ).id
    typeId = (
      await create('ut_event_types', {
        xid: TYPE_XID,
        enabled: true,
        label_fr: 'Type E2E',
        label_de: 'Typ E2E',
        label_en: 'E2E type',
      })
    ).id
    // the session the "Doublon E2E" row duplicates
    await create('ut_events', {
      start_date: '2031-03-08 18:30:00',
      end_date: '2031-03-08 19:30:00',
      subscription_publish_date: '2031-03-01 18:30:00',
      max_subscriptions: 20,
      location: locationId,
      city: cityId,
      progress: 'open',
      attendees: 'todo',
      title_fr: 'Déjà là E2E',
    })
  })

  test.afterAll(async () => {
    if (!admin) {
      return
    }
    if (locationId) {
      await deleteTestEvents()
      await api(`/api/collections/ut_locations/records/${locationId}`, {
        method: 'DELETE',
      })
    }
    if (typeId) {
      await api(`/api/collections/ut_event_types/records/${typeId}`, {
        method: 'DELETE',
      })
    }
  })

  test('previews, imports and creates the sessions of a CSV file', async ({
    memberPage: page,
  }) => {
    await page.goto('/admin/events')
    await page.getByRole('button', { name: 'Importer' }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Importer des sessions' })
    await expect(dialog).toBeVisible()

    await dialog.locator('.el-upload input[type="file"]').setInputFiles({
      name: 'sessions.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(CSV, 'utf-8'),
    })

    // Preview: 2 language lines merged + 4 recurring + 4 single = 8 importable,
    // 3 rows in error
    await expect(
      dialog.getByText('8 session(s) sur 8 prête(s) à être importée(s)'),
    ).toBeVisible()
    await expect(
      dialog.getByText('3 ligne(s) en erreur (non importables)'),
    ).toBeVisible()
    const rows = dialog.locator('.el-table__body .el-table__row')
    await expect(rows).toHaveCount(11)
    await expect(dialog.getByText('[04.03.2031 18:30]')).toBeVisible()
    await expect(dialog.getByText('[e2e-unknown-location]')).toBeVisible()
    await expect(
      dialog.getByText('Fin de récurrence [30.04.2031]'),
    ).toBeVisible()
    await expect(dialog.getByText('[e2e-unknown-type]')).toBeVisible()
    await expect(rows.filter({ hasText: 'Récurrente E2E' })).toHaveCount(4)

    // the merged session carries both languages
    await expect(rows.filter({ hasText: 'Séance E2E' })).toHaveCount(1)
    await dialog.locator('label', { hasText: /^de$/ }).click()
    await expect(rows.filter({ hasText: 'E2E Training' })).toHaveCount(1)
    await dialog.locator('label', { hasText: /^fr$/ }).click()

    await rows.filter({ hasText: 'Décochée E2E' }).locator('.el-switch').click()
    await expect(
      dialog.getByText('7 session(s) sur 8 prête(s) à être importée(s)'),
    ).toBeVisible()

    await dialog.getByRole('button', { name: 'Importer' }).click()

    // Done: 9 lines read, 7 selected, 6 created, 1 duplicate skipped
    const statistic = (title: string) =>
      dialog
        .locator('.el-statistic', { hasText: title })
        .locator('.el-statistic__number')
    await expect(statistic('Lignes traitées')).toHaveText('9', {
      timeout: 15_000,
    })
    await expect(statistic('Sessions générées')).toHaveText('7')
    await expect(statistic('Sessions créées')).toHaveText('6')
    await expect(statistic('Doublons ignorés')).toHaveText('1')

    // What actually landed in the database
    const events = await testEvents()
    const byTitle = (title: string) => events.filter(e => e.title_fr === title)
    expect(events).toHaveLength(7) // 6 created + the pre-existing one
    expect(byTitle('Doublon E2E')).toHaveLength(0)
    expect(byTitle('Décochée E2E')).toHaveLength(0)

    const [merged] = byTitle('Séance E2E')
    expect(merged).toMatchObject({
      start_date: '2031-03-04 18:30:00',
      end_date: '2031-03-04 19:30:00',
      subscription_publish_date: '2031-02-25 18:30:00',
      max_subscriptions: 20,
      city: cityId,
      types: [typeId],
      progress: 'open',
      attendees: 'todo',
      title_de: 'E2E Training',
      description_fr: 'Description en français',
      description_de: 'Beschreibung auf Deutsch',
    })

    expect(byTitle('Récurrente E2E').map(e => e.start_date)).toEqual([
      '2031-03-11 18:30:00',
      '2031-03-18 18:30:00',
      '2031-03-25 18:30:00',
      '2031-04-01 18:30:00',
    ])
    expect(byTitle('Type inconnu E2E')[0].types).toEqual([typeId])
  })
})
