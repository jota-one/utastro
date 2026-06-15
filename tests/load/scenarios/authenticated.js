import http from 'k6/http'
import { check } from 'k6'
import { PB_URL, TEST_EVENT_ID, TEST_CITY_ID, randomSleep } from '../config.js'
import { login, authHeaders } from '../utils/auth.js'

/**
 * Simulates an authenticated user:
 *   login → load subscriptions → subscribe to event → unsubscribe
 *         → watch city → unwatch city
 *
 * All writes are reversed so the test DB stays clean across runs.
 * TEST_EVENT_ID and TEST_CITY_ID must exist in the test DB.
 */
export function authenticatedFlow(email, password) {
  // 1. Login
  const auth = login(email, password)
  if (!auth) return
  const { token, userId } = auth
  const headers = authHeaders(token)

  randomSleep(0.5, 1)

  // 2. Load user subscriptions
  let res = http.get(
    `${PB_URL}/api/collections/ut_subscriptions/records?filter=${encodeURIComponent(`user="${userId}"`)}&fields=id,event,is_event_admin`,
    { headers, tags: { type: 'api' } },
  )
  check(res, { 'subscriptions 200': r => r.status === 200 })

  // 3. Load city watchers
  res = http.get(
    `${PB_URL}/api/collections/ut_city_watchers/records?filter=${encodeURIComponent(`user="${userId}"`)}&fields=id,city`,
    { headers, tags: { type: 'api' } },
  )
  check(res, { 'city watchers 200': r => r.status === 200 })

  randomSleep(1, 2)

  // 4. Subscribe to event (if TEST_EVENT_ID provided)
  if (TEST_EVENT_ID) {
    res = http.post(
      `${PB_URL}/api/collections/ut_subscriptions/records`,
      JSON.stringify({ user: userId, event: TEST_EVENT_ID, is_event_admin: false }),
      { headers, tags: { type: 'api' } },
    )
    const subscribed = check(res, { 'subscribe 200': r => r.status === 200 })

    if (subscribed) {
      const subId = res.json('id')
      randomSleep(0.5, 1.5)

      // 5. Unsubscribe (cleanup)
      res = http.del(`${PB_URL}/api/collections/ut_subscriptions/records/${subId}`, null, {
        headers,
        tags: { type: 'api' },
      })
      check(res, { 'unsubscribe 204': r => r.status === 204 })
    }
  }

  randomSleep(0.5, 1)

  // 6. Watch a city (if TEST_CITY_ID provided)
  if (TEST_CITY_ID) {
    res = http.post(
      `${PB_URL}/api/collections/ut_city_watchers/records`,
      JSON.stringify({ user: userId, city: TEST_CITY_ID }),
      { headers, tags: { type: 'api' } },
    )
    const watched = check(res, { 'watch city 200': r => r.status === 200 })

    if (watched) {
      const watchId = res.json('id')
      randomSleep(0.5, 1)

      // 7. Unwatch city (cleanup)
      res = http.del(`${PB_URL}/api/collections/ut_city_watchers/records/${watchId}`, null, {
        headers,
        tags: { type: 'api' },
      })
      check(res, { 'unwatch city 204': r => r.status === 204 })
    }
  }

  randomSleep(1, 2)
}
