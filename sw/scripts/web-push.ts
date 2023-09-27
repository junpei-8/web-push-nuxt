/**
 * @ref https://qiita.com/gtk2k/items/6deec05f7508332d8338
 * @ref https://miyauchi.dev/ja/posts/fcm-push-message
 */
//

interface NotificationData {
  url: string
}

const sw = self as unknown as ServiceWorkerGlobalScope

sw.addEventListener('push', function (event) {
  const payload: Record<string, string> = event.data?.json()
  if (!payload) return

  const { title, body, icon, url } = payload

  const data: NotificationData = { url }

  event.waitUntil(sw.registration.showNotification(title, { body, icon, data }))
})

let targetUrl = ''
let targetClientUrl = ''
let targetOriginUrl = ''

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

        const originUrl = sw.location.origin
        const url = originUrl + noticeData.url || ''

        console.log('matchedClients', matchedClients)
        setTimeout(() => {
          console.log('matchedClients', matchedClients)
          console.log('url: ', url)
          console.log('originUrl: ', originUrl)
        }, 2000)

        function focusClient(client: WindowClient) {
          if (!client.focus) return Promise.resolve(null)
          targetUrl = url
          return client.focus()
        }

        if (!matchedClientLength) return clients.openWindow(url)

        for (let i = 0; i < matchedClientLength; i++) {
          const client = matchedClients[i]
          setTimeout(() => console.log('client: : ', client), 2000)
          if (client.url === url) focusClient(client)
        }

        // matchedClients は Service Worker と同一の origin であることが保証されている
        return focusClient(matchedClients[0])
      })
  )
})

sw.addEventListener('message', (event) => {
  const source = event.source
  console.log('on message, target url: ', targetUrl)

  if (source && targetUrl) {
    source.postMessage({
      type: 'navigation',
      url: targetUrl,
      targetClientUrl,
      targetOriginUrl,
    })

    targetUrl = ''
    targetClientUrl = ''
    targetOriginUrl = ''
  }
})
