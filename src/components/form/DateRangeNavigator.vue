<template>
  <div class="form-date-range-navigator">
    <div class="row">
      <select v-model="rangeSize" class="dropdown">
        <option value="day">{{ t('date_range_day') }}</option>
        <option value="week">{{ t('date_range_week') }}</option>
        <option value="month">{{ t('date_range_month') }}</option>
        <option value="year">{{ t('date_range_year') }}</option>
      </select>
      <div class="current-range" v-html="currentRange" />
    </div>
    <div class="row">
      <button class="button-as-field text" :disabled="isNow(range, rangeSize)" @click="jumpToNow">
        {{ now }}
      </button>
      <div class="spacer" />
      <button class="button-as-field prev" :disabled="disablePrev" @click="navigatePrev()">
        <Icon name="chevron" class="icon" />
      </button>
      <button class="button-as-field next" :disabled="disableNext" @click="navigateNext()">
        <Icon name="chevron" class="icon" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { ref, computed, watch } from 'vue'
import { useI36n } from '@jota-one/i36n'
import useDateRange from '@/composables/useDateRange'
import Icon from '@/components/Icon.vue'
import type { DateRange, DateRangeSize } from '@/types'

type Props = {
  disablePrev?: boolean
  disableNext?: boolean
  initialDateRange?: DateRange
  initialDateRangeSize?: DateRangeSize
}

const props = defineProps<Props>()
const emit = defineEmits(['range-updated', 'range-size-updated'])

const { t } = useI36n()
const {
  getRangeText,
  getInitalRange,
  getDay,
  getWeek,
  getMonth,
  getNextDay,
  getNextWeek,
  getNextMonth,
  getNextYear,
  getPreviousDay,
  getPreviousWeek,
  getPreviousMonth,
  getPreviousYear,
  getYear,
  isNow,
} = useDateRange()

const rangeSize = ref<DateRangeSize>('day')
const range = ref<DateRange>(getInitalRange())

const updateRange = (newValue: DateRange) => {
  range.value = newValue
  emit('range-updated', range.value)
}

const now = computed(() =>
  rangeSize.value === 'day'
    ? t('common_today')
    : rangeSize.value === 'week'
      ? t('common_this_week')
      : rangeSize.value === 'month'
        ? t('common_this_month')
        : t('common_this_year'),
)

const currentRange = computed(() => getRangeText(range.value, rangeSize.value))

const navigateNext = () => {
  if (rangeSize.value === 'day') {
    updateRange(getNextDay(range.value.from))
  } else if (rangeSize.value === 'week') {
    updateRange(getNextWeek(range.value.from))
  } else if (rangeSize.value === 'month') {
    updateRange(getNextMonth(range.value.from))
  } else if (rangeSize.value === 'year') {
    updateRange(getNextYear(range.value.from))
  }
}

const navigatePrev = () => {
  if (rangeSize.value === 'day') {
    updateRange(getPreviousDay(range.value.from))
  } else if (rangeSize.value === 'week') {
    updateRange(getPreviousWeek(range.value.from))
  } else if (rangeSize.value === 'month') {
    updateRange(getPreviousMonth(range.value.from))
  } else if (rangeSize.value === 'year') {
    updateRange(getPreviousYear(range.value.from))
  }
}

const jumpToNow = () => {
  const now = dayjs()
  updateRange(
    rangeSize.value === 'day'
      ? getDay(now)
      : rangeSize.value === 'week'
        ? getWeek(now)
        : rangeSize.value === 'month'
          ? getMonth(now)
          : getYear(),
  )
}

watch(
  () => props.initialDateRange,
  value => {
    if (value && dayjs.isDayjs(value.from) && dayjs.isDayjs(value.to)) {
      range.value = value
    }
  },
  { immediate: true },
)

watch(
  () => props.initialDateRangeSize,
  value => {
    if (value) {
      rangeSize.value = value
    }
  },
  { immediate: true },
)

watch(
  () => rangeSize.value,
  value => {
    if (value === 'day') {
      updateRange(getDay(range.value.from))
    } else if (value === 'week') {
      updateRange(getWeek(range.value.from))
    } else if (value === 'month') {
      updateRange(getMonth(range.value.from))
    } else if (value === 'year') {
      updateRange(getYear())
    }
    emit('range-size-updated', rangeSize.value)
  },
  { immediate: true },
)
</script>

<style lang="postcss" scoped>
@import '@/assets/styles/_mediaquery.pcss';

.form-date-range-navigator {
  display: flex;
  flex-direction: column;
  gap: var(--size-gap-5);

  @media (--r) {
    flex-direction: row;
  }
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (--r) {
    &:first-child {
      flex: 1;
    }
  }
}

.spacer {
  flex: 1;
}

.current-range {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 0.25rem;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: capitalize;
  color: rgb(var(--color-neutral-darkest));
  border-radius: 0.35rem;

  @media (--r) {
    justify-content: center;
    margin: 0 0.25rem 0 0.5rem;
    border: 1px solid rgb(var(--color-neutral-lightest));
    background: rgba(var(--color-white), 0.4);
  }
}

.button-as-field {
  padding: 0.4rem;
  cursor: pointer;

  &.text {
    padding-left: 1rem;
    padding-right: 1rem;
    line-height: 1.5rem;
  }
}

.prev {
  margin-left: 0.5rem;
  margin-right: -1px;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;

  &:hover {
    z-index: 1;
  }

  .icon {
    transform: rotate(180deg);
  }
}

.next {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
</style>
