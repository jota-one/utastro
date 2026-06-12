<template>
  <div :class="['empty-list-icon', { big }]">
    <Icon :name="icon" class="icon" :color-theme="colorTheme" />
    <div v-if="empty && !loading" class="oblique" />
    <div v-if="loading" class="load">
      <span v-for="i in [...Array(big ? 8 : 6).keys()]" :key="i" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ColorTheme } from '@/types'
import { computed } from 'vue'
import Icon from './Icon.vue'

interface Props {
  icon: string
  bgColor: string
  loading?: boolean
  colorTheme?: ColorTheme
  big?: boolean
  empty?: boolean
}

const props = defineProps<Props>()
const bgColor = computed(() => props.bgColor)
</script>

<style lang="postcss" scoped>
@keyframes empty-list-icon-load {
  0% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(200%);
  }
  100% {
    transform: translateX(0);
  }
}
.empty-list-icon {
  position: relative;
  width: 3rem;
  height: 3rem;

  &.big {
    width: 5rem;
    height: 5rem;
  }
}

.icon {
  width: 100%;
  height: 100%;
}

.oblique {
  position: absolute;
  top: 2rem;
  left: -1.1rem;
  width: 7rem;
  height: 0.3rem;
  background: rgb(var(--color-neutral-light));
  transform: rotate(135deg);
  transform-origin: center;

  &:before {
    content: '';
    display: block;
    width: 100%;
    height: 0.3rem;
    margin-top: 0.3rem;
    background: v-bind(bgColor);
  }
}

.load {
  position: absolute;
  top: 0;
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: space-between;

  span {
    display: block;
    height: 100%;
    width: 0.25rem;
    background: v-bind(bgColor);
    animation: empty-list-icon-load 1s linear infinite;

    .big & {
      width: 0.35rem;
    }
  }
}
</style>
