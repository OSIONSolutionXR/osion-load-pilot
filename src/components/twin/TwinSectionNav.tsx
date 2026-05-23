import { motion } from 'motion/react'
import {
  GitBranch,
  AlertTriangle,
  CheckCircle,
  GitFork,
  Database,
  PlayCircle,
  HelpCircle
} from 'lucide-react'
import type { ProjectTwinAnalysis } from '../../types/projectTwin'
import type { StoredProjectTwinV2 } from '../../types/projectTwinV2'

// Twin Module Types
export type TwinModule = 'process' | 'questions' | 'risks' | 'actions' | 'decisions' | 'memory' | 'simulation'

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
    id: 'questions',
    label: 'Fragen',
    subtitle: 'Kontext erfassen',
    icon: HelpCircle,
    getCount: (_analysis, twin) => twin?.contextQuestions?.filter(q => q.status === 'open').length || 0,
    getStatus: (_analysis, twin) => {
      const openQuestions = twin?.contextQuestions?.filter(q => q.status === 'open').length || 0
      return openQuestions > 0 ? 'info' : 'neutral'
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

const statusConfig: Record<SectionStatus, { 
  border: string
  borderActive: string
  bg: string
  bgActive: string
  badge: string
  badgeText: string
  badgeActive: string
  iconBg: string
  gradient: string
  shadow: string
}> = {
  neutral: {
    border: 'border-[var(--lp-border)]',
    borderActive: 'border-[var(--lp-accent)]',
    bg: 'bg-[var(--lp-surface)]',
    bgActive: 'bg-gradient-to-br from-[var(--lp-accent)] to-[var(--lp-info)]',
    badge: 'bg-[var(--lp-surface-soft)]',
    badgeText: 'text-[var(--lp-muted)]',
    badgeActive: 'bg-white/25 text-white',
    iconBg: 'bg-[var(--lp-accent)]',
    gradient: 'from-[var(--lp-accent)] to-[var(--lp-info)]',
    shadow: 'shadow-[0_12px_32px_-8px_rgba(37,99,235,0.35)]'
  },
  info: {
    border: 'border-[var(--lp-border)]',
    borderActive: 'border-[var(--lp-accent)]',
    bg: 'bg-[var(--lp-surface)]',
    bgActive: 'bg-gradient-to-br from-[var(--lp-accent)] to-[var(--lp-info)]',
    badge: 'bg-[var(--lp-accent)]/15',
    badgeText: 'text-[var(--lp-accent)]',
    badgeActive: 'bg-white/25 text-white',
    iconBg: 'bg-[var(--lp-accent)]',
    gradient: 'from-[var(--lp-accent)] to-[var(--lp-info)]',
    shadow: 'shadow-[0_12px_32px_-8px_rgba(37,99,235,0.35)]'
  },
  warning: {
    border: 'border-[var(--lp-border)]',
    borderActive: 'border-amber-500',
    bg: 'bg-amber-50/30',
    bgActive: 'bg-gradient-to-br from-amber-500 to-orange-500',
    badge: 'bg-amber-500/15',
    badgeText: 'text-amber-600',
    badgeActive: 'bg-white/25 text-white',
    iconBg: 'bg-amber-500',
    gradient: 'from-amber-500 to-orange-500',
    shadow: 'shadow-[0_12px_32px_-8px_rgba(245,158,11,0.4)]'
  },
  critical: {
    border: 'border-[var(--lp-border)]',
    borderActive: 'border-rose-500',
    bg: 'bg-rose-50/30',
    bgActive: 'bg-gradient-to-br from-rose-500 to-red-600',
    badge: 'bg-rose-500/15',
    badgeText: 'text-rose-600',
    badgeActive: 'bg-white/25 text-white',
    iconBg: 'bg-rose-500',
    gradient: 'from-rose-500 to-red-600',
    shadow: 'shadow-[0_12px_32px_-8px_rgba(244,63,94,0.4)]'
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
            whileHover={{ 
              scale: 1.02,
              y: -2
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ 
              type: 'spring',
              stiffness: 400,
              damping: 25
            }}
            className={`
              twin-section-button
              ${isActive ? 'is-active' : ''}
              ${isActive ? statusStyles.borderActive : statusStyles.border}
              ${isActive ? statusStyles.bgActive : statusStyles.bg}
              ${isActive ? statusStyles.shadow : ''}
            `}
          >
            {/* Icon Container */}
            <div className={`
              twin-section-button__icon-container
              ${isActive ? 'is-active' : ''}
            `}>
              <div className={`
                twin-section-button__icon
                ${isActive ? statusStyles.iconBg : 'bg-[var(--lp-surface-soft)]'}
                ${isActive ? 'text-white' : 'text-[var(--lp-muted)]'}
              `}>
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              
              {/* Count Badge - Positioned on the icon */}
              {count > 0 && (
                <span className={`
                  twin-section-button__badge
                  ${isActive ? 'bg-white text-[var(--lp-accent)]' : `${statusStyles.badge} ${statusStyles.badgeText}`}
                `}>
                  {count}
                </span>
              )}
            </div>
            
            {/* Content */}
            <div className="twin-section-button__content">
              <span className={`
                twin-section-button__label
                ${isActive ? 'text-white' : 'text-[var(--lp-text-strong)]'}
              `}>
                {section.label}
              </span>
              <span className={`
                twin-section-button__subtitle
                ${isActive ? 'text-white/80' : 'text-[var(--lp-muted)]'}
              `}>
                {section.subtitle}
              </span>
            </div>

            {/* Active Indicator Dot */}
            {isActive && (
              <motion.div
                layoutId="activeIndicator"
                className="twin-section-button__indicator"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        )
      })}
    </nav>
  )
}
