import { motion } from 'motion/react'
import {
  GitBranch,
  AlertTriangle,
  CheckCircle,
  GitFork,
  Database,
  PlayCircle
} from 'lucide-react'
import type { ProjectTwinAnalysis } from '../../types/projectTwin'
import type { StoredProjectTwinV2 } from '../../types/projectTwinV2'

// Twin Module Types
export type TwinModule = 'process' | 'risks' | 'actions' | 'decisions' | 'memory' | 'simulation'

interface TwinSectionNavProps {
  activeSection: TwinModule
  onSectionChange: (section: TwinModule) => void
  analysis: ProjectTwinAnalysis
  twin?: StoredProjectTwinV2
}

interface SectionConfig {
  id: TwinModule
  label: string
  subtitle: string
  icon: typeof GitBranch
  getCount: (analysis: ProjectTwinAnalysis, twin?: StoredProjectTwinV2) => number
  getStatus: (analysis: ProjectTwinAnalysis, twin?: StoredProjectTwinV2) => SectionStatus
}

type SectionStatus = 'neutral' | 'info' | 'warning' | 'critical'

const sections: SectionConfig[] = [
  {
    id: 'process',
    label: 'Prozess',
    subtitle: 'Blocker & Abhängigkeiten',
    icon: GitBranch,
    getCount: (analysis) => analysis.dependencies?.filter(d => d.isBlocker).length || 0,
    getStatus: (analysis) => {
      const blockers = analysis.dependencies?.filter(d => d.isBlocker).length || 0
      const blocked = analysis.dependencies?.filter(d => d.status === 'blocked').length || 0
      return blockers > 0 || blocked > 0 ? 'warning' : 'neutral'
    }
  },
  {
    id: 'risks',
    label: 'Risiken',
    subtitle: 'Risikofelder prüfen',
    icon: AlertTriangle,
    getCount: (analysis) => analysis.risks?.length || 0,
    getStatus: (analysis) => {
      const critical = analysis.risks?.filter(r => r.severity === 'high').length || 0
      const medium = analysis.risks?.filter(r => r.severity === 'medium').length || 0
      if (critical > 0) return 'critical'
      if (medium > 0) return 'warning'
      return analysis.risks?.length > 0 ? 'info' : 'neutral'
    }
  },
  {
    id: 'actions',
    label: 'Aktionen',
    subtitle: 'Nächste Schritte',
    icon: CheckCircle,
    getCount: (analysis) => analysis.actions?.length || 0,
    getStatus: () => 'info'
  },
  {
    id: 'decisions',
    label: 'Optionen',
    subtitle: 'Entscheidungspfade',
    icon: GitFork,
    getCount: (analysis) => analysis.scenarios?.length || 0,
    getStatus: () => 'info'
  },
  {
    id: 'memory',
    label: 'Memory',
    subtitle: 'Notizen & Verlauf',
    icon: Database,
    getCount: (_analysis, twin) => (twin?.updates?.length || 0) + (twin?.chatHistory?.length ? 1 : 0),
    getStatus: () => 'neutral'
  },
  {
    id: 'simulation',
    label: 'Simulation',
    subtitle: 'Zukunft prüfen',
    icon: PlayCircle,
    getCount: (_analysis, twin) => twin?.simulationRuns?.length || twin?.futureSimulation ? 1 : 0,
    getStatus: () => 'neutral'
  }
]

const statusConfig: Record<SectionStatus, { border: string; bg: string; badge: string; badgeText: string; iconBg: string }> = {
  neutral: {
    border: 'border-[var(--lp-border)]',
    bg: 'bg-[var(--lp-surface)]',
    badge: 'bg-[var(--lp-surface-soft)]',
    badgeText: 'text-[var(--lp-muted)]',
    iconBg: 'bg-[var(--lp-accent)]'
  },
  info: {
    border: 'border-[var(--lp-cobalt)]/30',
    bg: 'bg-[var(--lp-surface)]',
    badge: 'bg-[var(--lp-cobalt)]/20',
    badgeText: 'text-[var(--lp-cobalt)]',
    iconBg: 'bg-[var(--lp-cobalt)]'
  },
  warning: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    badge: 'bg-amber-500/20',
    badgeText: 'text-amber-400',
    iconBg: 'bg-amber-500'
  },
  critical: {
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/5',
    badge: 'bg-rose-500/20',
    badgeText: 'text-rose-400',
    iconBg: 'bg-rose-500'
  }
}

export function TwinSectionNav({
  activeSection,
  onSectionChange,
  analysis,
  twin
}: TwinSectionNavProps) {
  return (
    <nav className="twin-section-nav">
      {sections.map((section) => {
        const count = section.getCount(analysis, twin)
        const status = section.getStatus(analysis, twin)
        const isActive = activeSection === section.id
        const Icon = section.icon
        
        const statusStyles = statusConfig[status]

        return (
          <motion.button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`
              twin-section-button
              ${isActive ? 'is-active' : ''}
              ${statusStyles.border}
              ${statusStyles.bg}
            `}
          >
            <div className={`
              twin-section-button__icon
              ${isActive ? statusStyles.iconBg : 'bg-[var(--lp-surface-soft)]'}
              ${isActive ? 'text-white' : 'text-[var(--lp-muted)]'}
            `}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="twin-section-button__content">
              <div className="twin-section-button__header">
                <span className="twin-section-button__label">{section.label}</span>
                {count > 0 && (
                  <span className={`
                    twin-section-button__count
                    ${isActive ? 'bg-white/20 text-white' : `${statusStyles.badge} ${statusStyles.badgeText}`}
                  `}
                  >
                    {count}
                  </span>
                )}
              </div>
              <div className="twin-section-button__subtitle">{section.subtitle}</div>
            </div>
          </motion.button>
        )
      })}
    </nav>
  )
}
