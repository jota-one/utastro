export type LangCode = 'fr' | 'de' | 'en'

export type PageName =
  | 'home'
  | 'my-account'
  | 'subscription'
  | 'sponsors'
  | 'contact'
  | 'subscription-form'
  | 'city'
  | 'session'
  | 'session-detail'
  | 'coach-subscription-form'

export const LANGS: LangCode[] = ['fr', 'de', 'en']
export const DEFAULT_LANG: LangCode = 'fr'

type RouteConfig = {
  name: PageName
  slugs: Record<LangCode, string>
  labels: Record<LangCode, string>
  parent?: PageName
  show: 'always' | 'never'
  dynamic?: boolean
}

const routeConfigs: RouteConfig[] = [
  {
    name: 'home',
    slugs: { fr: '', de: '', en: '' },
    labels: {
      fr: 'Urban Training',
      de: 'Urban Training',
      en: 'Urban Training',
    },
    show: 'always',
  },
  {
    name: 'my-account',
    slugs: { fr: 'mon-compte', de: 'mein-konto', en: 'my-account' },
    labels: { fr: 'Mon compte', de: 'Mein Konto', en: 'My account' },
    show: 'always',
  },
  {
    name: 'subscription',
    slugs: { fr: 'inscription', de: 'anmeldung', en: 'subscription' },
    labels: { fr: 'Inscription', de: 'Anmeldung', en: 'Subscription' },
    show: 'never',
  },
  {
    name: 'sponsors',
    slugs: { fr: 'sponsors', de: 'sponsoren', en: 'sponsors' },
    labels: { fr: 'Sponsors', de: 'Sponsoren', en: 'Sponsors' },
    show: 'never',
  },
  {
    name: 'contact',
    slugs: { fr: 'contact', de: 'kontakt', en: 'contact' },
    labels: { fr: 'Contact', de: 'Kontakt', en: 'Contact' },
    show: 'always',
  },
  {
    name: 'subscription-form',
    slugs: { fr: 'formulaire', de: 'formular', en: 'form' },
    labels: {
      fr: "Formulaire d'inscription",
      de: 'Anmeldungsformular',
      en: 'Subscription form',
    },
    parent: 'subscription',
    show: 'never',
  },
  {
    name: 'coach-subscription-form',
    slugs: { fr: 'formulaire-coach', de: 'formular-coach', en: 'form-coach' },
    labels: { fr: 'Formulaire coach', de: 'Coach-Formular', en: 'Coach form' },
    show: 'never',
  },
  {
    name: 'session',
    slugs: { fr: 'session', de: 'session', en: 'session' },
    labels: { fr: 'Session', de: 'Session', en: 'Session' },
    show: 'never',
  },
  // Dynamic routes — paths depend on runtime data from PocketBase
  {
    name: 'city',
    slugs: { fr: ':city', de: ':city', en: ':city' },
    labels: { fr: ':city', de: ':city', en: ':city' },
    parent: 'subscription',
    show: 'never',
    dynamic: true,
  },
  {
    name: 'session-detail',
    slugs: { fr: ':id', de: ':id', en: ':id' },
    labels: { fr: 'Session', de: 'Session', en: 'Session' },
    parent: 'session',
    show: 'never',
    dynamic: true,
  },
]

function buildRelativeSlug(route: RouteConfig, lang: LangCode): string {
  const slug = route.slugs[lang]
  if (!route.parent) {
    return slug
  }
  const parent = routeConfigs.find(r => r.name === route.parent)!
  const parentSlug = buildRelativeSlug(parent, lang)
  return parentSlug ? `${parentSlug}/${slug}` : slug
}

export function getPath(pageName: PageName, lang: LangCode): string {
  const route = routeConfigs.find(r => r.name === pageName)
  if (!route) {
    return `/${lang}`
  }
  const relSlug = buildRelativeSlug(route, lang)
  return relSlug ? `/${lang}/${relSlug}` : `/${lang}`
}

export function getLabel(pageName: PageName, lang: LangCode): string {
  return routeConfigs.find(r => r.name === pageName)?.labels[lang] ?? ''
}

export function getNavItems(lang: LangCode) {
  return routeConfigs
    .filter(r => r.show === 'always' && r.name !== 'home' && !r.dynamic)
    .map(r => ({
      name: r.name,
      label: r.labels[lang],
      path: getPath(r.name, lang),
    }))
}

export function getStaticPagePaths() {
  const paths: {
    params: { lang: LangCode; slug: string | undefined }
    props: { page: PageName; lang: LangCode }
  }[] = []

  for (const route of routeConfigs) {
    if (route.dynamic || route.name === 'home') {
      continue
    }
    for (const lang of LANGS) {
      paths.push({
        params: { lang, slug: buildRelativeSlug(route, lang) || undefined },
        props: { page: route.name, lang },
      })
    }
  }

  return paths
}
