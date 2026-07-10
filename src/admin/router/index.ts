import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Events from '../views/Events.vue'
import Cities from '../views/Cities.vue'
import Locations from '../views/Locations.vue'
import EventTypes from '../views/EventTypes.vue'
import EventProposers from '../views/EventProposers.vue'
import Sponsors from '../views/Sponsors.vue'
import Users from '../views/Users.vue'
import { useAuth } from '@/composables/useAuth'

const routes = [
  { path: '/', component: Dashboard },
  { path: '/events', component: Events },
  { path: '/cities', component: Cities },
  { path: '/locations', component: Locations },
  { path: '/event-types', component: EventTypes },
  { path: '/event-proposers', component: EventProposers },
  { path: '/sponsors', component: Sponsors },
  { path: '/users', component: Users },
]

const baseUrl = (import.meta as any).env?.BASE_URL || '/'

const router = createRouter({
  history: createWebHistory(baseUrl + 'admin/'),
  routes,
})

router.beforeEach(() => {
  const { isAuthenticated, isAdminUser } = useAuth()

  if (!isAuthenticated.value || !isAdminUser.value) {
    window.location.href = '/'
    return false
  }
})

export default router
