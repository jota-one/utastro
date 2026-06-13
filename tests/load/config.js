import { sleep } from 'k6'

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:4321'
export const PB_URL = __ENV.PB_URL || 'http://localhost:8091'

// An event ID that exists in the test DB (not full, not cancelled)
export const TEST_EVENT_ID = __ENV.TEST_EVENT_ID || ''

// A city ID that exists in the test DB
export const TEST_CITY_ID = __ENV.TEST_CITY_ID || ''

export const thresholds = {
  // Abort if error rate exceeds 1%
  http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: false }],
  // SSR pages: p95 under 2s on a light VPS
  'http_req_duration{type:page}': ['p(95)<2000'],
  // PocketBase API calls: p95 under 500ms
  'http_req_duration{type:api}': ['p(95)<500'],
  // Auth endpoint specifically
  'http_req_duration{type:auth}': ['p(95)<1000'],
}

export function eventDateFilter() {
  const now = new Date()
  const later = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
  const fmt = d => d.toISOString().replace('T', ' ').slice(0, 19)
  return `start_date > "${fmt(now)}" && start_date < "${fmt(later)}"`
}

export function randomSleep(min = 0.5, max = 2) {
  sleep(min + Math.random() * (max - min))
}
