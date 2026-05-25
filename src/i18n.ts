import type { App } from 'vue'
import { provideI36n } from '@jota-one/i36n'

const STORAGE_KEY = 'ut_lang'
const SUPPORTED = ['fr', 'de', 'en'] as const
export type Lang = (typeof SUPPORTED)[number]

export function detectLang(): Lang {
  if (typeof window === 'undefined') return 'fr'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && (SUPPORTED as readonly string[]).includes(stored)) return stored as Lang
  const browser = navigator.language.split('-')[0]
  return (SUPPORTED as readonly string[]).includes(browser) ? (browser as Lang) : 'fr'
}

export function setLang(lang: Lang) {
  localStorage.setItem(STORAGE_KEY, lang)
  window.location.reload()
}

const loaders: Record<Lang, () => Promise<{ default: Record<string, string> }>> = {
  fr: () => import('./translations/fr.json'),
  de: () => import('./translations/de.json'),
  en: () => import('./translations/en.json'),
}

const load = async (l: string) => {
  const loader = loaders[l as Lang] ?? loaders.fr
  return (await loader()).default
}

export function setupI18n(app: App) {
  provideI36n(detectLang(), { load }, app)
}
