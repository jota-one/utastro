/**
 * Smoke test — 1 VU, 1 iteration.
 * Validates that both anonymous and authenticated flows work before running load tests.
 *
 * Usage:
 *   k6 run --env-file tests/load/.env tests/load/smoke.js
 */
import { SharedArray } from 'k6/data'
import { thresholds } from './config.js'
import { anonymousFlow } from './scenarios/anonymous.js'
import { authenticatedFlow } from './scenarios/authenticated.js'

const users = new SharedArray('test-users', () => JSON.parse(open('./test-users.json')))

export const options = {
  vus: 1,
  iterations: 1,
  thresholds,
}

export default function () {
  anonymousFlow()

  if (users.length > 0) {
    const { email, password } = users[0]
    authenticatedFlow(email, password)
  }
}
