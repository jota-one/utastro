import { ref } from 'vue'
import type { City, Coords } from '@/types'
import { pb } from '@/pb'

export interface Cities {
  [id: string]: City
}

const cities = ref<Cities>({})
const filteredCities = ref<City[]>([])
let loadCitiesPromise: Promise<void> | null = null

export const useCities = () => {
  const loadCities = (): Promise<void> => {
    if (loadCitiesPromise) { return loadCitiesPromise }
    loadCitiesPromise = pb.collection('ut_cities').getFullList({
      filter: 'enabled=true',
      fields: 'id,label,slug,coords',
    }).then(records => {
      cities.value = Object.fromEntries(
        records.map(r => {
          const [lat, lng] = (r.coords || '').split(',').map(Number)
          const city: City = {
            id: r.id,
            label: r.label,
            slug: r.slug,
            coords: [lat || 0, lng || 0] as Coords,
            sponsors: [],
          }
          return [r.id, city]
        }),
      )
    }).finally(() => {
      loadCitiesPromise = null
    })
    return loadCitiesPromise
  }

  return {
    cities,
    filteredCities,
    loadCities,
  }
}
