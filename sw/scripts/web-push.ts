/**
 * @ref https://qiita.com/gtk2k/items/6deec05f7508332d8338
 * @ref https://miyauchi.dev/ja/posts/fcm-push-message
 */
//

interface NotificationData {
  url: string
}

type OptionalWindowClient = Partial<WindowClient> | null | undefined

const sw = self as unknown as ServiceWorkerGlobalScope

sw.addEventListener('push', function (event) {
  const payload: Record<string, string> = event.data?.json()
  if (!payload) return

  const { title, body, icon, url } = payload

  const data: NotificationData = { url }

  event.waitUntil(sw.registration.showNotification(title, { body, icon, data }))
})

sw.addEventListener('notificationclick', function (event) {
  event.notification.close()

  /** @type {Clients} */
  const clients = sw.clients

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function (matchedClients) {
      const noticeData: NotificationData = event.notification.data || {}

      const url = sw.location.origin + noticeData.url || ''

      function focusClient(client: OptionalWindowClient) {
        if (!client || !client.focus) return Promise.resolve(null)
        return client.focus()
      }

      function navigateClient(client: OptionalWindowClient) {
        if (!client || !client.navigate) return Promise.resolve(null)
        return client.navigate(url)
      }

      function requestNavigation(client: WindowClient, message?: string) {
        client.postMessage?.({ type: 'notification-click', url, message })
        return Promise.resolve(client)
      }

      // 既に開いているタブがあれば、そちらをフォーカスして、URLを更新する
      for (let i = 0; i < matchedClients.length; i++) {
        const client = matchedClients[i]
        if (client.url === url) {
          try {
            requestNavigation(client, 'searched client')
          } catch {}

          return focusClient(client)
            .then(navigateClient)
            .then(() => requestNavigation(client))
        }
      }

      return clients
        .openWindow(url)
        .then((client) => {
          if (!client) return null

          try {
            requestNavigation(client, 'searched client')
          } catch {}

          return client
        })

        .then(focusClient)
    })
  )
})
