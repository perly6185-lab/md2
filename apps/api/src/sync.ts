import type { Context } from 'hono'
import type { Env, PushRequest } from './types'
import { getUserById, pullChanges, pushChanges } from './db'
import { checkSyncRateLimit, getEffectivePlan } from './plan'

type SyncContext = Context<{ Bindings: Env, Variables: { userId: string } }>
type SyncErrorStatus = 400 | 404 | 429

function syncError(
  c: SyncContext,
  error: string,
  status: SyncErrorStatus,
  details: Record<string, unknown> = {},
): Response {
  return c.json({ error, ...details }, status)
}

async function enforceSyncRateLimit(c: SyncContext): Promise<Response | null> {
  const userId = c.get(`userId`)
  const user = await getUserById(c.env.DB, userId)
  if (!user)
    return syncError(c, `not_found`, 404)

  const plan = getEffectivePlan(user.plan, user.plan_expires_at)
  const rate = await checkSyncRateLimit(c.env.DB, userId, plan)
  if (!rate.allowed) {
    return syncError(c, `rate_limit_exceeded`, 429, {
      plan,
      limit: rate.limit,
      retryAfterSec: rate.retryAfterSec,
      upgradeRequired: plan === `free`,
    })
  }
  return null
}

export async function pullHandler(c: SyncContext) {
  const blocked = await enforceSyncRateLimit(c)
  if (blocked)
    return blocked

  const userId = c.get(`userId`)
  const sinceRaw = c.req.query(`since`)
  const since = Number.parseInt(sinceRaw ?? `0`, 10)
  const cursor = Number.isFinite(since) && since > 0 ? since : 0

  const { documents, settings, maxCursor } = await pullChanges(c.env, userId, cursor)
  return c.json({ documents, settings, cursor: maxCursor })
}

export async function pushHandler(c: SyncContext) {
  const blocked = await enforceSyncRateLimit(c)
  if (blocked)
    return blocked

  const userId = c.get(`userId`)

  let body: PushRequest
  try {
    body = await c.req.json<PushRequest>()
  }
  catch {
    return syncError(c, `invalid_body`, 400)
  }

  const documents = Array.isArray(body.documents) ? body.documents : []
  const settings = Array.isArray(body.settings) ? body.settings : []

  const { documents: mergedDocs, settings: mergedSettings, maxCursor } = await pushChanges(
    c.env,
    userId,
    documents,
    settings,
  )
  return c.json({ documents: mergedDocs, settings: mergedSettings, cursor: maxCursor })
}
