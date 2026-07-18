export type ImageCacheStatus = 'loading' | 'loaded'

interface CacheEntry {
  promise: Promise<HTMLImageElement>
  status: ImageCacheStatus
  lastAccessed: number
}

export interface ImageCacheSnapshot {
  readonly size: number
  readonly version: number
}

type Listener = () => void

function requestImage(url: string): Promise<HTMLImageElement> {
  if (typeof Image === 'undefined') {
    return Promise.reject(new Error('Image loading is unavailable during SSR'))
  }

  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    image.src = url
  })
}

export class BoundedImageCache {
  readonly maxEntries: number
  private readonly entries = new Map<string, CacheEntry>()
  private readonly listeners = new Set<Listener>()
  private version = 0
  private snapshot: ImageCacheSnapshot = { size: 0, version: 0 }

  constructor(maxEntries = 96) {
    if (!Number.isInteger(maxEntries) || maxEntries < 1) {
      throw new RangeError('maxEntries must be a positive integer')
    }
    this.maxEntries = maxEntries
  }

  load(url: string): Promise<HTMLImageElement> {
    const existing = this.entries.get(url)
    if (existing) {
      existing.lastAccessed = Date.now()
      return existing.promise
    }

    if (!this.makeRoom()) {
      return Promise.reject(new Error('Image cache is busy; retry shortly'))
    }

    const basePromise = requestImage(url)
    const entry: CacheEntry = {
      status: 'loading',
      lastAccessed: Date.now(),
      promise: basePromise,
    }

    entry.promise = basePromise
      .then((image) => {
        entry.status = 'loaded'
        entry.lastAccessed = Date.now()
        this.notify()
        return image
      })
      .catch((error: unknown) => {
        this.entries.delete(url)
        this.notify()
        throw error
      })

    this.entries.set(url, entry)
    this.notify()
    return entry.promise
  }

  has(url: string): boolean {
    return this.entries.has(url)
  }

  getStatus(url: string): ImageCacheStatus | undefined {
    return this.entries.get(url)?.status
  }

  clear(): void {
    if (this.entries.size === 0) return
    this.entries.clear()
    this.notify()
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = (): ImageCacheSnapshot => this.snapshot

  private makeRoom(): boolean {
    if (this.entries.size < this.maxEntries) return true

    // Pending requests stay addressable so concurrent consumers still share one fetch.
    const settledEntries = [...this.entries.entries()]
      .filter(([, entry]) => entry.status === 'loaded')
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)

    const oldestSettled = settledEntries[0]
    if (!oldestSettled) return false

    this.entries.delete(oldestSettled[0])
    return true
  }

  private notify(): void {
    this.version += 1
    this.snapshot = { size: this.entries.size, version: this.version }
    this.listeners.forEach((listener) => listener())
  }
}

export const imageCache = new BoundedImageCache()
