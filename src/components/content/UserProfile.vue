<template>
  <div v-if="isAuthenticated" class="container slim user-profile">
    <Tabs>
      <Tab
        :is-active="activeTab === 'profile'"
        :label="t('profile_my_profile')"
        @click="navigateTo('profile')"
      />
      <Tab
        :is-active="activeTab === 'cities'"
        :label="t('profile_my_cities')"
        :counter-value="userWatchingCities.length"
        counter-color="success"
        icon="city"
        @click="navigateTo('cities')"
      />
      <Tab
        :is-active="activeTab === 'sessions'"
        :label="t('profile_my_sessions')"
        :counter-value="subscribedSessions.length"
        always-display-counter
        counter-color="success"
        icon="sneaker"
        @click="navigateTo('sessions')"
      >
        <template v-if="coachingSessions.length">
          <Icon name="coach" class="coach-tab-icon" />
          {{ t('profile_sessions_as_staff') }}:
          <Counter :count="coachingSessions.length" color-theme="success" />
        </template>
      </Tab>
      <template #outer>
        <a v-if="isAdminUser" :href="adminLink" class="button primary admin" no-prefetch> Admin </a>
      </template>
    </Tabs>
    <div class="tab-content">
      <div v-if="userProfile && activeTab === 'profile'" class="profile">
        <ContentSubscriptionForm :user-profile="userProfile" />
      </div>
      <SessionList v-if="activeTab === 'sessions'" :sessions="userSubscribedSessions" />
      <template v-if="activeTab === 'cities'">
        <div class="watch-city-info" v-html="t('sessions_watch_cities_info')" />
        <div class="watch-city-form">
          <FormFieldWrapper
            :label="t('sessions_watch_cities_dropdown_label')"
            hide-error
            class="field"
          >
            <VueMultiselect
              v-model="selectedCities"
              :options="unwatchedCities"
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
          <button
            class="button primary"
            :disabled="!selectedCities.length"
            @click="watchCitiesAndClearDropdown"
          >
            {{ t('sessions_watch_cities_button') }}
          </button>
        </div>
        <ul v-if="userWatchingCities.length" class="cities-list">
          <li v-for="city in userWatchingCities" :key="city.id" class="city">
            <ArrowLink :href="getCityPageLink(city)" :label="city.label" class="arrow-link" />
            <button class="button primary subscribed" @click="unwatchCity(city.id)">
              {{ t('sessions_aside_city_subscribed_button') }}
            </button>
          </li>
        </ul>
        <EmptyList v-else icon="city" :empty-label="t('cities_list_empty')" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import VueMultiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.css'
import type { City } from '@/types'

type Props = { lang?: string }
defineProps<Props>()
import Tabs from '@components/Tabs.vue'
import Tab from '@components/Tab.vue'
import Icon from '@components/Icon.vue'
import Counter from '@components/Counter.vue'
import ArrowLink from '@/components/ArrowLink.vue'
import EmptyList from '@components/EmptyList.vue'
import FormFieldWrapper from '@components/form/FieldWrapper.vue'
import ContentSubscriptionForm from '@components/content/SubscriptionForm.vue'
import SessionList from '@components/session/List.vue'
import { useAuth } from '@/composables/useAuth'
import { useUserProfile } from '@/composables/useUserProfile'
import { useSessions } from '@/composables/useSessions'
import { useCities } from '@/composables/useCities'
import { useI36n } from '@jota-one/i36n'
import { getPath } from '@/routes'
import type { LangCode } from '@/routes'

const { isAuthenticated, isAdminUser, isStaffUser } = useAuth()
const {
  userProfile,
  subscribedSessions,
  coachingSessions,
  watchingCities,
  loadUserProfile,
  loadUserSubscriptions,
} = useUserProfile()
const { profileSessions, loadSessionsByIds, unwatchCity, watchCities } = useSessions()
const { cities, loadCities } = useCities()
const { t } = useI36n()

const getTabFromHash = (hash: string) => {
  if (hash === '#cities') {
    return 'cities'
  }
  if (hash === '#sessions') {
    return 'sessions'
  }
  return 'profile'
}

const activeTab = ref(getTabFromHash(window.location.hash))
const selectedCities = ref<City[]>([])

const sortCities = (a: City, b: City) => (a.label > b.label ? 1 : a.label === b.label ? 0 : -1)

const adminLink = computed(() => {
  const lang = window.location.pathname.split('/').filter(Boolean)[0] || 'fr'
  return `/${lang}/admin`
})

const userSubscribedSessions = computed(() => profileSessions.value ?? [])

const userWatchingCities = computed(() =>
  watchingCities.value
    .filter(watchingCity => cities.value[watchingCity.cityId])
    .map(watchingCity => cities.value[watchingCity.cityId])
    .sort(sortCities),
)

const unwatchedCities = computed(() =>
  (Object.values(cities.value) as City[])
    .filter(city => !watchingCities.value.map(c => c.cityId).includes(city.id))
    .sort(sortCities),
)

const getCityPageLink = (city: City) => {
  const lang = (window.location.pathname.split('/').filter(Boolean)[0] || 'fr') as LangCode
  return `${getPath('subscription', lang)}/${city.slug}`
}

const watchCitiesAndClearDropdown = () => {
  watchCities(selectedCities.value.map(city => city.id))
  selectedCities.value = []
}

const navigateTo = (tab: string) => {
  activeTab.value = tab
  if (tab === 'profile') {
    history.pushState(null, '', window.location.pathname + window.location.search)
  } else {
    history.pushState(null, '', `#${tab}`)
  }
}

onMounted(() => {
  window.addEventListener('hashchange', () => {
    activeTab.value = getTabFromHash(window.location.hash)
  })
})

if (isAuthenticated.value) {
  loadUserProfile()
  loadCities()
  loadUserSubscriptions().then(() => {
    const ids = [
      ...(subscribedSessions.value || []).map(s => s.eventId),
      ...(isStaffUser ? (coachingSessions.value || []).map(s => s.eventId) : []),
    ]
    loadSessionsByIds(ids)
  })
}
</script>

<style lang="postcss" scoped>
@import '@/assets/styles/_mediaquery.pcss';
.user-profile {
  padding: 1.5rem;
}

.button.admin {
  padding-top: 0.35rem;
  padding-bottom: 0.35rem;
}

.tab-content {
  padding: 2rem 1rem;
}

.city {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 1rem;
  margin-top: 1px;
  background: rgb(var(--color-primary));

  .arrow-link {
    color: rgb(var(--color-white));
  }
}

.coach-tab-icon {
  color: rgb(var(--color-primary), 0.75);
}

.watch-city-info {
  font-size: 0.9rem;
  font-weight: 300;
}
.watch-city-form {
  display: flex;
  align-items: flex-end;
  gap: var(--size-gap-20);
  padding-bottom: var(--size-gap-20);

  .field {
    flex: 1;
  }
}
</style>
