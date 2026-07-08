type CsvValue = string | number | boolean | null | undefined
export type CsvRow = Record<string, CsvValue>

const escapeCell = (value: CsvValue, delimiter: string): string => {
  // Match legacy export format: booleans render as "1" or empty.
  if (typeof value === 'boolean') {
    return value ? '1' : ''
  }
  const str = value === null || value === undefined ? '' : String(value)
  if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export const toCsv = (rows: CsvRow[], delimiter = ';'): string => {
  if (rows.length === 0) {
    return ''
  }
  const headers = Object.keys(rows[0])
  const lines = [
    headers.map(header => escapeCell(header, delimiter)).join(delimiter),
    ...rows.map(row =>
      headers.map(header => escapeCell(row[header], delimiter)).join(delimiter),
    ),
  ]
  return lines.join('\n')
}

export const downloadCsv = (
  filename: string,
  rows: CsvRow[],
  delimiter = ';',
) => {
  // Prepend BOM so Excel reads UTF-8 accents correctly.
  const blob = new Blob([`﻿${toCsv(rows, delimiter)}`], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
