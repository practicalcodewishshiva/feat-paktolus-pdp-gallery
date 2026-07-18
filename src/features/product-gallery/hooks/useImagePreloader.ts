import { useEffect, useState } from 'react'
import { imageCache } from '../services/imageCache'
import { getImageLoadingPolicy } from '../utils/imagePolicy'
import { getNetworkInformation } from '../utils/network'

export interface UseImagePreloaderOptions {
  enabled?: boolean
  trackProgress?: boolean
}

export interface ImagePreloadState {
  completed: number
  failed: number
  total: number
  isPreloading: boolean
}

export function useImagePreloader(
  urls: readonly string[],
  { enabled = true, trackProgress = false }: UseImagePreloaderOptions = {},
): ImagePreloadState {
  const [state, setState] = useState<ImagePreloadState>({
    completed: 0,
    failed: 0,
    total: 0,
    isPreloading: false,
  })

  useEffect(() => {
    let cancelled = false
    const policy = getImageLoadingPolicy(getNetworkInformation())
    const queue = [...new Set(urls.filter(Boolean))].slice(0, policy.preloadCount)

    if (!enabled || queue.length === 0) {
      if (trackProgress) {
        setState({
          completed: 0,
          failed: 0,
          total: queue.length,
          isPreloading: false,
        })
      }
      return () => {
        cancelled = true
      }
    }

    let nextIndex = 0
    let completed = 0
    let failed = 0
    // Gallery callers do not need progress, so tracking is opt-in to avoid a
    // parent render for every speculative image that settles.
    if (trackProgress) {
      setState({ completed, failed, total: queue.length, isPreloading: true })
    }

    const worker = async (): Promise<void> => {
      while (!cancelled) {
        const index = nextIndex
        nextIndex += 1
        const url = queue[index]
        if (url === undefined) return

        try {
          await imageCache.load(url)
        } catch {
          failed += 1
        } finally {
          completed += 1
          if (!cancelled && trackProgress) {
            setState({
              completed,
              failed,
              total: queue.length,
              isPreloading: completed < queue.length,
            })
          }
        }
      }
    }

    const workerCount = Math.min(policy.preloadConcurrency, queue.length)
    void Promise.all(Array.from({ length: workerCount }, worker))

    return () => {
      cancelled = true
    }
  }, [enabled, trackProgress, urls])

  return state
}
