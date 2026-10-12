import PocketBase from 'pocketbase'
import config from './config'

// PUBLIC_PB_BASE_URI is only set for local development (.env.local), where
// PocketBase runs on its own port. A deployed site serves PocketBase under
// /api on its own domain, so the browser uses the page's origin and the
// server side calls it locally on the port the jota-one/infra deployment
// provides (PB_PORT). Never compile a site's URL into the build: next and www
// share it and would read and write another site's database.
function pocketBaseUrl() {
  if (config.apiBaseUrl) {
    return config.apiBaseUrl
  }
  if (import.meta.env.SSR) {
    return `http://127.0.0.1:${process.env.PB_PORT}`
  }
  return window.location.origin
}

export const pb = new PocketBase(pocketBaseUrl())
