import type { ReactNode } from 'react'

/**
 * OSION Load Pilot - 12-Spalten Grid-Layout-System
 * 
 * Mobile: 1 Spalte (Single Column)
 * Tablet (md): 1 Spalte mit angepassten Größen
 * Desktop (lg): 12-Spalten-Grid mit 66/33 Split
 * Large Desktop (xl): Optimierte Breite
 */

interface GridLayoutProps {
  children: ReactNode
  className?: string
}

export function GridContainer({ children, className = '' }: GridLayoutProps) {
  return (
    <div className={`min-h-screen bg-zinc-950 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {children}
      </div>
    </div>
  )
}

interface GridRowProps {
  children: ReactNode
  className?: string
  gap?: 'none' | 'sm' | 'md' | 'lg'
}

export function GridRow({ children, className = '', gap = 'md' }: GridRowProps) {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-3',
    md: 'gap-4 md:gap-6',
    lg: 'gap-6 md:gap-8'
  }
  
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  )
}

interface GridColProps {
  children: ReactNode
  className?: string
  // Span für verschiedene Breakpoints
  span?: {
    mobile?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
    sm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
    md?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
    lg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
    xl?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  }
}

// Statische Mapping-Tabellen für Tailwind
const colSpanClasses: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  7: 'col-span-7',
  8: 'col-span-8',
  9: 'col-span-9',
  10: 'col-span-10',
  11: 'col-span-11',
  12: 'col-span-12'
}

const smColSpanClasses: Record<number, string> = {
  1: 'sm:col-span-1',
  2: 'sm:col-span-2',
  3: 'sm:col-span-3',
  4: 'sm:col-span-4',
  5: 'sm:col-span-5',
  6: 'sm:col-span-6',
  7: 'sm:col-span-7',
  8: 'sm:col-span-8',
  9: 'sm:col-span-9',
  10: 'sm:col-span-10',
  11: 'sm:col-span-11',
  12: 'sm:col-span-12'
}

const mdColSpanClasses: Record<number, string> = {
  1: 'md:col-span-1',
  2: 'md:col-span-2',
  3: 'md:col-span-3',
  4: 'md:col-span-4',
  5: 'md:col-span-5',
  6: 'md:col-span-6',
  7: 'md:col-span-7',
  8: 'md:col-span-8',
  9: 'md:col-span-9',
  10: 'md:col-span-10',
  11: 'md:col-span-11',
  12: 'md:col-span-12'
}

const lgColSpanClasses: Record<number, string> = {
  1: 'lg:col-span-1',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  5: 'lg:col-span-5',
  6: 'lg:col-span-6',
  7: 'lg:col-span-7',
  8: 'lg:col-span-8',
  9: 'lg:col-span-9',
  10: 'lg:col-span-10',
  11: 'lg:col-span-11',
  12: 'lg:col-span-12'
}

const xlColSpanClasses: Record<number, string> = {
  1: 'xl:col-span-1',
  2: 'xl:col-span-2',
  3: 'xl:col-span-3',
  4: 'xl:col-span-4',
  5: 'xl:col-span-5',
  6: 'xl:col-span-6',
  7: 'xl:col-span-7',
  8: 'xl:col-span-8',
  9: 'xl:col-span-9',
  10: 'xl:col-span-10',
  11: 'xl:col-span-11',
  12: 'xl:col-span-12'
}

export function GridCol({ children, className = '', span }: GridColProps) {
  const classes: string[] = []
  
  // Mobile (default)
  const mobileSpan = span?.mobile ?? 12
  if (mobileSpan in colSpanClasses) {
    classes.push(colSpanClasses[mobileSpan])
  }
  
  // SM breakpoint
  if (span?.sm !== undefined && span.sm in smColSpanClasses) {
    classes.push(smColSpanClasses[span.sm])
  }
  
  // MD breakpoint
  if (span?.md !== undefined && span.md in mdColSpanClasses) {
    classes.push(mdColSpanClasses[span.md])
  }
  
  // LG breakpoint
  if (span?.lg !== undefined && span.lg in lgColSpanClasses) {
    classes.push(lgColSpanClasses[span.lg])
  }
  
  // XL breakpoint
  if (span?.xl !== undefined && span.xl in xlColSpanClasses) {
    classes.push(xlColSpanClasses[span.xl])
  }
  
  return (
    <div className={`${classes.join(' ')} ${className}`}>
      {children}
    </div>
  )
}

// Utility: Stack für vertikale Abstände
interface StackProps {
  children: ReactNode
  className?: string
  space?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

export function Stack({ children, className = '', space = 'md' }: StackProps) {
  const spaceClasses = {
    none: 'space-y-0',
    xs: 'space-y-2',
    sm: 'space-y-3',
    md: 'space-y-4 md:space-y-6',
    lg: 'space-y-6 md:space-y-8',
    xl: 'space-y-8 md:space-y-10'
  }
  
  return (
    <div className={`${spaceClasses[space]} ${className}`}>
      {children}
    </div>
  )
}

// Utility: Card mit konsistentem Padding
interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5 md:p-6',
    lg: 'p-6 md:p-8'
  }
  
  return (
    <div className={`panel-card overflow-hidden ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  )
}

// Responsive Visibility
export function DesktopOnly({ children }: { children: ReactNode }) {
  return <div className="hidden lg:block">{children}</div>
}

export function MobileOnly({ children }: { children: ReactNode }) {
  return <div className="lg:hidden">{children}</div>
}

export function TabletAndUp({ children }: { children: ReactNode }) {
  return <div className="hidden md:block">{children}</div>
}
