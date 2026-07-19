import type { Ref } from 'vue'
import { store } from '@/storage'

export function persistedRef<T>(key: string, defaultValue: T): Ref<T> {
  return store.reactive<T>(key, defaultValue)
}

export function persistedGet(key: string): Promise<string | null> {
  return store.get(key)
}

export function persistedSet(key: string, value: string): Promise<void> {
  return store.set(key, value)
}

export function persistedGetJson<T>(key: string): Promise<T | null> {
  return store.getJSON<T>(key)
}

export function persistedSetJson<T>(key: string, value: T): Promise<void> {
  return store.setJSON(key, value)
}

export function persistedRemove(key: string): Promise<void> {
  return store.remove(key)
}

/** Keep tiny boot-time localStorage caches explicit and isolated from stores. */
export function syncBootStorageValue(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  }
  catch {
    // ignore quota / private mode
  }
}
