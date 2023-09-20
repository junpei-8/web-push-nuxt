import { defineNuxtConfig } from 'nuxt/config'
import vuetify from 'vite-plugin-vuetify'

/** @see https://nuxt.com/docs/api/configuration/nuxt-config */
export default defineNuxtConfig({
  ssr: true,

  hooks: { 
    'vite:extendConfig': (config) => void config.plugins!.push(vuetify())
  },

  imports: {
    imports: [{ from: 'vuetify' }]
  },

  build: {
    transpile: ['vuetify']
  },

  devtools: { enabled: true },
})
