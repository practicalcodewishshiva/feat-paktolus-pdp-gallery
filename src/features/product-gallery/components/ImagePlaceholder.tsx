import { memo } from 'react'

export interface ImagePlaceholderProps {
  status?: 'loading' | 'error'
  onRetry?: () => void
  className?: string
}

export const ImagePlaceholder = memo(function ImagePlaceholder({
  status = 'loading',
  onRetry,
  className = '',
}: ImagePlaceholderProps) {
  return (
    <div
      className={`product-gallery__placeholder product-gallery__placeholder--${status} ${className}`.trim()}
      role={status === 'error' ? 'alert' : 'status'}
      aria-label={status === 'error' ? 'Image failed to load' : 'Image loading'}
    >
      {status === 'error' ? (
        <>
          <span>Image unavailable</span>
          {onRetry && (
            <button type="button" onClick={onRetry} aria-label="Retry loading image">
              Retry
            </button>
          )}
        </>
      ) : (
        <span aria-hidden="true">Loading…</span>
      )}
    </div>
  )
})
