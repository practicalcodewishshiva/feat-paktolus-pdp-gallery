import { useCallback, useEffect, useState, type RefCallback } from 'react'

export interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean
}

export interface IntersectionObserverState<T extends Element> {
  ref: RefCallback<T>
  entry: IntersectionObserverEntry | null
  isIntersecting: boolean
}

export function useIntersectionObserver<T extends Element = HTMLElement>({
  root = null,
  rootMargin = '0px',
  threshold = 0,
  freezeOnceVisible = false,
}: UseIntersectionObserverOptions = {}): IntersectionObserverState<T> {
  const [node, setNode] = useState<T | null>(null)
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
  const [fallbackVisible, setFallbackVisible] = useState(false)
  const frozen = freezeOnceVisible && entry?.isIntersecting === true
  const ref = useCallback<RefCallback<T>>((element) => setNode(element), [])

  useEffect(() => {
    if (!node || frozen) return

    if (typeof IntersectionObserver === 'undefined') {
      // Loading eagerly is safer than leaving content permanently hidden.
      setFallbackVisible(true)
      return
    }

    setFallbackVisible(false)
    const observer = new IntersectionObserver(
      ([nextEntry]) => {
        if (nextEntry) setEntry(nextEntry)
      },
      { root, rootMargin, threshold },
    )
    observer.observe(node)

    return () => observer.disconnect()
  }, [frozen, node, root, rootMargin, threshold])

  return {
    ref,
    entry,
    isIntersecting: fallbackVisible || (entry?.isIntersecting ?? false),
  }
}
