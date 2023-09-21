import { connect } from '@planetscale/database'
import $env from '../nuxt.env.config'

export default connect({
  url: $env.DATABASE_URL,
  username: $env.DATABASE_USERNAME,
  password: $env.DATABASE_PASSWORD,
})
