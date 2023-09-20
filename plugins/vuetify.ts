import './vuetify.styles.scss'
import { createVuetify } from 'vuetify'

export default defineNuxtPlugin((nuxtApp) => {
  const WHITE_TEXT = '#fff'

  nuxtApp.vueApp.use(
    /** @see https://vuetifyjs.com/en/getting-started/installation */
    createVuetify({
      /** @see https://vuetifyjs.com/en/getting-started/installation/#ssr */
      ssr: true,

      /** @see https://vuetifyjs.com/en/features/theme/ */
      theme: {
        defaultTheme: 'light',
        themes: {
          light: {
            dark: false,
            colors: {
              background: '#18181B',
              'on-background': WHITE_TEXT,

              primary: '#00DC82',
              'on-primary': WHITE_TEXT,
            },
          },
        },
      },
    })
  )
})
