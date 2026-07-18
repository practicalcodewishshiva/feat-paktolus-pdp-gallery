import { useCallback, useSyncExternalStore } from 'react'
import { imageCache } from '../services/imageCache'

const SERVER_SNAPSHOT = { size: 0, version: 0 } as const

export function useImageCache() {
  const snapshot = useSyncExternalStore(
    imageCache.subscribe,
    imageCache.getSnapshot,
    () => SERVER_SNAPSHOT,
  )
  const load = useCallback((url: string) => imageCache.load(url), [])
  const has = useCallback((url: string) => imageCache.has(url), [])
  const clear = useCallback(() => imageCache.clear(), [])

  return {
    ...snapshot,
    load,
    has,
    clear,
  }
}
