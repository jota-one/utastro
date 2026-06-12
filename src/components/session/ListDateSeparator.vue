<template>
  <li class="session-list-date-marker">
    {{ display }}
  </li>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { computed } from 'vue'
import useDateRange from '@/composables/useDateRange'
import type { DateRangeSize } from '@/types'

interface Props {
  date: Date
  unit: DateRangeSize
}

const props = defineProps<Props>()

const { getRangeText } = useDateRange()
const display = computed(() => {
  const day = dayjs(props.date)
  const range = { from: day, to: day }
  return getRangeText(range, props.unit)
})
</script>

<style lang="postcss" scoped>
.session-list-date-marker {
  position: sticky;
  top: 0;
  list-style: none;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  font-weight: 500;
  background: rgb(var(--color-white));
  border-bottom: 1px solid rgb(var(--color-neutral-lightest));
  z-index: var(--z-index-session-list-separator);
}
</style>
