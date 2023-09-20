import * as schema from './schema'
import config from './config'
import connection from './connection'
import db from './db'

export default Object.assign(db, {
  schema,
  config,
  connection,
})
