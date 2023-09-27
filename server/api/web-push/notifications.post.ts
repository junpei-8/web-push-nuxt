import webPush from 'web-push'
import { db, webPushSubscriptionsTable } from '~/database'
import { WEB_PUSH_OPTIONS } from './_/options'
import { eq } from 'drizzle-orm'

export interface WebPushNotificationsPostRequestBody {
  title?: string
  content?: string
  pathname?: string
}

export default defineEventHandler(async (event) => {
  const [webPushSubscriptions, body] = await Promise.all([
    db.select().from(webPushSubscriptionsTable),
    readBody(event),
  ])

  const results = await Promise.all(
    webPushSubscriptions.map(({ endpoint, authKey, p256dhKey }) =>
      webPush
        .sendNotification(
          {
            endpoint,
            keys: {
              auth: authKey,
              p256dh: p256dhKey,
            },
          },

          JSON.stringify({
            title: body.title,
            content: body.content,
            pathname: body.pathname,
          }),

          WEB_PUSH_OPTIONS
        )
        .catch(async (error) =>
          error.statusCode === 410
            ? await db
                .delete(webPushSubscriptionsTable)
                .where(eq(webPushSubscriptionsTable.endpoint, endpoint))
                .catch(() => null)
            : error
        )
    )
  )

  return results
})
