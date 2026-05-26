<template>
  <div :class="`counter${colorTheme ? ' ' + colorTheme : ''}`">
    {{ count || 0 }}
  </div>
</template>

<script setup lang="ts">
import type { ColorTheme } from '@/types'

type Props = {
  count?: number
  colorTheme?: ColorTheme
}

defineProps<Props>()
</script>

<style lang="postcss" scoped>
.counter {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  min-height: 24px;
  padding: 4px;
  font-size: 14px;
  line-height: 14px;
  font-weight: 400;
  color: rgb(var(--color-white));
  border-radius: 10rem;
  border: 1px solid rgba(var(--color-white), 0.5);
  background: rgba(var(--color-neutral), 1);

  &.error {
    background: rgb(var(--color-error-text));
  }

  &.info {
    background: rgb(var(--color-info-text));
  }

  &.success {
    background: rgb(var(--color-success-text));
  }

  &.warning {
    background: rgb(var(--color-warning-text));
  }
}
</style>
