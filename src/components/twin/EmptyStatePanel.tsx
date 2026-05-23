import { motion } from 'motion/react'
import {
  GitBranch,
  HelpCircle,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import type { StoredProjectTwinV2 } from '../../types/projectTwinV2'
import type { ProjectTwinAnalysis } from '../../types/projectTwin'
import type { TwinModule } from './TwinSectionNav'

interface EmptyStatePanelProps {
  twin: StoredProjectTwinV2
  analysis: ProjectTwinAnalysis
  onSectionChange: (section: TwinModule) => void
}

export function EmptyStatePanel({ twin, analysis, onSectionChange }: EmptyStatePanelProps) {
  // Berechne Empfehlungen
  const openQuestions = twin.contextQuestions?.filter(q => q.status === 'open').length || 0
  const openMeasures = twin.measures?.filter(m => m.status !== 'done' && m.status !== 'discarded').length || 0
  const blockedMeasures = twin.measures?.filter(m => m.status === 'blocked').length || 0
  const criticalRisks = analysis.risks?.filter(r => r.severity === 'high').length || 0
  const processBlockers = analysis.dependencies?.filter(d => d.isBlocker).length || 0

  // Next Best Action berechnen
  const getNextBestAction = () => {
    if (processBlockers > 0) {
      return {
        section: 'process' as TwinModule,
        title: 'Prozess öffnen',
        reason: `${processBlockers} Blocker${processBlockers > 1 ? 's' : ''} im Prozesspfad erkannt`,
        priority: 'critical' as const,
        icon: GitBranch
      }
    }
    if (blockedMeasures > 0) {
      return {
        section: 'measures' as TwinModule,
        title: 'Maßnahmen öffnen',
        reason: `${blockedMeasures} blockierte Maßnahme${blockedMeasures > 1 ? 'n' : ''}`,
        priority: 'critical' as const,
        icon: ClipboardList
      }
    }
    if (criticalRisks > 0) {
      return {
        section: 'risks' as TwinModule,
        title: 'Risiken prüfen',
        reason: `${criticalRisks} kritische${criticalRisks > 1 ? 's' : ''} Risiko${criticalRisks > 1 ? '' : ''}`,
        priority: 'high' as const,
        icon: AlertTriangle
      }
    }
    if (openQuestions > 0) {
      return {
        section: 'questions' as TwinModule,
        title: 'Fragen beantworten',
        reason: `${openQuestions} offene${openQuestions > 1 ? '' : ''} Frage${openQuestions > 1 ? 'n' : ''}`,
        priority: 'medium' as const,
        icon: HelpCircle
      }
    }
    if (openMeasures > 0) {
      return {
        section: 'measures' as TwinModule,
        title: 'Maßnahmen öffnen',
        reason: `${openMeasures} offene${openMeasures > 1 ? '' : ''} Maßnahme${openMeasures > 1 ? 'n' : ''}`,
        priority: 'medium' as const,
        icon: ClipboardList
      }
    }
    return {
      section: 'actions' as TwinModule,
      title: 'Aktionen öffnen',
      reason: 'Nächste Schritte verfügbar',
      priority: 'low' as const,
      icon: CheckCircle
    }
  }

  const nextBestAction = getNextBestAction()
  const Icon = nextBestAction.icon

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'critical':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30',
          text: 'text-rose-400',
          badge: 'bg-rose-500 text-white',
          glow: 'shadow-[0_0_20px_-4px_rgba(244,63,94,0.3)]'
        }
      case 'high':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30',
          text: 'text-amber-400',
          badge: 'bg-amber-500 text-white',
          glow: 'shadow-[0_0_20px_-4px_rgba(245,158,11,0.3)]'
        }
      default:
        return {
          bg: 'bg-violet-500/10 border-violet-500/30',
          text: 'text-violet-400',
          badge: 'bg-violet-500 text-white',
          glow: 'shadow-[0_0_20px_-4px_rgba(139,92,246,0.3)]'
        }
    }
  }

  const styles = getPriorityStyles(nextBestAction.priority)

  return (
    <section className="lp-card lp-card--paded">
      {/* Empty State Header */}
      <div className="text-center py-12">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30"
        >
          <Sparkles className="w-10 h-10 text-violet-400" />
        </motion.div>
        
        <h3 className="text-xl font-semibold text-[var(--lp-text)] mb-2">
          Wähle einen Arbeitsbereich aus
        </h3>
        <p className="text-[var(--lp-muted)] max-w-md mx-auto">
          Klicke auf einen der Bereichs-Buttons oben, um detaillierte Informationen zu sehen.
        </p>
      </div>

      {/* Empfohlene Bereiche */}
      <div className="px-6 pb-6">
        <h4 className="text-sm font-medium text-[var(--lp-muted)] uppercase tracking-wider mb-4">
          Empfohlene Bereiche
        </h4>
        
        <div className="space-y-3">
          {/* Primary Recommendation */}
          <motion.button
            onClick={() => onSectionChange(nextBestAction.section)}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full p-4 rounded-xl border ${styles.bg} ${styles.glow} transition-all duration-200 text-left`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${styles.badge} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/20 text-white uppercase tracking-wider">
                      Empfohlen
                    </span>
                  </div>
                  <h5 className={`font-semibold ${styles.text}`}>
                    {nextBestAction.title}
                  </h5>
                  <p className="text-sm text-[var(--lp-muted)]">
                    {nextBestAction.reason}
                  </p>
                </div>
              </div>
              <ArrowRight className={`w-5 h-5 ${styles.text}`} />
            </div>
          </motion.button>

          {/* Secondary Stats */}
          <div className="grid grid-cols-3 gap-3">
            {openQuestions > 0 && nextBestAction.section !== 'questions' && (
              <motion.button
                onClick={() => onSectionChange('questions')}
                whileHover={{ y: -2 }}
                className="p-3 rounded-xl border border-[var(--lp-border)] bg-[var(--lp-surface-soft)] hover:border-violet-500/50 transition-all text-left"
              >
                <div className="flex items-center gap-2 mb-1">
                  <HelpCircle className="w-4 h-4 text-violet-400" />
                  <span className="text-lg font-semibold text-[var(--lp-text)]">{openQuestions}</span>
                </div>
                <span className="text-xs text-[var(--lp-muted)]">Offene Fragen</span>
              </motion.button>
            )}
            
            {openMeasures > 0 && nextBestAction.section !== 'measures' && (
              <motion.button
                onClick={() => onSectionChange('measures')}
                whileHover={{ y: -2 }}
                className="p-3 rounded-xl border border-[var(--lp-border)] bg-[var(--lp-surface-soft)] hover:border-violet-500/50 transition-all text-left"
              >
                <div className="flex items-center gap-2 mb-1">
                  <ClipboardList className="w-4 h-4 text-violet-400" />
                  <span className="text-lg font-semibold text-[var(--lp-text)]">{openMeasures}</span>
                </div>
                <span className="text-xs text-[var(--lp-muted)]">Offene Maßnahmen</span>
              </motion.button>
            )}
            
            {criticalRisks > 0 && nextBestAction.section !== 'risks' && (
              <motion.button
                onClick={() => onSectionChange('risks')}
                whileHover={{ y: -2 }}
                className="p-3 rounded-xl border border-[var(--lp-border)] bg-[var(--lp-surface-soft)] hover:border-violet-500/50 transition-all text-left"
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span className="text-lg font-semibold text-[var(--lp-text)]">{criticalRisks}</span>
                </div>
                <span className="text-xs text-[var(--lp-muted)]">Kritische Risiken</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default EmptyStatePanel
