import { appToastStore } from '~/app/stores/toast'
import type { WebPushSubscriptionsDeleteRequestBody } from '~/server/api/web-push/subscriptions.delete'
import type { WebPushSubscriptionsPostRequestBody } from '~/server/api/web-push/subscriptions.post'

const _swCookieName = 'WebPushSubscriptionEndpoint'

let _swRegistration: ServiceWorkerRegistration | null = null

serviceWorker?.addEventListener('message', (event) => {
  const data = event.data

  if (data.type === 'navigation' && data.pathname) {
    appToastStore.open('Redirect: ' + data.pathname, { color: 'info' })
    useRouter().push(data.pathname)
  }
})

const _gettingSwRegistration = serviceWorker
  ?.register('/sw/web-push.js', { scope: '/sw/' })
  .then((registration) => {
    appToastStore.open('Service Worker を登録しました', { color: 'success' })
    return (_swRegistration = registration)
  })

/** Web Push の ServiceWorker を登録する */
export async function registerWebPushServiceWorker() {
  if (!_gettingSwRegistration) return null

  const registration = _swRegistration || (await _gettingSwRegistration)

  appToastStore.open('Web Push のスクリプトの読み込みが完了しました', {
    color: 'success',
  })

  appToastStore.open('Service Worker デバイストークンを発行しています', {
    color: 'info',
  })

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: $env.VAPID_PUBLIC_KEY,
  })

  appToastStore.open('Service Worker デバイストークンを登録しました', {
    color: 'success',
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
  if (!IS_SUPPORTED_NOTIFICATION) return null

  const permission = await requestNotificationPermission()
  if (permission !== 'granted') return null

  appToastStore.open('Web Push に登録しています。', { color: 'info' })

  return registerWebPushServiceWorker()
}

export function subscribeWebPush() {
  if (!IS_SUPPORTED_NOTIFICATION) return null

  const permission = Notification.permission
  if (permission !== 'granted') return null

  return registerWebPushServiceWorker()
}
