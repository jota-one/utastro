<template>
  <div :class="['session-aside-widget', { collapsed, subscribed }]">
    <h3 class="title" @click="collapsed = !collapsed">
      {{ title }}
      <button class="collapse-toggle">
        <Icon name="chevron" class="icon" />
      </button>
    </h3>
    <div v-if="$slots.footer" class="collapsible">
      <div class="wrapper">
        <slot />
      </div>
      <div v-if="$slots.footer" class="footer">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Icon from '@/components/Icon.vue'

type Props = {
  title: string
  subscribed?: boolean
  collapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  subscribed: false,
  collapsed: true,
})

const collapsed = ref(props.collapsed)
</script>

<style lang="postcss" scoped>
@import '@styles/_mediaquery.pcss';

.session-aside-widget {
  position: relative;
  padding: 2rem 1.76rem;
  color: rgba(var(--color-white), 0.7);
  transition: color 0.2s linear;
  overflow: hidden;

  &:before {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background: rgb(var(--color-black));
    z-index: -1;
  }

  &:after {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background: rgb(var(--color-primary));
    z-index: -1;
    will-change: transform;
    transform: translate(0, 100%);
    transition: transform 0.2s linear;
  }

  &.subscribed {
    color: rgb(var(--color-black));

    &:after {
      transform: translate(0, 0);
    }
  }
}

.title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.4rem;
  font-weight: 800;
  color: rgb(var(--color-white));
  cursor: pointer;

  @media (--r) {
    pointer-events: none;
    cursor: initial;
  }
}

.collapse-toggle {
  pointer-events: none;

  .icon {
    width: 2rem;
    height: 2rem;
    color: rgba(var(--color-white), 0.5);
    transform: rotate(90deg);
    transition: transform 0.2s linear;

    @media (--r) {
      display: none;
    }

    .collapsed & {
      transform: rotate(0deg);
    }
  }
}

.collapsible {
  max-height: 100vh;
  overflow: hidden;
  transition: max-height 0.3s linear;

  .collapsed & {
    max-height: 0;

    @media (--r) {
      max-height: 100vh;
    }
  }

  .wrapper {
    padding-top: 1rem;
  }
}

.footer {
  padding-top: 2rem;
}
</style>
