import { computed, ref } from 'vue'
import type { UserProfile } from '@/types'
import { useAuth } from '@/composables/useAuth'
import { pb } from '@/pb'

export interface EventSubscription {
  id: string
  eventId: string
}

export interface CityWatcher {
  id: string
  cityId: string
}

export interface UserSubscriptions {
  cities: CityWatcher[]
  coachingSessions: EventSubscription[]
  sessions: EventSubscription[]
}

const userProfile = ref<UserProfile | null>(null)
const userSubscriptions = ref<UserSubscriptions | null>(null)
let loadSubscriptionsPromise: Promise<void> | null = null

export const useUserProfile = () => {
  const { isAuthenticated, userId } = useAuth()

  const loadUserSubscriptions = (): Promise<void> => {
    if (!userId.value) { return Promise.resolve() }
    if (loadSubscriptionsPromise) { return loadSubscriptionsPromise }
    loadSubscriptionsPromise = Promise.all([
      pb.collection('ut_city_watchers').getFullList({
        filter: `user="${userId.value}"`,
        fields: 'id,city',
      }),
      pb.collection('ut_subscriptions').getFullList({
        filter: `user="${userId.value}"`,
        fields: 'id,event,is_event_admin',
      }),
    ]).then(([cityRecords, subRecords]) => {
      userSubscriptions.value = {
        cities: cityRecords.map(r => ({ id: r.id, cityId: r.city })),
        sessions: subRecords
          .filter(r => !r.is_event_admin)
          .map(r => ({ id: r.id, eventId: r.event })),
        coachingSessions: subRecords
          .filter(r => r.is_event_admin)
          .map(r => ({ id: r.id, eventId: r.event })),
      }
    }).finally(() => {
      loadSubscriptionsPromise = null
    })
    return loadSubscriptionsPromise
  }

  const loadUserProfile = async () => {
    if (!userId.value) {
      return
    }

    const record = await pb.collection('ut_users').getOne(userId.value, {
      fields: 'id,email,name,street,npa,city,country,phone,gender,birthdate,region,accept_risks,accept_promo',
    })

    if (record) {
      userProfile.value = {
        id: record.id as unknown as number,
        email: record.email,
        name: record.name || '',
        street: record.street || '',
        zip: record.npa || undefined,
        city: record.city || '',
        phone: record.phone || '',
        regionId: record.region || undefined,
        country: record.country || '',
        birthdate: record.birthdate,
        gender: record.gender || '',
        risks: record.accept_risks || false,
        promo: record.accept_promo || false,
      }
    }
  }

  const watchingCities = computed(() =>
    isAuthenticated.value && userSubscriptions.value
      ? userSubscriptions.value.cities
      : [],
  )

  const subscribedSessions = computed(() =>
    isAuthenticated.value && userSubscriptions.value
      ? userSubscriptions.value.sessions
      : [],
  )

  const coachingSessions = computed(() =>
    isAuthenticated.value && userSubscriptions.value
      ? userSubscriptions.value.coachingSessions
      : [],
  )

  return {
    coachingSessions,
    userProfile,
    subscribedSessions,
    watchingCities,
    loadUserProfile,
    loadUserSubscriptions,
  }
}
