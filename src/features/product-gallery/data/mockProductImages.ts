import { createCdnImageUrl } from '../services/cdnUrl'
import type {
  ProductImage,
  ProductImageVariant,
} from '../types/productImage'

const SOURCE_IMAGES = [
  ['photo-1491553895911-0055eca6402d', 'Axiom 01 side profile'],
  ['photo-1542291026-7eec264c27ff', 'Axiom 01 three-quarter view'],
  ['photo-1549298916-b41d501d3772', 'Axiom 01 top view'],
  ['photo-1608231387042-66d1773070a5', 'Axiom 01 heel detail'],
  ['photo-1600185365483-26d7a4cc7519', 'Axiom 01 sole detail'],
  ['photo-1595950653106-6c9ebd614d3a', 'Axiom 01 leather detail'],
  ['photo-1600269452121-4f2416e55c28', 'Axiom 01 on-foot view'],
  ['photo-1560769629-975ec94e6a86', 'Axiom 01 studio view'],
  ['photo-1543508282-6319a3e2621f', 'Axiom 01 lace detail'],
  ['photo-1539185441755-769473a23570', 'Axiom 01 rear profile'],
] as const

const VARIANT_WIDTHS = {
  thumbnail: 96,
  small: 320,
  medium: 640,
  large: 960,
  xl: 1440,
  zoom: 2048,
  original: 2400,
} satisfies Record<ProductImageVariant, number>

function createMockProductImage(index: number): ProductImage {
  const source = SOURCE_IMAGES[index % SOURCE_IMAGES.length]
  const sourceUrl = `https://images.unsplash.com/${source[0]}?ixid=pdp-gallery-${index + 1}&fit=crop`
  const variants = Object.fromEntries(
    Object.entries(VARIANT_WIDTHS).map(([name, width]) => [
      name,
      {
        url: createCdnImageUrl(sourceUrl, {
          format: 'jpeg',
          width,
          quality: name === 'thumbnail' ? 72 : 84,
        }),
        width,
        height: Math.round(width * 1.25),
      },
    ]),
  ) as Record<ProductImageVariant, ProductImage['variants'][ProductImageVariant]>

  return {
    id: `product-image-${String(index + 1).padStart(3, '0')}`,
    alt: `${source[1]} product view ${Math.floor(index / SOURCE_IMAGES.length) + 1}`,
    blurPlaceholder: createCdnImageUrl(sourceUrl, {
      format: 'jpeg',
      width: 24,
      quality: 20,
    }),
    variants,
  }
}

export const MOCK_PRODUCT_IMAGES: readonly ProductImage[] = Object.freeze(
  Array.from({ length: 300 }, (_, index) =>
    Object.freeze(createMockProductImage(index)),
  ),
)
