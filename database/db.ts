import { drizzle } from 'drizzle-orm/planetscale-serverless'
import connection from './connection'
import * as schema from './schema'

export default drizzle(connection, { schema })
