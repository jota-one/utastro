<template>
  <a :href="href" :class="['arrow-link', { asButton, noPadding, reverse }]" :target="target">
    <span class="label">{{ label }}</span>
    <svg class="icon" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.9317 10.6465L12.7852 5.50004L13.4981 4.78715L20.711 12L13.4981 19.2129L12.7852 18.5L17.9317 13.3536L18.7852 12.5L17.5781 12.5L5.07812 12.5L5.07812 11.5L17.5781 11.5L18.7852 11.5L17.9317 10.6465Z"
        fill="currentColor"
      />
    </svg>
  </a>
</template>

<script setup lang="ts">
type Props = {
  href: string
  label: string
  target?: string
  asButton?: boolean
  noPadding?: boolean
  reverse?: boolean,
}

withDefaults(defineProps<Props>(), {
  target: '_self'
})
</script>

<style lang="postcss" scoped>
.arrow-link {
  display: inline-flex;
  align-items: center;
  padding: 0.9rem 0;
  font-weight: 500;
  color: rgb(var(--color-primary));

  &.noPadding {
    padding: 0;
  }

  &.asButton {
    padding-left: 1.17rem;
    padding-right: 1.17rem;
    color: rgb(var(--color-white));
    background: rgb(var(--color-primary));
    border-radius: 2rem;
    box-shadow: 0 0 0.6rem rgba(var(--color-black), 0.15);
    transition: all 0.1s linear;

    &:hover {
      background: rgb(var(--color-primary-hover));
      box-shadow: 0 0 0.6rem rgba(var(--color-primary), 0.75);
      .icon {
        transform: translateX(0.25rem);
        transition: transform 0.2s linear;
      }

      &.reverse .icon {
        transform: rotate(180deg) translateX(0.25rem);
      }
    }
  }
}

.label {
  order: 1;
}

.icon {
  order: 2;
  margin-left: 0.25rem;
  stroke-width: 1px;
  stroke: currentColor;

  .reverse & {
    order: 0;
    transform: rotate(180deg);
    margin-left: 0;
    margin-right: 0.25rem;
  }
}
</style>
