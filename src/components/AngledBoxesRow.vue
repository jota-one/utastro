<template>
  <div ref="container" class="angled-boxes-row">
    <div ref="wrapper" :class="['wrapper', { single: isSingle, scrollable }]">
      <template v-for="(box, index) in boxes" :key="`box-${index}`">
        <div v-if="index > 0" :class="['sep', sepColorTheme]" />
        <div class="box">
          <slot name="box" :item="box" :index="index" />
        </div>
      </template>
    </div>
    <template v-if="scrollable && !isSingle && containerWidth < wrapperWidth">
      <nav v-if="withArrowNav" class="arrows">
        <button class="arrow prev" @click="scrollToBox(currentBoxIndex - 1)" />
        <button class="arrow next" @click="scrollToBox(currentBoxIndex + 1)" />
      </nav>
      <nav class="dots-wrapper">
        <div class="dots">
          <button
            v-for="(dot, index) in dots"
            :key="`dot-${index}`"
            class="dot"
            @click="scrollToBox(index)"
          >
            <template v-if="showDotsTitle">{{ dot }}</template>
          </button>
        </div>
        <div ref="scrollBar" class="scrollbar" :style="scrollBarStyle" />
      </nav>
      <div :class="['gradient', { arrivedRight: arrivedState.right }]" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useResizeObserver, useScroll } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'

import type { ColorTheme } from '../..'

interface Props {
  boxes?: any[]
  sepColorTheme?: ColorTheme
  scrollable?: boolean
  showDotsTitle?: boolean
  withArrowNav?: boolean
}

const props = defineProps<Props>()

const scrollBar = ref<HTMLElement | null>(null)
const container = ref<HTMLElement | null>(null)
const wrapper = ref<HTMLElement | null>(null)
const containerWidth = ref(1)
const wrapperWidth = ref(0)
const currentBoxIndex = ref(0)
const { x, arrivedState } = useScroll(wrapper)

useResizeObserver(container, updateWidths)

const isSingle = computed(() => props.scrollable && props.boxes?.length === 1)

const dots = computed(() => (props.boxes || []).map((box: any) => box.title))

const boxWidth = computed(() => wrapperWidth.value / (props.boxes?.length || 1))

const scrollBarStyle = computed(() => {
  const ratio = containerWidth.value / wrapperWidth.value
  const width = (ratio * 100).toFixed(0)
  const translateX = x.value * ratio
  return `width: ${width}%; transform: translateX(${translateX}px);`
})

const scrollToBox = (index: number) => {
  currentBoxIndex.value = index
  x.value = index * boxWidth.value
}

function updateWidths() {
  let _wrapperWidth = 0

  wrapper.value
    ?.querySelectorAll('.box:not(.offset), .sep')
    .forEach((value: Element) => {
      _wrapperWidth += (value as HTMLElement).offsetWidth
    })

  wrapperWidth.value = _wrapperWidth
  containerWidth.value = container.value?.offsetWidth || 1
}

onMounted(updateWidths)
</script>

<style lang="postcss" scoped>
@import '@styles/_mediaquery.pcss';

.angled-boxes-row {
  position: relative;
  height: 100%;
}

.wrapper {
  height: inherit;
  display: flex;
  flex-direction: column;
  scroll-behavior: smooth;
  overflow: hidden;

  /* Hide scrollbar */
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */

  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }

  @media (--l) {
    flex-direction: row;
  }

  &.scrollable {
    position: relative;
    margin: 0 auto;
    height: 100%;
    padding-bottom: 1rem;

    @media (--m) {
      flex-direction: row;
      overflow-x: scroll;
      scroll-snap-type: x proximity;
      overflow-y: hidden;
      max-height: 400px;
    }

    &.single {
      @media (--m) {
        max-width: 75%;
      }

      @media (--l) {
        max-width: 50%;
      }
    }

    &:not(.single) {
      .box {
        @media (--m) {
          min-width: 500px;
          scroll-snap-align: start;
        }
      }
    }
  }
}

.box {
  flex: 1;
}

.sep {
  position: relative;
  z-index: 2;

  &:after {
    position: absolute;
    display: block;
    content: '';
    background: rgb(var(--color-bg));

    top: -1rem;
    right: -1rem;
    margin-left: -0.75rem;
    width: calc(100% + 2rem);
    height: calc(100% + 2rem);
    transform: rotate(-2deg);
    transition: background 0.2s ease-in-out;

    @media (--l) {
      top: -1rem;
      height: calc(100% + 2rem);
      transform: rotate(-2deg);
    }
  }

  &.error:after {
    background: rgb(var(--color-error-text));
  }

  &.info:after {
    background: rgb(var(--color-info-text));
  }

  &.success:after {
    background: rgb(var(--color-success-text));
  }

  &.warning:after {
    background: rgb(var(--color-warning-text));
  }

  &.subscribed:after {
    background: rgb(var(--color-success-text));
  }

  &.neutral:after {
    background: rgb(var(--color-neutral));
  }
}

.arrows {
  position: absolute;
  top: 0;
  right: 1.5rem;
  bottom: 2.5rem;
  left: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  mix-blend-mode: difference;
  z-index: 3;
  pointer-events: none;
}

.arrow {
  position: relative;
  width: 1.75rem;
  height: 1.75rem;
  border-top: 4px solid rgb(var(--color-neutral));
  border-left: 4px solid rgb(var(--color-neutral));
  transition: transform 0.1s ease-in-out;
  cursor: pointer;
  pointer-events: all;

  &.prev {
    transform: rotate(-45deg);

    &:hover {
      transform: scale(1.3) rotate(-45deg);
    }
  }

  &.next {
    transform: rotate(135deg);

    &:hover {
      transform: scale(1.3) rotate(135deg);
    }
  }
}

.dots-wrapper {
  display: none;
  position: relative;
  margin: 0.5rem auto;

  @media (--m) {
    display: flex;
    flex-direction: column;
  }
}
.dots {
  position: relative;
  display: flex;
  justify-content: center;
  gap: 1rem;
  z-index: 2;
}

.scrollbar {
  position: absolute;
  background: rgb(var(--color-bg));
  height: 0.2rem;
  mix-blend-mode: exclusion;
  opacity: 0.5;
  z-index: 3;
}

.dot {
  height: 100%;
  flex: 1;
  padding: 0 0 0.5rem;
  text-align: left;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgb(var(--color-neutral));
  border-radius: 0.25rem;
  border: none;

  &:before {
    display: block;
    content: '';
    height: 0.2rem;
    margin-bottom: 0.5rem;
    background: rgb(var(--color-neutral-lightest));
  }

  &.active {
    color: rgb(var(--color-neutral-darker));

    &:before {
      background: rgb(var(--color-neutral-light));
    }
  }

  &:not(.active) {
    cursor: pointer;
  }
}

.gradient {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 10%;
  background-image: linear-gradient(90deg, transparent, rgb(var(--color-bg)));
  opacity: 0;
  z-index: 1;
  pointer-events: none;
  transition: opacity 0.05s ease-in;

  @media (--m) {
    opacity: 1;

    &.arrivedRight {
      opacity: 0;
    }
  }
}
</style>
