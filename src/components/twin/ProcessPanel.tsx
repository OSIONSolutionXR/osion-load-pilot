import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  GitBranch,
  AlertTriangle,
  CheckCircle,
  Clock,
  Play,
  ChevronRight,
  Sparkles,
  Target
} from 'lucide-react'
import type { StoredProjectTwinV2, ProcessStep, ProcessStepStatus } from '../../types/projectTwinV2'
import type { ProjectTwinAnalysis } from '../../types/projectTwin'
import { Badge } from '../ui/Badge'
import ProcessStepDetail from './ProcessStepDetail'

interface ProcessPanelProps {
  twin: StoredProjectTwinV2
  analysis: ProjectTwinAnalysis
}

interface ProcessStepCardProps {
  step: ProcessStep
  index: number
  isLast: boolean
  onClick: () => void
  measures: { id: string; title: string; status: string }[]
}

function getStatusConfig(status: ProcessStepStatus) {
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
        icon: Play,
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

function ProcessStepCard({ step, index, isLast, onClick, measures }: ProcessStepCardProps) {
  const config = getStatusConfig(step.status)

  const hasBlocker = step.blockerReason && step.blockerReason.length > 0
  const linkedMeasures = measures.filter(m => step.linkedMeasureIds?.includes(m.id))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`
        relative p-4 rounded-xl border cursor-pointer
        ${config.bg} ${config.border}
        hover:shadow-lg hover:shadow-violet-500/10
        transition-all duration-200 group
      `}
    >
      {/* Step Number & Status */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
          ${config.badge}
        `}>
          {step.status === 'done' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <span className="text-sm font-bold">{step.order}</span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium uppercase tracking-wider ${config.text}`}>
              {config.label}
            </span>
            {hasBlocker && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">
                Blocker
              </span>
            )}
          </div>
          <h4 className="font-semibold text-[var(--lp-text)] truncate">{step.title}</h4>
        </div>
        
        <ChevronRight className={`w-5 h-5 ${config.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
      </div>

      {/* Description */}
      {step.description && (
        <p className="text-sm text-[var(--lp-muted)] mb-3 line-clamp-2">
          {step.description}
        </p>
      )}

      {/* Blocker Warning */}
      {hasBlocker && (
        <div className="mb-3 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
          <div className="flex items-center gap-2 text-xs text-rose-400">
            <AlertTriangle className="w-3 h-3" />
            <span className="truncate">{step.blockerReason}</span>
          </div>
        </div>
      )}

      {/* Linked Items Summary */}
      <div className="flex items-center gap-2">
        {linkedMeasures.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-[var(--lp-muted)]">
            <Target className="w-3 h-3" />
            <span>{linkedMeasures.length} Maßnahme{linkedMeasures.length > 1 ? 'n' : ''}</span>
          </div>
        )}
      </div>

      {/* Next Step Indicator */}
      {!isLast && step.status === 'done' && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-emerald-500/30" />
      )}
      {!isLast && step.status === 'active' && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-violet-500/50 animate-pulse" />
      )}
    </motion.div>
  )
}

export default function ProcessPanel({ twin, analysis }: ProcessPanelProps) {
  const [selectedStep, setSelectedStep] = useState<ProcessStep | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  const processSteps = useMemo(() => {
    if (twin.processSteps && twin.processSteps.length > 0) {
      return [...twin.processSteps].sort((a, b) => a.order - b.order)
    }
    return []
  }, [twin.processSteps])

  // Berechne Fortschritt
  const progress = useMemo(() => {
    const total = processSteps.length
    const done = processSteps.filter(s => s.status === 'done').length
    return total > 0 ? Math.round((done / total) * 100) : 0
  }, [processSteps])

  // Finde den nächsten nicht-blockierten Schritt
  const nextBestStep = useMemo(() => {
    return processSteps.find(s => s.status === 'next' || s.status === 'active')
  }, [processSteps])

  const handleStepClick = (step: ProcessStep) => {
    setSelectedStep(step)
    setShowDetail(true)
  }

  const handleCloseDetail = () => {
    setShowDetail(false)
    setTimeout(() => setSelectedStep(null), 200)
  }

  if (processSteps.length === 0) {
    return (
      <section className="lp-card lp-card--padded text-center py-12">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800">
          <GitBranch className="w-8 h-8 text-zinc-500" />
        </div>
        <h3 className="text-xl font-semibold text-[var(--lp-text)] mb-2">Keine Prozessschritte</h3>
        <p className="text-[var(--lp-muted)] max-w-md mx-auto">
          Der Prozesspfad wurde noch nicht erstellt. Aktualisiere den Project Twin, um Schritte zu generieren.
        </p>
      </section>
    )
  }

  return (
    <section className="lp-card lp-card--padded">
      {/* Header mit Fortschritt */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--lp-text)]">Prozesspfad</h3>
            <p className="text-sm text-[var(--lp-muted)]">
              {processSteps.length} Schritte • {progress}% abgeschlossen
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Fortschrittsbalken */}
          <div className="flex-1 min-w-[120px] max-w-[200px]">
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
              />
            </div>
          </div>
          
          <Badge variant={progress === 100 ? 'success' : 'neutral'}>
            {progress}%
          </Badge>
        </div>
      </div>

      {/* Next Best Action */}
      {nextBestStep && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-violet-400 uppercase tracking-wider mb-0.5">
                Empfohlener nächster Schritt
              </div>
              <div className="font-semibold text-[var(--lp-text)]">
                {nextBestStep.order}. {nextBestStep.title}
              </div>
            </div>
            <button
              onClick={() => handleStepClick(nextBestStep)}
              className="px-3 py-1.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-500 transition-colors"
            >
              Öffnen
            </button>
          </div>
        </motion.div>
      )}

      {/* Process Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {processSteps.map((step, index) => (
          <ProcessStepCard
            key={step.id}
            step={step}
            index={index}
            isLast={index === processSteps.length - 1}
            onClick={() => handleStepClick(step)}
            measures={twin.measures || []}
          />
        ))}
      </div>

      {/* Step Detail Modal */}
      <AnimatePresence>
        {showDetail && selectedStep && (
          <ProcessStepDetail
            step={selectedStep}
            isOpen={showDetail}
            onClose={handleCloseDetail}
            twin={twin}
            analysis={analysis}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
