import { describe, expect, it } from 'vitest'
import {
  getIndexAtOffset,
  getVirtualIndexes,
  getVirtualRange,
} from './virtualization'

describe('fixed-size virtualization', () => {
  it('maps offsets to stable item indexes', () => {
    expect(getIndexAtOffset(-20, 100)).toBe(0)
    expect(getIndexAtOffset(99, 100)).toBe(0)
    expect(getIndexAtOffset(100, 100)).toBe(1)
    expect(getIndexAtOffset(900, 0)).toBe(0)
  })

  it('clamps an overscanned range to the collection', () => {
    const range = getVirtualRange({
      itemCount: 300,
      itemSize: 100,
      scrollOffset: 250,
      viewportSize: 300,
      overscan: 2,
    })

    expect(range).toEqual({
      startIndex: 0,
      endIndex: 7,
      offset: 0,
      totalSize: 30_000,
    })
    expect(getVirtualIndexes(range)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
  })

  it('returns an empty range for an empty collection', () => {
    const range = getVirtualRange({
      itemCount: 0,
      itemSize: 100,
      scrollOffset: 0,
      viewportSize: 500,
    })

    expect(range.endIndex).toBe(-1)
    expect(getVirtualIndexes(range)).toEqual([])
  })
})
