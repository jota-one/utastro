import type { App } from 'vue'
import { setupI18n } from '@/i18n'

export default (app: App) => {
  setupI18n(app)
}
