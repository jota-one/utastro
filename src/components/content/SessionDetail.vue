<template>
  <div :class="['session-detail container', { subscribed, paused }]">
    <SessionCoachStrip
      v-if="sessionDetail && isStaffUser"
      :session="sessionDetail"
      class="coach-strip"
    />
    <AngledBoxesRow
      class="boxes"
      :boxes="['main', 'map']"
      :sep-color-theme="colorTheme"
    >
      <template #box="{ item }">
        <div v-if="item === 'main'" class="main">
          <div class="tags">
            <TagList class="tag-list">
              <Tag
                v-for="tag in sessionDetail?.tags || []"
                :key="tag.label"
                :label="tag.label"
              />
            </TagList>
          </div>

          <div class="title">
            <EmptyListIcon
              :icon="subscribed ? 'success' : 'sneaker'"
              :loading="!sessionDetail"
              :color-theme="subscribed ? 'subscribed' : colorTheme"
              bg-color="rgb(var(--color-black))"
              class="icon"
            />
            <h1 v-if="sessionDetail" class="text">
              {{ title }}
              <DateDisplay v-if="sessionDetail" :session="sessionDetail" />
            </h1>
          </div>

          <SessionTimeAndPlace
            v-if="sessionDetail"
            :session="sessionDetail"
            :subscribed="subscribed"
            show-address
            class="details"
          />

          <!-- <div v-if="sessionDetail" class="location-link">
            <a
              :href="`https://www.google.com/maps?q=${sessionDetail.location.coords.join(',')}`"
              target="_blank"
              rel="noopener noreferrer"
              class="button secondary"
            >
              {{ t('common_open_map') }}
            </a>
          </div> -->

          <div class="spacer" />

          <div v-if="!paused" class="subscription">
            <button
              v-if="displaySubscribeButton"
              :class="['button primary big subscribe', { subscribed }]"
              @click="onSubscribeButtonClick"
            >
              <template v-if="subscribed">
                {{ t('sessions_unsubscribe_button') }}
              </template>
              <template v-else>
                {{ t('session_subscribe_button') }}
              </template>
            </button>
            <div v-if="!subscribed" class="subscription-info">
              <span
                v-if="sessionDetail && isFull(sessionDetail)"
                v-html="t('session_full')"
              />
              <span
                v-else-if="sessionDetail && isAlmostFull(sessionDetail)"
                v-html="t('session_almost_full')"
              />
              <span
                v-else-if="sessionDetail && !canSubscribe(sessionDetail)"
                v-html="
                  t('sessions_subscription_starting', {
                    date: dayjs(sessionDetail.subscriptions.starting).format(
                      'DD.MM.YYYY',
                    ),
                    time: dayjs(sessionDetail.subscriptions.starting).format(
                      'HH:mm',
                    ),
                  })
                "
              />
            </div>
          </div>

          <div
            v-if="
              sessionDetail &&
              !paused &&
              !subscribed &&
              !isFull(sessionDetail) &&
              !canSubscribe(sessionDetail)
            "
            class="watch-city"
          >
            <button
              v-if="!watching"
              :class="['button primary watch-button', { subscribed: watching }]"
              @click="onWatchButtonClick"
            >
              {{ t('session_subscribe_city_button') }}
            </button>
            <div v-if="watching" class="watching-info">
              <Icon name="success" color-theme="success" />
              <div>
                <div
                  v-html="
                    t('sessions_aside_city_subscribed_text_1', {
                      city: city?.label,
                    })
                  "
                />
                <p v-html="t('sessions_aside_city_subscribed_text_2')" />
              </div>
            </div>
            <div
              v-else
              v-html="t('session_subscribe_city_info', { city: city?.label })"
            />
          </div>

          <div
            v-if="paused"
            class="paused-info"
            v-html="t('sessions_paused_info')"
          />
        </div>

        <div v-if="item === 'map'" class="map-container">
          <Map
            v-if="sessionDetail"
            embedded
            static
            prevent-center-to-user-position
            class="map"
            :session="sessionDetail"
          />
        </div>
      </template>
    </AngledBoxesRow>

    <TipBox
      v-if="
        sessionDetail && !paused && sessionDetail.moreInfo && moreInfoOpened
      "
      color-theme="info"
      class="more-infos"
      closeable
      @close="moreInfoOpened = false"
    >
      <div v-html="sessionDetail.moreInfo" />
    </TipBox>

    <div v-if="cityBackLink" class="city-back-link">
      <ContentBlockSpace size="quarter" />
      <ArrowLink
        :href="cityBackLink.path"
        :label="t('session_city_back_link', { city: cityBackLink.label })"
        reverse
        as-button
      />
    </div>

    <Modal id="session-unsubscribe">
      <SessionUnsubscribeConfirm />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { ref, computed, watch, onMounted } from 'vue'
