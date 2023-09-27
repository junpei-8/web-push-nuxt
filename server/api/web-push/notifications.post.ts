import webPush from 'web-push'
import { db, webPushSubscriptionsTable } from '~/database'
import { WEB_PUSH_OPTIONS } from './_/options'

export interface WebPushNotificationsPostRequestBody {
  title?: string
  content?: string
  url?: string
}

export default defineEventHandler(async (event) => {
  const [webPushSubscriptions, body] = await Promise.all([
    db.select().from(webPushSubscriptionsTable),
    readBody(event),
  ])

  const results = await Promise.all(
    webPushSubscriptions.map(async ({ endpoint, authKey, p256dhKey }) =>
      webPush
        .sendNotification(
          { endpoint, keys: { auth: authKey, p256dh: p256dhKey } },

          JSON.stringify({
            title: body.title,
            body: body.content,
            url: body.url,
          }),

          WEB_PUSH_OPTIONS
        )
        .catch((error) => error)
    )
  )

  return results
})
