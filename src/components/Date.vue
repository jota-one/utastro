<template>
  <span class="session-date">
    <span class="day-name">{{ date.name }}</span> {{ date.day }}<span class="sep">/</span
    >{{ date.month }}<span class="sep">/</span>{{ date.year }}
  </span>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

import type { Session } from '@/types'
import { pad } from '@/utils/format'
import { computed } from 'vue'
import { useLocaleDate } from '@/composables/useLocaleDate'

const props = defineProps({
  session: {
    type: Object as PropType<Session>,
    default: () => ({}),
  },
})

const { getLocaleDate } = useLocaleDate()

const date = computed(() => {
  const dateTime = props.session.start
  return {
    name: getLocaleDate(dateTime).format('dddd'),
    day: pad(dateTime.getDate()),
    month: pad(dateTime.getMonth() + 1),
    year: pad(dateTime.getFullYear()),
  }
})
</script>

<style lang="postcss" scoped>
.session-date {
  display: block;
  font-weight: 900;
  word-spacing: 0;

  .sep {
    padding: 0;
    margin: 0;
    font-weight: 100;
  }

  .day-name {
    font-weight: 300;
  }
}
</style>
