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
        const noticeData: NotificationData = event.notification.data || {}

        const originUrl = sw.location.origin
        const url = originUrl + noticeData.url || ''

        console.log('matchedClients', matchedClients)
        setTimeout(() => {
          console.log('matchedClients', matchedClients)
          console.log('url: ', url)
          console.log('originUrl: ', originUrl)
        }, 2000)

        // 既に開いているタブがあれば、そちらをフォーカスして、URLを更新する
        for (let i = 0; i < matchedClients.length; i++) {
          const client = matchedClients[i]
          setTimeout(() => console.log('client: : ', client), 2000)
          if (client.url === url) {
            targetClientUrl = client.url
            return client.focus ? client.focus() : Promise.resolve(null)
          }
        }

        setTimeout(() => console.log('openWindow: ', targetClientUrl), 2000)
        return clients.openWindow(url)
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
