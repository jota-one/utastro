<template>
  <div :class="`block-space ${size}`" />
</template>

<script setup lang="ts">
import type { BlockSpaceSize } from '../../'

interface Props {
  size: BlockSpaceSize
}

withDefaults(defineProps<Props>(), {
  size: 'full',
})
</script>

<style lang="postcss" scoped>
.block-space {
  &.full {
    height: 7rem;
  }

  &.half {
    height: 3.5rem;
  }

  &.quarter {
    height: 1.75rem;
  }
}
</style>
