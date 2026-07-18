import { useCallback, useEffect, useState } from 'react'
import { imageCache } from '../services/imageCache'

export type ImageLoadStatus = 'idle' | 'loading' | 'loaded' | 'error'

export interface UseImageLoaderOptions {
  src: string
  placeholder?: string
  enabled?: boolean
  retries?: number
  retryDelayMs?: number
}

export interface UseImageLoaderResult {
  currentSrc: string | undefined
  status: ImageLoadStatus
  error: Error | null
  retry: () => void
}

const toError = (value: unknown) =>
  value instanceof Error ? value : new Error('Unknown image loading error')

export function useImageLoader({
  src,
  placeholder,
  enabled = true,
  retries = 2,
  retryDelayMs = 300,
}: UseImageLoaderOptions): UseImageLoaderResult {
  const [retryKey, setRetryKey] = useState(0)
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(placeholder)
  const [status, setStatus] = useState<ImageLoadStatus>('idle')
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    setCurrentSrc(placeholder)
    setError(null)

    if (!enabled || !src) {
      setStatus('idle')
      return () => {
        cancelled = true
      }
    }

    setStatus('loading')
    const maxAttempts = Math.max(1, Math.floor(retries) + 1)

    const attemptLoad = (attempt: number): void => {
      void imageCache.load(src).then(
        () => {
          if (cancelled) return
          setCurrentSrc(src)
          setStatus('loaded')
        },
        (reason: unknown) => {
          if (cancelled) return
          if (attempt < maxAttempts) {
            retryTimer = setTimeout(
              () => attemptLoad(attempt + 1),
              Math.max(0, retryDelayMs) * attempt,
            )
            return
          }
          setError(toError(reason))
          setStatus('error')
        },
      )
    }

    attemptLoad(1)

    return () => {
      cancelled = true
      if (retryTimer !== undefined) clearTimeout(retryTimer)
    }
  }, [enabled, placeholder, retries, retryDelayMs, retryKey, src])

  const retry = useCallback(() => setRetryKey((key) => key + 1), [])

  return { currentSrc, status, error, retry }
}
