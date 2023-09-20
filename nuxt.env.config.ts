const $env = {
  PROCESS_VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY as string,
  VAPID_PUBLIC_KEY: import.meta.env.VAPID_PUBLIC_KEY as string,
  VAPID_PRIVATE_KEY: import.meta.env.VAPID_PRIVATE_KEY as string,
  VAPID_EMAIL: import.meta.env.VAPID_EMAIL as string,
  DATABASE_URL: import.meta.env.DATABASE_URL as string,
  test: 'string',
} as const

type $Env = typeof $env

declare global {
  const $env: $Env
}

export default $env
