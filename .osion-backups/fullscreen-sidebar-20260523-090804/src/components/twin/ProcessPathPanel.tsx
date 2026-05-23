import { motion } from 'motion/react'
import { GitBranch, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { Badge } from '../ui/Badge'
import type { StoredProjectTwin } from '../../lib/projectTwinStore'
import type { ProjectTwinAnalysis } from '../../types/projectTwin'

export type ProcessStepStatus = 'done' | 'active' | 'blocked' | 'next' | 'pending' | 'skipped'

export interface ProcessStep {
  id: string
  title: string
  description?: string
  status: ProcessStepStatus
  order: number
  reason?: string
  blockerReason?: string
  dependsOn?: string[]
  updatedAt?: string
}

interface ProcessPathPanelProps {
  variant?: 'full' | 'compact'
  twin?: StoredProjectTwin | null
  analysis?: ProjectTwinAnalysis | null
}

function getProcessStatusLabel(status: ProcessStepStatus): string {
  switch (status) {
    case 'done':
      return 'Erledigt'
    case 'active':
      return 'Aktiv'
    case 'blocked':
      return 'Blockiert'
    case 'next':
      return 'Nächster Schritt'
    case 'skipped':
      return 'Übersprungen'
    default:
      return 'Ausstehend'
  }
}

function getStatusColorClasses(status: ProcessStepStatus): string {
  switch (status) {
    case 'done':
      return 'border-emerald-500/30 bg-emerald-500/8'
    case 'active':
      return 'border-violet-500/40 bg-violet-500/10'
    case 'blocked':
      return 'border-rose-500/40 bg-rose-500/10'
    case 'next':
      return 'border-amber-500/40 bg-amber-500/10'
    case 'skipped':
      return 'border-zinc-500/20 bg-zinc-500/5 opacity-60'
    default:
      return 'border-[var(--lp-border)] bg-[var(--lp-surface-soft)]'
  }
}

function getStatusBadgeClasses(status: ProcessStepStatus): string {
  switch (status) {
    case 'done':
      return 'bg-emerald-500/20 text-emerald-400'
    case 'active':
      return 'bg-violet-500/20 text-violet-400'
    case 'blocked':
      return 'bg-rose-500/20 text-rose-400'
    case 'next':
      return 'bg-amber-500/20 text-amber-400'
    case 'skipped':
      return 'bg-zinc-500/20 text-zinc-500'
    default:
      return 'bg-zinc-500/20 text-zinc-400'
  }
}

/**
 * Normalisiert Prozessschritte aus verschiedenen Quellen im Twin
 */
function normalizeProcessSteps(twin: StoredProjectTwin | null): ProcessStep[] {
  if (!twin) return []

  // Mögliche Quellen für Prozessschritte
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const twinAny = twin as any
  const raw =
    twinAny?.processSteps ||
    twinAny?.processPath ||
    twinAny?.workflow ||
    twinAny?.criticalPath ||
    twin.analysis?.dependencies ||
    []

  const list = Array.isArray(raw) ? raw : []

  // Wenn keine Prozessschritte vorhanden, aus Abhängigkeiten ableiten
  if (list.length === 0 && twin.analysis?.dependencies) {
    const deps = twin.analysis.dependencies
    return deps.map((dep, index) => ({
      id: `dep-${index}`,
      title: dep.from,
      description: dep.explanation,
      status: dep.isBlocker ? 'blocked' : dep.status === 'done' ? 'done' : dep.status === 'required' ? 'next' : 'pending',
      order: index + 1,
      blockerReason: dep.isBlocker ? dep.explanation : undefined,
      dependsOn: [],
      updatedAt: twin.updatedAt
    }))
  }

  // Wenn immer noch keine Schritte, aus Aktionen ableiten
  if (list.length === 0 && twin.analysis?.actions) {
    return twin.analysis.actions.slice(0, 5).map((action, index) => ({
      id: `action-${index}`,
      title: action.title,
      description: `Verantwortlich: ${action.owner}`,
      status: index === 0 ? 'next' : index === 1 ? 'active' : 'pending',
      order: index + 1,
      dependsOn: [],
      updatedAt: twin.updatedAt
    }))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const steps = (list as any[])
    .map((step: Record<string, unknown>, index: number) => {
      const statusRaw = String(
        step.status ||
        step.state ||
        step.phase ||
        step.progress ||
        ''
      ).toLowerCase()

      let status: ProcessStepStatus = 'pending'

      if (['done', 'completed', 'complete', 'erledigt', 'abgeschlossen'].includes(statusRaw)) {
        status = 'done'
      } else if (['active', 'current', 'aktuell', 'in_progress', 'running'].includes(statusRaw)) {
        status = 'active'
      } else if (['blocked', 'blocker', 'kritisch', 'critical', 'gesperrt'].includes(statusRaw)) {
        status = 'blocked'
      } else if (['next', 'next_step', 'nächster schritt', 'naechster schritt'].includes(statusRaw)) {
        status = 'next'
      } else if (['skipped', 'irrelevant', 'übersprungen', 'uebersprungen'].includes(statusRaw)) {
        status = 'skipped'
      }

      return {
        id: String(step.id || step.key || `process-step-${index + 1}`),
        title: String(step.title || step.name || step.label || step.step || `Schritt ${index + 1}`),
        description: String(step.description || step.reason || step.details || step.summary || ''),
        status,
        order: Number.isFinite(Number(step.order)) ? Number(step.order) : index + 1,
        blockerReason: step.blockerReason ? String(step.blockerReason) : undefined,
        dependsOn: Array.isArray(step.dependsOn) ? step.dependsOn.map(String) : [],
        updatedAt: step.updatedAt ? String(step.updatedAt) : twin.updatedAt
      }
    })
    .sort((a, b) => a.order - b.order)

  // Debug-Log
  console.log('[ProcessPath] normalized', {
    source: list.length > 0 ? 'twin.processSteps/processPath' : twin.analysis?.dependencies ? 'twin.analysis.dependencies' : twin.analysis?.actions ? 'twin.analysis.actions' : 'empty',
    stepCount: steps.length,
    statuses: steps.map(s => s.status),
    titles: steps.map(s => s.title).slice(0, 10)
  })

  return steps
}

export function ProcessPathPanel({ variant = 'full', twin, analysis }: ProcessPathPanelProps) {
  const steps = useMemo(() => normalizeProcessSteps(twin ?? null), [twin])
  const isCompact = variant === 'compact'
  const hasAnalysis = Boolean(analysis)
  const projectTitle = twin?.analysis?.project.title ?? analysis?.project.title

  if (!hasAnalysis && !twin) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="lp-card lp-card--padded"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[var(--lp-text)]">Prozesspfad</h2>
            <p className="text-sm text-[var(--lp-muted)]">Dynamischer Ablauf des Project Twins</p>
          </div>
        </div>

        <div className="text-center py-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--lp-border)] bg-gradient-to-br from-violet-500/20 to-rose-500/20">
            <Sparkles className="w-7 h-7 text-violet-300" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--lp-text)] mb-3">Noch keine Projektlage analysiert</h3>
          <p className="text-sm text-[var(--lp-muted)] max-w-2xl mx-auto">
            Erfasse einen Input, damit Load Pilot den Prozesspfad ableiten kann.
          </p>
        </div>
      </motion.section>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={isCompact ? '' : 'lp-card lp-card--padded'}
    >
      {/* Header */}
      <div className={`flex items-center justify-between ${isCompact ? 'mb-6' : 'mb-8'}`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className={`font-semibold text-[var(--lp-text)] ${isCompact ? 'text-lg' : 'text-xl'}`}>Prozesspfad</h2>
            <p className="text-sm text-[var(--lp-muted)]">{projectTitle ?? 'Aktueller Ablauf des Project Twins'}</p>
          </div>
        </div>
        <Badge variant="neutral">{steps.length} Schritte</Badge>
      </div>

      {/* Desktop: Horizontal Scroll */}
      <div className="hidden lg:block">
        <div className="process-path">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`process-step ${getStatusColorClasses(step.status)}`}
            >
              <div className="process-step__number">
                Schritt {step.order}
              </div>
              <h3 className="process-step__title">{step.title}</h3>
              {step.description && (
                <p className="process-step__description">{step.description}</p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <span className={`process-step__status ${getStatusBadgeClasses(step.status)}`}>
                  {getProcessStatusLabel(step.status)}
                </span>
                {step.blockerReason && (
                  <span className="text-xs text-rose-400">⚠ Blockiert</span>
                )}
              </div>

              {/* Connector to next step */}
              {index < steps.length - 1 && (
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-0.5 bg-gradient-to-r from-violet-500/50 to-blue-500/50 z-10"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: Vertical Timeline */}
      <div className="lg:hidden space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="relative">
            <div className={`lp-card lp-card--padded ${getStatusColorClasses(step.status)}`}>
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' :
                    step.status === 'active' ? 'bg-violet-500/20 text-violet-400' :
                    step.status === 'blocked' ? 'bg-rose-500/20 text-rose-400' :
                    step.status === 'next' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-zinc-700 text-zinc-400'
                  }`}>
                    {step.order}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-0.5 h-8 bg-gradient-to-b from-violet-500/50 to-blue-500/50 mt-2"></div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--lp-text)]">{step.title}</h3>
                  {step.description && (
                    <p className="text-sm text-[var(--lp-muted)] mt-1">{step.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadgeClasses(step.status)}`}>
                      {getProcessStatusLabel(step.status)}
                    </span>
                    {step.blockerReason && (
                      <span className="text-xs text-rose-400">⚠ Blockiert</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  )
}
