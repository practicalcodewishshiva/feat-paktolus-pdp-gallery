import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { createResponsiveImageSources } from '../services'
import { getImageLoadingPolicy, getNetworkInformation } from '../utils'
import { ImagePlaceholder } from './ImagePlaceholder'

export interface ProgressiveImageProps {
  src: string
  alt: string
  placeholder?: string
  widths: readonly number[]
  sizes: string
  width?: number
  height?: number
  loading?: 'eager' | 'lazy'
  fetchPriority?: 'high' | 'low' | 'auto'
  enabled?: boolean
  className?: string
  onLoad?: () => void
  onError?: () => void
}

export const ProgressiveImage = memo(function ProgressiveImage({
  src,
  alt,
  placeholder,
  widths,
  sizes,
  width,
  height,
  loading = 'lazy',
  fetchPriority = 'auto',
  enabled = true,
  className = '',
  onLoad,
  onError,
}: ProgressiveImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [retryKey, setRetryKey] = useState(0)
  // Network Information is a progressive enhancement: unsupported browsers get
  // the premium default, while Save-Data/2G users never download oversized assets.
  const policy = useMemo(
    () => getImageLoadingPolicy(getNetworkInformation()),
    [],
  )
  const sources = useMemo(
    () => {
      const constrainedWidths = widths.filter((width) => width <= policy.maxWidth)
      const effectiveWidths =
        constrainedWidths.length > 0 ? constrainedWidths : [policy.maxWidth]
      return createResponsiveImageSources(src, effectiveWidths, policy.quality)
    },
    [policy.maxWidth, policy.quality, src, widths],
  )
  useEffect(() => setStatus('loading'), [src])
  const handleLoad = useCallback(() => {
    setStatus('loaded')
    onLoad?.()
  }, [onLoad])
  const handleError = useCallback(() => {
    setStatus('error')
    onError?.()
  }, [onError])
  const retry = useCallback(() => {
    setStatus('loading')
    setRetryKey((key) => key + 1)
  }, [])

  if (!enabled) {
    return (
      <div
        className={`product-gallery__progressive-image product-gallery__progressive-image--deferred ${className}`.trim()}
        aria-hidden="true"
      />
    )
  }

  return (
    <div
      className={`product-gallery__progressive-image product-gallery__progressive-image--${status} ${className}`.trim()}
      style={{ position: 'relative' }}
    >
      {placeholder && (
        <img
          className="product-gallery__blur-image"
          src={placeholder}
          alt=""
          aria-hidden="true"
          width={width}
          height={height}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(12px)',
            opacity: status === 'loaded' ? 0 : 1,
            transition: 'opacity 180ms ease',
          }}
        />
      )}
      <picture key={retryKey}>
        <source type="image/avif" srcSet={sources.avif} sizes={sizes} />
        <source type="image/webp" srcSet={sources.webp} sizes={sizes} />
        <source type="image/jpeg" srcSet={sources.jpeg} sizes={sizes} />
        <img
          className="product-gallery__image"
          src={sources.fallback}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          fetchPriority={fetchPriority}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            opacity: status === 'loaded' ? 1 : 0,
            transition: 'opacity 180ms ease',
          }}
        />
      </picture>
      {!placeholder && status === 'loading' && <ImagePlaceholder />}
      {status === 'error' && <ImagePlaceholder status="error" onRetry={retry} />}
    </div>
  )
})
