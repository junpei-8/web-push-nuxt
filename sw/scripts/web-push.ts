/**
 * @ref https://qiita.com/gtk2k/items/6deec05f7508332d8338
 * @ref https://miyauchi.dev/ja/posts/fcm-push-message
 */
//

interface NotificationData {
  pathname?: string
}

const sw = self as unknown as ServiceWorkerGlobalScope

sw.addEventListener('install', function () {
  sw.skipWaiting()
})

sw.addEventListener('activate', function (event) {
  event.waitUntil(sw.clients.claim())
})

sw.addEventListener('push', function (event) {
  const payload: Record<string, string> = event.data?.json()

  if (!payload) return

  const { title, content: body, icon, pathname } = payload

  const data: NotificationData = { pathname }

  event.waitUntil(sw.registration.showNotification(title, { body, icon, data }))
})

sw.addEventListener('notificationclick', function (event) {
  event.stopImmediatePropagation()
  event.notification.close()

  const clients = sw.clients

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (matchedClients) {
        const matchedClientLength = matchedClients.length
        const noticeData: NotificationData = event.notification.data || {}

        const pathnameRegexp = /^https?:\/\/[^\/]+(\/[^?]*)/
        const navigationPathname = noticeData.pathname || ''
        const navigationPathnameLength = navigationPathname.length

        /** クライアントをフォーカスする */
        function focusClient(client: WindowClient) {
          return client.focus().then((client) => {
            client.postMessage({
              type: 'navigation',
              pathname: navigationPathname,
            })
            return client
          })
        }

        /** Pathname と一致する文字数を返す */
        function findPathnameMatchCount(string: string) {
          let matchCount = 0
          for (let i = 0; i < navigationPathnameLength; i++) {
            if (navigationPathname[i] !== string[i]) break
            matchCount++
          }
          return matchCount
        }

        // ナビゲーション先の情報
        let navigationClient: WindowClient | undefined
        let navigationPathnameDistance = Infinity
        let navigationPathnameMatchCount = -1

        // 既に開いているタブがあればフォーカスする
        for (let i = 0; i < matchedClientLength; i++) {
          const client = matchedClients[i]
          const pathname = (client.url.match(pathnameRegexp) || [])[1] || '/'

          // 既に開いているタブの中に同じ pathname があればフォーカスする
          if (pathname === navigationPathname) return focusClient(client)

          // frameType が 'none' の場合はスキップする
          if (client.frameType === 'none') continue

          // if (!navigationClient) navigationClient = client
          // pathname の文字列が近いクライアントを検索する
          const pathnameMatchCount = findPathnameMatchCount(pathname)
          if (pathnameMatchCount <= navigationPathnameMatchCount) continue

          // pathname との文字列の差分が小さいクライアントを優先する
          const pathnameDiff = navigationPathnameLength - pathname.length
          const pathnameDistance = Math.abs(pathnameDiff)
          if (pathnameDistance >= navigationPathnameDistance) continue

          // より差分が少ないクライアントが見つかったら更新する
          navigationClient = client
          navigationPathnameDistance = pathnameDistance
          navigationPathnameMatchCount = pathnameMatchCount
        }

        // ナビゲーション先が存在したら Focus する
        if (navigationClient) return focusClient(navigationClient)

        // ナビゲーション先が存在しなかったら新しいタブを開く
        return clients.openWindow(sw.location.origin + navigationPathname)
      })
  )
})
