import { migrate } from 'drizzle-orm/planetscale-serverless/migrator'
import config from './config'
import db from './db'

migrate(db, { migrationsFolder: config.out })
