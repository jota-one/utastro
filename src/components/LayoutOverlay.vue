<template>
  <div :class="['overlay', { active }]">
    <div class="container">
      <div class="wrapper">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  active: {
    type: Boolean,
  },
})

onBeforeUnmount(() => {
  window.document.documentElement.style.overflow = 'initial'
})

watch(
  () => props.active,
  active => {
    window.document.documentElement.style.overflow = active
      ? 'hidden'
      : 'initial'
  },
  { immediate: true },
)
</script>

<style lang="postcss" scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--color-black), 0.7);
  transition: background 0.2s linear;
  z-index: var(--z-index-overlay);

  &:not(.active) {
    display: none;
  }
}

.wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
