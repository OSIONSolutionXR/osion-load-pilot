import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'

interface FadeInProps {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
}

export function FadeIn({ 
  children, 
  delay = 0, 
  duration = 0.5, 
  className = '',
  direction = 'up'
}: FadeInProps) {
  const prefersReducedMotion = useReducedMotion()
  
  const directions = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 },
    none: {}
  }
  
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ 
        duration, 
        delay, 
        ease: [0.25, 0.1, 0.25, 1] 
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface StaggerContainerProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
  initialDelay?: number
}

export function StaggerContainer({ 
  children, 
  className = '',
  staggerDelay = 0.05,
  initialDelay = 0
}: StaggerContainerProps) {
  const prefersReducedMotion = useReducedMotion()
  
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: initialDelay
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ 
  children, 
  className = '' 
}: { 
  children: ReactNode
  className?: string 
}) {
  const prefersReducedMotion = useReducedMotion()
  
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }
  
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.4,
            ease: [0.25, 0.1, 0.25, 1]
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface HoverScaleProps {
  children: ReactNode
  className?: string
  scale?: number
}

export function HoverScale({ children, className = '', scale = 1.02 }: HoverScaleProps) {
  const prefersReducedMotion = useReducedMotion()
  
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }
  
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface PulseRingProps {
  children: ReactNode
  className?: string
  color?: string
}

export function PulseRing({ children, className = '', color = '#ff006e' }: PulseRingProps) {
  const prefersReducedMotion = useReducedMotion()
  
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }
  
  return (
    <div className={`relative ${className}`}>
      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{ border: `2px solid ${color}` }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: [0, 0.5, 0],
          scale: [0.8, 1.1, 1.2]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeOut"
        }}
      />
      {children}
    </div>
  )
}

interface SlideInProps {
  children: ReactNode
  from?: 'left' | 'right' | 'top' | 'bottom'
  className?: string
  duration?: number
}

export function SlideIn({ 
  children, 
  from = 'right',
  className = '',
  duration = 0.3
}: SlideInProps) {
  const prefersReducedMotion = useReducedMotion()
  
  const positions = {
    left: { x: -100, y: 0 },
    right: { x: 100, y: 0 },
    top: { x: 0, y: -100 },
    bottom: { x: 0, y: 100 }
  }
  
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, ...positions[from] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Page Transition Wrapper
export function PageTransition({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion()
  
  if (prefersReducedMotion) {
    return <>{children}</>
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}

// Skeleton Loading Animation
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`bg-white/10 rounded ${className}`}
      animate={{ 
        opacity: [0.1, 0.2, 0.1],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  )
}

// CountUp Animation für Zahlen
interface CountUpProps {
  end: number
  className?: string
  suffix?: string
}

export function CountUp({ end, className = '', suffix = '' }: CountUpProps) {
  const prefersReducedMotion = useReducedMotion()
  
  if (prefersReducedMotion) {
    return <span className={className}>{end}{suffix}</span>
  }
  
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: { duration: 0.5 }
        }}
      >
        {end}{suffix}
      </motion.span>
    </motion.span>
  )
}
