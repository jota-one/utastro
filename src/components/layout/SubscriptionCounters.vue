<template>
  <div class="subscription-counters">
    <div :class="['subscription-counter', { on: citiesCount }]">
      <a :href="route('my-account') + '#cities'">
        <Icon name="city" class="icon city" />
      </a>
      <Counter
        :count="citiesCount"
        :color-theme="citiesCount ? 'success' : undefined"
        class="counter"
      />
    </div>
    <div :class="['subscription-counter', { on: subscribedSessionsCount }]">
      <a :href="route('my-account') + '#sessions'">
        <Icon name="sneaker" class="icon sneaker" />
      </a>
      <Counter
        :count="subscribedSessionsCount"
        :color-theme="subscribedSessionsCount ? 'success' : undefined"
        class="counter"
      />
    </div>
    <div v-if="showCoach" :class="['subscription-counter', { on: coachSessionsCount }]">
      <a :href="route('my-account') + '#sessions'">
        <Icon name="coach" class="icon coach" />
      </a>
      <Counter
        :count="coachSessionsCount"
        :color-theme="coachSessionsCount ? 'success' : undefined"
        class="counter"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from '@components/Icon.vue'
import Counter from '@components/Counter.vue'
import { useRoutes } from '@composables/useRoutes'

type Props = {
  citiesCount?: number
  subscribedSessionsCount?: number
  coachSessionsCount?: number
  showCoach?: boolean
}

const {
  citiesCount = 0,
  subscribedSessionsCount = 0,
  coachSessionsCount = 0,
  showCoach = false,
} = defineProps<Props>()

const { route } = useRoutes()
</script>

<style lang="postcss" scoped>
.subscription-counters {
  display: flex;
  align-items: center;
  gap: var(--size-gap-20);
  margin-right: 1rem;
}

.subscription-counter {
  position: relative;
  height: 2rem;
  width: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover .icon {
    color: rgb(var(--color-primary));
  }
}

.counter {
  position: absolute;
  top: -10px;
  right: -10px;
}

.icon {
  color: rgba(var(--color-neutral), 0.5);
  transition: color 0.1s linear;

  .on & {
    color: rgba(var(--color-primary), 0.75);
  }

  &.city {
    height: 1.8rem;
    width: 1.8rem;
  }

  &.sneaker,
  &.coach {
    margin-top: 0.5rem;
    height: 2.25rem;
    width: 2.25rem;
  }
}
</style>
