import { motion } from 'motion/react'
import { ArrowLeft, RefreshCw, Zap, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '../ui/Button'
import type { ProjectTwinAnalysis } from '../../types/projectTwin'
import type { StoredProjectTwin } from '../../lib/projectTwinStore'

interface ProjectCommandHeaderProps {
  project: ProjectTwinAnalysis['project']
  quality: ProjectTwinAnalysis['quality']
  progress?: StoredProjectTwin['progress']
  updatedAt: string
  onBack: () => void
  onUpdate: () => void
  isUpdating?: boolean
}

export default function ProjectCommandHeader({
  project,
  quality,
  progress,
  updatedAt,
  onBack,
  onUpdate,
  isUpdating = false
}: ProjectCommandHeaderProps) {
  // Bestimme Hauptstatus
  const getMainStatus = () => {
    if (quality.confidence === 'low') return { label: 'BLOCKER', color: 'rose', icon: AlertCircle }
    if (quality.confidence === 'medium') return { label: 'KLÄRUNG', color: 'amber', icon: Clock }
    return { label: 'AKTIV', color: 'emerald', icon: CheckCircle2 }
  }

  const mainStatus = getMainStatus()
  const StatusIcon = mainStatus.icon

  // Formatiere Update-Zeit
  const formatUpdateTime = (date: string) => {
    const updated = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - updated.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Gerade eben'
    if (diffMins < 60) return `Vor ${diffMins} Min`
    if (diffHours < 24) return `Vor ${diffHours} Std`
    if (diffDays === 1) return 'Gestern'
    return updated.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack} className="text-zinc-400 hover:text-zinc-200">
            <ArrowLeft className="w-5 h-5" />
            <span className="ml-2">Zurück</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50">
            <Zap className="w-4 h-4 text-[#ff006e]" />
            <span className="text-sm text-zinc-400">Project Twin</span>
          </div>
          
          <Button 
            variant="ghost" 
            onClick={onUpdate} 
            disabled={isUpdating}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* Main Command Surface */}
      <div className="panel-premium p-6 md:p-8">
        {/* Status Bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-${mainStatus.color}-500/10 border border-${mainStatus.color}-500/30`}>
            <StatusIcon className={`w-4 h-4 text-${mainStatus.color}-400`} />
            <span className={`text-sm font-semibold text-${mainStatus.color}-400 uppercase tracking-wider`}>
              {mainStatus.label}
            </span>
          </div>
          
          <span className="text-sm text-zinc-500">
            {formatUpdateTime(updatedAt)} · {progress?.percent ?? 0}% Awareness
          </span>
        </div>

        {/* Project Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
          {project.title}
        </h1>

        {/* Condensed Description - max 2 lines */}
        <p className="text-zinc-400 text-base leading-relaxed line-clamp-2 max-w-3xl">
          {project.description}
        </p>

        {/* Compact Meta Row */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Status</span>
            <span className="text-sm text-zinc-300">{project.status}</span>
          </div>
          
          <div className="w-px h-4 bg-zinc-700" />
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Typ</span>
            <span className="text-sm text-zinc-300">{project.type}</span>
          </div>
          
          {quality.confidence !== 'high' && (
            <>
              <div className="w-px h-4 bg-zinc-700" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Confidence</span>
                <span className={`text-sm ${quality.confidence === 'low' ? 'text-rose-400' : 'text-amber-400'}`}>
                  {quality.confidence === 'low' ? 'Niedrig' : 'Mittel'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.header>
  )
}
