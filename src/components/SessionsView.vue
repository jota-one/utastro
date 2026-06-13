<template>
  <div class="sessions">
    <div class="wrapper container">
      <div class="aside">
        <div class="sticky">
          <SessionCityWatchWidget
            v-if="forceShowCityWatchWidget"
            class="city-watch-top"
            :city="filteredCities[0]"
          >
            <template #sub-title>
              <div style="display: inline-flex">
                <Badge :label="filteredCities[0].label" color-theme="success" />
              </div>
            </template>
          </SessionCityWatchWidget>
          <FacebookWidget v-if="asideType === 'facebookWidget'" />
          <SessionAsideWidget
            v-if="asideType === 'facebookLink'"
            :title="t('sessions_aside_facebook_title')"
          >
            <div v-html="t('sessions_aside_facebook_text')" />
            <template #footer>
              <ArrowLink
                as-button
                target="_blank"
                :href="t('sessions_aside_facebook_link_url')"
                :label="t('sessions_aside_facebook_link_label')"
              />
            </template>
          </SessionAsideWidget>
          <SessionCityWatchWidget
            v-if="asideType === 'citySubscription' && city"
            :city="city"
          />
        </div>
      </div>
      <div>
        <SessionFilters
          :single-city="city"
          @empty-period-text-updated="emptyPeriodText = $event"
        />
        <div class="list">
          <SessionList
            :single-city="city"
            :loading="!sessionsLoaded"
            :sessions="filteredSessions"
            :empty-period-text="emptyPeriodText"
            :max="listMax"
          />
        </div>
        <SessionCityWatchWidget
          v-if="forceShowCityWatchWidget"
          class="city-watch-bottom"
          :city="filteredCities[0]"
          uncollapsed
        >
          <template #sub-title>
            <div style="display: inline-flex">
              <Badge :label="filteredCities[0].label" color-theme="success" />
            </div>
          </template>
        </SessionCityWatchWidget>
      </div>
    </div>
    <Modal id="session-unsubscribe">
      <SessionUnsubscribeConfirm />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { ref, computed, onMounted } from 'vue'
import { useI36n } from '@jota-one/i36n'
import { useCities } from '@/composables/useCities'
import { useSessions } from '@/composables/useSessions'
import useDateRange from '@/composables/useDateRange'
import SessionFilters from '@/components/session/Filters.vue'
import SessionList from '@/components/session/List.vue'
import SessionAsideWidget from '@/components/session/AsideWidget.vue'
import SessionCityWatchWidget from '@/components/session/CityWatchWidget.vue'
import SessionUnsubscribeConfirm from '@/components/session/UnsubscribeConfirm.vue'
import FacebookWidget from '@/components/FacebookWidget.vue'
import Modal from '@/components/Modal.vue'
import Badge from '@/components/Badge.vue'
import ArrowLink from '@/components/ArrowLink.vue'
import type { City, DateRangeSize } from '@/types'

export type AsideType = 'citySubscription' | 'facebookLink' | 'facebookWidget'

type Props = {
  asideType: AsideType
  city?: City
  initialDateRangeSize?: DateRangeSize
  listMax?: number
}

const props = withDefaults(defineProps<Props>(), {
  asideType: 'facebookLink',
  city: undefined,
  initialDateRangeSize: 'week',
  listMax: -1,
})

const { t } = useI36n()
const {
  filteredTags,
  sessions,
  sessionsLoaded,
  sessionsDateRange,
  sessionsDateRangeSize,
  getNextAvailableSession,
  loadSessions,
  sessionMatchesCities,
  sessionMatchesTags,
} = useSessions()
const { filteredCities, loadCities } = useCities()
const { isInRange } = useDateRange()

const emptyPeriodText = ref('')

const cities = computed(() => (props.city ? [props.city] : filteredCities.value))

const filteredSessions = computed(() =>
  (sessions.value || []).filter(session => {
    const matchesCities = sessionMatchesCities(session, cities.value)
    const matchesTags = sessionMatchesTags(session, filteredTags.value)
    const matchesDateRange = isInRange(dayjs(session.start), sessionsDateRange.value)
    return matchesDateRange && matchesCities && matchesTags
  }),
)

const forceShowCityWatchWidget = computed(
  () =>
    !getNextAvailableSession() &&
    props.asideType !== 'citySubscription' &&
    filteredCities.value.length > 0,
)

onMounted(async () => {
  sessionsDateRangeSize.value = props.initialDateRangeSize
  await loadCities()
  await loadSessions()
})
</script>

<style lang="postcss" scoped>
@import '@/assets/styles/_mediaquery.pcss';

.wrapper {
  display: grid;
  column-gap: var(--size-gap-50);

  @media (--l) {
    grid-template-rows: auto 1fr auto;
    grid-template-columns: 1fr 16rem;
  }
}

.aside {
  padding: var(--size-gap-40) 0 var(--size-gap-20);

  @media (--l) {
    grid-row: 1 / span 2;
    grid-column: 2;
  }
}

.sticky {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (--l) {
    position: sticky;
    top: var(--size-gap-20);
  }
}

.city-watch-top {
  display: none;

  @media (--l) {
    display: block;
  }
}

.city-watch-bottom {
  display: block;

  @media (--l) {
    display: none;
  }
}

.list {
  @media (--l) {
    grid-row: 2;
    grid-column: 1;
  }
}
</style>
