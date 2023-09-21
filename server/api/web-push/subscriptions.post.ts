import { InferInsertModel, eq } from 'drizzle-orm'
import { db, webPushSubscriptionsTable } from '~/database'

export interface WebPushSubscriptionsPostRequestBody
  extends InferInsertModel<typeof webPushSubscriptionsTable> {}

export default defineEventHandler(async (event) => {
  const body = await readBody<WebPushSubscriptionsPostRequestBody>(event)

  const existsWebPushSubscription = await db
    .select({ id: webPushSubscriptionsTable.id })
    .from(webPushSubscriptionsTable)
    .limit(1)
    .where(eq(webPushSubscriptionsTable.endpoint, body.endpoint))

  if (existsWebPushSubscription.length === 0) {
    await db.insert(webPushSubscriptionsTable).values(body)
  }

  return true
})
