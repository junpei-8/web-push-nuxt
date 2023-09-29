import { appToastStore } from '~/app/stores/toast'
import type { WebPushSubscriptionsDeleteRequestBody } from '~/server/api/web-push/subscriptions.delete'
import type { WebPushSubscriptionsPostRequestBody } from '~/server/api/web-push/subscriptions.post'

const _webPushEndpointCookieName = 'WebPushSubscriptionEndpoint'

// NOTE: スクリプト読み込み時に起動しないと IOS Safari で正常に動作しなくなる
const _webPushServiceWorkerRegistration = serviceWorker
  ?.register('/sw/web-push.js', { scope: '/sw/' })
  .then((registration) => {
    appToastStore.open('Service Worker を登録しました', { color: 'success' })

    serviceWorker.addEventListener('message', (event) => {
      const data = event.data
      if (!data) return

      const { type, pathname } = data

      if (type === 'navigation' && pathname) {
        appToastStore.open('リダイレクト: ' + pathname, { color: 'info' })
        useRouter().push(data.pathname)
      }
    })

    registration.addEventListener('updatefound', () =>
      appToastStore.open('Service Worker の更新が見つかりました', {
        color: 'info',
      })
    )

    return registration
  })

/** Web Push の ServiceWorker を登録する */
export async function registerWebPushServiceWorker() {
  if (!_webPushServiceWorkerRegistration) return

  const registration = await _webPushServiceWorkerRegistration

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: $env.VAPID_PUBLIC_KEY,
  })

  appToastStore.open('Service Worker デバイストークンを登録しました', {
    color: 'success',
  })

  const { endpoint, keys, expirationTime = null } = subscription.toJSON()
  if (!endpoint || !keys) return null

  const existingEndpoint = getCookie(_webPushEndpointCookieName)

  // 既に登録済みの Subscription と Endpoint 同様のものであれば何もしない
  if (existingEndpoint === endpoint) return true

  // 既に登録済みの Subscription と Endpoint が異なるものであれば、既存の Subscription を削除する
  if (existingEndpoint) {
    const subscriptionsDeleteRequest: WebPushSubscriptionsDeleteRequestBody = {
      endpoint,
    }

    const { error } = await useLazyFetch(`/api/web-push/subscriptions`, {
      method: 'POST',
      body: subscriptionsDeleteRequest,
    })

    if (error.value) console.log(error.value)

    deleteCookie(_webPushEndpointCookieName)

    appToastStore.open('既存の Subscription を削除しました', {
      color: 'success',
    })
  }

  // 有効期限を生成
  let expiredAt: Date | undefined
  if (expirationTime) {
    expiredAt = new Date()
    expiredAt.setTime(expiredAt.getTime() + expirationTime)
  }

  // Cookie を設定
  setCookie(_webPushEndpointCookieName, endpoint, {
    expires: expiredAt || Infinity,
  })

  const subscriptionsPostRequest: WebPushSubscriptionsPostRequestBody = {
    endpoint,
    expiredAt,
    authKey: keys.auth,
    p256dhKey: keys.p256dh!,
  }

  const { error } = await useLazyFetch(`/api/web-push/subscriptions`, {
    method: 'POST',
    body: subscriptionsPostRequest,
  })

  if (error.value) {
    // ↓ エラー時は Cookie を削除する
    deleteCookie(_webPushEndpointCookieName)
    console.error(error.value)
    return false
  }

  return true
}

export interface SubscribeWebPushOptions {
  /** @default true */
  withRequest?: boolean
}
export async function subscribeWebPush(options: SubscribeWebPushOptions = {}) {
  if (!IS_SUPPORTED_NOTIFICATION) return null

  const permission =
    options.withRequest === false
      ? Notification.permission
      : await requestNotificationPermission()

  appToastStore.open('Permission: ' + permission)

  if (permission !== 'granted') return null

  return registerWebPushServiceWorker()
}
export function subscribeWebPushOnChangeVisibility(
  options: SubscribeWebPushOptions = {}
) {
  if (!IS_SUPPORTED_NOTIFICATION) return

  const onChangeVisibility = () => {
    if (document.visibilityState === 'visible') {
      appToastStore.open('Visibility が有効になりました')
      subscribeWebPush(options)
    }
  }

  document.addEventListener('visibilitychange', onChangeVisibility)
  return () => removeEventListener('visibilitychange', onChangeVisibility)
}
