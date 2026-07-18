export type ImageFormat = 'avif' | 'webp' | 'jpeg'

export interface CdnImageOptions {
  format: ImageFormat
  width?: number
  quality?: number
}

export interface ResponsiveImageSources {
  avif: string
  webp: string
  jpeg: string
  fallback: string
}

const clampInteger = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(value)))

export function createCdnImageUrl(
  sourceUrl: string,
  { format, width, quality = 80 }: CdnImageOptions,
): string {
  const url = new URL(sourceUrl)

  url.searchParams.set('fm', format === 'jpeg' ? 'jpg' : format)
  url.searchParams.set('q', String(clampInteger(quality, 1, 100)))

  if (width !== undefined) {
    url.searchParams.set('w', String(clampInteger(width, 1, 8192)))
  } else {
    url.searchParams.delete('w')
  }

  return url.toString()
}

export function createSrcSet(
  sourceUrl: string,
  widths: readonly number[],
  format: ImageFormat,
  quality = 80,
): string {
  return [...new Set(widths)]
    .filter((width) => Number.isFinite(width) && width > 0)
    .sort((a, b) => a - b)
    .map((width) => {
      const normalizedWidth = clampInteger(width, 1, 8192)
      return `${createCdnImageUrl(sourceUrl, { format, width: normalizedWidth, quality })} ${normalizedWidth}w`
    })
    .join(', ')
}

export function createResponsiveImageSources(
  sourceUrl: string,
  widths: readonly number[],
  quality = 80,
): ResponsiveImageSources {
  const fallbackWidth = Math.max(...widths.filter((width) => width > 0), 1)

  return {
    avif: createSrcSet(sourceUrl, widths, 'avif', quality),
    webp: createSrcSet(sourceUrl, widths, 'webp', quality),
    jpeg: createSrcSet(sourceUrl, widths, 'jpeg', quality),
    fallback: createCdnImageUrl(sourceUrl, {
      format: 'jpeg',
      width: fallbackWidth,
      quality,
    }),
  }
}
