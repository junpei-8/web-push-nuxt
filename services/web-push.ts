import { appToastStore } from '~/app/stores/toast'
import type { WebPushSubscriptionsDeleteRequestBody } from '~/server/api/web-push/subscriptions.delete'
import type { WebPushSubscriptionsPostRequestBody } from '~/server/api/web-push/subscriptions.post'

// Register の状態を管理するキャッシュ
let _webPushSwRegistration: ServiceWorkerRegistration | null = null
let _gettingWebPushSwRegistration: Promise<ServiceWorkerRegistration> | null
let _updatingWebPushSwRegistration: Promise<ServiceWorkerRegistration> | null

/** Service Worker を更新する関数。 */
export async function updateWebPushServiceWorker(
  registration: ServiceWorkerRegistration
) {
  const updatingRegistration = registration.update().then(() => registration)

  await (_updatingWebPushSwRegistration = updatingRegistration)

  listenWebPushServiceWorkerNavigationRequest(registration)
  appToastStore.open('Service Worker を更新しました', { color: 'info' })

  // 更新が完了したら 更新中を管理している変数を null にする
  _updatingWebPushSwRegistration = null
}

interface RegisterWebPushServiceWorkerReturns {
  registration: ServiceWorkerRegistration
  registrationType: 'initializing' | 'updating' | 'fresh' | 'cached'
}
/** Web Push の Service Worker を読み込む */
export async function registerWebPushServiceWorker(): Promise<RegisterWebPushServiceWorkerReturns> {
  if (!serviceWorker) throw new Error('Service Worker is not supported')

  // 更新中の場合
  if (_updatingWebPushSwRegistration) {
    return {
      registration: await _updatingWebPushSwRegistration,
      registrationType: 'updating',
    }
  }

  // 初期化中の場合
  if (_gettingWebPushSwRegistration) {
    return {
      registration: await _gettingWebPushSwRegistration,
      registrationType: 'initializing',
    }
  }

  // キャッシュが存在する場合
  if (_webPushSwRegistration) {
    return {
      registration: _webPushSwRegistration,
      registrationType: 'cached',
    }
  }

  const gettingRegistration = (_gettingWebPushSwRegistration =
    serviceWorker.register('/sw/web-push.js', {
      scope: '/sw/',
      updateViaCache: 'none',
    }))

  const registration = await gettingRegistration

  appToastStore.open('Service Worker を登録しました', { color: 'success' })

  // Service Worker を更新する関数を定義
  const updateRegistration = () => updateWebPushServiceWorker(registration)

  await updateRegistration()

  // 新しい更新があった時に Service Worker を更新するイベントリスナーを追加
  addEventListener('updatefound', updateRegistration)

  // Service Worker が Unregister された時に、Service Worker を更新するイベントリスナーを削除する
  addServiceWorkerUnregisterEventListener(registration, () =>
    removeEventListener('updatefound', updateRegistration)
  )

  appToastStore.open('Service Worker が有効になりました', { color: 'success' })

  _webPushSwRegistration = registration
  _gettingWebPushSwRegistration = null

  registration.getNotifications().then((notifications) =>
    appToastStore.open('Notifications: ' + JSON.stringify(notifications), {
      color: 'info',
    })
  )

  return {
    registration,
    registrationType: 'fresh',
  }
}

/** Web Push の ServiceWorker を登録する */
export function navigateByWebPushServiceWorkerRequest(event: MessageEvent) {
  const data = event.data
  if (!data) return

  const { type, pathname } = data

  if (type === 'navigation' && pathname) {
    appToastStore.open('Redirect: ' + pathname, { color: 'info' })
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

  appToastStore.open('Navigation Request Listener を登録しました', {
    color: 'success',
  })

  // Service Worker からのメッセージを受け取った時に発火するイベントリスナーを削除する
  const removeEventListener = () => {
    serviceWorker.removeEventListener('message', navigate)
    removeUnregisterListener()
    appToastStore.open('Navigation Request Listener が削除されました', {
      color: 'success',
    })
  }

  // Service Worker が Unregister された時に、Service Worker からのメッセージを受け取った時に発火するイベントリスナーを削除する
  const removeUnregisterListener = listenServiceWorkerUnregisterEvent(
    register,
    removeEventListener
  )

  return removeEventListener
}

const _webPushSubscriptionEndpointCookieName = 'WebPushSubscriptionEndpoint'

/** Web Push の ServiceWorker を登録する。 */
export async function subscribeWebPushServiceWorker() {
  // Web Push サービスワーカーを登録する
  const { registration, registrationType } =
    await registerWebPushServiceWorker()

  appToastStore.open('Registration Type: ' + registrationType, {
    color: 'info',
  })

  // 一番最初の登録時の場合
  // if (registrationType === 'fresh') {
  //   listenWebPushServiceWorkerNavigationRequest(registration)
  // }

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
  if (existingEndpoint === endpoint) {
    appToastStore.open('既に登録済みの Registration です', { color: 'info' })
    return registration
  }

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
    throw error.value
  }

  return registration
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

serviceWorker?.addEventListener('message', (event) => {
  appToastStore.open(
    'Message from Service Worker1: ' + JSON.stringify(event.data),
    { color: 'info' }
  )
})

serviceWorker?.addEventListener('messageerror', (event) => {
  appToastStore.open(
    'Message from Service Worker Error: ' + JSON.stringify(event.data),
    { color: 'error' }
  )
})
