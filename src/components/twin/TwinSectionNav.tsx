import { motion } from 'motion/react'
import {
  GitBranch,
  AlertTriangle,
  CheckCircle,
  GitFork,
  Database,
  PlayCircle,
  HelpCircle,
  ClipboardList
} from 'lucide-react'
import type { ProjectTwinAnalysis } from '../../types/projectTwin'
import type { StoredProjectTwinV2 } from '../../types/projectTwinV2'

// Twin Module Types
export type TwinModule = 'process' | 'questions' | 'measures' | 'risks' | 'actions' | 'decisions' | 'memory' | 'simulation'

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
    id: 'measures',
    label: 'Maßnahmen',
    subtitle: 'Offene Aufgaben',
    icon: ClipboardList,
    getCount: (_analysis, twin) => twin?.measures?.filter(m => m.status !== 'done' && m.status !== 'discarded').length || 0,
    getStatus: (_analysis, twin) => {
      const blockedMeasures = twin?.measures?.filter(m => m.status === 'blocked').length || 0
      const inProgressMeasures = twin?.measures?.filter(m => m.status === 'in_progress').length || 0
      if (blockedMeasures > 0) return 'warning'
      if (inProgressMeasures > 0) return 'info'
      return 'neutral'
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
  iconBgActive: string
  iconColor: string
  iconColorActive: string
  labelColor: string
  labelColorActive: string
  subtitleColor: string
  subtitleColorActive: string
  gradient: string
  shadow: string
}> = {
  neutral: {
    border: 'border-zinc-700',
    borderActive: 'border-violet-600',
    bg: 'bg-zinc-900/50',
    bgActive: 'bg-violet-600',
    badge: 'bg-zinc-800',
    badgeText: 'text-zinc-400',
    badgeActive: 'bg-violet-500 text-white',
    iconBg: 'bg-zinc-800',
    iconBgActive: 'bg-violet-500',
    iconColor: 'text-zinc-400',
    iconColorActive: 'text-white',
    labelColor: 'text-zinc-300',
    labelColorActive: 'text-white',
    subtitleColor: 'text-zinc-500',
    subtitleColorActive: 'text-violet-100',
    gradient: 'from-violet-600 to-violet-700',
    shadow: 'shadow-[0_12px_32px_-8px_rgba(139,92,246,0.35)]'
  },
  info: {
    border: 'border-zinc-700',
    borderActive: 'border-violet-600',
    bg: 'bg-zinc-900/50',
    bgActive: 'bg-violet-600',
    badge: 'bg-violet-500/15',
    badgeText: 'text-violet-400',
    badgeActive: 'bg-violet-500 text-white',
    iconBg: 'bg-violet-500/20',
    iconBgActive: 'bg-violet-400',
    iconColor: 'text-violet-400',
    iconColorActive: 'text-white',
    labelColor: 'text-zinc-300',
    labelColorActive: 'text-white',
    subtitleColor: 'text-zinc-500',
    subtitleColorActive: 'text-violet-100',
    gradient: 'from-violet-600 to-violet-700',
    shadow: 'shadow-[0_12px_32px_-8px_rgba(139,92,246,0.35)]'
  },
  warning: {
    border: 'border-zinc-700',
    borderActive: 'border-violet-600',
    bg: 'bg-zinc-900/50',
    bgActive: 'bg-violet-600',
    badge: 'bg-amber-500/15',
    badgeText: 'text-amber-500',
    badgeActive: 'bg-violet-500 text-white',
    iconBg: 'bg-amber-500/20',
    iconBgActive: 'bg-violet-400',
    iconColor: 'text-amber-500',
    iconColorActive: 'text-white',
    labelColor: 'text-zinc-300',
    labelColorActive: 'text-white',
    subtitleColor: 'text-zinc-500',
    subtitleColorActive: 'text-violet-100',
    gradient: 'from-violet-600 to-violet-700',
    shadow: 'shadow-[0_12px_32px_-8px_rgba(139,92,246,0.35)]'
  },
  critical: {
    border: 'border-zinc-700',
    borderActive: 'border-violet-600',
    bg: 'bg-zinc-900/50',
    bgActive: 'bg-violet-600',
    badge: 'bg-rose-500/15',
    badgeText: 'text-rose-500',
    badgeActive: 'bg-violet-500 text-white',
    iconBg: 'bg-rose-500/20',
    iconBgActive: 'bg-violet-400',
    iconColor: 'text-rose-500',
    iconColorActive: 'text-white',
    labelColor: 'text-zinc-300',
    labelColorActive: 'text-white',
    subtitleColor: 'text-zinc-500',
    subtitleColorActive: 'text-violet-100',
    gradient: 'from-violet-600 to-violet-700',
    shadow: 'shadow-[0_12px_32px_-8px_rgba(139,92,246,0.35)]'
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
              ${isActive ? statusStyles.bgActive : statusStyles.bg + ' hover:bg-zinc-800'}
              ${isActive ? statusStyles.shadow : ''}
              transition-all duration-200
            `}
          >
            {/* Icon Container */}
            <div className={`
              twin-section-button__icon-container
              ${isActive ? 'is-active' : ''}
            `}>
              <div className={`
                twin-section-button__icon
                ${isActive ? statusStyles.iconBgActive : statusStyles.iconBg}
                ${isActive ? statusStyles.iconColorActive : statusStyles.iconColor}
              `}>
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              
              {/* Count Badge - Positioned on the icon */}
              {count > 0 && (
                <span className={`
                  twin-section-button__badge
                  ${isActive ? statusStyles.badgeActive : `${statusStyles.badge} ${statusStyles.badgeText}`}
                `}>
                  {count}
                </span>
              )}
            </div>
            
            {/* Content */}
            <div className="twin-section-button__content">
              <span className={`
                twin-section-button__label
                ${isActive ? statusStyles.labelColorActive : statusStyles.labelColor}
              `}>
                {section.label}
              </span>
              <span className={`
                twin-section-button__subtitle
                ${isActive ? statusStyles.subtitleColorActive : statusStyles.subtitleColor}
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
