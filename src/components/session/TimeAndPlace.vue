<template>
  <div class="session-time-place">
    <div class="detail">
      <Icon :class="['icon time', { subscribed }]" name="time" />
      <div class="text">
        {{ startTime }}
        <template v-if="endTime"> - {{ endTime }} </template>
      </div>
    </div>
    <div class="detail">
      <Icon class="icon place" name="marker" :color-theme="colorTheme" />
      <div :class="['text', { showAddress }]">
        <a
          no-prefetch
          :href="getCityPageHref()"
        >
          <Badge
            :label="cities[session.cityId]?.label"
            :color-theme="colorTheme"
          />
        </a>
        <div class="location">
          {{ session.location.label }}
        </div>
        <div v-if="session.location.address && showAddress" class="address">
          <template
            v-for="(line, i) in session.location.address.split('\n')"
            :key="`line-${i}`"
          >
            {{ line }}<br />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCities } from '@/composables/useCities'
import { useSessions } from '@/composables/useSessions'
import Icon from '@/components/Icon.vue'
import Badge from '@/components/Badge.vue'
import type { Session } from '@/types'

interface Props {
  session: Session
  subscribed?: boolean | null
  showAddress?: boolean
}

const { cities } = useCities()
const { getSessionTheme } = useSessions()

const props = defineProps<Props>()

const pad = (n: number) => String(n).padStart(2, '0')

const startTime = computed(() => getTime(props.session.start))
const endTime = computed(() => props.session.end && getTime(props.session.end))

const getCityPageHref = () => {
  const lang = window.location.pathname.split('/').filter(Boolean)[0] || 'fr'
  const slug = cities.value[props.session.cityId]?.slug
  return slug ? `/${lang}/city/${slug}` : undefined
}

const colorTheme = computed(() =>
  props.subscribed ? 'subscribed' : getSessionTheme(props.session),
)

const getTime = (date: Date) => {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  return `${pad(hours)}:${pad(minutes)}`
}
</script>

<style lang="postcss" scoped>
.session-time-place {
  display: flex;
  flex-direction: column;
  gap: var(--size-gap-10);
}

.detail {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--size-gap-5);
}

.icon {
  grid-column: 1;
  color: rgb(var(--color-neutral));

  width: 2rem;
  height: 2rem;

  &.time {
    height: 1.6rem;
  }
}

.text {
  grid-column: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  row-gap: var(--size-gap-5);
  column-gap: var(--size-gap-10);

  &.showAddress {
    margin-top: 0.3rem;
  }
}

.address {
  flex-basis: 100%;
  opacity: 0.6;
}
</style>
