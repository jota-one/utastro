import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import type { CenterCoords, Marker } from "@/types"
import config from '@/config'

if (typeof window !== 'undefined') {
  setOptions({ key: config.gmap.apiKey, v: 'weekly' })
}

type MapUpdateProps = {
  zoom?: number
  center?: CenterCoords
}

type MapInitProps = MapUpdateProps & {
  el: HTMLElement
}

type MapType = 'roadmap'

type MapUrlProps = {
  center?: string
  zoom: number
  width: number
  height: number
  mapType: MapType
  markers: string
}

let map: google.maps.Map
const gMarkers: google.maps.marker.AdvancedMarkerElement[] = []
let onMarkerClick: (marker: Marker) => void = () => {}

const createMarkerIcon = (marker: Marker) => {
  const markerIconImg = document.createElement('img')
  markerIconImg.setAttribute('data-marker-icon', '')
  markerIconImg.src = marker.icon
  markerIconImg.width = 58
  markerIconImg.height = 51
  return markerIconImg
}

export default function useGMap() {
  const initMap = async (id: string, props: MapInitProps) => {
    const { el, zoom, center } = props

    const { Map } = await importLibrary('maps')

    // The map, centered at Uluru
    map = new Map(el, {
      zoom,
      center,
      // Switch to false for homepage hero screenshot
      mapTypeControl: true,
      fullscreenControl: true,
      streetViewControl: true,
      zoomControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_RIGHT,
      },
      fullscreenControlOptions: {
        position: google.maps.ControlPosition.BOTTOM_RIGHT,
      },
      mapId: id,
    })
  }

  const updateMap = (props: MapUpdateProps) => {
    if (!map) {
      return
    }

    const { center, zoom } = props

    if (center) {
      map.setCenter(new google.maps.LatLng(center))
    }

    if (zoom) {
      map.setZoom(zoom)
    }
  }

  const createGMarker = async (map: google.maps.Map, marker: Marker) => {
    if (!map) {
      return
    }

    const { AdvancedMarkerElement } = await importLibrary('marker')

    return new AdvancedMarkerElement({
      map,
      position: { lat: marker.coords[0], lng: marker.coords[1] },
      content: createMarkerIcon(marker),
      title: marker.label,
      gmpClickable: true,
      zIndex: parseInt(
        ((1 / marker.coords[0]) * 10000000).toString().split('.')[0].slice(2),
      ),
    })
  }

  const loadMarkers = async (
    markers: Marker[],
    onClick: (marker: Marker) => void,
  ) => {
    onMarkerClick = onClick
    for (const marker of markers) {
      const gMarker = await createGMarker(map, marker)

      if (gMarker) {
        gMarker.element.addEventListener('click', () => {
          onMarkerClick(marker)
        })

        gMarkers.push(gMarker)
      }
    }

    return gMarkers.sort((a, b) => {
      return (a.position?.lat || 0) > (b.position?.lat || 0)
        ? -1
        : (a.position?.lat || 0) < (b.position?.lat || 0)
        ? 1
        : 0
    })
  }

  const updateMarkers = async (markers: Marker[]) => {
    if (!gMarkers) {
      return
    }
    for (let i = 0; i < gMarkers.length; i++) {
      const gMarker = gMarkers[i]
      const marker = markers.find(
        m =>
          m.coords[0] === gMarker.position?.lat &&
          m.coords[1] === gMarker.position?.lng,
      )

      if (!marker) {
        gMarker.map = null
      }
    }

    for (let i = 0; i < markers.length; i++) {
      const marker = markers[i]
      const gMarker = gMarkers.find(m => {
        const pos = m.position

        return pos?.lat === marker.coords[0] && pos?.lng === marker.coords[1]
      })

      if (gMarker) {
        (gMarker.content as HTMLImageElement).src = marker.icon
      } else {
        const newGMarker = await createGMarker(map, marker)

        if (newGMarker) {
          newGMarker.element.addEventListener('click', () => {
            onMarkerClick(marker)
          })
          gMarkers.push(newGMarker)
        }
      }
    }
  }

  const getStaticMapUrl = (props: MapUrlProps) => {
    const { center, zoom, width, height, mapType, markers } = props
    return `${config.gmap.staticUrl}?center=${center}&zoom=${zoom}&scale=2&size=${width}x${height}&maptype=${mapType}
${markers}&key=${config.gmap.apiKey}`
  }

  return { initMap, updateMap, loadMarkers, updateMarkers, getStaticMapUrl }
}
