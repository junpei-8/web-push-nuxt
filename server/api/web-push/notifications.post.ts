import { eq } from 'drizzle-orm'
import { db, webPushSubscriptionsTable } from '~/database'
import webPush from 'web-push'
import { WEB_PUSH_OPTIONS } from './_/options'

export default defineEventHandler(async (event) => {
  const webPushSubscriptions = await db.select().from(webPushSubscriptionsTable)

  await Promise.all(
    webPushSubscriptions.map(async ({ endpoint, authKey, p256dhKey }) =>
      webPush.sendNotification(
        { endpoint, keys: { auth: authKey, p256dh: p256dhKey } },

        JSON.stringify({
          title: 'New Post',
          body: 'A new post has been added. Check it out!',
        }),

        WEB_PUSH_OPTIONS
      )
    )
  )

  return true
})
