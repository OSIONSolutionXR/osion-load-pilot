import { motion } from 'motion/react'
import { Shield, AlertTriangle, CheckCircle2, Clock, Activity } from 'lucide-react'
import type { ProjectTwinAnalysis } from '../../types/projectTwin'
import type { StoredProjectTwin } from '../../lib/projectTwinStore'

interface SystemStatusPanelProps {
  quality: ProjectTwinAnalysis['quality']
  progress?: StoredProjectTwin['progress']
  updateCount?: number
}

export default function SystemStatusPanel({
  quality,
  progress,
  updateCount = 0
}: SystemStatusPanelProps) {
  // Berechne Status-Indikatoren
  const hasBlockers = quality.missingContext.length > 0 || quality.confidence === 'low'
  const isActionable = quality.isActionable
  const completionPercent = progress?.percent ?? 0

  // Status-Items
  const statusItems = [
    {
      label: 'Twin-Status',
      value: isActionable ? 'Aktiv' : 'Entwurf',
      icon: Activity,
      color: isActionable ? 'emerald' : 'amber'
    },
    {
      label: 'Datenqualität',
      value: quality.inputQuality === 'strong' ? 'Detailliert' : 
            quality.inputQuality === 'usable' ? 'Ausreichend' : 'Minimal',
      icon: hasBlockers ? AlertTriangle : CheckCircle2,
      color: hasBlockers ? 'amber' : 'emerald'
    },
    {
      label: 'Vertrauen',
      value: quality.confidence === 'high' ? 'Hoch' : 
            quality.confidence === 'medium' ? 'Mittel' : 'Niedrig',
      icon: Shield,
      color: quality.confidence === 'high' ? 'emerald' : 
            quality.confidence === 'medium' ? 'amber' : 'rose'
    },
    {
      label: 'Updates',
      value: `${updateCount} verarbeitet`,
      icon: Clock,
      color: 'zinc'
    }
  ]

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="panel-card overflow-hidden"
    >
      <div className="p-5 border-b border-white/5">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Systemstatus</h3>
      </div>
      
      <div className="p-5 space-y-4">
        {statusItems.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg bg-${item.color}-500/10 flex items-center justify-center`}>
                <Icon className={`w-4 h-4 text-${item.color}-400`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-zinc-500">{item.label}</div>
                <div className={`text-sm font-medium text-${item.color}-400 truncate`}>
                  {item.value}
                </div>
              </div>
            </div>
          )
        })}
        
        {/* Progress Bar */}
        <div className="pt-3 border-t border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500">Projekt-Klarheit</span>
            <span className="text-sm font-medium text-zinc-300">{completionPercent}%</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#ff006e] to-violet-500 transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>
    </motion.section>
  )
}
