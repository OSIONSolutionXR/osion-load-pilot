import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  Target,
  CheckCircle,
  AlertTriangle,
  Clock,
  Plus,
  Sparkles,
  Shield,
  FileCheck,
  ChevronRight,
  Link
} from 'lucide-react'
import type { ProcessStep } from '../../types/projectTwinV2'
import type { ProjectTwinAnalysis } from '../../types/projectTwin'
import type { StoredProjectTwinV2 } from '../../types/projectTwinV2'
import { Badge } from '../ui/Badge'

interface ProcessStepDetailProps {
  step: ProcessStep
  isOpen: boolean
  onClose: () => void
  twin: StoredProjectTwinV2
  analysis: ProjectTwinAnalysis
}

function getStatusConfig(status: ProcessStep['status']) {
  switch (status) {
    case 'done':
      return {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        badge: 'bg-emerald-500 text-white',
        icon: CheckCircle,
        label: 'Erledigt'
      }
    case 'active':
      return {
        bg: 'bg-violet-500/10',
        border: 'border-violet-500/40',
        text: 'text-violet-400',
        badge: 'bg-violet-500 text-white',
        icon: Target,
        label: 'Aktiv'
      }
    case 'blocked':
      return {
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/40',
        text: 'text-rose-400',
        badge: 'bg-rose-500 text-white',
        icon: AlertTriangle,
        label: 'Blockiert'
      }
    case 'next':
      return {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/40',
        text: 'text-amber-400',
        badge: 'bg-amber-500 text-white',
        icon: Clock,
        label: 'Nächster Schritt'
      }
    default:
      return {
        bg: 'bg-zinc-800',
        border: 'border-zinc-700',
        text: 'text-zinc-400',
        badge: 'bg-zinc-700 text-zinc-300',
        icon: Clock,
        label: 'Ausstehend'
      }
  }
}

