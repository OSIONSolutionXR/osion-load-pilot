import type { LucideIcon } from 'lucide-react'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  icon?: LucideIcon
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

const variantClasses = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost'
}

const sizeClasses = {
  default: '',
  sm: 'px-4 py-2 text-sm',
  lg: 'px-8 py-5 text-base'
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'default',
  icon: Icon, 
  onClick, 
  className = '',
  type = 'button',
  disabled
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  )
}
