import { defineNuxtConfig } from 'nuxt/config'
import vuetify from 'vite-plugin-vuetify'
import appConfig from './nuxt.app.config'
import pwaConfig from './nuxt.pwa.config'
import envConfig from './nuxt.env.config'
import nuxtModuleSw from './sw/nuxt-module-sw'

/** @see https://nuxt.com/docs/api/configuration/nuxt-config */
export default defineNuxtConfig({
  ssr: true,

  modules: [
    '@vite-pwa/nuxt',
    nuxtModuleSw({ inputDir: './sw/scripts', outputDir: './public/sw' }),
  ],

  hooks: {
    'vite:extendConfig': (config) => void config.plugins!.push(vuetify()),
  },

  imports: {
    imports: [{ typeFrom: 'vuetify' }],
  },

  build: {
    transpile: ['vuetify'],
  },

  app: appConfig,

  pwa: pwaConfig,

  devtools: { enabled: true },

  vite: {
    define: {
      $env: envConfig,
    },
    css: {
      preprocessorOptions: {
        scss: { additionalData: `@use '~/styles/core' as *;\n` },
      },
    },
  },

  nitro: {
    ignore: ['**/_/**/*'],
  },
})
