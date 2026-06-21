<template>
  <div class="session-list">
    <header class="results">
      <div>
        <b>{{ citiesCount }}</b>
        {{ t('sessions_locations') }}
      </div>
      <div style="flex-grow: 1" />
      <div>
        <b>{{ sessions.length }}</b>
        {{ t('sessions_label') }}
      </div>
    </header>
    <ul v-if="sessions?.length">
      <template v-for="(session, index) in renderedItems" :key="session.id">
        <SessionListDateSeparator
          v-if="displaySeparator(index, listSeparatorUnit)"
          :date="session.start"
          :unit="listSeparatorUnit"
        />
        <SessionListItem :session="session" class="session-list-item" />
      </template>
    </ul>
    <EmptyList
      v-else
      icon="sneaker"
      :loading="loading"
      :loading-label="t('sessions_loading')"
      :empty-label="
        emptyPeriodText
          ? t('sessions_empty_period', { period: emptyPeriodText })
          : t('sessions_empty')
      "
    >
      <div class="next-available">
        <button
          v-if="nextAvailableSessionDate"
          class="button secondary"
          @click="jumpToNextAvailableSession(singleCity)"
        >
          {{ t('sessions_next_available', { date: nextAvailableSessionDate }) }}
        </button>
      </div>
    </EmptyList>
    <div v-if="showLoadMoreButton" class="load-more">
      <div
        class="text"
        v-html="
          t('common_load_more_counts', {
            start: renderListStart + 1,
            stop: renderListStop,
            total: sessions.length,
          })
        "
      />
      <button class="button secondary" @click="loadMore">
        {{
          t('common_load_more_button', {
            size: Math.min(sessions.length - renderListStop, LIST_CHUNK_LENGTH),
          })
        }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { ref, computed, onMounted } from 'vue'
import { useI36n } from '@jota-one/i36n'
import { useLocaleDate } from '@/composables/useLocaleDate'
import { useSessions } from '@/composables/useSessions'
import SessionListItem from '@/components/session/ListItem.vue'
import SessionListDateSeparator from '@/components/session/ListDateSeparator.vue'
import EmptyList from '@/components/EmptyList.vue'
import type { City, DateRangeSize, Session } from '@/types'

const { t } = useI36n()
const { getLocaleDate } = useLocaleDate()
const {
  sessionsDateRangeSize,
  getNextAvailableSession,
  jumpToNextAvailableSession,
} = useSessions()

interface Props {
  loading?: boolean
  emptyPeriodText?: string
  max?: number
  sessions: Session[]
  singleCity?: City
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyPeriodText: undefined,
  max: -1,
  sessions: () => [],
  singleCity: undefined,
})

const LIST_CHUNK_LENGTH = 25
const renderListStart = ref(0)
const renderListStop = ref(LIST_CHUNK_LENGTH)
const listSeparatorUnit = ref<DateRangeSize>('day')

const showLoadMoreButton = computed(() => {
  if (props.max > 0) {
    return renderListStop.value < props.max
  }

  return props.sessions.length > renderListStop.value
})

const renderedItems = computed(() =>
  props.sessions.slice(renderListStart.value, renderListStop.value),
)

const citiesCount = computed(
  () =>
    props.sessions.reduce((cities: number[], session) => {
      if (!cities.includes(session.cityId)) {
        cities.push(session.cityId)
      }
      return cities
    }, []).length,
)

const nextAvailableSessionDate = computed(() => {
  const next = getNextAvailableSession(props.singleCity)

  if (next) {
    const date = dayjs(next.start)
    return date.isSame(dayjs(), 'year')
      ? getLocaleDate(date).format('DD MMMM')
      : getLocaleDate(date).format('DD MMMM YYYY')
  }
})

const loadMore = () => {
  if (
    props.max > renderListStop.value &&
    props.max - renderListStop.value < LIST_CHUNK_LENGTH
  ) {
    renderListStop.value = props.max
  } else {
    renderListStop.value += LIST_CHUNK_LENGTH
  }
}

const displaySeparator = (index: number, unit: DateRangeSize) => {
  return sessionsDateRangeSize.value === 'day'
    ? false
    : index === 0
      ? true
      : !getLocaleDate(renderedItems.value[index - 1].start).isSame(
          getLocaleDate(renderedItems.value[index].start),
          unit,
        )
}

onMounted(() => {
  if (props.max > 0 && props.max < renderListStop.value) {
    renderListStop.value = props.max
  }
})
</script>

<style lang="postcss" scoped>
.session-list {
  display: flex;
  flex-direction: column;
}

.session-list-item {
  margin-bottom: 1rem;
}

.results {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0.75rem;
  font-size: 0.8rem;
}

.load-more {
  margin-top: var(--size-gap-50);
  align-self: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--size-gap-20);

  .text {
    font-size: 0.9rem;
    color: rgb(var(--color-neutral-dark));
  }
}
</style>
