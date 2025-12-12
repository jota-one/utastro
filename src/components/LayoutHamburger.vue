<template>
  <button :class="['hamburger', { opened }]" @click="$emit('click')">
    <div class="inner"></div>
  </button>
</template>

<script setup lang="ts">
defineEmits(['click'])
defineProps({
  opened: {
    type: Boolean,
    default: false,
  },
})
</script>

<style lang="postcss" scoped>
@import '@styles/_mediaquery.pcss';

.hamburger {
  margin-top: 1rem;
  width: 30px;
  height: 30px;
  perspective: 60px;
  cursor: pointer;
  transition-timing-function: linear;
  transition-duration: 0.15s;
  transition-property: opacity, filter;
  z-index: var(--z-index-hamburger);

  @media (--m) {
    display: none;
  }
}

.inner {
  top: 50%;
  display: block;
  margin-top: -2px;
  transition-timing-function: cubic-bezier(0.55, 0.055, 0.675, 0.19);
  transition-duration: 75ms;

  &,
  &:before,
  &:after {
    display: block;
    content: '';
    position: absolute;
    width: 100%;
    height: 2px;
    transition-timing-function: ease;
    transition-duration: 0.15s;
    transition-property: transform;
    border-radius: 2px;
    background: rgb(var(--color-primary));
  }

  &:before,
  &:after {
    transition: transform 0s cubic-bezier(0.645, 0.045, 0.355, 1) 0.1s;
  }

  &:before {
    top: -8px;
    transition: top 75ms ease 0.12s, opacity 75ms ease;
  }

  &:after {
    bottom: -8px;
    transition: bottom 75ms ease 0.12s,
      transform 75ms cubic-bezier(0.55, 0.055, 0.675, 0.19);
  }

  .opened & {
    transition-delay: 0.12s;
    transition-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
    transform: rotate(45deg);

    &:before {
      top: 0;
      transition: top 75ms ease, opacity 75ms ease 0.12s;
      opacity: 0;
    }

    &:after {
      bottom: 0;
      transition: bottom 75ms ease,
        transform 75ms cubic-bezier(0.215, 0.61, 0.355, 1) 0.12s;
      transform: rotate(-90deg);
    }
  }
}
</style>
