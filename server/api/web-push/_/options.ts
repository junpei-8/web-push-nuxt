import { RequestOptions } from 'web-push'
import $env from '~/nuxt.env.config'

export const WEB_PUSH_OPTIONS = {
  vapidDetails: {
    subject: `mailto:${$env.VAPID_EMAIL}`,
    publicKey: $env.VAPID_PUBLIC_KEY,
    privateKey: $env.VAPID_PRIVATE_KEY,
  },
} as const satisfies RequestOptions
