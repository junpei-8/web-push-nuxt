import {
  mysqlTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core'

const tableName = 'web_push_registrations'

export default mysqlTable(tableName, {
  id: serial('id').primaryKey(),
  endpoint: varchar('endpoint', { length: 768 }).notNull().unique(),
  authKey: text('auth_key').notNull(),
  p256dhKey: text('p256dh_key').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
