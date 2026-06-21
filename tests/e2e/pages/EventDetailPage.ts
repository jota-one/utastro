import type { Page } from '@playwright/test'

export class EventDetailPage {
  constructor(private page: Page) {}

  async goto(eventId: string) {
    await this.page.goto(`/fr/session/${eventId}`)
    // Wait for the Vue component to hydrate and load event data
    await this.page.waitForLoadState('networkidle')
  }

  subscribeButton() {
    return this.page.locator('button', { hasText: "Je m'inscris!" })
  }

  unsubscribeButton() {
    return this.page.locator('button', { hasText: 'Se désinscrire' })
  }

  fullMessage() {
    return this.page.getByText('Le cours est plein')
  }

  eventStartingSoonMessage() {
    return this.page.getByText('Inscriptions dès le')
  }

  watchCityButton() {
    return this.page.locator('button', { hasText: 'Reste informé!' })
  }

  watchingCityConfirmation() {
    return this.page.getByText('Es-tu sûr de vouloir te désinscrire', {
      exact: false,
    })
  }

  async subscribe() {
    await this.subscribeButton().click()
    // If not authenticated, a login modal opens — caller must handle
  }

  async confirmUnsubscribe() {
    await this.unsubscribeButton().click()
    // Modal opens — confirm
    await this.page.locator('button', { hasText: 'Confirmer' }).click()
  }

  async isSubscribed(): Promise<boolean> {
    const btn = this.unsubscribeButton()
    try {
      await btn.waitFor({ timeout: 5_000 })
      return await btn.isVisible()
    } catch {
      return false
    }
  }

  /** Returns the header event counter (sneaker icon) badge text. */
  async eventCounterText(): Promise<string> {
    // The sneaker counter is the 2nd counter badge in the header
    const counters = this.page.locator('.subscription-counters .counter')
    return (await counters.nth(1).textContent()) ?? '0'
  }
}
