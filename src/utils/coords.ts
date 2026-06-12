import type { Coords } from '@/types'

export const buildCoords = (input: string): Coords => {
  const [lat, lng] = input.split(',')

  if (lat && lng) {
    return [parseFloat(lat.trim()), parseFloat(lng.trim())]
  }

  return [0, 0]
}
