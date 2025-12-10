<template>
  <svg :class="`icon ${colorTheme}`" viewBox="0 0 24 24" width="24" height="24">
    <path
      v-for="(path, i) of paths"
      :key="`path-${i}`"
      fill-rule="evenodd"
      clip-rule="evenodd"
      :opacity="path.opacity"
      :d="path.d"
    />
  </svg>
</template>

<script setup lang="ts">
import icons from '@assets/icons.json'
import type { ColorTheme } from '../..'
import { computed } from 'vue'

const props = defineProps({
  name: {
    type: String,
    default: '',
  },
  colorTheme: {
    type: String as PropType<ColorTheme>,
    default: '',
  },
})

const paths = computed(() => {
  const icon = (icons as Record<string, string>)[props.name]

  if (Array.isArray(icon)) {
    return icon
  } else if (typeof icon === 'string') {
    return [{ opacity: 1, d: icon }]
  }
})
</script>

<style lang="postcss" scoped>
.icon {
  flex-shrink: 0;
  fill: currentColor;
  will-change: fill;
  transition: fill 0.2s ease-in-out;

  &.error {
    fill: rgb(var(--color-error-text));
  }

  &.info {
    fill: rgb(var(--color-info-text));
  }

  &.success {
    fill: rgb(var(--color-success-text));
  }

  &.warning {
    fill: rgb(var(--color-warning-text));
  }

  &.neutral {
    fill: rgb(var(--color-neutral));
  }

  &.subscribed {
    fill: rgba(var(--color-white), 0.9);
  }
}
</style>