import { useI36n } from '@jota-one/i36n'
import { useAuth } from '@/composables/useAuth'
import { useUserProfile } from '@/composables/useUserProfile'
import { useSessions } from '@/composables/useSessions'
import { useCities } from '@/composables/useCities'
import { useRoutes } from '@/composables/useRoutes'
import useModal from '@/composables/useModal'
import SessionCoachStrip from '@/components/session/CoachStrip.vue'
import SessionTimeAndPlace from '@/components/session/TimeAndPlace.vue'
import SessionUnsubscribeConfirm from '@/components/session/UnsubscribeConfirm.vue'
import AngledBoxesRow from '@/components/AngledBoxesRow.vue'
import ContentBlockSpace from '@components/content/BlockSpace.vue'
import EmptyListIcon from '@/components/EmptyListIcon.vue'
import TagList from '@/components/TagList.vue'
import Tag from '@/components/Tag.vue'
import TipBox from '@/components/TipBox.vue'
import ArrowLink from '@/components/ArrowLink.vue'
import Modal from '@/components/Modal.vue'
import Icon from '@/components/Icon.vue'
import DateDisplay from '@/components/Date.vue'
import Map from '@/components/content/Map.vue'

type Props = {
  sessionId?: string
}

const props = defineProps<Props>()

const { t } = useI36n()
const {
  sessionDetail,
  canSubscribe,
  isAlmostFull,
  isFull,
  getSessionTheme,
  loadSession,
  subscribeToSession,
  watchCities,
} = useSessions()
const { isAuthenticated, isStaffUser } = useAuth()
const { openedModal, openModal } = useModal()
const { subscribedSessions, watchingCities, loadUserSubscriptions } =
  useUserProfile()
const { cities, loadCities } = useCities()
const { route } = useRoutes()

const moreInfoOpened = ref(true)
const subscribeAfterLogin = ref(false)
const watchAfterLogin = ref(false)

const city = computed(
  () => sessionDetail.value && cities.value[sessionDetail.value.cityId],
)

const title = computed(() => {
  if (!sessionDetail.value) {
    return t('sessions_loading')
  }
  if (sessionDetail.value.paused) {
    return t('sessions_paused_title')
  }
  return sessionDetail.value?.title || t('sessions_default_title')
})

const paused = computed(() => sessionDetail.value?.paused)

const subscribed = computed(
  () =>
    sessionDetail.value &&
    isAuthenticated.value &&
    subscribedSessions.value
      .map(s => s.eventId)
      .includes(sessionDetail.value.id),
)

const watching = computed(
  () =>
    isAuthenticated.value &&
    city.value &&
    watchingCities.value.map(c => c.cityId).includes(city.value.id),
)

const colorTheme = computed(() =>
  !sessionDetail.value || paused.value
    ? 'neutral'
    : getSessionTheme(sessionDetail.value),
)

const cityBackLink = computed(() => {
  if (sessionDetail.value && city.value) {
    const path = route('city').replace(':city', city.value.slug)
    return { path, label: city.value.label }
  }
  return null
})

const eventStarted = computed(
  () =>
    sessionDetail.value && dayjs(sessionDetail.value.start).isBefore(dayjs()),
)

const displaySubscribeButton = computed(
  () =>
    !eventStarted.value &&
    (subscribed.value ||
      (sessionDetail.value && canSubscribe(sessionDetail.value))),
)

const subscribe = async () => {
  const id = props.sessionId || getSessionIdFromUrl()
  if (id) {
    await subscribeToSession(id)
    loadSession(id)
  }
}

const onSubscribeButtonClick = () => {
  if (!isAuthenticated.value) {
    subscribeAfterLogin.value = true
    openModal('login')
  } else if (subscribed.value) {
    const id = props.sessionId || getSessionIdFromUrl()
    openModal('session-unsubscribe', {
      sessionId: id,
      cb: async () => {
        loadSession(id)
      },
    })
  } else {
    subscribe()
  }
}

