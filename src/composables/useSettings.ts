import { computed } from 'vue'
import type { LangCode } from '@/types'

export const useSettings = () => {
  const currentLangCode = computed<LangCode>(() => {
    const pathParts = window.location.pathname.split('/').filter(Boolean)
    return (pathParts[0] || 'fr') as LangCode
  })

  return { currentLangCode }
}
