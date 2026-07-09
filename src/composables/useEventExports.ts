import dayjs from 'dayjs'
import { pb } from '@/pb'
import { downloadCsv, type CsvRow } from '@/utils/csv'

type PbRecord = Record<string, any>

// CSV export of an event's subscribers, shared by the admin events list and
// the subscribers dialog.
export const useEventExports = () => {
  const exportSubscribers = async (event: PbRecord) => {
    const subs = await pb.collection('ut_subscriptions').getFullList({
      filter: `event = "${event.id}"`,
      expand: 'user',
    })
    const rows: CsvRow[] = subs
      .filter(sub => sub.expand?.user)
      .sort((a, b) =>
        String(a.expand!.user.name || '').localeCompare(
          String(b.expand!.user.name || ''),
        ),
      )
      .map(sub => {
        const user = sub.expand!.user
        return {
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
          presence: sub.presence,
          coach: sub.is_event_admin,
        }
      })
    downloadCsv(
      `${dayjs().format('YYYY-MM-DD_HH-mm-ss')}-event-${event.id}-subscribers.csv`,
      rows,
    )
  }

  return { exportSubscribers }
}
