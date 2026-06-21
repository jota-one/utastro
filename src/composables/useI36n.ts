import { ref } from 'vue'
import { getI36n, initI36n as _initI36n } from '@jota-one/i36n'
import fr from '@/translations/fr.json'
import de from '@/translations/de.json'
import en from '@/translations/en.json'

const translations: Record<string, Record<string, string>> = { fr, de, en }

export const useI36n = () => {
  const load = async (langCode: string) =>
    translations[langCode] || translations.fr

  const initI36n = (langCode: string) => {
    const showKey = ref(false)
    _initI36n(langCode, { load, showKey })
  }

  return { initI36n, getI36n }
}
