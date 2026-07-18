import { describe, expect, it } from 'vitest'
import { getImageLoadingPolicy } from './imagePolicy'

describe('image loading policy', () => {
  it('prefers data saving over reported connection speed', () => {
    expect(
      getImageLoadingPolicy({ saveData: true, effectiveType: '4g' }),
    ).toEqual({
      quality: 58,
      maxWidth: 640,
      preloadCount: 0,
      preloadConcurrency: 1,
    })
  })

  it('reduces speculative work on constrained connections', () => {
    expect(getImageLoadingPolicy({ effectiveType: '2g' }).preloadCount).toBe(1)
    expect(getImageLoadingPolicy({ effectiveType: '3g' }).maxWidth).toBe(960)
  })

  it('uses the full policy when connection data is unavailable', () => {
    expect(getImageLoadingPolicy()).toEqual({
      quality: 84,
      maxWidth: 2048,
      preloadCount: 6,
      preloadConcurrency: 4,
    })
  })
})
