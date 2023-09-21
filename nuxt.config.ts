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
    nuxtModuleSw({ inputDir: './sw/scripts', outputDir: './public/_sw' }),
  ],

  hooks: {
    ready: () => console.log('ready...'),
    restart: () => console.log('restarting...'),
    'build:before': () => console.log('building...'),
    /**
     * Called before generating the app.
     *
     * @param options GenerateAppOptions object
     * @returns Promise
     */
    'builder:generateApp': () => console.log('generating app...'),
    /**
     * Called at build time in development when the watcher spots a change to a file or directory in the project.
     *
     * @param event "add" | "addDir" | "change" | "unlink" | "unlinkDir"
     * @param path the path to the watched file
     * @returns Promise
     */
    'builder:watch': (event, path) => console.log('watching...', event, path),

    'vite:extendConfig': (config) => void config.plugins!.push(vuetify()),
  },

  imports: {
    imports: [{ typeFrom: 'h3' }, { typeFrom: 'vuetify' }],
  },

  build: {
    transpile: ['vuetify'],
  },

  app: appConfig,

  pwa: pwaConfig,

  devtools: { enabled: true },

  vite: {
    define: { $env: envConfig },
    plugins: [],
  },
})
