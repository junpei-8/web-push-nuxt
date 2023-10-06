import { NuxtConfig } from 'nuxt/config'

export default {
  head: {
    title: 'Web Push with Nuxt',
    meta: [{ name: 'apple-mobile-web-app-capable', content: 'yes' }],
    link: [
      { rel: 'manifest', href: '/manifest.webmanifest' },
      { rel: 'icon', href: '/app/favicon.ico', sizes: 'any' },
      { rel: 'icon', href: '/app/favicon.svg', type: 'image/svg+xml' },
      { rel: 'apple-touch-icon', href: '/app/icon-apple-180x180.png' },
    ],

    script: [
      {
        innerHTML: `addEventListener('load', function () {
					if ('serviceWorker' in navigator) {
						navigator.serviceWorker.register('/sw/web-push.js', {
							scope: '/sw/',
							updateViaCache: 'none',
						})
					}
				}`,
      },
    ],
  },
} satisfies NuxtConfig['app']
