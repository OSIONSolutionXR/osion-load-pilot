interface ConnectorProps {
  from: { x: number; y: number }
  to: { x: number; y: number }
  variant?: 'normal' | 'blocked'
}

// Calculate bezier curve path
function curvePath(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const controlOffset = 64
  return `M ${from.x} ${from.y} C ${from.x + controlOffset} ${from.y}, ${to.x - controlOffset} ${to.y}, ${to.x} ${to.y}`
}

export function Connector({ from, to, variant = 'normal' }: ConnectorProps) {
  const isBlocked = variant === 'blocked'
  
  return (
    <svg 
      className="absolute inset-0 pointer-events-none" 
      aria-hidden="true"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Gradient for normal connectors */}
        <linearGradient id="gradient-edge" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
        
        {/* Arrow marker */}
        <marker 
          id="arrow" 
          viewBox="0 0 10 10" 
          refX="8" 
          refY="5" 
          markerWidth="6" 
          markerHeight="6" 
          orient="auto-start-reverse"
        >
          <path d="M0 0L10 5L0 10Z" fill="#8b5cf6" />
        </marker>
        
        {/* Blocked arrow marker */}
        <marker 
          id="arrow-blocked" 
          viewBox="0 0 10 10" 
          refX="8" 
          refY="5" 
          markerWidth="6" 
          markerHeight="6" 
          orient="auto-start-reverse"
        >
          <path d="M0 0L10 5L0 10Z" fill="#fb7185" />
        </marker>
      </defs>
      
      {/* Connection path */}
      <path
        d={curvePath(from, to)}
        fill="none"
        stroke={isBlocked ? '#fb7185' : 'url(#gradient-edge)'}
        strokeWidth="2.5"
        strokeLinecap="round"
        markerEnd={isBlocked ? 'url(#arrow-blocked)' : 'url(#arrow)'}
        className={isBlocked ? '[stroke-dasharray:8_6]' : ''}
        style={isBlocked ? { animation: 'dash-flow 1s linear infinite' } : {}}
      />
      
      {/* Blocked indicator (X circle) */}
      {isBlocked && (
        <g>
          <circle 
            cx={(from.x + to.x) / 2} 
            cy={(from.y + to.y) / 2} 
            r="12" 
            fill="#07070b"
            stroke="#fb7185"
            strokeWidth="2"
          />
          <text 
            x={(from.x + to.x) / 2} 
            y={(from.y + to.y) / 2 + 4}
            textAnchor="middle"
            fill="#fb7185"
            fontSize="14"
            fontWeight="bold"
          >
            ×
          </text>
        </g>
      )}
    </svg>
  )
}
