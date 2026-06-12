import dayjs, { Dayjs } from 'dayjs'
import { useSettings } from '@/composables/useSettings'
import { useLocaleDate } from '@/composables/useLocaleDate'
import { useI36n } from '@/composables/useI36n'

import type { DateRange, DateRangeSize } from '@/types'

export default function useDateRange() {
  const { currentLangCode } = useSettings()
  const { getLocaleDate } = useLocaleDate()
  const { getI36n } = useI36n()
  const { $label: t } = getI36n()

  const _addWeek = (date: Dayjs): Dayjs => getLocaleDate(date).endOf('week')

  const _getStartOfWeek = (date: Dayjs): Dayjs => getLocaleDate(date).startOf('week').startOf('day')

  const getInitalRange = (): DateRange => {
    return {
      from: dayjs().startOf('day'),
      to: dayjs().add(1, 'day').startOf('day'),
    }
  }

  const getDay = (date: Dayjs): DateRange => {
    const from = date.startOf('day')
    const to = date.add(1, 'day').startOf('day')
    return { from, to }
  }

  const getWeek = (date: Dayjs): DateRange => {
    const from = _getStartOfWeek(date)
    const to = _addWeek(from)
    return { from, to }
  }

  const getMonth = (date: Dayjs): DateRange => {
    const from = date.startOf('month')
    const to = date.endOf('month')
    return { from, to }
  }

  const getYear = (): DateRange => {
    const from = dayjs().startOf('year')
    const to = dayjs().endOf('year')
    return { from, to }
  }

  const getNextDay = (date: Dayjs): DateRange => {
    const from = date.add(1, 'day').startOf('day')
    const to = from.add(1, 'day').startOf('day')
    return { from, to }
  }

  const getNextWeek = (date: Dayjs): DateRange => {
    const from = _getStartOfWeek(date.add(1, 'week'))
    const to = _addWeek(from)
    return { from, to }
  }

  const getNextMonth = (date: Dayjs): DateRange => {
    const from = date.add(1, 'month').startOf('month')
    const to = from.endOf('month')

    return { from, to }
  }

  const getNextYear = (date: Dayjs): DateRange => {
    const from = date.add(1, 'year').startOf('year')
    const to = from.endOf('year')

    return { from, to }
  }

  const getPreviousDay = (date: Dayjs): DateRange => {
    const from = date.add(-1, 'day').startOf('day')
    const to = date.startOf('day')
    return { from, to }
  }

  const getPreviousWeek = (date: Dayjs): DateRange => {
    const from = _getStartOfWeek(date.add(-1, 'week'))
    const to = _addWeek(from)
    return { from, to }
  }

  const getPreviousMonth = (date: Dayjs): DateRange => {
    const from = date.add(-1, 'month').startOf('month')
    const to = from.endOf('month')

    return { from, to }
  }

  const getPreviousYear = (date: Dayjs): DateRange => {
    const from = date.add(-1, 'year').startOf('year')
    const to = from.endOf('year')

    return { from, to }
  }

  const isNow = (range: DateRange, rangeSize: DateRangeSize) =>
    dayjs.isDayjs(range.from) ? range.from.isSame(dayjs(), rangeSize) : false

  const isInRange = (date: Dayjs, range: DateRange): boolean =>
    date.isAfter(range.from) && date.isBefore(range.to)

  const getRangeText = (range: DateRange, rangeSize: DateRangeSize, withArticle?: boolean) => {
    const localeFrom = getLocaleDate(range.from)
    const localeTo = getLocaleDate(range.to)
    let text = ''

    if (rangeSize === 'day') {
      text = localeFrom.format(`dddd DD MMM YYYY`)

      if (withArticle) {
        if (isNow(range, rangeSize)) {
          text = t.value('common_today')
        } else if (isNow(getPreviousDay(range.from), rangeSize)) {
          text = t.value('common_tomorrow')
        } else {
          text =
            (currentLangCode.value === 'fr'
              ? 'le '
              : currentLangCode.value === 'de'
                ? 'am '
                : 'on ') + text
        }
      }
    } else if (rangeSize === 'week') {
      let from = localeFrom.format('DD MMM')
      const to = localeTo.format('DD MMM YYYY')

      if (localeFrom.isSame(localeTo, 'month')) {
        from = localeFrom.format('DD')
      }

      text = `${from} - ${to}`

      if (withArticle) {
        if (isNow(range, rangeSize)) {
          text = t.value('common_this_week')
        } else if (isNow(getPreviousWeek(range.from), rangeSize)) {
          text = t.value('common_next_week')
        } else {
          text =
            (currentLangCode.value === 'fr'
              ? 'la semaine du '
              : currentLangCode.value === 'de'
                ? 'in der Woche vom '
                : 'the week of ') + text
        }
      }
    } else if (rangeSize === 'month') {
      text = localeFrom.format('MMMM YYYY')

      if (withArticle) {
        if (isNow(range, rangeSize)) {
          text = t.value('common_this_month')
        } else if (isNow(getPreviousMonth(range.from), rangeSize)) {
          text = t.value('common_next_month')
        } else {
          text =
            (currentLangCode.value === 'fr'
              ? 'en '
              : currentLangCode.value === 'de'
                ? 'im '
                : 'in ') + text
        }
      }
    } else if (rangeSize === 'year') {
      text = dayjs(range.from).year().toString()

      if (withArticle) {
        text =
          (currentLangCode.value === 'fr'
            ? 'en '
            : currentLangCode.value === 'de'
              ? 'in '
              : 'in ') + text
      }
    }

    return text
  }

  return {
    getInitalRange,
    getDay,
    getWeek,
    getMonth,
    getNextDay,
    getNextWeek,
    getNextMonth,
    getNextYear,
    getPreviousDay,
    getPreviousWeek,
    getPreviousMonth,
    getPreviousYear,
    getRangeText,
    getYear,
    isInRange,
    isNow,
  }
}
