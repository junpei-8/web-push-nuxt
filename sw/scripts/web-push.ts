/**
 * @ref https://qiita.com/gtk2k/items/6deec05f7508332d8338
 * @ref https://miyauchi.dev/ja/posts/fcm-push-message
 */
//

interface NotificationData {
  pathname: string
}

const sw = self as unknown as ServiceWorkerGlobalScope

console.log('sw load')

sw.addEventListener('push', function (event) {
  const payload: Record<string, string> = event.data?.json()
  if (!payload) return

  const { title, content: body, icon, pathname } = payload

  const data: NotificationData = { pathname }

  console.log('web push')

  event.waitUntil(sw.registration.showNotification(title, { body, icon, data }))
})

sw.addEventListener('notificationclick', function (event) {
  event.notification.close()

  /** @type {Clients} */
  const clients = sw.clients

  event.waitUntil(
    clients
      .matchAll({ includeUncontrolled: true })
      .then(function (matchedClients) {
        console.log(matchedClients)
        matchedClients.forEach((client) => client.postMessage('test!'))

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

        matchedClients
          .filter((client) => client.type === 'window')
          .forEach((windowClient) => {
            windowClient.postMessage('testやで！')
            const client = windowClient as WindowClient
            if (client.url === url) return focusClient(client)
          })
        // // 既に開いているタブがあればフォーカスする
        // for (let i = 0; i < matchedClientLength; i++) {
        //   const client = matchedClients[i]
        //   if (client.url === url) return focusClient(client)
        // }

        // // 既に開いているタブがない場合は最初のタブをフォーカスする
        // return focusClient(matchedClients[0])
      })
  )
})
