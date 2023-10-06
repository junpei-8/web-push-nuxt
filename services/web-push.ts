import { appToastStore } from '~/app/stores/toast'
import type { WebPushSubscriptionsDeleteRequestBody } from '~/server/api/web-push/subscriptions.delete'
import type { WebPushSubscriptionsPostRequestBody } from '~/server/api/web-push/subscriptions.post'

/** Web Push の Subscription を保存する関数。 */
const _webPushSubscriptionEndpointCookieName = 'WebPushSubscriptionEndpoint'

// Service Worker の登録情報をキャッシュする変数
let _subscribingWebPushSw: Promise<ServiceWorkerRegistration> | null
let _webPushSwRegistration: ServiceWorkerRegistration | null = null

/** Service Worker を更新する関数。 */
export async function updateWebPushServiceWorker(
  registration: ServiceWorkerRegistration
) {
  return registration.update().then(() => registration)
}

/** Service Worker からのメッセージをもとにナビゲーションを行う関数。 */
export function navigateByWebPushServiceWorkerRequest(event: MessageEvent) {
  const data = event.data
  if (!data) return

  const { type, pathname } = data

  if (type === 'navigation' && pathname) {
    appToastStore.openAsInfo('リダイレクト先： ' + pathname)
    useRouter().push(data.pathname)
  }
}

/** Web Push の Service Worker を読み込みブラウザに登録する関数。 */
export async function registerWebPushServiceWorker() {
  if (!serviceWorker) throw new Error('Service Worker is not supported')

  // Web Push の Service Worker を登録する。
  const gettingRegistration = appToastStore.openAsSuccess(
    'Web Push の Service Worker を登録しました'
  )

  // Service Worker の登録が完了するまで待つ。
  const registration = await getOrRegisterServiceWorker(
    '/sw/web-push.js',
    '/sw/web-push/'
  )

  // 最新の Service Worker が有効になるまで待つ。
  await registration.update()

  // Service Worker を更新する関数を定義し、
  // Service Worker の更新が見つかったときに発火するようにイベントリスナーを追加。
  const updateRegistration = () => updateWebPushServiceWorker(registration)
  addEventListener('updatefound', updateRegistration)

  // Service Worker からのメッセージをもとにナビゲーションをする関数を定義し、
  // Service Worker からメッセージが送信されたときに発火するようにイベントリスナーを追加。
  const navigate = navigateByWebPushServiceWorkerRequest.bind(null)
  serviceWorker.addEventListener('message', navigate)

  // Service Worker が Unregister された時に関連するイベントリスナーを削除する。
  //   1) Service Worker の更新が見つかったときにアップデートするイベントリスナー
  //   2) Service Worker からメッセージが送信されたときに発火するようにイベントリスナーを追加
  addServiceWorkerUnregisterEventListener(registration, () => {
    removeEventListener('updatefound', updateRegistration)
    serviceWorker.removeEventListener('message', navigate)
  })

  // Service Worker の登録情報をキャッシュして返却する。
  return (_webPushSwRegistration = registration)
}

/** Web Push の Service Worker を登録する関数のオプション */
export interface SubscribeWebPushOptions {
  /** @default true */
  withRequest?: boolean
}

