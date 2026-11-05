import { test, expect, fetchAdminAuth, PB_URL } from '../../fixtures/index'

/**
 * Search in the admin lists: like on the legacy site, a city name finds the
 * sessions and the locations of that city, even when their own name does not
 * mention it. Uses the `adminPage` fixture (TEST_MEMBER, an admin).
 */

async function list(collection: string, params: Record<string, string>) {
  const { token } = await fetchAdminAuth()
  const query = new URLSearchParams(params)
  const response = await fetch(
    `${PB_URL}/api/collections/${collection}/records?${query}`,
    { headers: { Authorization: token } },
  )
  return (await response.json()).items as Record<string, any>[]
}

test.describe('Admin search', () => {
  test('a city finds its sessions, whatever their title', async ({
    adminPage,
  }) => {
    const [event] = await list('ut_events', {
      filter: 'title_fr = "" && title_de = "" && title_en = "" && city != ""',
      sort: '-start_date',
      perPage: '1',
      expand: 'city',
    })
    const city = event.expand!.city.label

    await adminPage.goto('/admin/events')
    if (new Date(event.start_date) < new Date()) {
      await adminPage.locator('.el-switch').first().click()
    }
    await adminPage.getByPlaceholder('Rechercher des Sessions').fill(city)

    await expect(adminPage.locator('.el-table__row').first()).toContainText(
      city,
    )
  })

  test('a city finds its locations', async ({ adminPage }) => {
    const locations = await list('ut_locations', {
      filter: 'enabled = true && city != ""',
      perPage: '200',
      expand: 'city',
    })
    const location = locations.find(
      l =>
        ![l.xid, l.label_fr, l.label_de, l.address].some(text =>
          text?.includes(l.expand!.city.label),
        ),
    )!

    const city = location.expand!.city.label

    await adminPage.goto('/admin/locations')
    const results = adminPage.waitForResponse(
      response =>
        response.url().includes('ut_locations') &&
        decodeURIComponent(response.url()).includes(`"${city}"`),
    )
    await adminPage.getByPlaceholder(/^Rechercher des/).fill(city)

    expect((await (await results).json()).totalItems).toBeGreaterThan(0)
  })

  test('a city is found without its accents', async ({ adminPage }) => {
    const [event] = await list('ut_events', {
      filter: 'city.label ~ "Genève"',
      sort: '-start_date',
      perPage: '1',
    })

    await adminPage.goto('/admin/events')
    if (new Date(event.start_date) < new Date()) {
      await adminPage.locator('.el-switch').first().click()
    }
    await adminPage.getByPlaceholder('Rechercher des Sessions').fill('geneve')

    await expect(adminPage.locator('.el-table__row').first()).toContainText(
      'Genève',
    )
  })

  test('an unknown city finds nothing', async ({ adminPage }) => {
    await adminPage.goto('/admin/events')
    await adminPage
      .getByPlaceholder('Rechercher des Sessions')
      .fill('Atlantide')

    await expect(adminPage.locator('.el-table__row')).toHaveCount(0)
  })
})
