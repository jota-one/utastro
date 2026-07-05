import type { Page } from '@playwright/test'

export class ProfilePage {
  constructor(private page: Page) {}

  async gotoSessions() {
    await this.page.goto('/fr/mon-compte#sessions')
    await this.page.waitForLoadState('networkidle')
  }

  sessionItems() {
    return this.page.locator('.session-list-item')
  }

  unsubscribeButton() {
    return this.page.locator('.session-list-item .button.unsubscribe').first()
  }

  emptyMessage() {
    return this.page.getByText('Aucune session prévue')
  }

  sessionsTabBadgeText() {
    // "Mes sessions <n>" badge in the tab bar
    return this.page
      .locator('.tabs')
      .innerText()
      .then(text => text.match(/Mes sessions\s+(\d+)/)?.[1] ?? '0')
  }

  async confirmUnsubscribe() {
    await this.unsubscribeButton().click()
    await this.page.locator('button', { hasText: 'Confirmer' }).click()
  }
}
