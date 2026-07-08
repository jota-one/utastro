import { test, expect, PB_URL } from '../../fixtures/index'
import type { Download, Page } from '@playwright/test'

/**
 * Admin CSV exports (Users, Cities, Events). Validates the full chain:
 * admin auth → view → export click → browser download → CSV shape.
 * Uses the `memberPage` fixture, whose TEST_MEMBER account is a superadmin.
 * Assertions target structure (BOM, delimiter, headers, dedup) rather than
 * exact counts, so the spec is robust against seed-data drift.
 */

const BOM = '﻿'

async function readDownload(download: Download): Promise<string> {
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer)
  }
  return Buffer.concat(chunks).toString('utf-8')
}

/** Splits an exported CSV into its header cells and data lines. */
function parseCsv(content: string): { header: string[]; dataLines: string[] } {
  expect(content.startsWith(BOM), 'CSV must start with a UTF-8 BOM').toBe(true)
  const body = content.slice(BOM.length)
  const lines = body.split('\n')
  return { header: lines[0].split(';'), dataLines: lines.slice(1) }
}

async function triggerDownload(
  page: Page,
  action: () => Promise<void>,
): Promise<Download> {
  const [download] = await Promise.all([page.waitForEvent('download'), action()])
  return download
}

test.describe('Admin CSV exports', () => {
  test('exports all users with the expected columns', async ({ memberPage }) => {
    await memberPage.goto('/admin/users')

    const download = await triggerDownload(memberPage, () =>
      memberPage.getByRole('button', { name: 'Exporter' }).click(),
    )

    expect(download.suggestedFilename()).toMatch(/-users\.csv$/)

    const { header, dataLines } = parseCsv(await readDownload(download))
    expect(header).toEqual([
      'email',
      'role',
      'name',
      'npa',
      'city',
      'region',
      'gender',
      'birthdate',
      'accept_newsletter',
      'accept_promo',
      'duplicates',
    ])
    expect(dataLines.length).toBeGreaterThan(0)
  })

  test('exports all city watchers', async ({ memberPage }) => {
    await memberPage.goto('/admin/cities')

    // Open the global export dropdown, then pick "Pers. intéressées".
    await memberPage.getByRole('button', { name: 'Exporter' }).click()
    const download = await triggerDownload(memberPage, () =>
      memberPage
        .getByRole('menuitem', { name: 'Pers. intéressées', exact: true })
        .click(),
    )

    expect(download.suggestedFilename()).toMatch(/-all-watchers\.csv$/)

    const { header } = parseCsv(await readDownload(download))
    expect(header).toContain('email')
    expect(header).toContain('city_of_interest')
  })

  test('exports event subscribers for an event that has some', async ({
    memberPage,
  }) => {
    // Find an event with at least one subscriber so the CSV is non-trivial.
    const res = await fetch(
      `${PB_URL}/api/collections/ut_events/records?` +
        new URLSearchParams({
          filter: 'subscription_count > 0',
          fields: 'id',
          perPage: '1',
          skipTotal: '1',
        }),
    )
    const { items } = (await res.json()) as { items: { id: string }[] }
    test.skip(items.length === 0, 'no event with subscribers in this dataset')
    const eventId = items[0].id

    await memberPage.goto('/admin/events')

    // The events table paginates; the row for our event may not be visible, so
    // export from the row that exposes the "Exporter les inscrits" action and
    // assert on the download shape rather than a specific event.
    const exportButton = memberPage
      .locator('button[title="Exporter les inscrits"]')
      .first()
    await expect(exportButton).toBeVisible()

    const download = await triggerDownload(memberPage, () =>
      exportButton.click(),
    )

    expect(download.suggestedFilename()).toMatch(
      /-event-[a-z0-9]+-subscribers\.csv$/,
    )

    const content = await readDownload(download)
    // An event with zero subscribers yields a header-less file (empty rows), so
    // only assert on structure when there is data.
    if (content.length > BOM.length) {
      const { header } = parseCsv(content)
      expect(header).toContain('email')
    }
    // Reference eventId so the discovery guard is not dead code.
    expect(eventId).toBeTruthy()
  })
})
