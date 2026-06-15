/**
 * Load test — simulates 100 concurrent users.
 * 80% anonymous browsing, 20% authenticated flows.
 *
 * Usage:
 *   k6 run --env-file tests/load/.env tests/load/load.js
 */
import { SharedArray } from 'k6/data'
import { thresholds } from './config.js'
import { anonymousFlow } from './scenarios/anonymous.js'
import { authenticatedFlow } from './scenarios/authenticated.js'

const users = new SharedArray('test-users', () => JSON.parse(open('./test-users.json')))

export const options = {
  scenarios: {
    anonymous: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 80 }, // ramp up to 80 VUs
        { duration: '3m', target: 80 }, // sustain
        { duration: '30s', target: 0 }, // ramp down
      ],
      exec: 'runAnonymous',
    },
    authenticated: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 20 },
        { duration: '3m', target: 20 },
        { duration: '30s', target: 0 },
      ],
      exec: 'runAuthenticated',
    },
  },
  thresholds,
}

export function runAnonymous() {
  anonymousFlow()
}

export function runAuthenticated() {
  if (!users.length) return
  // Each VU rotates through the user pool
  const user = users[__VU % users.length]
  authenticatedFlow(user.email, user.password)
}
