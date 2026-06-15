import http from 'k6/http'
import { check } from 'k6'
import { BASE_URL, PB_URL, eventDateFilter, randomSleep } from '../config.js'

/**
 * Simulates an anonymous user browsing the app.
 * Hits Astro SSR pages + PocketBase public API endpoints.
 */
export function anonymousFlow() {
  // 1. Astro SSR homepage (redirects / → /fr, k6 follows automatically)
  let res = http.get(`${BASE_URL}/`, { tags: { type: 'page' } })
  check(res, { 'homepage 200': r => r.status === 200 })
  randomSleep(1, 3)

  // 2. Cities list (PocketBase public API)
  res = http.get(
    `${PB_URL}/api/collections/ut_cities/records?filter=enabled%3Dtrue&fields=id,label,slug,coords&sort=label`,
    { tags: { type: 'api' } },
  )
  check(res, { 'cities 200': r => r.status === 200 })
  randomSleep(0.5, 1.5)

  // 3. Events list with date filter
  const filter = encodeURIComponent(eventDateFilter())
  res = http.get(
    `${PB_URL}/api/collections/ut_events/records?filter=${filter}&expand=location,types`,
    { tags: { type: 'api' } },
  )
  check(res, { 'events 200': r => r.status === 200 })

  // 4. Optionally open one event detail page (first result)
  const events = res.json('items')
  if (events && events.length > 0) {
    const eventId = events[0].id
    randomSleep(1, 2)
    res = http.get(`${PB_URL}/api/collections/ut_events/records/${eventId}?expand=location,types`, {
      tags: { type: 'api' },
    })
    check(res, { 'event detail 200': r => r.status === 200 })
  }

  randomSleep(1, 3)
}
