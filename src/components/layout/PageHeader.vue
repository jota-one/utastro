<template>
  <header class="header">
    <div class="container">
      <a :href="route('home')" class="logo" no-prefetch>
        <Logo boxed />
      </a>
      <LayoutHamburger :opened="menuOpened" @click="menuOpened = !menuOpened" />
      <div :class="['navigation-wrapper', { opened: menuOpened }]">
        <LayoutSubscriptionCounters
          v-if="isAuthenticated"
          :cities-count="citiesCount"
          :subscribed-sessions-count="subscribedSessionsCount"
          :coach-sessions-count="coachSessionsCount"
          :show-coach="isStaffUser"
          class="counters"
        />
        <a
          :href="route('subscription')"
          class="button primary"
          no-prefetch
          @click="closeMobileOverlay"
        >
          {{ label('subscription') }}
        </a>
        <button
          v-if="isAuthenticated"
          class="button tertiary"
          @click="onAuthButtonClick"
        >
          {{ t('common_logout') }}
        </button>
        <button v-else class="button secondary" @click="onAuthButtonClick">
          {{ t('common_login') }}
        </button>
        <nav class="navigation">
          <a
            v-for="navItem in navigationItems"
            :key="navItem.path"
            no-prefetch
            :href="navItem.path"
            class="link"
            @click="closeMobileOverlay"
          >
            {{ navItem.label }}
          </a>
          <div class="sep" />
          <!-- <select class="dropdown" @change="changeLang">
            <option
              v-for="lang in langs"
              :key="lang?.code"
              :value="lang?.code"
              :selected="lang?.code === route.params?.lang"
            >
              {{ lang?.code }}
            </option>
          </select> -->
        </nav>
      </div>
    </div>
    <Modal id="login">
      <FormLogin
        @authenticated="onAuthenticated"
        @signup="closeModal('login')"
        @close="closeModal('login')"
      />
    </Modal>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { init as initPlausible } from '@plausible-analytics/tracker'
import { useI36n } from '@jota-one/i36n'
import Logo from '@components/Logo.vue'
import LayoutHamburger from '@components/layout/Hamburger.vue'
import LayoutSubscriptionCounters from '@components/layout/SubscriptionCounters.vue'
import useModal from '@composables/useModal'
import Modal from '@components/Modal.vue'
import FormLogin from '@components/form/Login.vue'
import { useAuth } from '@composables/useAuth'
import { useUserProfile } from '@composables/useUserProfile'
import { useCities } from '@composables/useCities'
import { useRoutes } from '@composables/useRoutes'

initPlausible({
  domain: 'urban-training.ch'
})

console.log('initplausible')

const { t } = useI36n()
const { modalParams, openModal, closeModal } = useModal()
const { isAuthenticated, isStaffUser, logout } = useAuth()
const {
  watchingCities,
  subscribedSessions,
  coachingSessions,
  loadUserSubscriptions,
} = useUserProfile()
const { cities, loadCities } = useCities()
const { route, label, navItems: navigationItems } = useRoutes()

const citiesCount = computed(
  () => watchingCities.value.filter(w => !!cities.value[w.cityId]).length,
)
const subscribedSessionsCount = computed(() => subscribedSessions.value.length)
const coachSessionsCount = computed(() => coachingSessions.value.length)

loadCities()

if (isAuthenticated.value) {
  loadUserSubscriptions()
}

watch(isAuthenticated, val => {
  if (val) {
    loadUserSubscriptions()
  }
})

const menuOpened = ref(false)

// const changeLang = async (e: Event) => {
//   const pageId = currentPage.value?.id

//   if (!pageId) {
//     return
//   }

//   const langCode = (e.target as HTMLInputElement)?.value
//   const lang = langs.value.find(lang => lang.code === langCode)

//   if (!lang) {
//     return
//   }

//   const { data: newPage } = await useFetch<Page>(
//     `${api.prefix}/navigation/${pageId}?lang_id=${lang.id}`,
//   )

//   if (newPage.value?.path) {
//     router.push({ path: newPage.value.path })
//   }
// }

const onAuthenticated = () => {
  if (modalParams.value.redirect) {
    // @todo implement redirection logic
    //router.push({ path: modalParams.value.redirect })
  }

  closeModal('login')
}

const onAuthButtonClick = async () => {
  if (isAuthenticated.value) {
    logout()

    // @todo: implement redirection logic
  } else {
    openModal('login')
  }
}

const closeMobileOverlay = () => {
  menuOpened.value = false
}
</script>

<style lang="postcss" scoped>
@import '@styles/_mediaquery.pcss';

.header {
  position: relative;
  margin-bottom: -4rem;
  overflow-x: hidden;
  overflow-y: visible;
}

.container {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.navigation-wrapper {
  position: fixed;
  left: 100%;
  width: 300px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--size-gap-15);
  padding-top: 4rem;
  background: rgba(var(--color-bg), 0.975);
  box-shadow: 0 0 1rem rgba(0, 0, 0, 0.4);
  opacity: 0;
  transform: translateX(0);
  transition: all 0.2s ease;
  transition-delay: 0.2s;
  z-index: var(--z-index-page-header);

  &.opened {
    transform: translateX(-100%);
    opacity: 1;
  }

  @media (--m) {
    flex: 1;
    position: relative;
    height: auto;
    left: auto;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-end;
    padding-top: 1rem;
    background: transparent;
    opacity: 1;
    box-shadow: none;

    &,
    &.opened {
      transform: translateX(0);
      transition: none;
    }
  }
}

.navigation {
  padding: 1rem 1rem 5rem;
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;

  @media (--m) {
    margin-top: 0;
    padding: 0;
    flex-basis: 100%;
    flex-direction: row;
    justify-content: flex-end;
  }

  .sep {
    flex: 1;

    @media (--m) {
      display: none;
    }
  }
}

.logo {
  margin-bottom: 1rem;
}

.dropdown {
  margin-left: 0.5rem;
  text-transform: uppercase;
  height: 2.2rem;
  align-self: center;
}

.link {
  display: inline-flex;
  align-items: center;
  margin: 0.25rem;
  padding: 0.5rem 0.75rem;
  font-weight: 500;
  color: rgb(var(--color-black));
  transition: all 0.1s linear;

  &:hover {
    background: rgb(var(--color-black), 0.1);
    border-radius: 0.3rem;
  }

  &.router-link-exact-active {
    &,
    &:hover {
      color: rgb(var(--color-primary));
      background: rgb(var(--color-primary), 0.1);
      border-radius: 0.3rem;
    }
  }

  @media (--l) {
    padding: 0.3rem 0.5rem;
  }
}

.counters {
  margin-bottom: 2rem;

  @media (--m) {
    margin-bottom: 0;
  }
}
</style>
