import { appToastStore } from '~/app/stores/toast'

export const serviceWorker = IS_CLIENT ? navigator.serviceWorker : null

// export function getOrRegisterServiceWorker(
//   scriptUrl: string,
//   scope: string,
//   options?: Omit<RegistrationOptions, 'scope'>
// ) {
//   return serviceWorker!
//     .getRegistrations()
//     .then(
//       (registrations) =>
//         registrations.find((registration) => registration.scope === scope) ||
//         serviceWorker!.register(scriptUrl, { scope, ...options })
//     )
// }

export async function getOrRegisterServiceWorker(
  scriptUrl: string,
  scope: string,
  options?: Omit<RegistrationOptions, 'scope'>
) {
  const registrations = await serviceWorker!.getRegistrations()

  console.log('Registrations: ' + registrations)
  appToastStore.openAsInfo(
    'Registrations: ' +
      registrations.map((registration) => registration.scope).join(', ')
  )

  let registration = registrations.find(
    (registration) => registration.scope === scope
  )

  if (registration) {
    return registration
  }

  registration = await serviceWorker!.register(scriptUrl, {
    scope,
    ...options,
  })

  return registration

  // return serviceWorker!
  //   .getRegistrations()
  //   .then(
  //     (registrations) =>
  //       registrations.find((registration) => registration.scope === scope) ||
  //       serviceWorker!.register(scriptUrl, { scope, ...options })
  //   )
}

export type UnregisterCallback = (isRegistrationFound: boolean) => void

let _unRegisterCallbacksMap: WeakMap<
  ServiceWorkerRegistration,
  UnregisterCallback[]
> | null = null

/** Service Worker を Unregister した時に発火するコールバックを起動させる。 */
export function dispatchServiceWorkerUnregisterCallback(
  this: ServiceWorkerRegistration,
  isFoundRegistration: boolean
) {
  const callbacks = _unRegisterCallbacksMap?.get(this)
  const callbackLength = (callbacks && callbacks.length) || 0

  if (callbackLength) {
    for (let i = 0; i < callbackLength; i++) {
      callbacks![i](isFoundRegistration)
    }

    _unRegisterCallbacksMap!.delete(this)
  }

  return isFoundRegistration
}

/**
 * Service Worker を Unregister した時に発火するイベントリスナーを追加する。\
 * Unregister されたとき、登録されていたイベントリスナは全て削除される。
 */
export function addServiceWorkerUnregisterEventListener(
  registration: ServiceWorkerRegistration,
  callback: UnregisterCallback
) {
  if (!_unRegisterCallbacksMap) {
    _unRegisterCallbacksMap = new WeakMap()
    _unRegisterCallbacksMap.set(registration, [])

    const originalUnregisterEvent = registration.unregister
    registration.unregister = function () {
      return originalUnregisterEvent
        .call(registration)
        .then(dispatchServiceWorkerUnregisterCallback.bind(this))
    }
  }

  const callbacks = _unRegisterCallbacksMap.get(registration)!
  callbacks.push(callback)
}

/** ServiceWorker を Unregister した時に発火するイベントリスナーを削除する。 */
export function removeServiceWorkerUnregisterEventListener(
  registration: ServiceWorkerRegistration,
  callback: UnregisterCallback
) {
  const callbacks = _unRegisterCallbacksMap?.get(registration)
  if (!callbacks) return

  const index = callbacks.indexOf(callback)
  if (index === -1) return

  callbacks.splice(index, 1)
}

/** Service Worker を Unregister した時に発火するイベントリスナーを追加し、戻り値として、追加したイベントリスナーを削除する関数を返す */
export function listenServiceWorkerUnregisterEvent(
  registration: ServiceWorkerRegistration,
  callback: UnregisterCallback
) {
  addServiceWorkerUnregisterEventListener(registration, callback)
  return () =>
    removeServiceWorkerUnregisterEventListener(registration, callback)
}
