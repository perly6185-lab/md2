import type { Env } from './types'
import { buildDatedObjectPath } from './upload-filename'

export async function uploadToR2(env: Env, file: File): Promise<string> {
  const bucket = env.UPLOAD_IMAGES
  const publicUrl = env.UPLOAD_R2_PUBLIC_URL?.trim().replace(/\/$/, ``)
  if (!bucket || !publicUrl)
    throw new Error(`R2 upload is not configured`)

  const key = buildDatedObjectPath(file.name, file.type)
  await bucket.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || `application/octet-stream` },
  })

  return `${publicUrl}/${key}`
}