const onWatchButtonClick = () => {
  if (!isAuthenticated.value) {
    watchAfterLogin.value = true
    openModal('login')
  } else if (city.value) {
    watchCities([city.value.id])
  }
}

const getSessionIdFromUrl = (): string => {
  const parts = window.location.pathname.split('/').filter(Boolean)
  return parts[parts.length - 1] || ''
}

watch(
  () => openedModal.value,
  value => {
    if (!value && isAuthenticated.value) {
      if (!subscribed.value && subscribeAfterLogin.value) {
        subscribe()
        subscribeAfterLogin.value = false
      }
      if (!watching.value && watchAfterLogin.value && city.value) {
        watchCities([city.value.id])
        watchAfterLogin.value = false
      }
    }
  },
)

watch(
  () => isAuthenticated.value,
  value => {
    if (value) {
      loadUserSubscriptions()
    }
  },
  { immediate: true },
)

watch(
  () => title.value,
  value => {
    if (typeof document !== 'undefined') {
      document.title = value
    }
  },
  { immediate: true },
)

onMounted(async () => {
  await loadCities()
  const id = props.sessionId || getSessionIdFromUrl()
  loadSession(id)
})
</script>

<style lang="postcss" scoped>
@import '@styles/_mediaquery.pcss';

.session-detail {
  position: relative;
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.coach-strip {
  width: 100%;
}

.boxes {
  width: 100%;
  height: 100%;
  color: rgb(var(--color-neutral-lightest));

  @media (--l) {
    flex-direction: row !important;
    height: 35rem;
  }
}

.main {
  position: relative;
  height: 100%;
  padding: 2rem 2rem 4rem;
  display: flex;
  flex-direction: column;
  will-change: color;
  transition: color 0.4s ease-in-out;

  @media (--r) {
    padding: 2rem 4rem 3rem 2rem;
  }

  &:before {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background: rgb(var(--color-black));
    z-index: -1;
  }

  &:after {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background: rgb(var(--color-primary));
    z-index: -1;
    transform: translate(0, 100%);
    will-change: transform;
    transition: transform 0.2s ease-in-out;

    @media (--r) {
      transform: translate(100%, 0);
    }

    .subscribed & {
      transform: translate(0, 0);
    }
  }

  .subscribed & {
    color: rgb(var(--color-black));
  }

  .paused & {
    &:before {
      background: rgba(255, 252, 0, 0.2);
      background-image: repeating-linear-gradient(
        -55deg,
        rgba(255, 252, 0, 0.2),
        rgba(255, 252, 0, 0.2) 1rem,
        transparent 1rem,
        transparent 2rem
      );
    }

    .title .text {
      color: rgb(var(--color-black));
    }

    .details {
      filter: grayscale(1);
      color: rgb(var(--color-neutral));
    }
  }
}

.more-infos {
  position: absolute;
  top: -1.5rem;
  box-shadow: 0 0 0.5rem rgba(0, 0, 0, 0.25);
  z-index: 2;
}

.tags {
  min-height: 1.625rem;
}

.title {
  padding-top: var(--size-gap-30);
  display: flex;
  gap: var(--size-gap-30);

  .icon {
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    color: rgb(var(--color-primary));

    @media (--r) {
      width: 3.5rem;
      height: 3.5rem;
    }

    .subscribed & {
      color: rgb(var(--color-white));
    }
  }

  .text {
    font-size: 1.4rem;
    line-height: 1.6rem;
    font-weight: 300;

    @media (--r) {
      font-size: 1.8rem;
      line-height: 2rem;
    }
  }
}

.details,
.subscription,
.watch-city,
.paused-info,
.location-link {
  padding-top: var(--size-gap-30);
  padding-left: 4rem;

  @media (--r) {
    padding-left: 4.75rem;
  }
}

.spacer {
  flex-grow: 1;
  min-height: 2rem;
}

.subscription,
.watch-city {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--size-gap-20);
  color: rgb(var(--color-neutral-light));

  @media (--r) {
    flex-direction: row;
    align-items: center;
  }
}

.watching-info {
  display: flex;
  gap: var(--size-gap-10);
}

.watch-button {
  flex-shrink: 0;
}

.map-container {
  position: relative;
  width: 100%;
  height: 25rem;

  @media (--l) {
    height: 100%;
  }

  .map {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    height: 100%;
    width: 100%;
    padding: 0;
  }
}

.city-back-link {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.paused-info {
  color: rgb(var(--color-black));
}
</style>
