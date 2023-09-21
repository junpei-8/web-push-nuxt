import { InferSelectModel, eq } from 'drizzle-orm'
import { db, webPushSubscriptionsTable } from '~/database'

export interface WebPushSubscriptionsDeleteRequestBody
  extends Pick<
    InferSelectModel<typeof webPushSubscriptionsTable>,
    'endpoint'
  > {}

export default defineEventHandler(async (event) => {
  const body = await readBody<WebPushSubscriptionsDeleteRequestBody>(event)

  await db
    .delete(webPushSubscriptionsTable)
    .where(eq(webPushSubscriptionsTable.endpoint, body.endpoint))

  return true
})
