import { motion } from 'motion/react'
import { AlertTriangle, Shield, AlertCircle } from 'lucide-react'
import type { ProjectTwinAnalysis } from '../../types/projectTwin'

interface RiskRadarProps {
  risks: ProjectTwinAnalysis['risks']
}

export default function RiskRadar({ risks }: RiskRadarProps) {
  // Risiken nach Schwere sortieren und kategorisieren
  const criticalRisks = risks.filter(r => r.severity === 'high').slice(0, 2)
  const relevantRisks = risks.filter(r => r.severity === 'medium').slice(0, 3)
  const remainingCount = risks.length - criticalRisks.length - relevantRisks.length

  if (risks.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="panel-card p-5"
      >
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Risiko-Radar</h3>
        </div>
        <p className="text-sm text-zinc-500">Keine kritischen Risiken identifiziert.</p>
      </motion.section>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="panel-card overflow-hidden"
    >
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Risiko-Radar</h3>
          </div>
          {remainingCount > 0 && (
            <span className="text-xs text-zinc-500">+{remainingCount} weitere</span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Kritische Risiken */}
        {criticalRisks.map((risk, index) => (
          <div key={index} className="border-l-4 border-l-rose-500 pl-4 py-2 bg-rose-500/5 rounded-r-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Kritisch</span>
            </div>
            <p className="text-sm font-medium text-zinc-200">{risk.title}</p>
            <p className="text-xs text-zinc-500 mt-1">{risk.explanation}</p>
          </div>
        ))}

        {/* Relevante Risiken */}
        {relevantRisks.map((risk, index) => (
          <div key={`rel-${index}`} className="border-l-4 border-l-amber-500 pl-4 py-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">Relevant</span>
            </div>
            <p className="text-sm text-zinc-300">{risk.title}</p>
          </div>
        ))}

        {/* Keine Risiken */}
        {criticalRisks.length === 0 && relevantRisks.length === 0 && (
          <div className="flex items-center gap-2 text-zinc-500">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Keine relevanten Risiken</span>
          </div>
        )}
      </div>
    </motion.section>
  )
}
