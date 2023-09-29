import { appToastStore } from '~/app/stores/toast'
import type { WebPushSubscriptionsDeleteRequestBody } from '~/server/api/web-push/subscriptions.delete'
import type { WebPushSubscriptionsPostRequestBody } from '~/server/api/web-push/subscriptions.post'

let _webPushSwRegistration: ServiceWorkerRegistration | null = null
let _gettingWebPushSwRegistration: Promise<ServiceWorkerRegistration> | null
let _updatingWebPushSwRegistration: Promise<ServiceWorkerRegistration> | null

/** Service Worker を更新する関数 */
export async function updateWebPushServiceWorker(
  registration: ServiceWorkerRegistration
) {
  const updatingRegistration = registration.update().then(() => registration)

  await (_updatingWebPushSwRegistration = updatingRegistration)

  // 更新が完了したら 更新中を管理している変数を null にする
  _updatingWebPushSwRegistration = null
}

/** Web Push の Service Worker を読み込む */
export async function registerWebPushServiceWorker() {
  if (!serviceWorker) throw new Error('Service Worker is not supported')

  if (_updatingWebPushSwRegistration) await _updatingWebPushSwRegistration
  if (_gettingWebPushSwRegistration) return _gettingWebPushSwRegistration
  if (_webPushSwRegistration) return _webPushSwRegistration

  const gettingRegistration = (_gettingWebPushSwRegistration =
    serviceWorker.register('/sw/web-push.js', { scope: '/sw/' }))

  const registration = await gettingRegistration

  appToastStore.open('Service Worker を登録しました', { color: 'success' })

  // Service Worker を更新する関数を定義
  const updateRegistration = () => updateWebPushServiceWorker(registration)

  // 更新する
  await updateRegistration()

  // 新しい更新があった時に Service Worker を更新するイベントリスナーを追加
  addEventListener('updatefound', updateRegistration)

  // Service Worker が Unregister された時に、Service Worker を更新するイベントリスナーを削除する
  addServiceWorkerUnregisterEventListener(registration, () =>
    removeEventListener('updatefound', updateRegistration)
  )

  addServiceWorkerUnregisterEventListener(registration, () =>
    console.log('unregister!', registration)
  )

  appToastStore.open('Service Worker が有効になりました', { color: 'success' })

  _webPushSwRegistration = registration
  _gettingWebPushSwRegistration = null

  setTimeout(() => {
    console.log('Unregister !')
    registration.unregister()
  }, 8000)

  return registration
}

/** Web Push の ServiceWorker を登録する */
export function navigateByWebPushServiceWorkerRequest(event: MessageEvent) {
  const data = event.data
  if (!data) return

  const { type, pathname } = data

  if (type === 'navigation' && pathname) {
    appToastStore.open('リダイレクト: ' + pathname, { color: 'info' })
    useRouter().push(data.pathname)
  }
}

/**
 * Web Push Service Worker のナビゲーションリクエストを監視する。
 * Service Worker が Unregister されると、自動的にリスナーを削除は削除される。
 */
export function listenWebPushServiceWorkerNavigationRequest(
  register: ServiceWorkerRegistration
) {
  if (!serviceWorker) throw new Error('Service Worker is not supported')

  const navigate = navigateByWebPushServiceWorkerRequest.bind(null)

  // Service Worker からのメッセージを受け取った時に発火するイベントリスナーを追加する
  serviceWorker.addEventListener('message', navigate)

  // Service Worker からのメッセージを受け取った時に発火するイベントリスナーを削除する
  const removeEventListener = () => {
    serviceWorker.removeEventListener('message', navigate)
    removeUnregisterListener()
  }

  // Service Worker が Unregister された時に、Service Worker からのメッセージを受け取った時に発火するイベントリスナーを削除する
  const removeUnregisterListener = listenServiceWorkerUnregisterEvent(
    register,
    removeEventListener
  )
}

const _webPushSubscriptionEndpointCookieName = 'WebPushSubscriptionEndpoint'

/** Web Push の ServiceWorker を登録する */
export async function subscribeWebPushServiceWorker() {
  const registration = await registerWebPushServiceWorker()

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: $env.VAPID_PUBLIC_KEY,
  })

  appToastStore.open('Service Worker デバイストークンを登録しました', {
    color: 'success',
  })

  const { endpoint, keys, expirationTime = null } = subscription.toJSON()
  const { auth: authKey, p256dh: p256dhKey } = keys || {}

  if (!endpoint) throw new Error('Endpoint of Subscription is invalid')
  if (!authKey) throw new Error('AuthKey of Subscription is invalid')
  if (!p256dhKey) throw new Error('P256dhKey of Subscription is invalid')

  const existingEndpoint = getCookie(_webPushSubscriptionEndpointCookieName)

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

    deleteCookie(_webPushSubscriptionEndpointCookieName)

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
  setCookie(_webPushSubscriptionEndpointCookieName, endpoint, {
    expires: expiredAt || Infinity,
  })

  const subscriptionsPostRequest: WebPushSubscriptionsPostRequestBody = {
    endpoint,
    expiredAt,
    authKey,
    p256dhKey,
  }

  const { error } = await useLazyFetch(`/api/web-push/subscriptions`, {
    method: 'POST',
    body: subscriptionsPostRequest,
  })

  if (error.value) {
    // ↓ エラー時は Cookie を削除する
    deleteCookie(_webPushSubscriptionEndpointCookieName)
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

  return subscribeWebPushServiceWorker()
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
