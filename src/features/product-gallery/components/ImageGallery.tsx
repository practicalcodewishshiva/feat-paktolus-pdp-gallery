import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useImagePreloader } from '../hooks'
import type { ProductImage } from '../types'
import { ImagePlaceholder } from './ImagePlaceholder'
import { MainImage } from './MainImage'
import { ThumbnailList } from './ThumbnailList'

export interface ImageGalleryProps {
  images: readonly ProductImage[]
  initialIndex?: number
  activeIndex?: number
  onActiveIndexChange?: (index: number) => void
  thumbnailSize?: number
  className?: string
}

const clampIndex = (index: number, count: number) =>
  count === 0 ? 0 : Math.min(count - 1, Math.max(0, index))

export const ImageGallery = memo(function ImageGallery({
  images,
  initialIndex = 0,
  activeIndex: controlledIndex,
  onActiveIndexChange,
  thumbnailSize = 80,
  className = '',
}: ImageGalleryProps) {
  const [internalIndex, setInternalIndex] = useState(() =>
    clampIndex(initialIndex, images.length),
  )
  const activeIndex = clampIndex(controlledIndex ?? internalIndex, images.length)
  const activeImage = images[activeIndex]

  useEffect(() => {
    if (controlledIndex === undefined && internalIndex !== activeIndex) {
      setInternalIndex(activeIndex)
    }
  }, [activeIndex, controlledIndex, internalIndex])

  const select = useCallback(
    (index: number) => {
      const nextIndex = clampIndex(index, images.length)
      if (controlledIndex === undefined) setInternalIndex(nextIndex)
      onActiveIndexChange?.(nextIndex)
    },
    [controlledIndex, images.length, onActiveIndexChange],
  )
  const previous = useCallback(
    () => select((activeIndex - 1 + images.length) % images.length),
    [activeIndex, images.length, select],
  )
  const next = useCallback(
    () => select((activeIndex + 1) % images.length),
    [activeIndex, images.length, select],
  )
  const adjacentUrls = useMemo(() => {
    if (images.length < 2) return []
    const indexes = [
      (activeIndex - 1 + images.length) % images.length,
      (activeIndex + 1) % images.length,
    ]
    return [...new Set(indexes)].map((index) => images[index].variants.xl.url)
  }, [activeIndex, images])
  useImagePreloader(adjacentUrls)

  if (!activeImage) {
    return (
      <section
        className={`product-gallery product-gallery--empty ${className}`.trim()}
        aria-label="Product image gallery"
      >
        <ImagePlaceholder status="error" />
      </section>
    )
  }

  return (
    <section
      className={`product-gallery ${className}`.trim()}
      aria-label="Product image gallery"
    >
      <div className="product-gallery__stage">
        <button
          type="button"
          className="product-gallery__control product-gallery__control--previous"
          onClick={previous}
          aria-label="Show previous product image"
          disabled={images.length < 2}
        >
          ‹
        </button>
        <MainImage
          image={activeImage}
          index={activeIndex}
          count={images.length}
          onPrevious={previous}
          onNext={next}
        />
        <button
          type="button"
          className="product-gallery__control product-gallery__control--next"
          onClick={next}
          aria-label="Show next product image"
          disabled={images.length < 2}
        >
          ›
        </button>
      </div>
      <p className="product-gallery__status" aria-live="polite" aria-atomic="true">
        Image {activeIndex + 1} of {images.length}: {activeImage.alt}
      </p>
      <ThumbnailList
        images={images}
        activeIndex={activeIndex}
        onSelect={select}
        itemSize={thumbnailSize}
      />
    </section>
  )
})
