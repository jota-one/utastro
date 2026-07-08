import dayjs from 'dayjs'
import { pb } from '@/pb'
import { downloadCsv, type CsvRow } from '@/utils/csv'

// Season "test year": before May the running season is still last year's, so
// exports start counting from January 1st of the relevant year. Mirrors the
// getTestYear() helper of the legacy urban-training backend.
const getTestYear = (): string => {
  const now = dayjs()
  const year = now.month() < 4 ? now.year() - 1 : now.year()
  return `${year}-01-01`
}

const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss')

const timestamp = () => dayjs().format('YYYY-MM-DD_HH-mm-ss')

const fmt = (value: unknown, format = 'DD.MM.YYYY'): string =>
  value ? dayjs(value as string).format(format) : ''

type PbRecord = Record<string, any>

// Common user columns shared by every people-oriented city export. When a
// cityLabel is provided (global exports across all cities) it is appended as
// the "city_of_interest" column, matching the legacy CSV.
const userRow = (user: PbRecord, cityLabel?: string): CsvRow => {
  const row: CsvRow = {
    email: user.email,
    role: user.role || 'user',
    name: user.name,
    npa: user.npa,
    city: user.city,
    region: user.region,
    gender: user.gender,
    birthdate: user.birthdate,
    accept_newsletter: user.accept_newsletter,
    accept_promo: user.accept_promo,
  }
  if (cityLabel !== undefined) {
    row.city_of_interest = cityLabel
  }
  return row
}

const byName = (a: PbRecord, b: PbRecord): number =>
  String(a.name || '').localeCompare(String(b.name || ''))

// Fetch city watchers (optionally for a single city), expanded with the user
// and city records.
const fetchWatchers = async (cityId?: string): Promise<PbRecord[]> => {
  const records = await pb.collection('ut_city_watchers').getFullList({
    filter: cityId ? `city = "${cityId}"` : '',
    expand: 'user,city',
  })
  return records.filter(record => record.expand?.user)
}

// Fetch subscriptions to events located in a city (or all cities), restricted
// to the current season window, expanded with the user and event (+ its city).
const fetchSubscriptions = async (cityId?: string): Promise<PbRecord[]> => {
  const parts = [
    `event.start_date > "${getTestYear()}"`,
    `event.start_date < "${now()}"`,
  ]
  if (cityId) {
    parts.push(`event.city = "${cityId}"`)
  }
  const records = await pb.collection('ut_subscriptions').getFullList({
    filter: parts.join(' && '),
    expand: 'user,event.city,event.location,event.types',
  })
  return records.filter(record => record.expand?.user && record.expand?.event)
}

// Deduplicate a list of records by their expanded user id, keeping first seen.
const uniqueByUser = (records: PbRecord[]): PbRecord[] => {
  const seen = new Set<string>()
  return records.filter(record => {
    const id = record.expand.user.id
    if (seen.has(id)) {
      return false
    }
    seen.add(id)
    return true
  })
}

