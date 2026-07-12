import type { Context } from 'hono'
import type { Env } from './types'
import { isAfdianConfigured, queryOrder } from './afdian'
import { getUserById } from './db'
import { activateProFromOrder, getEffectivePlan, parseGithubLoginFromRemark } from './plan'

type ActivateContext = Context<{ Bindings: Env, Variables: { userId: string } }>
type ActivateErrorStatus = 400 | 403 | 404 | 503

function activateError(
  c: ActivateContext,
  error: string,
  status: ActivateErrorStatus,
): Response {
  return c.json({ error }, status)
}

export async function activateHandler(c: ActivateContext) {
  if (!isAfdianConfigured(c.env))
    return activateError(c, `afdian_not_configured`, 503)

  let body: { orderNo?: string }
  try {
    body = await c.req.json()
  }
  catch {
    return activateError(c, `invalid_body`, 400)
  }

  const orderNo = body.orderNo?.trim()
  if (!orderNo)
    return activateError(c, `order_no_required`, 400)

  const user = await getUserById(c.env.DB, c.get(`userId`))
  if (!user)
    return activateError(c, `not_found`, 404)

  const order = await queryOrder(c.env, orderNo)
  if (!order)
    return activateError(c, `order_not_found`, 404)

  if (order.status !== 2)
    return activateError(c, `order_not_paid`, 400)

  const remarkLogin = parseGithubLoginFromRemark(order.remark ?? ``)
  const currentLogin = user.login.toLowerCase()

  if (remarkLogin && remarkLogin !== currentLogin)
    return activateError(c, `remark_mismatch`, 403)

  const result = await activateProFromOrder(c.env, order, user.login)
  if (!result.ok) {
    const status = result.reason === `user_not_found` ? 404 : 400
    return activateError(c, result.reason, status)
  }

  const plan = getEffectivePlan(`pro`, result.expiresAt)
  return c.json({
    plan,
    planExpiresAt: result.expiresAt,
  })
}
