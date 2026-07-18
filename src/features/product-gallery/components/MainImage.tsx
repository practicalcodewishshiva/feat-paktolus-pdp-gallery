import {
  memo,
  useCallback,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { imageCache } from '../services'
import type { ProductImage } from '../types'
import { ProgressiveImage } from './ProgressiveImage'
import { ZoomViewer } from './ZoomViewer'

const MAIN_WIDTHS = [320, 640, 960, 1440, 2048] as const
const SWIPE_THRESHOLD = 48

export interface MainImageProps {
  image: ProductImage
  index: number
  count: number
  onPrevious: () => void
  onNext: () => void
  className?: string
}

export const MainImage = memo(function MainImage({
  image,
  index,
  count,
  onPrevious,
  onNext,
  className = '',
}: MainImageProps) {
  const [zoomOpen, setZoomOpen] = useState(false)
  const swipeStart = useRef<{ pointerId: number; x: number; y: number } | null>(null)
  const suppressClick = useRef(false)

  const preloadZoom = useCallback(() => {
    // Use the cache service directly: subscribing this hot component to cache
    // metadata would re-render it whenever any background preload completes.
    void imageCache.load(image.variants.zoom.url).catch(() => undefined)
  }, [image.variants.zoom.url])
  const openZoom = useCallback(() => {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    preloadZoom()
    setZoomOpen(true)
  }, [preloadZoom])
  const closeZoom = useCallback(() => setZoomOpen(false), [])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        onPrevious()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        onNext()
      } else if (event.key === 'Escape' && zoomOpen) {
        closeZoom()
      } else if ((event.key === 'Enter' || event.key === ' ') && !zoomOpen) {
        event.preventDefault()
        openZoom()
      }
    },
    [closeZoom, onNext, onPrevious, openZoom, zoomOpen],
  )
  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      preloadZoom()
      if (event.pointerType === 'touch' || event.pointerType === 'pen') {
        event.currentTarget.setPointerCapture(event.pointerId)
        swipeStart.current = {
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
        }
      }
    },
    [preloadZoom],
  )
  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const start = swipeStart.current
      swipeStart.current = null
      if (!start || start.pointerId !== event.pointerId) return
      const deltaX = event.clientX - start.x
      const deltaY = event.clientY - start.y
      if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) <= Math.abs(deltaY)) return
      suppressClick.current = true
      if (deltaX < 0) onNext()
      else onPrevious()
    },
    [onNext, onPrevious],
  )

  return (
    <div
      className={`product-gallery__main ${className}`.trim()}
      role="group"
      aria-label={`Product image ${index + 1} of ${count}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={preloadZoom}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        swipeStart.current = null
      }}
    >
      <button
        type="button"
        className="product-gallery__main-image-button"
        onClick={openZoom}
        aria-label={`Open zoomed view of ${image.alt}`}
      >
        <ProgressiveImage
          key={image.id}
          src={image.variants.xl.url}
          alt={image.alt}
          placeholder={image.blurPlaceholder}
          widths={MAIN_WIDTHS}
          sizes="(max-width: 767px) 100vw, (max-width: 1199px) 75vw, 960px"
          width={image.variants.xl.width}
          height={image.variants.xl.height}
          loading="eager"
          fetchPriority="high"
        />
      </button>
      <ZoomViewer image={image} open={zoomOpen} onClose={closeZoom} />
    </div>
  )
})
