import { ref } from 'vue'
import { LANGS, DEFAULT_LANG } from '@/routes'
import type { LangCode } from '@/routes'

export function useLang() {
  const docLang =
    typeof document !== 'undefined' ? (document.documentElement.lang as LangCode) : DEFAULT_LANG

  const lang = ref<LangCode>(LANGS.includes(docLang) ? docLang : DEFAULT_LANG)

  return { lang }
}
