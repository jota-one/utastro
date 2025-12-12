<template>
  <div :class="['tip-box', colorTheme, { closeable }]">
    <Icon :name="iconName" class="icon theme" />
    <slot />
    <button v-if="closeable" class="close" @click="$emit('close')">
      <Icon class="icon" name="close" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'

import type { ColorTheme } from '../../'
import Icon from './Icon.vue'

defineEmits(['close'])
const props = defineProps({
  colorTheme: {
    type: String as PropType<ColorTheme>,
    default: '',
  },
  closeable: Boolean,
})

const iconName = computed(() => {
  if (props.colorTheme === 'neutral') {
    return 'info'
  }
  return props.colorTheme
})
</script>

<style lang="postcss" scoped>
.tip-box {
  position: relative;
  padding: 1.06rem 0.94rem 1.06rem 3.4rem;
  font-size: 0.88rem;
  font-weight: 500;
  border-radius: 5px;

  &.closeable {
    padding-right: 3rem;
  }

  &.error {
    color: rgb(var(--color-error-text));
    background: rgb(var(--color-error-bg));
  }

  &.info {
    color: rgb(var(--color-info-text));
    background: rgb(var(--color-info-bg));
  }

  &.success {
    color: rgb(var(--color-success-text));
    background: rgb(var(--color-success-bg));
  }

  &.warning {
    color: rgb(var(--color-warning-text));
    background: rgb(var(--color-warning-bg));
  }

  &.neutral {
    color: rgb(var(--color-neutral-text));
    background: rgb(var(--color-neutral-bg));
  }
}

.icon.theme {
  position: absolute;
  top: 0.93rem;
  left: 0.94rem;
}

.close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  height: 1rem;
  width: 1rem;
  cursor: pointer;

  .icon {
    width: 1rem;
    height: 1rem;

    .error & {
      fill: rgb(var(--color-error-text));
    }

    .warning & {
      fill: rgb(var(--color-warning-text));
    }

    .info & {
      fill: rgb(var(--color-info-text));
    }

    .success & {
      fill: rgb(var(--color-success-text));
    }

    .neutral & {
      fill: rgb(var(--color-neutral-text));
    }
  }
}
</style>
