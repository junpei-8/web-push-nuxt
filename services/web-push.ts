let _registration: ServiceWorkerRegistration | null = null

const _gettingRegistration = serviceWorker
  ?.register('/sw/web-push.js', { scope: '/sw/' })
  .then((result) => (_registration = result))

export async function subscribeWebPush() {
  console.log('subscribeWebPush', _gettingRegistration)

  if (!_gettingRegistration) return null

  console.log(_registration, _gettingRegistration)

  const permission = await requestNotificationPermission()
  if (permission !== 'granted') return null

  const registration = _registration || (await _gettingRegistration)

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: $env.VAPID_PUBLIC_KEY,
  })

  console.log(subscription)

  return subscription
}
