import { pb } from '@/pb'

const withoutAccents = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

/**
 * Filter conditions for the cities a search matches once accents are ignored:
 * "Geneve" finds Genève, which the SQLite comparison of PocketBase does not.
 * Only the cities it misses are listed, as a filter has a limited length.
 */
export const citiesIgnoringAccents = async (search: string, field: string) => {
  const cities = await pb
    .collection('ut_cities')
    .getFullList({ fields: 'id,label' })

  return cities
    .filter(
      ({ label }) =>
        withoutAccents(label).includes(withoutAccents(search)) &&
        !label.toLowerCase().includes(search.toLowerCase()),
    )
    .map(({ id }) => `${field} = "${id}"`)
}
