import dayjs from 'dayjs'
import { ref, computed } from 'vue'
import useDateRange from '@/composables/useDateRange'
import { useCities } from '@/composables/useCities'
import { useAuth } from '@/composables/useAuth'
import { useUserProfile } from '@/composables/useUserProfile'
import { useSettings } from '@/composables/useSettings'
import { pb } from '@/pb'
import config from '@/config'

import type {
  Attendee,
  City,
  ColorTheme,
  Coords,
  DateRange,
  DateRangeSize,
  Session,
  SessionAttendeesStatus,
  Tag,
} from '@/types'

const sessionMatchesCities = (session: Session, filteredCities: City[]) =>
  !filteredCities.length || filteredCities.map((city: City) => city.id).includes(session.cityId)

const sessionMatchesTags = (session: Session, filteredTags: Tag[]) =>
  !filteredTags.length ||
  filteredTags.some((tag: Tag) => (session.tags || []).map((t: Tag) => t.id).includes(tag.id))

const mapRecordToSession = (r: Record<string, any>, lang: string): Session => {
  const loc = r.expand?.location
  const coordParts = (loc?.coords || '').split(',').map(Number)
  return {
    id: r.id,
    title: r[`title_${lang}`] || r.title_fr || '',
    location: {
      label: loc?.[`label_${lang}`] || loc?.label_fr || '',
      coords: [coordParts[0] || 0, coordParts[1] || 0] as Coords,
      address: loc?.address || '',
    },
    cityId: r.city,
    start: new Date(r.start_date),
    end: r.end_date ? new Date(r.end_date) : undefined,
    subscriptions: {
      starting: r.subscription_publish_date ? new Date(r.subscription_publish_date) : undefined,
      max: r.max_subscriptions || 0,
      currentCount: r.subscription_count || 0,
      staffCount: r.staff_count || 0,
    },
    tags: (r.expand?.types || []).map((t: Record<string, any>) => ({
      id: t.id,
      label: t[`label_${lang}`] || t.label_fr || t.xid,
    })),
    moreInfo: r[`description_${lang}`] || r.description_fr || undefined,
    paused: r.progress === 'paused' ? r.progress : null,
    cancelled: r.progress === 'cancelled' ? r.progress : null,
    attendees: (r.attendees || 'todo') as SessionAttendeesStatus,
  }
}

const sessions = ref<Session[] | null>(null)
const profileSessions = ref<Session[] | null>(null)
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
  const { getDay, getWeek, getMonth, getYear } = useDateRange()
  const { filteredCities } = useCities()

  const loadSession = async (sessionId: string | undefined): Promise<void> => {
    if (!sessionId) {
      return
    }
    const { currentLangCode } = useSettings()
    const record = await pb.collection('ut_events').getOne(sessionId, {
      expand: 'location,types',
    })
    sessionDetail.value = mapRecordToSession(record, currentLangCode.value)
  }

  const loadSessionsByIds = async (ids: string[]): Promise<void> => {
    if (!ids.length) {
      profileSessions.value = []
      return
    }
    const { currentLangCode } = useSettings()
    const filter = ids.map(id => `id="${id}"`).join(' || ')
    const records = await pb.collection('ut_events').getFullList({
      filter,
      expand: 'location,types',
    })
    profileSessions.value = records.map(r => mapRecordToSession(r, currentLangCode.value))
  }

  const loadAttendees = async (_sessionId: string | undefined): Promise<void> => {
    // TODO: load from PocketBase once attendance feature is implemented
  }

  const loadSessions = async () => {
    const { currentLangCode } = useSettings()

    const { from: rangeFrom, to } = config.dateRangeNav
      ? sessionsDateRange.value
      : { from: dayjs(), to: dayjs().add(12, 'month') }

    const from = rangeFrom.isBefore(dayjs()) ? dayjs() : rangeFrom
    const filter = `start_date > "${from.format('YYYY-MM-DD HH:mm:ss')}" && start_date < "${to.format('YYYY-MM-DD HH:mm:ss')}"`

    const records = await pb.collection('ut_events').getFullList({
      filter,
      expand: 'location,types',
    })

    sessions.value = records.map(r => mapRecordToSession(r, currentLangCode.value))
    sessionsLoaded.value = true
  }

  const updateSessionCount = (sessionId: string, count: number, asStaff?: boolean) => {
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

  const subscribeToSession = async (sessionId: string, asStaff?: boolean) => {
    const { userId } = useAuth()
    if (!userId.value) {
      return
    }
    await pb.collection('ut_subscriptions').create({
      user: userId.value,
      event: sessionId,
      is_event_admin: asStaff || false,
    })
    const session = sessions.value?.find(s => s.id === sessionId)
    const newCount = asStaff
      ? (session?.subscriptions.staffCount || 0) + 1
      : (session?.subscriptions.currentCount || 0) + 1
    updateSessionCount(sessionId, newCount, asStaff)
    await useUserProfile().loadUserSubscriptions()
  }

  const unsubscribeFromSession = async (sessionId: string, asStaff?: boolean) => {
    const { userId } = useAuth()
    if (!userId.value) {
      return
    }
    const { subscribedSessions, coachingSessions } = useUserProfile()
    const list = asStaff ? coachingSessions.value : subscribedSessions.value
    const sub = list.find(s => s.eventId === sessionId)
    if (!sub) {
      return
    }
    await pb.collection('ut_subscriptions').delete(sub.id)
    const session = sessions.value?.find(s => s.id === sessionId)
    const newCount = asStaff
      ? Math.max((session?.subscriptions.staffCount || 1) - 1, 0)
      : Math.max((session?.subscriptions.currentCount || 1) - 1, 0)
    updateSessionCount(sessionId, newCount, asStaff)
    await useUserProfile().loadUserSubscriptions()
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
    if (!config.dateRangeNav) {
      return
    }

    const nextSession = getNextAvailableSession(city)

    if (nextSession) {
      const anchor = dayjs(nextSession.start)
      sessionsDateRange.value =
        sessionsDateRangeSize.value === 'day'
          ? getDay(anchor)
          : sessionsDateRangeSize.value === 'week'
            ? getWeek(anchor)
            : sessionsDateRangeSize.value === 'month'
              ? getMonth(anchor)
              : getYear()
    }
  }

  return {
    filteredTags,
    profileSessions,
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
    loadSessionsByIds,
    sessionMatchesCities,
    sessionMatchesTags,
    subscribeToSession,
    unsubscribeFromSession,
    unwatchCity,
    watchCities,
  }
}
