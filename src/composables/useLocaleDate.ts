import dayjs, { type Dayjs } from 'dayjs'
import de from 'dayjs/locale/de-ch'
import en from 'dayjs/locale/en-gb'
import fr from 'dayjs/locale/fr-ch'
import { useSettings } from '@/composables/useSettings'

export const useLocaleDate = () => {
  const { currentLangCode } = useSettings()

  const getLocaleDate = (date: Dayjs | Date) => {
    const locale = currentLangCode.value === 'de' ? de : currentLangCode.value === 'fr' ? fr : en

    // eslint-disable-next-line import/no-named-as-default-member
    return (dayjs.isDayjs(date) ? date : dayjs(date)).locale(locale)
  }

  return { getLocaleDate }
}
