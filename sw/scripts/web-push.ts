/**
 * @ref https://qiita.com/gtk2k/items/6deec05f7508332d8338
 * @ref https://miyauchi.dev/ja/posts/fcm-push-message
 */
//

interface NotificationData {
  pathname: string
}

const sw = self as unknown as ServiceWorkerGlobalScope

sw.addEventListener('push', function (event) {
  const payload: Record<string, string> = event.data?.json()
  if (!payload) return

  const { title, content: body, icon, pathname } = payload

  const data: NotificationData = { pathname }

  event.waitUntil(sw.registration.showNotification(title, { body, icon, data }))
})

sw.addEventListener('notificationclick', function (event) {
  event.notification.close()

  /** @type {Clients} */
  const clients = sw.clients

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (matchedClients) {
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

        if (!matchedClientLength) return clients.openWindow(url)

        for (let i = 0; i < matchedClientLength; i++) {
          const client = matchedClients[i]
          if (client.url === url) focusClient(client)
        }

        // matchedClients は Service Worker と同一の origin であることが保証されている
        return focusClient(matchedClients[0])
      })
  )
})
