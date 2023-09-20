const $env = {
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY!,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY!,
  VAPID_EMAIL: process.env.VAPID_EMAIL!,
  DATABASE_URL: process.env.DATABASE_URL!,
  DATABASE_USERNAME: process.env.DATABASE_USERNAME!,
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD!,
} as const

type $Env = typeof $env

declare global {
  const $env: $Env
}

export default $env
