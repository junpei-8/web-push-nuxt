/**
 * @ref https://qiita.com/gtk2k/items/6deec05f7508332d8338
 * @ref https://miyauchi.dev/ja/posts/fcm-push-message
 */
//

interface NotificationData {
  pathname: string
}

const sw = self as unknown as ServiceWorkerGlobalScope

console.log('load sw')

sw.addEventListener('install', function (event) {
  console.log('install')
  event.waitUntil(sw.skipWaiting())
})
// sw.addEventListener('activate', function (event) {
//   console.log('activate')
//   event.waitUntil(sw.clients.claim())
// })

sw.addEventListener('push', function (event) {
  const payload: Record<string, string> = event.data?.json()
  if (!payload) return

  const { title, content: body, icon, pathname } = payload

  const data: NotificationData = { pathname }

  sw.skipWaiting()

  event.waitUntil(sw.registration.showNotification(title, { body, icon, data }))
})

sw.addEventListener('notificationclick', function (event) {
  event.stopImmediatePropagation()
  event.notification.close()

  /** @type {Clients} */
  const clients = sw.clients

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (matchedClients) {
        console.log(matchedClients)

        const matchedClientLength = matchedClients.length
        const noticeData: NotificationData = event.notification.data || {}

        const pathname = noticeData.pathname || ''
        const originUrl = sw.location.origin
        const url = originUrl + pathname

        function focusClient(client: WindowClient) {
          if (!client.focus) return Promise.resolve(null)
          client.postMessage({ type: 'navigation', pathname })
          return client.focus()
        }

        // 同一 Origin で開いているタブがなければ新規に開く
        if (!matchedClientLength) return clients.openWindow(url)

        // 既に開いているタブがあればフォーカスする
        for (let i = 0; i < matchedClientLength; i++) {
          const client = matchedClients[i]
          if (client.url === url) return focusClient(client)
        }

        // 既に開いているタブがない場合は最初のタブをフォーカスする
        return focusClient(matchedClients[0])
      })
  )
})
