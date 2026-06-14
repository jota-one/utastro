import dayjs from 'dayjs'

export const dateFormat = (date: string, formatFrom = 'YYYY-MM-DD', formatTo = 'DD.MM.YYYY') =>
  dayjs(date, formatFrom).format(formatTo)

export const dateTimeFormat = (
  dateStr: string,
  formatFrom = 'YYYY-MM-DD HH:mm',
  formatTo = 'DD.MM.YYYY HH:mm',
) => dateFormat(dateStr, formatFrom, formatTo)

export const responseDateTimeFormat = (dateStr: string) => dayjs(dateStr).format('YYYY-MM-DDTHH:mm')

export const pad = (number: number, pad = 2, char = '0') => number.toString().padStart(pad, char)

export const nowUTC = () => new Date(new Date().toUTCString()).getTime()
