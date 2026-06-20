<template>
  <ul class="map-legends">
    <li v-for="legend in legends" :key="legend.imgKey" class="legend">
      <img :src="`/img/marker/${legend.imgKey}.png`" width="45" height="40" />
      <span v-html="t(`map_legend_${legend.labelKey}`)" />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI36n } from '@jota-one/i36n'
import { useAuth } from '@composables/useAuth'

interface Props {
  mapType: 'cities' | 'sessions'
}

const props = defineProps<Props>()

const { isAuthenticated } = useAuth()

const { t } = useI36n()
const citiesLegends = computed(() => {
  const legends = [
    { imgKey: 'city-off', labelKey: 'city_off' },
    { imgKey: 'city-on', labelKey: 'city_on' },
  ]

  if (isAuthenticated.value) {
    legends.push({ imgKey: 'city-watching', labelKey: 'city_watching' })
  }

  return legends
})

const eventsLegends = computed(() => {
  const legends = [
    { imgKey: 'event-open', labelKey: 'event_open' },
    { imgKey: 'event-active', labelKey: 'event_active' },
    { imgKey: 'event-almost-full', labelKey: 'event_almost_full' },
    { imgKey: 'event-full', labelKey: 'event_full' },
  ]

  if (isAuthenticated.value) {
    legends.push({ imgKey: 'event-watching', labelKey: 'event_watching' })
  }

  return legends
})

const legends = computed(() =>
  props.mapType === 'cities' ? citiesLegends.value : eventsLegends.value,
)
</script>

<style lang="postcss" scoped>
.map-legends {
  list-style: none;
  padding-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: var(--size-gap-5);
}

.legend {
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  line-height: 1rem;
}
</style>
