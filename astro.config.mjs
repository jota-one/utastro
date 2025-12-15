// @ts-check
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

import vue from '@astrojs/vue'

import node from '@astrojs/node'

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    ...(process.env.NODE_ENV === 'production'
      ? {
          ssr: {
            noExternal: ['vue', 'pocketbase', '@primevue/themes', '@primeuix/themes'],
          },
        }
      : {}),
  },

  integrations: [vue({ appEntrypoint: '/src/pages/_app' })],
  outDir: 'pb/pb_public',

  ...(process.env.NODE_ENV === 'production'
    ? {
        server: {
          host: '127.0.0.1',
        },
      }
    : {}),

  adapter: node({
    mode: 'standalone',
  }),
})
