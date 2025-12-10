<template>
  <div class="text-on-bg">
    <span :class="['text', { invert }]">
      <slot />
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  invert?: boolean
  bgOpacity?: number
}

const props = defineProps<Props>()

const backgroundColor = computed(() => {
  const color = props.invert ? 'white' : 'black'
  const opacity = props.bgOpacity || 1

  return `rgb(var(--color-${color}), ${opacity})`
})
</script>

<style lang="postcss" scoped>
.text-on-bg {
  display: flex;

  &:first-child span {
    padding-top: 0.6rem;
  }

  &:last-child span {
    padding-bottom: 0.6rem;
  }
}

.text {
  display: block;
  padding: 0 0.6rem 0.4rem;
  color: rgb(var(--color-white));
  background: v-bind(backgroundColor);

  &.invert {
    color: rgb(var(--color-black));
  }
}
</style>
