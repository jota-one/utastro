import dayjs from 'dayjs'
import { ref, computed } from 'vue'
import useDateRange from '@/composables/useDateRange'
import { useCities } from '@/composables/useCities'
import { useAuth } from '@/composables/useAuth'
import { useUserProfile } from '@/composables/useUserProfile'
import { pb } from '@/pb'

import type {
  Attendee,
  City,
  ColorTheme,
  DateRange,
  DateRangeSize,
  Session,
  SessionAttendeesStatus,
  Tag,
} from '@/types'

const sessionMatchesCities = (session: Session, filteredCities: City[]) =>
  !filteredCities.length ||
  filteredCities.map((city: City) => city.id).includes(session.cityId)

const sessionMatchesTags = (session: Session, filteredTags: Tag[]) =>
  !filteredTags.length ||
  filteredTags.some((tag: Tag) =>
    (session.tags || []).map((t: Tag) => t.id).includes(tag.id),
  )

const sessions = ref<Session[] | null>(null)
const sessionsLoaded = ref(false)
const sessionDetail = ref<Session | null>(null)
const sessionAttendees = ref<Attendee[] | null>(null)
const sessionAttendeesStatus = ref<SessionAttendeesStatus>('todo')
const filteredTags = ref<Tag[]>([])
const sessionsDateRange = ref<DateRange>({
  from: dayjs().startOf('day'),
  to: dayjs().add(1, 'day').startOf('day'),
})
const sessionsDateRangeSize = ref<DateRangeSize>('week')

export const useSessions = () => {
  const { getDay, getWeek, getMonth } = useDateRange()
  const { filteredCities } = useCities()

  const loadSession = async (_sessionId: number | undefined): Promise<void> => {
    // TODO: load from PocketBase sessions collection (not yet created)
  }

  const loadAttendees = async (_sessionId: number | undefined): Promise<void> => {
    // TODO: load from PocketBase once attendance feature is implemented
  }

  const loadSessions = async () => {
    // TODO: load from PocketBase sessions collection (not yet created)
    sessions.value = []
    sessionsLoaded.value = true
  }

  const updateSessionCount = (sessionId: number, count: number, asStaff?: boolean) => {
    if (sessions.value) {
      sessions.value = sessions.value.map(session => {
        if (session.id === sessionId) {
          if (asStaff) {
            session.subscriptions.staffCount = count
          } else {
            session.subscriptions.currentCount = count
          }
        }
        return session
      })
    }

    if (sessionDetail.value) {
      if (asStaff) {
        sessionDetail.value.subscriptions.staffCount = count
      } else {
        sessionDetail.value.subscriptions.currentCount = count
      }
    }
  }

  const subscribeToSession = async (_sessionId: number, _asStaff?: boolean) => {
    // TODO: implement with PocketBase
  }

  const unsubscribeFromSession = async (_sessionId: number, _asStaff?: boolean) => {
    // TODO: implement with PocketBase
  }

  const watchCities = async (cityIds: string[]) => {
    const { userId } = useAuth()
    if (!userId.value) {
      return
    }
    const batch = pb.createBatch()
    cityIds.forEach(cityId =>
      batch.collection('ut_city_watchers').create({ user: userId.value, city: cityId }),
    )
    await batch.send()
    await useUserProfile().loadUserSubscriptions()
  }

  const unwatchCity = async (cityId: string) => {
    const { userId } = useAuth()
    if (!userId.value) {
      return
    }
    const { watchingCities } = useUserProfile()
    const watcher = watchingCities.value.find(w => w.cityId === cityId)
    if (!watcher) {
      return
    }
    await pb.collection('ut_city_watchers').delete(watcher.id)
    await useUserProfile().loadUserSubscriptions()
  }

  const tags = computed(() =>
    (sessions.value || []).reduce((tags: Tag[], session) => {
      ;(session.tags || []).forEach(tag => {
        if (!tags.map(t => t.id).includes(tag.id)) {
          tags.push(tag)
        }
      })
      return tags
    }, []),
  )

  const canSubscribe = (session: Session) =>
    !dayjs(session.subscriptions.starting).isAfter(Date.now()) && !isFull(session)

  const getNextAvailableSession = (city?: City) =>
    sessions.value &&
    sessions.value.find(
      session =>
        dayjs(session.start).isAfter(sessionsDateRange.value.from) &&
        sessionMatchesCities(session, city ? [city] : filteredCities.value) &&
        sessionMatchesTags(session, filteredTags.value),
    )

  const getSessionTheme = (session: Session): ColorTheme =>
    isFull(session) ? 'error' : isAlmostFull(session) ? 'warning' : 'success'

  const isAlmostFull = (session: Session) =>
    session.subscriptions.currentCount / session.subscriptions.max >= 0.75

  const isFull = (session: Session) =>
    session.subscriptions.currentCount >= session.subscriptions.max

  const jumpToNextAvailableSession = (city?: City) => {
    const nextSession = getNextAvailableSession(city)

    if (nextSession) {
      sessionsDateRange.value =
        sessionsDateRangeSize.value === 'day'
          ? getDay(dayjs(nextSession.start))
          : sessionsDateRangeSize.value === 'week'
          ? getWeek(dayjs(nextSession.start))
          : getMonth(dayjs(nextSession.start))
    }
  }

  return {
    filteredTags,
    sessionAttendees,
    sessionAttendeesStatus,
    sessionDetail,
    sessions,
    sessionsLoaded,
    sessionsDateRange,
    sessionsDateRangeSize,
    tags,
    canSubscribe,
    getNextAvailableSession,
    getSessionTheme,
    isAlmostFull,
    isFull,
    jumpToNextAvailableSession,
    loadAttendees,
    loadSession,
    loadSessions,
    sessionMatchesCities,
    sessionMatchesTags,
    subscribeToSession,
    unsubscribeFromSession,
    unwatchCity,
    watchCities,
  }
}
