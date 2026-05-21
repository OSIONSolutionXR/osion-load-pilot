import type { LucideIcon } from 'lucide-react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'violet' | 'rose' | 'blue' | 'simulation' | 'neutral' | 'amber' | 'success'
  icon?: LucideIcon
  className?: string
}

const variants = {
  violet: 'badge-violet',
  rose: 'badge-rose',
  blue: 'badge-blue',
  simulation: 'badge-simulation',
  neutral: 'bg-white/5 border-white/10 text-zinc-400',
  amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
}

export function Badge({ children, variant = 'neutral', icon: Icon, className = '' }: BadgeProps) {
  return (
    <span className={`badge ${variants[variant]} ${className}`}>
      {Icon && <Icon className="w-3 h-3 mr-1" />}
      {children}
    </span>
  )
}
