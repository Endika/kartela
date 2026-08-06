/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { version } from './package.json' with { type: 'json' }

export default defineConfig({
  base: '/kartela/',
  // Baked in at build time so the running page can say which build it is — the thing you
  // actually need when a PWA might be serving a stale cache.
  define: { __APP_VERSION__: JSON.stringify(version) },
  plugins: [
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false },
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Kartela',
        short_name: 'Kartela',
        description: 'Pick your favourite movie poster, one duel at a time',
        theme_color: '#1d1147',
        background_color: '#1d1147',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/kartela/',
        scope: '/kartela/',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // The posters are the game, so they are precached with the app shell: without them
        // an offline match shows empty cards.
        globPatterns: ['**/*.{js,css,html,svg,png,json,webp,woff2}'],
      },
    }),
  ],
  build: { sourcemap: true, target: 'es2022' },
  test: {
    environment: 'jsdom',
  },
})
