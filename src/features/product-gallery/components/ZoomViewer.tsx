import {
  memo,
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent,
} from 'react'
import { useImageLoader } from '../hooks'
import type { ProductImage } from '../types'
import { ImagePlaceholder } from './ImagePlaceholder'

export interface ZoomViewerProps {
  image: ProductImage
  open: boolean
  onClose: () => void
  className?: string
}

interface Transform {
  x: number
  y: number
  scale: number
}

const distance = (a: PointerEvent, b: PointerEvent) =>
  Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)

export const ZoomViewer = memo(function ZoomViewer({
  image,
  open,
  onClose,
  className = '',
}: ZoomViewerProps) {
  const imageRef = useRef<HTMLImageElement>(null)
  const pointers = useRef(new Map<number, PointerEvent>())
  const transform = useRef<Transform>({ x: 0, y: 0, scale: 1 })
  const gestureStart = useRef({ distance: 0, scale: 1, x: 0, y: 0 })
  const frame = useRef<number | null>(null)
  const { currentSrc, status, retry } = useImageLoader({
    src: image.variants.zoom.url,
    placeholder: image.blurPlaceholder,
    enabled: open,
  })

  const paint = useCallback(() => {
    if (frame.current !== null) return
    frame.current = requestAnimationFrame(() => {
      const node = imageRef.current
      const { x, y, scale } = transform.current
      if (node) node.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
      frame.current = null
    })
  }, [])

  useEffect(() => {
    if (!open) return
    transform.current = { x: 0, y: 0, scale: 1 }
    pointers.current.clear()
    paint()
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
      frame.current = null
    }
  }, [open, paint])

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, event.nativeEvent)
    const activePointers = [...pointers.current.values()]
    if (activePointers.length === 1) {
      if (event.pointerType === 'mouse' && transform.current.scale === 1) {
        transform.current.scale = 2
      }
      gestureStart.current = {
        distance: 0,
        scale: transform.current.scale,
        x: event.clientX,
        y: event.clientY,
      }
    } else if (activePointers.length === 2) {
      gestureStart.current.distance = distance(activePointers[0], activePointers[1])
      gestureStart.current.scale = transform.current.scale
    }
    paint()
  }, [paint])

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return
    const previous = pointers.current.get(event.pointerId)
    pointers.current.set(event.pointerId, event.nativeEvent)
    const activePointers = [...pointers.current.values()]

    if (activePointers.length === 2 && gestureStart.current.distance > 0) {
      transform.current.scale = Math.min(
        4,
        Math.max(
          1,
          gestureStart.current.scale *
            (distance(activePointers[0], activePointers[1]) /
              gestureStart.current.distance),
        ),
      )
    } else if (previous && transform.current.scale > 1) {
      transform.current.x += event.clientX - previous.clientX
      transform.current.y += event.clientY - previous.clientY
    }
    paint()
  }, [paint])

  const releasePointer = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId)
    const remaining = [...pointers.current.values()]
    if (remaining.length === 1) {
      gestureStart.current = {
        distance: 0,
        scale: transform.current.scale,
        x: remaining[0].clientX,
        y: remaining[0].clientY,
      }
    }
  }, [])

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      event.preventDefault()
      transform.current.scale = Math.min(
        4,
        Math.max(1, transform.current.scale - event.deltaY * 0.002),
      )
      paint()
    },
    [paint],
  )

  if (!open) return null

  return (
    <div
      className={`product-gallery__zoom ${className}`.trim()}
      role="dialog"
      aria-modal="true"
      aria-label={`Zoomed view of ${image.alt}`}
    >
      <button
        type="button"
        className="product-gallery__zoom-close"
        onClick={onClose}
        aria-label="Close zoomed image"
        autoFocus
      >
        ×
      </button>
      <div
        className="product-gallery__zoom-viewport"
        style={{ touchAction: 'none', overflow: 'hidden' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={releasePointer}
        onPointerCancel={releasePointer}
        onWheel={handleWheel}
      >
        {status === 'error' ? (
          <ImagePlaceholder status="error" onRetry={retry} />
        ) : (
          <img
            ref={imageRef}
            className="product-gallery__zoom-image"
            src={currentSrc}
            alt={image.alt}
            draggable={false}
            style={{ transformOrigin: 'center', willChange: 'transform' }}
          />
        )}
      </div>
    </div>
  )
})
