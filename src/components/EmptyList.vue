<template>
  <div :class="['empty-list', { loading }]">
    <EmptyListIcon
      :icon="icon"
      big
      empty
      :loading="loading"
      bg-color="rgb(var(--color-neutral-lightest))"
      class="icon"
    />
    <h4 class="text">
      <template v-if="loading">
        {{ loadingLabel }}
      </template>
      <template v-else>
        {{ emptyLabel }}
      </template>
    </h4>
    <div class="custom">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import EmptyListIcon from '@/components/EmptyListIcon.vue'
interface Props {
  icon: string
  emptyLabel: string
  loading?: boolean
  loadingLabel?: string
}

defineProps<Props>()
</script>

<style lang="postcss" scoped>
.empty-list {
  min-height: 20rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(var(--color-neutral-light));
  background: rgb(var(--color-neutral-lightest));
}

.icon {
  padding-bottom: var(--size-gap-10);
}

.text {
  font-size: 1.1rem;
  font-weight: 500;
}

.custom {
  padding-top: 1rem;
}
</style>
