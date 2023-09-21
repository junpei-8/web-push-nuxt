import {
  mysqlTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core'

export const webPushSubscriptionsTableName = 'web_push_subscriptions'

export const webPushSubscriptionsTable = mysqlTable(
  webPushSubscriptionsTableName,
  {
    id: serial('id').primaryKey(),
    endpoint: varchar('endpoint', { length: 768 }).notNull().unique(),
    authKey: text('auth_key').notNull(),
    p256dhKey: text('p256dh_key').notNull(),
    expiredAt: timestamp('expired_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  }
)
