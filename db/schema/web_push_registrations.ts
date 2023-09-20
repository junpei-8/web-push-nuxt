import {
  mysqlTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/mysql-core'

const tableName = 'web_push_registrations'

export default mysqlTable(
  tableName,
  {
    id: serial('id').primaryKey(),
    endpoint: text('endpoint').notNull(),
    authKey: text('auth_key').notNull(),
    p256dhKey: text('p256dh_key').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    endpointIndex: uniqueIndex(`ui_${tableName}_endpoint`).on(table.endpoint),
  })
)
