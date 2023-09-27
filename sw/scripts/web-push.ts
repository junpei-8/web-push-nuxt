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
let targetClientUrl: string = ''

sw.addEventListener('notificationclick', function (event) {
  event.notification.close()

  /** @type {Clients} */
  const clients = sw.clients

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function (matchedClients) {
      const noticeData: NotificationData = event.notification.data || {}

      const originUrl = sw.location.origin
      const url = originUrl + noticeData.url || ''

      // 既に開いているタブがあれば、そちらをフォーカスして、URLを更新する
      for (let i = 0; i < matchedClients.length; i++) {
        const client = matchedClients[i]
        if (client.focus && client.url.startsWith(originUrl)) {
          targetClientUrl = client.url
          return client.focus()
        }
      }

      return clients.openWindow(url)
    })
  )
})

sw.addEventListener('message', (event) => {
  const source = event.source

  if (source && targetUrl) {
    source.postMessage({
      type: 'navigation',
      url: targetUrl,
      targetClientUrl,
    })

    targetUrl = ''
  }
})
