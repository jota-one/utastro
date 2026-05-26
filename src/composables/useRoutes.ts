import { computed } from 'vue'
import { getPath, getNavItems, getLabel } from '@/routes'
import type { PageName } from '@/routes'
import { useLang } from './useLang'

export function useRoutes() {
  const { lang } = useLang()

  const route = (pageName: PageName) => getPath(pageName, lang.value)
  const label = (pageName: PageName) => getLabel(pageName, lang.value)
  const navItems = computed(() => getNavItems(lang.value))

  return { route, label, navItems, lang }
}