/** Web Push の Service Worker を登録する。 */
export async function subscribeWebPushServiceWorker(
  options: SubscribeWebPushOptions
) {
  if (!IS_SUPPORTED_NOTIFICATION) {
    throw new Error('Web Push is not supported')
  }

  const noticePermission =
    options.withRequest === false
      ? Notification.permission
      : await requestNotificationPermission()

  if (noticePermission !== 'granted') {
    throw new Error('Permission is not granted')
  }

  // Web Push の Service Worker を登録する。
  const registration = await registerWebPushServiceWorker()

  // Push Manager に Web Push の情報を登録する。
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: $env.VAPID_PUBLIC_KEY,
  })

  appToastStore.openAsSuccess('Web Push Subscription を発行しました')

  // Subscription の結果を JSON へ変換して変数に代入する。
  const { endpoint, keys, expirationTime = null } = subscription.toJSON()
  const { auth: authKey, p256dh: p256dhKey } = keys || {}

  // Subscription の情報が不正な場合はエラーをスローする。
  if (!endpoint) throw new Error('Endpoint of Subscription is invalid')
  if (!authKey) throw new Error('AuthKey of Subscription is invalid')
  if (!p256dhKey) throw new Error('P256dhKey of Subscription is invalid')

  // 過去に登録した Subscription を取得する。
  const existingEndpoint = getCookie(_webPushSubscriptionEndpointCookieName)

  // 既に登録済みの Endpoint であれば DB に登録せずに終了する。
  if (existingEndpoint === endpoint) {
    appToastStore.openAsInfo('登録済みの Web Push Subscription です')
    return registration
  }

  // 既に登録済みの Endpoint が新しく取得した Endpoint と異なる場合、既存の Subscription を削除する。
  if (existingEndpoint) {
    // DB に保存されている過去の Subscription を削除する。
    const { error } = await useLazyFetch(`/api/web-push/subscriptions`, {
      method: 'POST',
      body: { endpoint } satisfies WebPushSubscriptionsDeleteRequestBody,
    })

    // Cookie に保存されている過去の Subscription を削除する。
    deleteCookie(_webPushSubscriptionEndpointCookieName)

    // 削除のエラーはコンソールに出力するのみ。
    if (error.value) {
      console.error(error.value)
      appToastStore.openAsError('過去の Subscription を削除できませんでした')

      // ↓ 正常に削除できた場合の処理
    } else {
      appToastStore.openAsWarning('過去の Subscription を削除しました')
    }
  }

  // Subscription の有効期限を算出する
  let expiredAt: Date | undefined
  if (expirationTime) {
    expiredAt = new Date()
    expiredAt.setTime(expiredAt.getTime() + expirationTime)
  }

  // Web Push の Endpoint を Cookie に保存する
  setCookie(_webPushSubscriptionEndpointCookieName, endpoint, {
    expires: expiredAt || Infinity,
  })

  // DB に Subscription を登録する
  const { error } = await useLazyFetch(`/api/web-push/subscriptions`, {
    method: 'POST',
    body: {
      endpoint,
      expiredAt,
      authKey,
      p256dhKey,
    } satisfies WebPushSubscriptionsPostRequestBody,
  })

  // 登録のエラー時は設定した Cookie を削除しエラーをスローする
  if (error.value) {
    deleteCookie(_webPushSubscriptionEndpointCookieName)
    appToastStore.openAsError(
      'Web Push Subscription を DB に登録できませんでした'
    )
    throw error.value

    // ↓ 正常に登録できた場合の処理
  } else {
    appToastStore.openAsSuccess('Web Push Subscription を DB に保存しました')
  }

  return registration
}

/** Web Push を登録する。 */
export function subscribeWebPush(options: SubscribeWebPushOptions = {}) {
  // 既に登録中の場合
  if (_subscribingWebPushSw) return _subscribingWebPushSw

  // キャッシュが存在する場合
  if (_webPushSwRegistration) return Promise.resolve(_webPushSwRegistration)

  return (_subscribingWebPushSw = subscribeWebPushServiceWorker(
    options
  ).finally(() => (_subscribingWebPushSw = null)))
}

/** Visibility に更新があったときに Web Push を登録する */
export function subscribeWebPushOnVisible(
  options: SubscribeWebPushOptions = {}
) {
  const onChangeVisibility = () => {
    if (document.visibilityState === 'visible') {
      subscribeWebPush(options)
      appToastStore.openAsInfo('App が Foreground になりました')
    }
  }

  document.addEventListener('visibilitychange', onChangeVisibility)
  return () => removeEventListener('visibilitychange', onChangeVisibility)
}
