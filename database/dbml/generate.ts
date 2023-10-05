import * as schema from '../schema'
import { mysqlGenerate } from 'drizzle-dbml-generator'

mysqlGenerate({
  schema,
  out: './database/dbml/schema.dbml',
  relational: true,
})
