import { mysqlTable, serial, text, timestamp } from 'drizzle-orm/mysql-core'

export default mysqlTable('web_push_registrations', {
  id: serial('id').primaryKey(),
  endpoint: text('endpoint').notNull().unique(),
  authKey: text('auth_key').notNull(),
  p256dhKey: text('p256dh_key').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