export default function ProcessStepDetail({ step, isOpen, onClose, twin, analysis }: ProcessStepDetailProps) {
  const statusConfig = getStatusConfig(step.status)
  const StatusIcon = statusConfig.icon
  
  // Verknüpfte Maßnahmen und Risiken
  const linkedMeasures = twin.measures?.filter(m => step.linkedMeasureIds?.includes(m.id)) || []
  const linkedRisks = analysis.risks?.filter((_, i) => 
    step.linkedMeasureIds?.some(id => id.includes(`risk-${i}`))
  ) || []

  const [checkpoints, setCheckpoints] = useState([
    { id: '1', label: 'Voraussetzungen geprüft', checked: false },
    { id: '2', label: 'Ressourcen verfügbar', checked: false },
    { id: '3', label: 'Stakeholder informiert', checked: false },
  ])

  const toggleCheckpoint = (id: string) => {
    setCheckpoints(prev => 
      prev.map(cp => cp.id === id ? { ...cp, checked: !cp.checked } : cp)
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-10 lg:inset-20 bg-[var(--lp-surface)] rounded-2xl border border-[var(--lp-border)] z-50 overflow-hidden flex flex-col max-w-4xl mx-auto"
          >
            {/* Header */}
            <div className={`p-6 border-b border-[var(--lp-border)] ${statusConfig.bg}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${statusConfig.badge} flex items-center justify-center`}>
                    <StatusIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={statusConfig.badge}>
                        {statusConfig.label}
                      </Badge>
                      <span className="text-sm text-[var(--lp-muted)]">
                        Schritt {step.order}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-[var(--lp-text)]">{step.title}</h2>
                  </div>
                </div>
                
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--lp-muted)]" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Prozessziel */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-semibold text-[var(--lp-text)]">Prozessziel</h3>
                </div>
                <p className="text-[var(--lp-muted)] pl-6">
                  {step.description || 'Keine Beschreibung verfügbar.'}
                </p>
              </section>

              {/* Voraussetzungen & Ergebnis Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Voraussetzungen */}
                <section className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Link className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-semibold text-[var(--lp-text)]">Voraussetzungen</h3>
                  </div>
                  <ul className="space-y-1">
                    {step.dependsOn.length > 0 ? (
                      step.dependsOn.map((depId, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-[var(--lp-muted)]">
                          <ChevronRight className="w-3 h-3" />
                          <span>{depId}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-[var(--lp-muted)]">Keine Voraussetzungen</li>
                    )}
                  </ul>
                </section>

                {/* Blocker */}
                <section className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <h3 className="text-sm font-semibold text-[var(--lp-text)]">Blocker</h3>
                  </div>
                  {step.blockerReason ? (
                    <p className="text-sm text-rose-400">{step.blockerReason}</p>
                  ) : (
                    <p className="text-sm text-[var(--lp-muted)]">Keine Blocker</p>
                  )}
                </section>
              </div>

              {/* Prüfpunkte */}
              <section className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <div className="flex items-center gap-2 mb-4">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-[var(--lp-text)]">Prüfpunkte</h3>
                </div>
                <div className="space-y-2">
                  {checkpoints.map(cp => (
                    <label
                      key={cp.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={cp.checked}
                        onChange={() => toggleCheckpoint(cp.id)}
                        className="w-4 h-4 rounded border-zinc-600 text-emerald-500 focus:ring-emerald-500/20"
                      />
                      <span className={`text-sm ${cp.checked ? 'text-zinc-500 line-through' : 'text-[var(--lp-text)]'}`}>
                        {cp.label}
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Verknüpfte Maßnahmen */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-violet-400" />
                    <h3 className="text-sm font-semibold text-[var(--lp-text)]">
                      Zugehörige Maßnahmen ({linkedMeasures.length})
                    </h3>
                  </div>
                  <button className="flex items-center gap-1 px-3 py-1 text-sm text-violet-400 hover:text-violet-300 transition-colors">
                    <Plus className="w-4 h-4" />
                    Maßnahme erstellen
                  </button>
                </div>
                <div className="space-y-2">
                  {linkedMeasures.length > 0 ? (
                    linkedMeasures.map(measure => (
                      <div
                        key={measure.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800"
                      >
                        <div>
                          <div className="font-medium text-sm text-[var(--lp-text)]">{measure.title}</div>
                          {measure.description && (
                            <div className="text-xs text-[var(--lp-muted)]">{measure.description}</div>
                          )}
                        </div>
                        <Badge variant={
                          measure.status === 'done' ? 'success' :
                          measure.status === 'blocked' ? 'rose' :
                          measure.status === 'in_progress' ? 'amber' :
                          'neutral'
                        }>
                          {measure.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--lp-muted)]">Keine verknüpften Maßnahmen</p>
                  )}
                </div>
              </section>

              {/* Verknüpfte Risiken */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-semibold text-[var(--lp-text)]">
                    Zugehörige Risiken ({linkedRisks.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {linkedRisks.length > 0 ? (
                    linkedRisks.map((risk, i) => (
                      <div
                        key={`risk-${i}`}
                        className="flex items-center justify-between p-3 rounded-lg bg-rose-500/5 border border-rose-500/20"
                      >
                        <div>
                          <div className="font-medium text-sm text-[var(--lp-text)]">{risk.title}</div>
                          <div className="text-xs text-[var(--lp-muted)]">{risk.severity} Risiko</div>
                        </div>
                        <Badge variant={
                          risk.severity === 'high' ? 'rose' :
                          risk.severity === 'medium' ? 'amber' :
                          'neutral'
                        }>
                          {risk.severity}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--lp-muted)]">Keine verknüpften Risiken</p>
                  )}
                </div>
              </section>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-[var(--lp-border)] bg-zinc-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-xs text-[var(--lp-muted)]">
                  Zuletzt aktualisiert: {new Date(step.updatedAt).toLocaleString('de-DE')}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Mit KI bearbeiten
                </button>
                <button
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-500 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Als erledigt markieren
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
