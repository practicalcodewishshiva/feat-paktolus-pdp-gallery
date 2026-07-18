import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type UIEvent,
} from 'react'
import { useIntersectionObserver } from '../hooks'
import type { ProductImage } from '../types'
import { getVirtualIndexes, getVirtualRange } from '../utils'
import { ProgressiveImage } from './ProgressiveImage'

export interface ThumbnailListProps {
  images: readonly ProductImage[]
  activeIndex: number
  onSelect: (index: number) => void
  itemSize?: number
  overscan?: number
  ariaLabel?: string
  className?: string
}

interface ThumbnailProps {
  image: ProductImage
  index: number
  active: boolean
  itemSize: number
  root: HTMLElement | null
  onSelect: (index: number) => void
}

const Thumbnail = memo(function Thumbnail({
  image,
  index,
  active,
  itemSize,
  root,
  onSelect,
}: ThumbnailProps) {
  const { ref, isIntersecting } = useIntersectionObserver<HTMLLIElement>({
    root,
    rootMargin: `${itemSize * 2}px`,
    freezeOnceVisible: true,
  })
  const select = useCallback(() => onSelect(index), [index, onSelect])

  return (
    <li
      ref={ref}
      className={`product-gallery__thumbnail-item${active ? ' product-gallery__thumbnail-item--active' : ''}`}
      style={{ position: 'absolute', left: index * itemSize, width: itemSize }}
    >
      <button
        type="button"
        className="product-gallery__thumbnail-button"
        onClick={select}
        aria-label={`Show image ${index + 1}: ${image.alt}`}
        aria-current={active ? 'true' : undefined}
      >
        <ProgressiveImage
          src={image.variants.thumbnail.url}
          alt=""
          placeholder={image.blurPlaceholder}
          widths={[96, 192]}
          sizes={`${itemSize}px`}
          width={itemSize}
          height={itemSize}
          enabled={isIntersecting}
        />
      </button>
    </li>
  )
})

export const ThumbnailList = memo(function ThumbnailList({
  images,
  activeIndex,
  onSelect,
  itemSize = 80,
  overscan = 2,
  ariaLabel = 'Product images',
  className = '',
}: ThumbnailListProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [root, setRoot] = useState<HTMLDivElement | null>(null)
  const [scrollOffset, setScrollOffset] = useState(0)
  const [viewportSize, setViewportSize] = useState(0)

  useEffect(() => {
    const node = scrollerRef.current
    setRoot(node)
    if (!node) return
    const updateSize = () => setViewportSize(node.clientWidth)
    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const node = scrollerRef.current
    if (!node || activeIndex < 0) return
    const start = activeIndex * itemSize
    const end = start + itemSize
    if (start < node.scrollLeft) node.scrollTo({ left: start, behavior: 'smooth' })
    else if (end > node.scrollLeft + node.clientWidth) {
      node.scrollTo({ left: end - node.clientWidth, behavior: 'smooth' })
    }
  }, [activeIndex, itemSize])

  const range = useMemo(
    () =>
      getVirtualRange({
        itemCount: images.length,
        itemSize,
        scrollOffset,
        viewportSize,
        overscan,
      }),
    [images.length, itemSize, overscan, scrollOffset, viewportSize],
  )
  const indexes = useMemo(() => getVirtualIndexes(range), [range])
  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => setScrollOffset(event.currentTarget.scrollLeft),
    [],
  )

  return (
    <div
      ref={scrollerRef}
      className={`product-gallery__thumbnails ${className}`.trim()}
      onScroll={handleScroll}
      role="region"
      aria-label={ariaLabel}
      tabIndex={0}
    >
      <ol
        className="product-gallery__thumbnail-list"
        style={{ position: 'relative', width: range.totalSize, height: itemSize }}
      >
        {indexes.map((index) => {
          const image = images[index]
          return image ? (
            <Thumbnail
              key={image.id}
              image={image}
              index={index}
              active={index === activeIndex}
              itemSize={itemSize}
              root={root}
              onSelect={onSelect}
            />
          ) : null
        })}
      </ol>
    </div>
  )
})
