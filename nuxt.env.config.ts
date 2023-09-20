export const $env = {
  PROCESS_VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
  VAPID_PUBLIC_KEY: import.meta.env.VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY: import.meta.env.VAPID_PRIVATE_KEY,
  VAPID_EMAIL: import.meta.env.VAPID_EMAIL,
  DATABASE_URL: import.meta.env.DATABASE_URL,
} as const

export type $Env = typeof $env

declare global {
  const $env: $Env
}
