import type { CSSProperties } from 'react'

interface PullToRefreshIndicatorProps {
  isPulling: boolean
  progress: number
  isRefreshing: boolean
}

// Pull to refresh visual indicator component
export function PullToRefreshIndicator({ 
  isPulling, 
  progress, 
  isRefreshing 
}: PullToRefreshIndicatorProps) {
  const opacity = Math.min(progress * 2, 1)
  const scale = 0.5 + (progress * 0.5)

  const containerStyle: CSSProperties = {
    opacity: isPulling || isRefreshing ? 1 : 0,
    transform: `translateY(${isPulling ? 0 : -20}px)`,
    transition: isPulling ? 'none' : 'all 0.2s ease'
  }

  const innerStyle: CSSProperties = {
    transform: `scale(${isRefreshing ? 1 : scale})`,
    opacity: isRefreshing ? 1 : opacity,
    transition: isPulling ? 'none' : 'all 0.2s ease'
  }

  const iconStyle: CSSProperties = {
    transform: `rotate(${progress * 180}deg)`
  }

  return (
    <div 
      className="absolute top-0 left-0 right-0 h-16 flex items-center justify-center pointer-events-none z-10"
      style={containerStyle}
    >
      <div 
        className="w-10 h-10 rounded-full bg-[var(--lp-surface)] border border-[var(--lp-border)] shadow-lg flex items-center justify-center"
        style={innerStyle}
      >
        {isRefreshing ? (
          <div className="w-5 h-5 border-2 border-[var(--lp-border)] border-t-[var(--lp-accent)] rounded-full animate-spin" />
        ) : (
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            className="text-[var(--lp-accent)]"
            style={iconStyle}
          >
            <path d="M12 5v14M5 12l7-7 7 7" />
          </svg>
        )}
      </div>
    </div>
  )
}
