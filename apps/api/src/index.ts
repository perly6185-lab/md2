import type { ApiVariables, Env } from './types'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  API_CORS_ALLOW_HEADERS,
  API_CORS_ALLOW_METHODS,
  API_CORS_MAX_AGE_SECONDS,
  resolveCorsOrigin,
} from './cors-config'
import { registerAuthenticatedRoutes, registerPublicRoutes } from './routes'

const app = new Hono<{ Bindings: Env, Variables: ApiVariables }>()

// CORS：允许 APP_URL 中配置的来源（支持通配符，逗号分隔）携带凭据访问
app.use(`*`, async (c, next) => {
  const handler = cors({
    origin: origin => resolveCorsOrigin(c.env, origin),
    allowMethods: API_CORS_ALLOW_METHODS,
    allowHeaders: API_CORS_ALLOW_HEADERS,
    credentials: true,
    maxAge: API_CORS_MAX_AGE_SECONDS,
  })
  return handler(c, next)
})

registerPublicRoutes(app)
registerAuthenticatedRoutes(app)

export default app
