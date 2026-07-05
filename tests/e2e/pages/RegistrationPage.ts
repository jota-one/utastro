import type { Page } from '@playwright/test'

const FORM_URL = '/fr/inscription/formulaire'

export interface NewUserData {
  email: string
  password: string
  name: string
  zip: string
  city: string
  phone: string
  birthYear: string
  gender: 'Féminin' | 'Masculin' | 'Autre'
  canton: string // 2-char canton code, e.g. 'VD'
}

export class RegistrationPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(FORM_URL)
  }

  async fill(data: NewUserData) {
    await this.page.getByLabel('E-mail').fill(data.email)
    await this.page.getByLabel('Mot de passe').first().fill(data.password)
    await this.page.getByLabel('Confirmation du mot de passe').fill(data.password)
    await this.page.getByLabel('Nom complet').fill(data.name)
    await this.page.getByLabel('NPA').fill(data.zip)
    await this.page.getByLabel('Ville').fill(data.city)
    await this.page.getByLabel('Téléphone').fill(data.phone)
    await this.page.getByLabel('Genre').selectOption({ label: data.gender })
    await this.page.getByLabel('Année de naissance').fill(data.birthYear)
    await this.page.getByLabel('Canton').selectOption({ value: data.canton })
    // Accept risks checkbox (required)
    const risksCheckbox = this.page.locator('input[type="checkbox"]').first()
    await risksCheckbox.check()
  }

  async submit() {
    await this.page.locator('button', { hasText: 'Envoyer mes informations' }).click()
  }

  async isSuccessVisible(): Promise<boolean> {
    const success = this.page.getByText('Ton compte a été créé!')
    try {
      await success.waitFor({ timeout: 5_000 })
      return true
    } catch {
      return false
    }
  }
}
