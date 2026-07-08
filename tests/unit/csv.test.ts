import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toCsv, type CsvRow } from '../../src/utils/csv.ts'

test('returns an empty string for no rows', () => {
  assert.equal(toCsv([]), '')
})

test('derives the header from the first row keys, in order', () => {
  const rows: CsvRow[] = [{ email: 'a@b.c', name: 'Alice', npa: 1000 }]
  const [header] = toCsv(rows).split('\n')
  assert.equal(header, 'email;name;npa')
})

test('uses semicolon as the default delimiter', () => {
  const csv = toCsv([{ a: '1', b: '2' }])
  assert.equal(csv, 'a;b\n1;2')
})

test('honours a custom delimiter', () => {
  const csv = toCsv([{ a: '1', b: '2' }], ',')
  assert.equal(csv, 'a,b\n1,2')
})

test('quotes a cell containing the delimiter', () => {
  const csv = toCsv([{ city: 'Bienne; BE' }])
  assert.equal(csv, 'city\n"Bienne; BE"')
})

test('escapes embedded double quotes by doubling them', () => {
  const csv = toCsv([{ name: 'The "Boss"' }])
  assert.equal(csv, 'name\n"The ""Boss"""')
})

test('quotes a cell containing a newline', () => {
  const csv = toCsv([{ note: 'line1\nline2' }])
  assert.equal(csv, 'note\n"line1\nline2"')
})

test('renders null and undefined as empty cells', () => {
  const csv = toCsv([{ a: null, b: undefined, c: 'x' }])
  assert.equal(csv, 'a;b;c\n;;x')
})

test('stringifies numbers', () => {
  const csv = toCsv([{ count: 0, ratio: 1.5 }])
  assert.equal(csv, 'count;ratio\n0;1.5')
})

test('renders booleans as 1 or empty (legacy format)', () => {
  const csv = toCsv([{ active: true, banned: false }])
  assert.equal(csv, 'active;banned\n1;')
})

test('keeps column order stable across rows', () => {
  const rows: CsvRow[] = [
    { email: 'a@b.c', role: 'user' },
    { role: 'admin', email: 'd@e.f' },
  ]
  assert.equal(toCsv(rows), 'email;role\na@b.c;user\nd@e.f;admin')
})
