import type { NetworkInformationLike } from './network'

export interface ImageLoadingPolicy {
  quality: number
  maxWidth: number
  preloadCount: number
  preloadConcurrency: number
}

const DEFAULT_POLICY: ImageLoadingPolicy = {
  quality: 84,
  maxWidth: 2048,
  preloadCount: 6,
  preloadConcurrency: 4,
}

export function getImageLoadingPolicy(
  connection?: NetworkInformationLike,
): ImageLoadingPolicy {
  if (connection?.saveData) {
    return {
      quality: 58,
      maxWidth: 640,
      preloadCount: 0,
      preloadConcurrency: 1,
    }
  }

  switch (connection?.effectiveType) {
    case 'slow-2g':
    case '2g':
      return {
        quality: 62,
        maxWidth: 640,
        preloadCount: 1,
        preloadConcurrency: 1,
      }
    case '3g':
      return {
        quality: 74,
        maxWidth: 960,
        preloadCount: 3,
        preloadConcurrency: 2,
      }
    default:
      return { ...DEFAULT_POLICY }
  }
}