export function useCityExports() {
  // --- People lists -------------------------------------------------------

  const exportWatchers = async (cityId: string, slug: string) => {
    const watchers = await fetchWatchers(cityId)
    const rows = watchers
      .map(w => w.expand.user)
      .sort(byName)
      .map(user => userRow(user))
    downloadCsv(`${timestamp()}-${slug}-watchers.csv`, rows)
  }

  const exportSubscribers = async (cityId: string, slug: string) => {
    const subs = uniqueByUser(await fetchSubscriptions(cityId))
    const rows = subs
      .map(s => s.expand.user)
      .sort(byName)
      .map(user => userRow(user))
    downloadCsv(`${timestamp()}-${slug}-subscribers.csv`, rows)
  }

  const exportWatchersOrSubscribers = async (cityId: string, slug: string) => {
    const [watchers, subs] = await Promise.all([
      fetchWatchers(cityId),
      fetchSubscriptions(cityId),
    ])
    const rows = uniqueByUser([...watchers, ...subs])
      .map(r => r.expand.user)
      .sort(byName)
      .map(user => userRow(user))
    downloadCsv(`${timestamp()}-${slug}-watchers-or-subscribers.csv`, rows)
  }

  const exportAllWatchers = async () => {
    const watchers = await fetchWatchers()
    const rows = watchers
      .sort((a, b) => byName(a.expand.user, b.expand.user))
      .map(w => userRow(w.expand.user, w.expand.city?.label))
    downloadCsv(`${timestamp()}-all-watchers.csv`, rows)
  }

  const exportAllSubscribers = async () => {
    const subs = uniqueByUser(await fetchSubscriptions())
    const rows = subs
      .sort((a, b) => byName(a.expand.user, b.expand.user))
      .map(s => userRow(s.expand.user, s.expand.event.expand?.city?.label))
    downloadCsv(`${timestamp()}-all-subscribers.csv`, rows)
  }

  const exportAllWatchersOrSubscribers = async () => {
    const [watchers, subs] = await Promise.all([
      fetchWatchers(),
      fetchSubscriptions(),
    ])
    const cityLabelOf = (record: PbRecord): string =>
      record.expand.city?.label ??
      record.expand.event?.expand?.city?.label ??
      ''
    const rows = uniqueByUser([...watchers, ...subs])
      .sort((a, b) => byName(a.expand.user, b.expand.user))
      .map(record => userRow(record.expand.user, cityLabelOf(record)))
    downloadCsv(`${timestamp()}-all-watchers-or-subscribers.csv`, rows)
  }

  // --- Event-oriented exports (single city) -------------------------------

  const exportSubscriptionsAll = async (cityId: string, slug: string) => {
    const subs = await fetchSubscriptions(cityId)
    const rows: CsvRow[] = subs
      .sort((a, b) =>
        String(a.expand.event.start_date).localeCompare(
          String(b.expand.event.start_date),
        ),
      )
      .map(s => {
        const event = s.expand.event
        const user = s.expand.user
        const location = event.expand?.location
        const types = (event.expand?.types ?? []) as PbRecord[]
        return {
          start_date: fmt(event.start_date, 'DD.MM.YYYY HH:mm'),
          end_date: fmt(event.end_date, 'DD.MM.YYYY HH:mm'),
          subscription_publish_date: fmt(
            event.subscription_publish_date,
            'DD.MM.YYYY HH:mm',
          ),
          max_subscriptions: event.max_subscriptions,
          location: location?.label_fr ?? '',
          address: location?.address ?? '',
          title: event.title_fr,
          event_type: types.map(type => type.label_fr).join(', '),
          email: user.email,
          name: user.name,
          street: user.street,
          npa: user.npa,
          city: user.city,
          presence: s.presence,
          coach: s.is_event_admin,
        }
      })
    downloadCsv(`${timestamp()}-${slug}-subscriptions-all.csv`, rows)
  }

  const exportSubscriptionsStatistics = async (
    cityId: string,
    slug: string,
  ) => {
    const subs = await fetchSubscriptions(cityId)

    // Aggregate per event. Staff (event admins) are counted separately and
    // excluded from the participant/presence counts.
    const events = new Map<string, PbRecord>()
    const stats = new Map<string, Record<string, number>>()

    for (const sub of subs) {
      const event = sub.expand.event
      if (!events.has(event.id)) {
        events.set(event.id, event)
        stats.set(event.id, {
          count_subscriptions: 0,
          count_staff_subscriptions: 0,
          count_male_subscriptions: 0,
          count_male_presence: 0,
          count_female_subscriptions: 0,
          count_female_presence: 0,
          count_neutral_subscriptions: 0,
          count_neutral_presence: 0,
        })
      }
      const bucket = stats.get(event.id)!
      if (sub.is_event_admin) {
        bucket.count_staff_subscriptions += 1
        continue
      }
      const gender = sub.expand.user.gender
      const group =
        gender === 'male' || gender === 'female' ? gender : 'neutral'
      bucket.count_subscriptions += 1
      bucket[`count_${group}_subscriptions`] += 1
      if (sub.presence) {
        bucket[`count_${group}_presence`] += 1
      }
    }

    const percent = (present: number, total: number): number =>
      total ? Math.round((present / total) * 100) : 0

    const rows: CsvRow[] = [...events.values()]
      .sort((a, b) => String(a.start_date).localeCompare(String(b.start_date)))
      .map(event => {
        const s = stats.get(event.id)!
        const countPresences =
          s.count_male_presence +
          s.count_female_presence +
          s.count_neutral_presence
        return {
          id: event.id,
          title: event.title_fr,
          start_date: fmt(event.start_date),
          max_subscriptions: event.max_subscriptions,
          count_subscriptions: s.count_subscriptions,
          count_staff_subscriptions: s.count_staff_subscriptions,
          count_male_subscriptions: s.count_male_subscriptions,
          count_male_presence: s.count_male_presence,
          count_female_subscriptions: s.count_female_subscriptions,
          count_female_presence: s.count_female_presence,
          count_neutral_subscriptions: s.count_neutral_subscriptions,
          count_neutral_presence: s.count_neutral_presence,
          count_presences: countPresences,
          percent_presence_male: percent(
            s.count_male_presence,
            s.count_male_subscriptions,
          ),
          percent_presence_female: percent(
            s.count_female_presence,
            s.count_female_subscriptions,
          ),
          percent_presence_neutral: percent(
            s.count_neutral_presence,
            s.count_neutral_subscriptions,
          ),
          percent_presence_total: percent(countPresences, s.count_subscriptions),
        }
      })
    downloadCsv(`${timestamp()}-${slug}-subscriptions-statistics.csv`, rows)
  }

  return {
    exportWatchers,
    exportSubscribers,
    exportWatchersOrSubscribers,
    exportAllWatchers,
    exportAllSubscribers,
    exportAllWatchersOrSubscribers,
    exportSubscriptionsAll,
    exportSubscriptionsStatistics,
  }
}
