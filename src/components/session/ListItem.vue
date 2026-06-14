<template>
  <li
    :class="[
      'session-list-item',
      {
        subscribed,
        paused: session.paused,
        cancelled: session.cancelled,
        coachable: isStaffUser,
      },
    ]"
  >
    <SessionCoachStrip
      v-if="isStaffUser && !session.paused && !session.cancelled"
      :session="session"
      class="coach-strip"
    />
    <div class="left">
      <Icon
        :name="subscribed ? 'success' : 'sneaker'"
        class="session-icon"
        :color-theme="subscribed ? 'subscribed' : getSessionTheme(session)"
      />
    </div>
    <div class="head">
      <h3 class="title">
        {{ title }}
        <DateDisplay class="date" :session="session" />
      </h3>
      <TagList>
        <Tag v-for="tag in session.tags" :key="tag.label" :label="tag.label" />
      </TagList>
    </div>
    <div class="body">
      <SessionTimeAndPlace :session="session" :subscribed="subscribed" class="time-place" />
      <div v-if="!session.paused && !session.cancelled" class="subscribe">
        <template v-if="session.moreInfo">
          <button class="more-info" @click="toggleMoreInfo(session.id)">
            <Icon name="info" class="icon" />
          </button>
          <div v-if="openedMoreInfos.includes(session.id)" class="info-box">
            <TipBox color-theme="info" closeable @close="toggleMoreInfo(session.id)">
              <div v-html="session.moreInfo" />
            </TipBox>
          </div>
        </template>
        <div v-if="isFull(session)" class="subscription-info" v-html="t('session_full')" />
        <div
          v-else-if="isAlmostFull(session)"
          class="subscription-info"
          v-html="t('session_almost_full')"
        />
        <div
          v-else-if="!canSubscribe(session) && !isFull(session)"
          class="subscription-info"
          v-html="
            t('sessions_subscription_starting', {
              date: dayjs(session.subscriptions.starting).format('DD.MM.YYYY'),
              time: dayjs(session.subscriptions.starting).format('HH:mm'),
            })
          "
        />
        <a
          no-prefetch
          :class="`button ${
            subscribed ? 'secondary subscribed' : canSubscribe(session) ? 'primary' : 'secondary'
          }`"
          :href="sessionDetailPage"
        >
          <Icon name="map" />
          <template v-if="canSubscribe(session) && !subscribed">
            {{ t('sessions_subscription_button') }}
          </template>
          <template v-else>
            {{ t('sessions_detail_button') }}
          </template>
        </a>
        <button
          v-if="subscribed"
          class="button primary unsubscribe subscribed"
          @click="openModal('session-unsubscribe', { sessionId: session.id })"
        >
          {{ t('sessions_unsubscribe_button') }}
        </button>
      </div>
      <div v-else-if="session.paused" class="subscribe paused">
        <button class="more-info" @click="toggleMoreInfo(session.id)">
          <Icon name="info" class="icon" />
        </button>
        <div v-if="openedMoreInfos.includes(session.id)" class="info-box">
          <TipBox color-theme="info" closeable @close="toggleMoreInfo(session.id)">
            <div v-html="t('sessions_paused_info')" />
          </TipBox>
        </div>
      </div>
      <div v-else-if="session.cancelled" class="subscribe cancelled">
        {{ t(`sessions_cancelled_${props.session.cancelled}_title`) }}
      </div>
    </div>
  </li>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { ref, computed } from 'vue'
import { useI36n } from '@jota-one/i36n'
import { useAuth } from '@/composables/useAuth'
import { useUserProfile } from '@/composables/useUserProfile'
import { useSessions } from '@/composables/useSessions'
import useModal from '@/composables/useModal'
import SessionCoachStrip from '@/components/session/CoachStrip.vue'
import SessionTimeAndPlace from '@/components/session/TimeAndPlace.vue'
import Icon from '@/components/Icon.vue'
import DateDisplay from '@/components/Date.vue'
import TagList from '@/components/TagList.vue'
import Tag from '@/components/Tag.vue'
import TipBox from '@/components/TipBox.vue'
import type { Session } from '@/types'

const { t } = useI36n()

const { isAuthenticated, isStaffUser } = useAuth()
const { subscribedSessions } = useUserProfile()
const { getSessionTheme, canSubscribe, isAlmostFull, isFull } = useSessions()
const { openModal } = useModal()

type Props = {
  session: Session
}

const props = withDefaults(defineProps<Props>(), {
  session: () => ({}) as Session,
})

const openedMoreInfos = ref<number[]>([])

const title = computed(() =>
  props.session.paused
    ? t('sessions_paused_title')
    : props.session.title || t('sessions_default_title'),
)

const sessionDetailPage = computed(() => {
  const lang = window.location.pathname.split('/').filter(Boolean)[0] || 'fr'
  return `/${lang}/session/${props.session.id}`
})

const subscribed = computed(
  () =>
    isAuthenticated.value &&
    subscribedSessions.value.map(s => s.eventId).includes(props.session.id),
)

const toggleMoreInfo = (sessionId: number) => {
  if (openedMoreInfos.value.includes(sessionId)) {
    openedMoreInfos.value = openedMoreInfos.value.filter(id => id !== sessionId)
  } else {
    openedMoreInfos.value.push(sessionId)
  }
}
</script>

<style lang="postcss" scoped>
@import '@/assets/styles/_mediaquery.pcss';

.session-list-item {
  position: relative;
  list-style: none;
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: auto 1fr;
  column-gap: var(--size-gap-20);
  border-top: 1px dashed rgba(var(--color-black), 0.5);
  overflow: hidden;

  &.coachable:not(.subscribed):not(.paused):not(.cancelled) {
    background: rgba(var(--color-neutral-lightest), 0.3);
  }

  &:before {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background: rgb(var(--color-primary));
    z-index: -1;
    will-change: transform;
    transform: translate(0, 101%);
    transition: transform 0.2s linear;

    @media (--r) {
      transform: translate(101%, 0);
    }
  }

  &.subscribed:before {
    transform: translate(0, 0);
  }

  &.paused,
  &.cancelled {
    background-position: 0 -1rem;
    background-size: 100% calc(100% + 2rem);

    .left,
    .time-place {
      filter: grayscale(1);
      opacity: 0.75;
    }
  }

  &.paused {
    background: rgba(255, 252, 0, 0.2);
    background-image: repeating-linear-gradient(
      -55deg,
      rgba(255, 252, 0, 0.2),
      rgba(255, 252, 0, 0.2) 1rem,
      transparent 1rem,
      transparent 2rem
    );
  }

  &.cancelled {
    background: rgba(0, 189, 255, 0.2);
    background-image: repeating-linear-gradient(
      -55deg,
      rgba(200, 200, 200, 0.2),
      rgba(200, 200, 200, 0.2) 1rem,
      transparent 1rem,
      transparent 2rem
    );
  }
}

.coach-strip {
  grid-row: 1;
  grid-column: 1 / span 2;
}

.left {
  grid-column: 1;
  grid-row: 2;
  position: relative;
  padding: 1.17rem 0 0 1.17rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;

  @media (--m) {
    grid-row: 2 / span 2;
    padding-bottom: 1.17rem;
  }
}

.session-icon {
  width: 2.75rem;
  height: 2.75rem;
  color: rgb(var(--color-primary));

  .subscribed & {
    color: rgb(var(--color-white));
  }
}

.subscribed-icon {
  display: none;
  width: 2rem;
  height: 2rem;
  color: rgb(var(--color-white));

  .subscribed & {
    display: block;
  }
}

.head,
.body {
  grid-column: 2;

  @media (--m) {
    grid-column: 2;
  }
}

.head,
.body {
  display: flex;
  justify-content: space-between;
  gap: var(--size-gap-10);
  padding-right: 1.17rem;
}

.head {
  grid-row: 2;
  padding-top: 1.17rem;
  align-items: flex-start;

  .title {
    font-size: 0.9rem;
    line-height: 1.1rem;
    font-weight: 500;
    flex: 1;
  }

  .date {
    font-size: 1.17rem;
    line-height: 2rem;
  }
}

.body {
  grid-row: 3;
  flex-direction: column;
  gap: var(--size-gap-20);
  padding-bottom: 1.17rem;

  @media (--xs-only) {
    grid-column: 2;
    margin-left: -0.5rem;
  }

  @media (--xl) {
    flex-direction: row;
    align-items: flex-end;
  }
}

.time-place {
  font-size: 0.94rem;
  margin: var(--size-gap-20) 0 0.5rem;
}

.subscribe {
  display: flex;
  flex-wrap: wrap;
  gap: var(--size-gap-10);

  &.paused,
  &.cancelled {
    justify-content: flex-end;
  }

  &.cancelled {
    font-weight: 600;
  }

  @media (--m) {
    justify-content: flex-end;
  }
}

.subscription-info {
  margin-top: 0.2rem;
  font-size: 0.9rem;
  line-height: 1.1rem;
  color: rgb(var(--color-neutral-dark));
}

.more-info {
  cursor: pointer;

  &:hover {
    color: rgb(var(--color-info));

    .subscribed & {
      color: rgb(var(--color-white));
    }
  }

  .icon {
    width: 2rem;
    height: 2rem;
  }
}

.button {
  flex-shrink: 0;
  white-space: nowrap;

  &.unsubscribe {
    display: none;
    color: rgb(var(--color-white));

    .subscribed & {
      display: initial;
    }
  }
}

.info-box {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--color-white));
  z-index: 1;

  & > * {
    width: 100%;
    height: 100%;
  }
}
</style>
