import { appToastStore } from '~/app/stores/toast'
import type { WebPushSubscriptionsDeleteRequestBody } from '~/server/api/web-push/subscriptions.delete'
import type { WebPushSubscriptionsPostRequestBody } from '~/server/api/web-push/subscriptions.post'

const _swCookieName = 'WebPushSubscriptionEndpoint'

let _swRegistration: ServiceWorkerRegistration | null = null
export async function registerServiceWorker() {
  if (!serviceWorker) return null
  if (_swRegistration) return _swRegistration

  const registration = await serviceWorker.register('/sw/web-push.js', {
    scope: '/sw/',
  })

  appToastStore.open('Service Worker を登録しました', { color: 'success' })

  // Service Worker が有効になるまで待つ
  await serviceWorker.ready

  appToastStore.open('Service Worker が有効になりました', { color: 'success' })

  _swRegistration = registration

  serviceWorker.addEventListener('message', (event) => {
    const data = event.data
    if (!data) return

    const { type, pathname } = data

    if (type === 'navigation' && pathname) {
      appToastStore.open('リダイレクト: ' + pathname, { color: 'info' })
      useRouter().push(data.pathname)
    }
  })

  return registration
}

/** Web Push の ServiceWorker を登録する */
export async function registerWebPushServiceWorker() {
  const registration = _swRegistration || (await registerServiceWorker())

  if (!registration) {
    appToastStore.open('Service Worker の登録に失敗しました', {
      color: 'error',
    })
    return null
  }

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

    const { error } = await useLazyFetch(`/api/web-push/subscriptions`, {
      method: 'POST',
      body: subscriptionsDeleteRequest,
    })

    if (error.value) console.log(error.value)

    deleteCookie(_swCookieName)

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
  setCookie(_swCookieName, endpoint, { expires: expiredAt || Infinity })

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
    deleteCookie(_swCookieName)
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

  if (permission !== 'granted') return null

  return registerWebPushServiceWorker()
}
export function subscribeWebPushOnChangeVisibility(
  options: SubscribeWebPushOptions = {}
) {
  if (!IS_SUPPORTED_NOTIFICATION) return

  const onChangeVisibility = () => {
    if (document.visibilityState === 'visible') subscribeWebPush(options)
  }

  document.addEventListener('visibilitychange', onChangeVisibility)
  return () => removeEventListener('visibilitychange', onChangeVisibility)
}
