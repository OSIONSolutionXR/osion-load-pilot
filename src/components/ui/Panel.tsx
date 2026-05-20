interface PanelProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'compact'
}

export function Panel({ children, className = '', variant = 'default' }: PanelProps) {
  const baseClasses = 'panel-premium'
  const variantClasses = variant === 'compact' ? 'p-6 md:p-8' : 'p-8 md:p-10'
  
  return (
    <div className={`${baseClasses} ${variantClasses} ${className}`}>
      {children}
    </div>
  )
}

export function PanelHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-between mb-8 ${className}`}>
      {children}
    </div>
  )
}

export function PanelTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`text-headline font-semibold ${className}`}>
      {children}
    </h2>
  )
}
