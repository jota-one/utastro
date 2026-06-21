<template>
  <div :class="['map container', { embedded, backLink }]">
    <ArrowLink
      v-if="backLink"
      :href="backLink.href"
      :label="backLink.label"
      no-padding
      reverse
      class="back-link"
    />
    <div :class="['wrapper', { hideControls }]">
      <a
        v-if="static"
        :href="staticLink"
        target="_blank"
        class="static-wrapper"
      >
        <img :src="staticUrl" class="static-map" />
        <img src="/img/marker/event-active.png" class="static-marker" />
      </a>
      <GMap
        v-else
        :zoom="zoom"
        :center="centerCoords"
        :markers="markers"
        @marker-clicked="onMarkerClicked"
      />
    </div>
    <MapLegends v-if="!embedded" :map-type="city ? 'sessions' : 'cities'" />
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { ref, computed, watch } from 'vue'
import { useGeolocation } from '@vueuse/core'
import { useI36n } from '@jota-one/i36n'

import config from '@/config'
import { buildCoords } from '@/utils/coords'
import { useCities } from '@/composables/useCities'
import { useSessions } from '@/composables/useSessions'
import { useUserProfile } from '@/composables/useUserProfile'
import { useRoutes } from '@composables/useRoutes'
import useGMap from '@composables/useGMap'
import ArrowLink from '@components/ArrowLink.vue'
import GMap from '@components/GMap.vue'
import MapLegends from '@components/MapLegends.vue'
import type { City, Coords, Link, Marker, Session } from '@/types'


interface Props {
  backLink?: Link
  city?: City
  embedded?: boolean
  hideControls?: boolean
  preventCenterToUserPosition?: boolean
  session?: Session
  static?: boolean
}

const { route, label, lang, navItems: navigationItems } = useRoutes()
const { cities, filteredCities } = useCities()
const { sessions, canSubscribe, getSessionTheme } = useSessions()
const { coords } = useGeolocation()
const { watchingCities, subscribedSessions } = useUserProfile()
const { getStaticMapUrl } = useGMap()

const { t } = useI36n()

const props = defineProps<Props>()

const zoom = ref()
const watchingCityIds = computed(() => watchingCities.value.map(c => c.cityId))

const markers = computed(() => {
  const unique: Marker[] = []
  let all: Marker[]

  const getMarkerState = (session: Session) => {
    const theme = getSessionTheme(session)

    let state =
      theme === 'error'
        ? 'full'
        : theme === 'success'
        ? canSubscribe(session)
          ? 'active'
          : 'open'
        : theme === 'warning'
        ? 'almost-full'
        : ''

    if (subscribedSessions.value.some(s => s.eventId === session.id)) {
      state += '-subscribed'
    }

    return state
  }

  if (props.session) {
    return [
      {
        icon: `/img/marker/event-${getMarkerState(props.session)}.png`,
        slug: props.session?.id?.toString(),
        label:
          props.session.title ||
          t('sessions_default_title') +
            dayjs(props.session.start).format(' DD.MM.YYYY @HH:mm'),
        coords: props.session.location.coords,
      },
    ]
  }

  if (props.city) {
    all = (sessions.value || [])
      .filter(session => session.cityId === props.city?.id)
      .map<Marker>(session => ({
        icon: `/img/marker/event-${getMarkerState(session)}.png`,
        slug: session.id,
        label: session.location.label,
        coords: session.location.coords,
      }))
  } else {
    all = Object.values(cities.value).map((city: City) => {
      const isWatching = watchingCityIds.value.includes(city.id)
      const isFilteredOut =
        filteredCities.value.length &&
        !filteredCities.value.map(city => city.slug).includes(city.slug)
      const hasSessions = (sessions.value || []).some(
        session => session.cityId === city.id,
      )
      const state = hasSessions ? '-on' : '-off'
      const watching = isWatching ? '-watching' : ''
      const filtered = isFilteredOut ? '-filtered' : ''

      const icon = `/img/marker/city${state}${watching}${filtered}.png`

      return {
        icon,
        slug: city.slug,
        label: city.label,
        coords: city.coords,
      }
    })
  }

  all.forEach(marker => {
    if (
      !unique.some(
        m =>
          m.coords[0] === marker.coords?.[0] &&
          m.coords[1] === marker.coords[1],
      )
    ) {
      unique.push(marker)
    }
  })

  return unique
})

const computedCenter = computed(() =>
  markers.value.reduce(
    (centerCoords: any, marker: any, index: number) => {
      centerCoords.lat += marker.coords?.[0] || 0
      centerCoords.lng += marker.coords?.[1] || 0

      if (index === markers.value.length - 1) {
        centerCoords.lng = centerCoords.lng / markers.value.length
        centerCoords.lat = centerCoords.lat / markers.value.length
      }

      return centerCoords
    },
    { lat: 0, lng: 0 },
  ),
)

const isUserPositionActive = computed(
  () =>
    !props.preventCenterToUserPosition && coords.value.latitude !== Infinity,
)

const centerCoords = computed(() => {
  if (props.city) {
    const cityCoords = buildCoords(props.city.coords.toString())
    return { lat: cityCoords[0], lng: cityCoords[1] }
  } else {
    return !props.preventCenterToUserPosition && isUserPositionActive.value
      ? {
          lat: coords.value.latitude,
          lng: coords.value.longitude,
        }
      : {
          lat: computedCenter.value.lat,
          lng: computedCenter.value.lng,
        }
  }
})

const staticUrl = computed(() => {
  const center = props.session?.location.coords.join(',')
  const zoom = 18
  const width = 600
  const height = 600
  const mapType = 'roadmap'
  const markers = ''

  return getStaticMapUrl({ center, zoom, width, height, mapType, markers })
})

const staticLink = computed(
  () => `${config.gmap.staticLink}?q=${props.session?.location.coords.join(',')}`,
)

const onMarkerClicked = (marker: Marker) => {
  if (props.city && marker.slug) {
    window.location.href = route('session-detail').replace(':id', marker.slug)
  } else if (!props.session && marker.slug) {
    window.location.href = route('city').replace(':city', marker.slug)
  }
}

watch(
  [() => props.city, () => props.session],
  ([cityValue, sessionValue]) => {
    zoom.value = cityValue ? 13 : sessionValue ? 15 : 9
  },
  { immediate: true },
)
</script>
<style lang="postcss" scoped>
.back-link {
  margin-bottom: 1rem;
}

.map {
  z-index: 0;

  &.embedded .wrapper {
    height: 100%;
  }
}

.wrapper {
  position: relative;
  width: 100%;
  height: 450px;
  box-shadow: 0 0 var(--size-gap-10) rgba(var(--color-neutral), 0.3);
  z-index: 0;
}

.static-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.static-map {
  object-fit: contain;
  width: 732px;
  height: 732px;
}

.static-marker {
  position: absolute;
  margin-top: -50px;
  height: 50px;
  z-index: 1;
}
</style>
