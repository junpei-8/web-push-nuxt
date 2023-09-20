import { InferInsertModel } from 'drizzle-orm'
import db from '~/db'

export interface WebPushRegisterRequestBody
  extends InferInsertModel<typeof db.schema.webPushRegistrations> {}

export default defineEventHandler(async (event) => {
  const body = await readBody<WebPushRegisterRequestBody>(event)

  await db.insert(db.schema.webPushRegistrations).values(body)

  return { ok: true }
})
