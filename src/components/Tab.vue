<template>
  <button :id="id" :class="['tab', { active: isActive || defaultActive }]">
    <Icon v-if="icon" :name="icon" class="icon" />
    <span>{{ label }}</span>
    <Counter
      v-if="counterValue || alwaysDisplayCounter"
      :count="counterValue"
      class="counter"
      :color-theme="counterColor"
    />
    <slot />
  </button>
</template>

<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import Counter from '@/components/Counter.vue'
import type { ColorTheme } from '@/types'

interface Props {
  label: string
  isActive: boolean
  alwaysDisplayCounter?: boolean
  defaultActive?: boolean
  id?: string
  icon?: string
  counterValue?: number
  counterColor?: ColorTheme
}

defineProps<Props>()
</script>

<style lang="postcss" scoped>
.tab {
  display: flex;
  align-items: center;
  gap: var(--size-gap-10);
  margin: 0.75rem 0 -1px;
  padding: 0.7rem 0.9rem;
  min-height: 3rem;
  border-top-right-radius: 3px;
  border-top-left-radius: 3px;
  flex-shrink: 0;
  white-space: nowrap;
  font-weight: 500;
  color: rgb(var(--color-neutral));
  filter: grayscale(1);

  &:not(.buttons):not(.active):hover {
    background: rgb(var(--color-bg), 0.25);
    box-shadow: 0 0 1rem rgba(var(--color-neutral), 0.1);
    cursor: pointer;
  }

  &.active {
    color: inherit;
    background: rgb(var(--color-bg));
    box-shadow: 0 0 1rem rgba(var(--color-neutral), 0.2);
    filter: none;
  }
}

.icon {
  margin-top: -0.2rem;
  width: 1.5rem;
  height: 1.5rem;
  color: rgb(var(--color-neutral-lighter));

  .active & {
    color: rgb(var(--color-primary), 0.75);
  }

  &.sneaker {
    width: 1.8rem;
    height: 1.8rem;
  }
}

.counter {
  margin-top: -0.1rem;
}
</style>
