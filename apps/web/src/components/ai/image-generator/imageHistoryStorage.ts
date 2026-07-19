import { persistedGetJson, persistedRemove, persistedSetJson } from '@/stores/persistence'

export const IMAGE_EXPIRY_MS = 60 * 60 * 1000
export const MAX_IMAGE_HISTORY = 20

const IMAGE_STORAGE_KEYS = {
  images: `ai_generated_images`,
  prompts: `ai_image_prompts`,
  timestamps: `ai_image_timestamps`,
} as const

export interface ImageHistory {
  images: string[]
  prompts: string[]
  timestamps: number[]
}

function emptyImageHistory(): ImageHistory {
  return {
    images: [],
    prompts: [],
    timestamps: [],
  }
}

function imageHistoriesMatch(a: ImageHistory, b: ImageHistory): boolean {
  return a.images.length === b.images.length
    && a.prompts.length === b.prompts.length
    && a.timestamps.length === b.timestamps.length
    && a.images.every((image, index) => image === b.images[index])
    && a.prompts.every((prompt, index) => prompt === b.prompts[index])
    && a.timestamps.every((timestamp, index) => timestamp === b.timestamps[index])
}

export function isImageExpired(timestamp: number, now = Date.now()): boolean {
  return now - timestamp > IMAGE_EXPIRY_MS
}

export function normalizeImageHistory(history: ImageHistory, now = Date.now()): ImageHistory {
  if (history.images.length === 0 || history.timestamps.length === 0)
    return emptyImageHistory()

  const images: string[] = []
  const prompts: string[] = []
  const timestamps: number[] = []
  const limit = Math.min(history.images.length, history.timestamps.length)

  for (let index = 0; index < limit; index++) {
    const image = history.images[index]
    const timestamp = history.timestamps[index]

    if (!image || !timestamp || isImageExpired(timestamp, now))
      continue

    images.push(image)
    prompts.push(history.prompts[index] || ``)
    timestamps.push(timestamp)
  }

  return { images, prompts, timestamps }
}

export function trimImageHistory(history: ImageHistory, limit = MAX_IMAGE_HISTORY): ImageHistory {
  return {
    images: history.images.slice(0, limit),
    prompts: history.prompts.slice(0, limit),
    timestamps: history.timestamps.slice(0, limit),
  }
}

export async function loadImageHistory(): Promise<ImageHistory> {
  const [images, prompts, timestamps] = await Promise.all([
    persistedGetJson<string[]>(IMAGE_STORAGE_KEYS.images),
    persistedGetJson<string[]>(IMAGE_STORAGE_KEYS.prompts),
    persistedGetJson<number[]>(IMAGE_STORAGE_KEYS.timestamps),
  ])

  return {
    images: images ?? [],
    prompts: prompts ?? [],
    timestamps: timestamps ?? [],
  }
}

export async function loadValidImageHistory(): Promise<ImageHistory> {
  const history = await loadImageHistory()
  const normalized = normalizeImageHistory(history)

  if (!imageHistoriesMatch(history, normalized))
    await saveImageHistory(normalized)

  return normalized
}

export async function saveImageHistory(history: ImageHistory): Promise<void> {
  if (history.images.length === 0) {
    await clearImageHistory()
    return
  }

  await Promise.all([
    persistedSetJson(IMAGE_STORAGE_KEYS.images, history.images),
    persistedSetJson(IMAGE_STORAGE_KEYS.prompts, history.prompts),
    persistedSetJson(IMAGE_STORAGE_KEYS.timestamps, history.timestamps),
  ])
}

export async function clearImageHistory(): Promise<void> {
  await Promise.all([
    persistedRemove(IMAGE_STORAGE_KEYS.images),
    persistedRemove(IMAGE_STORAGE_KEYS.prompts),
    persistedRemove(IMAGE_STORAGE_KEYS.timestamps),
  ])
}
