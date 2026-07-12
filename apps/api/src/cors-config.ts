import type { Env } from './types'
import { isAllowedOrigin, isBrowserExtensionOrigin } from './origin'

export const API_CORS_ALLOW_METHODS = [`GET`, `POST`, `DELETE`, `OPTIONS`]
export const API_CORS_ALLOW_HEADERS = [`Authorization`, `Content-Type`]
export const API_CORS_MAX_AGE_SECONDS = 86400

export function resolveCorsOrigin(env: Env, origin: string | undefined): string | null {
  return isAllowedOrigin(env, origin) || isBrowserExtensionOrigin(origin) ? origin ?? null : null
}
