export interface VirtualRangeOptions {
  itemCount: number
  itemSize: number
  scrollOffset: number
  viewportSize: number
  overscan?: number
}

export interface VirtualRange {
  startIndex: number
  endIndex: number
  offset: number
  totalSize: number
}

const toSafeInteger = (value: number) =>
  Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0

export function getIndexAtOffset(offset: number, itemSize: number): number {
  if (!Number.isFinite(itemSize) || itemSize <= 0) return 0
  return Math.floor(Math.max(0, offset) / itemSize)
}

export function getVirtualRange({
  itemCount,
  itemSize,
  scrollOffset,
  viewportSize,
  overscan = 2,
}: VirtualRangeOptions): VirtualRange {
  const count = toSafeInteger(itemCount)
  if (count === 0 || !Number.isFinite(itemSize) || itemSize <= 0) {
    return { startIndex: 0, endIndex: -1, offset: 0, totalSize: 0 }
  }

  const safeOffset = Math.max(0, scrollOffset)
  const safeViewport = Math.max(0, viewportSize)
  const safeOverscan = toSafeInteger(overscan)
  const visibleStart = Math.min(count - 1, getIndexAtOffset(safeOffset, itemSize))
  const visibleEnd = Math.min(
    count - 1,
    Math.max(visibleStart, Math.ceil((safeOffset + safeViewport) / itemSize) - 1),
  )
  const startIndex = Math.max(0, visibleStart - safeOverscan)
  const endIndex = Math.min(count - 1, visibleEnd + safeOverscan)

  return {
    startIndex,
    endIndex,
    offset: startIndex * itemSize,
    totalSize: count * itemSize,
  }
}

export function getVirtualIndexes(range: VirtualRange): number[] {
  if (range.endIndex < range.startIndex) return []
  return Array.from(
    { length: range.endIndex - range.startIndex + 1 },
    (_, index) => range.startIndex + index,
  )
}
