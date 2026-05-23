import { useState, useEffect, useCallback, useRef } from 'react'

interface UseVirtualListOptions<T> {
  items: T[]
  itemHeight: number
  overscan?: number
  containerHeight?: number
}

interface VirtualItem<T> {
  item: T
  index: number
  style: React.CSSProperties
}

export function useVirtualList<T>({
  items,
  itemHeight,
  overscan = 5,
  containerHeight = 600
}: UseVirtualListOptions<T>): {
  virtualItems: VirtualItem<T>[]
  totalHeight: number
  startIndex: number
  endIndex: number
  scrollToIndex: (index: number) => void
  containerRef: React.RefObject<HTMLDivElement | null>
} {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const totalHeight = items.length * itemHeight
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2)

  const virtualItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
    item,
    index: startIndex + index,
    style: {
      position: 'absolute' as const,
      top: (startIndex + index) * itemHeight,
      height: itemHeight,
      left: 0,
      right: 0
    }
  }))

  const scrollToIndex = useCallback((index: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTop = index * itemHeight
    }
  }, [itemHeight])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      setScrollTop(container.scrollTop)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  return {
    virtualItems,
    totalHeight,
    startIndex,
    endIndex,
    scrollToIndex,
    containerRef: containerRef as React.RefObject<HTMLDivElement | null>
  }
}

// Lazy load hook for heavy components
export function useLazyLoad<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit
): {
  ref: React.RefObject<T | null>
  isInView: boolean
  hasIntersected: boolean
} {
  const ref = useRef<T>(null)
  const [isInView, setIsInView] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
        if (entry.isIntersecting) {
          setHasIntersected(true)
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.01,
        ...options
      }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [options])

  return { ref: ref as React.RefObject<T | null>, isInView, hasIntersected }
}

// Intersection Observer hook for infinite scroll
export function useInfiniteScroll(
  onLoadMore: () => void,
  hasMore: boolean,
  isLoading: boolean
): {
  loaderRef: React.RefObject<HTMLDivElement | null>
} {
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = loaderRef.current
    if (!element || !hasMore || isLoading) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [onLoadMore, hasMore, isLoading])

  return { loaderRef: loaderRef as React.RefObject<HTMLDivElement | null> }
}
