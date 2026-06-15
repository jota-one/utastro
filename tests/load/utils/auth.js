import http from 'k6/http'
import { check } from 'k6'
import { PB_URL } from '../config.js'

/**
 * Authenticates against the custom legacy auth endpoint.
 * Returns { token, userId } or null on failure.
 */
export function login(email, password) {
  const res = http.post(`${PB_URL}/api/custom/auth/login`, JSON.stringify({ email, password }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { type: 'auth' },
  })

  const ok = check(res, { 'login 200': r => r.status === 200 })
  if (!ok) return null

  const body = res.json()
  return { token: body.token, userId: body.record?.id }
}

export function authHeaders(token) {
  return {
    Authorization: token,
    'Content-Type': 'application/json',
  }
}
