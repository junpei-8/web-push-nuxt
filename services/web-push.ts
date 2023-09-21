import { WebPushSubscriptionsDeleteRequestBody } from '~/server/api/web-push/subscriptions.delete'
import { WebPushSubscriptionsPostRequestBody } from '~/server/api/web-push/subscriptions.post'

const _swCookieName = 'WebPushSubscriptionEndpoint'

let _swRegistration: ServiceWorkerRegistration | null = null

const _gettingSwRegistration = serviceWorker
  ?.register('/sw/web-push.js', { scope: '/sw/' })
  .then((result) => (_swRegistration = result))

/** Web Push の ServiceWorker を登録する */
export async function registerWebPushServiceWorker() {
  if (!_gettingSwRegistration) return null

  const registration = _swRegistration || (await _gettingSwRegistration)

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: $env.VAPID_PUBLIC_KEY,
  })

  const { endpoint, keys, expirationTime = null } = subscription.toJSON()
  if (!endpoint || !keys) return null

  const existingEndpoint = getCookie(_swCookieName)

  // 既に登録済みの Subscription と Endpoint 同様のものであれば何もしない
  if (existingEndpoint === endpoint) return true

  // 既に登録済みの Subscription と Endpoint が異なるものであれば、既存の Subscription を削除する
  if (existingEndpoint) {
    const subscriptionsDeleteRequest: WebPushSubscriptionsDeleteRequestBody = {
      endpoint,
    }

    fetch(`/api/web-push/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscriptionsDeleteRequest),
    }).catch((error) => console.error(error))

    deleteCookie(_swCookieName)
  }

  // 有効期限を生成
  let expiredAt: Date | undefined
  if (expirationTime) {
    expiredAt = new Date()
    expiredAt.setTime(expiredAt.getTime() + expirationTime)
  }

  // Cookie を設定
  setCookie(_swCookieName, endpoint, { expires: expiredAt || Infinity })

  const subscriptionsPostRequest: WebPushSubscriptionsPostRequestBody = {
    endpoint,
    expiredAt,
    authKey: keys.auth,
    p256dhKey: keys.p256dh!,
  }

  try {
    await fetch(`/api/web-push/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscriptionsPostRequest),
    })

    return true

    // ↓ エラー時は Cookie を削除する
  } catch (error) {
    deleteCookie(_swCookieName)
    console.error(error)
    return false
  }
}

export async function subscribeWebPushWithRequest() {
  if (!IS_CLIENT) return null

  const permission = await requestNotificationPermission()
  if (permission !== 'granted') return null

  registerWebPushServiceWorker()
}

export function subscribeWebPush() {
  if (!IS_CLIENT) return null

  const permission = Notification.permission
  if (permission !== 'granted') return null

  registerWebPushServiceWorker()
}

export function sendWebPush() {
  fetch(`/api/web-push/notifications`, { method: 'POST' }).catch((error) =>
    console.error(error)
  )
}
