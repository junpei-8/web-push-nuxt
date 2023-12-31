import { ModuleOptions } from '@vite-pwa/nuxt'

export default {
  registerType: 'autoUpdate',

  includeAssets: ['app/favicon.ico'],

  client: {
    installPrompt: true,
  },

  manifest: {
    id: 'web-push-nuxt',
    start_url: '/',
    name: 'Web Push with Nuxt',
    short_name: 'Web Push with Nuxt',
    description: 'Web Push with Nuxt',
    display: 'standalone',
    theme_color: '#00dc82',
    background_color: '#18181b',

    icons: [
      {
        src: 'app/icon-64x64.png',
        sizes: '64x64',
        type: 'image/png',
      },
      {
        src: 'app/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'app/icon-maskable-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: 'app/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: 'app/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },

  workbox: {
    navigateFallback: null,
  },

  devOptions: {
    enabled: true,
    type: 'module',
  },
} satisfies ModuleOptions
