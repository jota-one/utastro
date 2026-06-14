<template>
  <div class="session-filters">
    <div class="bg" />
    <FormFieldWrapper
      :label="t('sessions_filter_locations_label')"
      hide-error
      class="filter"
    >
      <VueMultiselect
        v-if="!singleCity"
        v-model="filteredCities"
        :options="sortedCities"
        :multiple="true"
        :close-on-select="true"
        placeholder=""
        select-label=""
        selected-label=""
        deselect-label=""
        label="label"
        track-by="id"
      />
      <VueMultiselect
        v-else
        v-model="singleCityModel"
        disabled
        :options="sortedCities"
        :multiple="true"
        :close-on-select="true"
        placeholder=""
        select-label=""
        selected-label=""
        deselect-label=""
        label="label"
        track-by="id"
      />
    </FormFieldWrapper>
    <FormFieldWrapper
      v-if="tags?.length"
      :label="t('sessions_filter_tags_label')"
      hide-error
      class="filter"
    >
      <VueMultiselect
        v-model="filteredTags"
        :options="tags"
        :multiple="true"
        :close-on-select="true"
        placeholder=""
        select-label=""
        selected-label=""
        deselect-label=""
        label="label"
        track-by="id"
      />
    </FormFieldWrapper>
    <FormFieldWrapper
      v-if="config.dateRangeNav"
      class="navigator"
      :label="t('sessions_navigate_label')"
      hide-error
    >
      <FormDateRangeNavigator
        :initial-date-range="sessionsDateRange"
        :initial-date-range-size="sessionsDateRangeSize"
        :disable-prev="isNow(sessionsDateRange, sessionsDateRangeSize)"
        @range-updated="onRangeUpdate"
        @range-size-updated="onRangeSizeUpdate"
      />
    </FormFieldWrapper>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import VueMultiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.css'
import { useI36n } from '@jota-one/i36n'
import config from '@/config'
import { useCities } from '@/composables/useCities'
import { useSessions } from '@/composables/useSessions'
import useDateRange from '@/composables/useDateRange'
import FormFieldWrapper from '@/components/form/FieldWrapper.vue'
import FormDateRangeNavigator from '@/components/form/DateRangeNavigator.vue'
import type { City, DateRange, DateRangeSize } from '@/types'

type Props = {
  singleCity?: City
}

const emit = defineEmits(['empty-period-text-updated'])
const props = defineProps<Props>()

const { t } = useI36n()
const { cities, filteredCities } = useCities()
const { filteredTags, sessionsDateRange, sessionsDateRangeSize, tags } = useSessions()
const { getRangeText, isNow } = useDateRange()

const singleCityModel = ref(props.singleCity ? [props.singleCity] : [])

const sortedCities = computed(() =>
  Object.values(cities.value).sort((a, b) =>
    a.label > b.label ? 1 : a.label === b.label ? 0 : -1,
  ),
)

const updateEmptyPeriodText = () => {
  const text = getRangeText(sessionsDateRange.value, sessionsDateRangeSize.value, true)
  emit('empty-period-text-updated', text)
}

const onRangeUpdate = (range: DateRange) => {
  sessionsDateRange.value = range
  updateEmptyPeriodText()
}

const onRangeSizeUpdate = (rangeSize: DateRangeSize) => {
  sessionsDateRangeSize.value = rangeSize
  updateEmptyPeriodText()
}
</script>

<style lang="postcss" scoped>
@import '@/assets/styles/_mediaquery.pcss';

.session-filters {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  column-gap: var(--size-gap-20);
  padding-bottom: var(--size-gap-20);
  border-bottom: 1px dotted rgb(var(--color-neutral-lighter));
}

.filter {
  flex: 1;
  flex-basis: calc(50% - var(--size-gap-10));
}

.navigator {
  flex-basis: 100%;
}

.bg {
  position: absolute;
  top: 0;
  left: 1rem;
  bottom: 0;
  right: 1rem;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;

  &:after {
    content: '';
    position: absolute;
    top: 4rem;
    right: 0;
    bottom: -100%;
    left: 0;
    display: block;
    border-radius: 100%;
    background: rgb(var(--color-neutral-lightest));
    filter: blur(1rem);
    opacity: 0.3;
  }
}
</style>
