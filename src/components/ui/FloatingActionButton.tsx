import { motion } from 'motion/react'
import { Plus } from 'lucide-react'

interface FloatingActionButtonProps {
  onClick: () => void
  label?: string
  className?: string
}

export function FloatingActionButton({ 
  onClick, 
  label = 'Neue Maßnahme',
  className = '' 
}: FloatingActionButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`
        lp-fab lp-fab--extended
        ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      aria-label={label}
    >
      <Plus className="w-5 h-5" />
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  )
}

// Simple FAB for mobile-only (just icon)
export function FloatingActionButtonMobile({ 
  onClick, 
  label = 'Neue Maßnahme',
  className = '' 
}: FloatingActionButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`
        lp-fab
        ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      aria-label={label}
    >
      <Plus className="w-6 h-6" />
    </motion.button>
  )
}
