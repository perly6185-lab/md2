import type { Env } from './types'

export type UploadBackend = `github` | `r2`

export interface UploadGithubConfig {
  username: string
  repoList: string[]
  branch: string
  tokens: string[]
  useCdn: boolean
}

export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024

export const UPLOAD_RATE_LIMIT = {
  anonymous: 60,
  free: 120,
  pro: 300,
} as const

const DEFAULT_GITHUB_USERNAME = `bucketio`
const DEFAULT_GITHUB_BRANCH = `main`
const DEFAULT_GITHUB_REPO_COUNT = 20

export function isUploadEnabled(env: Env): boolean {
  return env.UPLOAD_ENABLED === `true` || env.UPLOAD_ENABLED === `1`
}

export function getUploadBackend(env: Env): UploadBackend {
  return env.UPLOAD_BACKEND === `r2` ? `r2` : `github`
}

export function parseGithubUploadConfig(env: Env): UploadGithubConfig | null {
  const tokensRaw = env.UPLOAD_GITHUB_TOKENS_BUCKETIO
  if (!tokensRaw)
    return null

  const tokens = tokensRaw.split(`,`).map(s => s.trim()).filter(Boolean)
  if (!tokens.length)
    return null

  const username = env.UPLOAD_GITHUB_USERNAME?.trim() || DEFAULT_GITHUB_USERNAME
  const repoList = (env.UPLOAD_GITHUB_REPO_LIST ?? ``)
    .split(`,`)
    .map(s => s.trim())
    .filter(Boolean)

  if (!repoList.length) {
    for (let i = 0; i < DEFAULT_GITHUB_REPO_COUNT; i++)
      repoList.push(`img${i}`)
  }

  const branch = env.UPLOAD_GITHUB_BRANCH?.trim() || DEFAULT_GITHUB_BRANCH
  const useCdn = env.UPLOAD_GITHUB_USE_CDN !== `false` && env.UPLOAD_GITHUB_USE_CDN !== `0`

  return { username, repoList, branch, tokens, useCdn }
}

export function isR2UploadReady(env: Env): boolean {
  return Boolean(env.UPLOAD_IMAGES && env.UPLOAD_R2_PUBLIC_URL?.trim())
}

export function isUploadBackendReady(env: Env): boolean {
  const backend = getUploadBackend(env)
  if (backend === `r2`)
    return isR2UploadReady(env)
  return parseGithubUploadConfig(env) !== null
}
