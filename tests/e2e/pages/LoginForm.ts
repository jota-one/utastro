import type { Page } from '@playwright/test'

/** The login modal opened from the header "Connexion" button. */
export class LoginForm {
  constructor(private page: Page) {}

  form() {
    return this.page.locator('.login-form')
  }

  /** Opens the modal from the header of the current page. */
  async open() {
    await this.page
      .locator('header button', { hasText: 'Connexion' })
      .first()
      .click()
    await this.form().waitFor()
  }

  async login(email: string, password: string) {
    await this.form().getByLabel('Identifiant').fill(email)
    await this.form().getByLabel('Mot de passe').fill(password)
    await this.form().locator('button[type="submit"]').click()
  }

  async requestPasswordReset(email: string) {
    await this.form()
      .locator('button', { hasText: 'Mot de passe oublié?' })
      .click()
    await this.form().getByLabel('Identifiant').fill(email)
    await this.form().locator('button', { hasText: 'Réinitialiser' }).click()
  }

  logoutButton() {
    return this.page
      .locator('header button', { hasText: 'Déconnexion' })
      .first()
  }

  loginButton() {
    return this.page.locator('header button', { hasText: 'Connexion' }).first()
  }
}
