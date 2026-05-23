import { motion } from 'motion/react'
import { User, FileText, Building, CheckCircle2, AlertCircle } from 'lucide-react'
import type { DerivedDependencyNode } from '../../lib/projectTwinDerived'

interface DependencyNodeProps {
  node: DerivedDependencyNode
  index: number
}

const iconMap: Record<string, typeof User> = {
  'user': User,
  'file-text': FileText,
  'building': Building,
  'check-circle': CheckCircle2
}

const statusColors = {
  complete: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', glow: 'shadow-emerald-500/20' },
  active: { border: 'border-blue-500/30', bg: 'bg-blue-500/10', glow: 'shadow-blue-500/20' },
  blocked: { border: 'border-[#fb7185]/40', bg: 'bg-[#fb7185]/10', glow: 'shadow-[#fb7185]/30' },
  pending: { border: 'border-white/10', bg: 'bg-white/5', glow: '' }
}

export function DependencyNode({ node, index }: DependencyNodeProps) {
  const Icon = iconMap[node.icon] || User
  const colors = statusColors[node.status]
  const isCritical = node.state === 'critical'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1] 
      }}
      className="relative flex flex-col"
    >
      {/* Node Card */}
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={`
          panel-card p-6 md:p-8 flex flex-col items-center text-center
          ${colors.border} border-2
          ${isCritical ? 'shadow-[0_0_30px_rgba(251,113,133,0.15)]' : ''}
        `}
        style={isCritical ? { animation: 'pulse-glow 3s ease-in-out infinite' } : {}}
      >
        {/* Step Number */}
        <div className="text-label text-zinc-500 mb-4">Schritt {node.step}</div>
        
        {/* Icon */}
        <div className={`
          w-14 h-14 rounded-2xl flex items-center justify-center mb-4
          ${isCritical ? 'bg-[#fb7185]/15 text-[#fb7185]' : 'bg-white/5 text-zinc-400'}
        `}>
          <Icon className="w-6 h-6" />
        </div>
        
        {/* Title */}
        <h3 className={`text-title mb-1 ${isCritical ? 'text-[#fb7185]' : ''}`}>
          {node.title}
        </h3>
        
        {/* Status */}
        <div className="flex items-center gap-2 mt-2">
          {isCritical && (
            <AlertCircle className="w-4 h-4 text-[#fb7185]" />
          )}
          <span className={`text-subhead ${isCritical ? 'text-[#fb7185]' : 'text-zinc-400'}`}>
            {node.subtitle}
          </span>
        </div>

        {/* Critical State Badge */}
        {isCritical && node.state && (
          <div className="mt-4">
            <span className="badge badge-rose">{node.state.toUpperCase()}</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
