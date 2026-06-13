/**
 * Stress test — ramps up to 1000 VUs to find the breaking point.
 * Focused on anonymous reads (pages + PocketBase public API) since
 * that's the dominant traffic pattern and the most likely bottleneck
 * on a single-CPU VPS with SQLite.
 *
 * A small authenticated scenario is included to surface SQLite write
 * contention under pressure.
 *
 * Usage:
 *   k6 run --env-file tests/load/.env tests/load/stress.js
 */
import { SharedArray } from 'k6/data'
import { thresholds } from './config.js'
import { anonymousFlow } from './scenarios/anonymous.js'
import { authenticatedFlow } from './scenarios/authenticated.js'

const users = new SharedArray('test-users', () =>
  JSON.parse(open('./test-users.json')),
)

export const options = {
  scenarios: {
    anonymous_stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },  // warm up
        { duration: '2m', target: 500 },  // push
        { duration: '2m', target: 1000 }, // peak
        { duration: '1m', target: 0 },    // cool down
      ],
      exec: 'runAnonymous',
    },
    authenticated_stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 10 },
        { duration: '2m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '1m', target: 0 },
      ],
      exec: 'runAuthenticated',
    },
  },
  thresholds: {
    ...thresholds,
    // Relax thresholds slightly for stress — we're looking for the cliff, not tuning
    'http_req_duration{type:page}': ['p(95)<5000'],
    'http_req_duration{type:api}': ['p(95)<2000'],
  },
}

export function runAnonymous() {
  anonymousFlow()
}

export function runAuthenticated() {
  if (!users.length) return
  const user = users[__VU % users.length]
  authenticatedFlow(user.email, user.password)
}
