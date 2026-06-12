<template>
  <div :class="['badge', colorTheme]">
    {{ label }}
  </div>
</template>

<script setup lang="ts">
import type { ColorTheme } from '@/types'

type Props = {
  colorTheme?: ColorTheme
  label?: string
}

withDefaults(defineProps<Props>(), {
  colorTheme: undefined,
  label: '',
})
</script>

<style lang="postcss" scoped>
.badge {
  position: relative;
  padding: 0.2rem 0.5rem 0.3rem;
  font-size: 0.82rem;
  font-weight: 500;
  border-radius: 5px;
  border: 1px solid;
  transition: color 0.3s ease-in-out, background 0.3s ease-in-out;

  &.error {
    color: rgb(var(--color-error-text));
    background: rgba(var(--color-error-text), 0.1);
  }

  &.info {
    color: rgb(var(--color-info-text));
    background: rgba(var(--color-info-text), 0.1);
  }

  &.success {
    color: rgb(var(--color-success-text));
    background: rgba(var(--color-success-text), 0.1);
  }

  &.warning {
    color: rgb(var(--color-warning-text));
    background: rgba(var(--color-warning-text), 0.1);
  }

  &.subscribed {
    color: rgb(var(--color-white));
    background: rgba(var(--color-white), 0.2);
  }
}

.icon {
  position: absolute;
  top: 1.06rem;
  left: 0.94rem;
}
</style>
