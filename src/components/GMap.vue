<template>
  <div class="gmap">
    <div ref="mapEl" class="gmap-container" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import useGMap from '@composables/useGMap'
import type { CenterCoords, Marker } from '@/types'

interface Props {
  zoom: number
  center: CenterCoords
  markers: Marker[]
}

const emit = defineEmits(['marker-clicked'])
const props = withDefaults(defineProps<Props>(), {
  markers: () => [],
})

const mapEl = ref<HTMLElement | undefined>()
const mapLoaded = ref(false)
const { initMap, loadMarkers, updateMap, updateMarkers } = useGMap()

watch(
  () => mapEl.value,
  async value => {
    if (value) {
      await initMap('ut-map', {
        el: value,
        zoom: props.zoom,
        center: props.center,
      })
      mapLoaded.value = true
      await loadMarkers(props.markers, (marker: Marker) =>
        emit('marker-clicked', marker),
      )
    }
  },
)

watch(
  [() => props.zoom, () => props.center, () => mapLoaded.value],
  ([zoomValue, centerValue]) => {
    updateMap({ zoom: zoomValue, center: centerValue })
  },
  { immediate: true },
)

watch(
  () => props.markers,
  async value => await updateMarkers(value),
)
</script>

<style lang="postcss">
.gmap,
.gmap-container {
  width: 100%;
  height: 100%;

  div[role='img'] {
    cursor: pointer;
  }
}
</style>
