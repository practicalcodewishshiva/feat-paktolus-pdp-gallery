export const PRODUCT_IMAGE_VARIANTS = [
  'thumbnail',
  'small',
  'medium',
  'large',
  'xl',
  'zoom',
  'original',
] as const

export type ProductImageVariant = (typeof PRODUCT_IMAGE_VARIANTS)[number]

export interface ProductImageSource {
  url: string
  width: number
  height: number
}

export interface ProductImage {
  id: string
  alt: string
  blurPlaceholder: string
  variants: Record<ProductImageVariant, ProductImageSource>
}
