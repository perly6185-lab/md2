import type { ApiVariables, Env } from './types'
import { Hono } from 'hono'
import { activateHandler } from './activate'
import { authMiddleware, authRoutes, meHandler } from './auth'
import { createShareHandler, deleteShareHandler, listSharesHandler, unlockShareHandler, viewShareHandler } from './share'
import { SHARE_FAVICON_PATH } from './share-head'
import { pullHandler, pushHandler } from './sync'
import { uploadHandler } from './upload'
import { afdianWebhookHandler } from './webhook'

type ApiApp = Hono<{ Bindings: Env, Variables: ApiVariables }>

const API_HEALTH_RESPONSE = { name: `md-api`, ok: true }

export function registerPublicRoutes(app: ApiApp): void {
  // Public routes intentionally sit outside authMiddleware.
  app.get(`/`, c => c.json(API_HEALTH_RESPONSE))
  app.post(`/upload`, uploadHandler)
  app.get(SHARE_FAVICON_PATH, c => c.env.ASSETS.fetch(c.req.raw))
  app.route(`/auth`, authRoutes)

  // AFDIAN_WEBHOOK_TOKEN optionally protects the tokenized webhook route.
  app.post(`/webhooks/afdian`, afdianWebhookHandler)
  app.post(`/webhooks/afdian/:token`, afdianWebhookHandler)

  app.get(`/s/:shareId`, viewShareHandler)
  app.post(`/s/:shareId/unlock`, unlockShareHandler)
}

export function registerAuthenticatedRoutes(app: ApiApp): void {
  const api = new Hono<{ Bindings: Env, Variables: ApiVariables }>()
  api.use(`*`, authMiddleware)
  api.get(`/me`, meHandler)
  api.get(`/sync/pull`, pullHandler)
  api.post(`/sync/push`, pushHandler)
  api.post(`/sync/activate`, activateHandler)
  api.get(`/share`, listSharesHandler)
  api.post(`/share`, createShareHandler)
  api.delete(`/share/:id`, deleteShareHandler)

  app.route(`/`, api)
}
