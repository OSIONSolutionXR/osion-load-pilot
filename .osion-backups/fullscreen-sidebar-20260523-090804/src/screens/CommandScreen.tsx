import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Zap, AlertTriangle, Clock, Target, ArrowRight, Plus, Activity, 
  AlertCircle, Calendar, Filter, X, CheckCircle2,
  User, Flag, ChevronRight, LayoutGrid
} from 'lucide-react'
import type { StoredProjectTwin } from '../lib/projectTwinStore'
import type { Measure, MeasureStatus, MeasurePriority } from '../types/measures'
import { 
  normalizeMeasures, 
  sortMeasuresByPriority, 
  filterMeasures,
  calculateDueDateCategory,
  formatDaysUntilDue,
  findProjectsWithBlockers,
  findProjectsNeedingUpdate
} from '../lib/measuresNormalize'
import { FadeIn } from '../components/animations/MicroAnimations'

type FilterType = 'all' | 'critical' | 'deadlines' | 'blocked' | 'update-needed'

interface CommandScreenProps {
  twins: StoredProjectTwin[]
  onOpenTwin: (id: string) => void
  onNewInput: () => void
}

export default function CommandScreen({ twins, onOpenTwin, onNewInput }: CommandScreenProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [selectedMeasure, setSelectedMeasure] = useState<Measure | null>(null)

  const allTwins = twins
  const hasTwins = allTwins.length > 0

  // Normalize measures from all projects
  const allMeasures = useMemo(() => {
    if (!hasTwins) return []
    return normalizeMeasures(allTwins)
  }, [allTwins, hasTwins])

  // Calculate statistics
  const stats = useMemo(() => {
    const critical = allMeasures.filter(m => 
      (m.priority === 'critical' || m.priority === 'high') && 
      m.status !== 'done' && m.status !== 'discarded'
    ).length

    const withDeadlines = allMeasures.filter(m => 
      m.dueDate && m.status !== 'done' && m.status !== 'discarded'
    ).length

    const blockedProjects = findProjectsWithBlockers(allTwins).length
    const updateNeeded = findProjectsNeedingUpdate(allTwins).length

    return { critical, withDeadlines, blockedProjects, updateNeeded }
  }, [allMeasures, allTwins])

  // Filter measures based on active filter
  const filteredMeasures = useMemo(() => {
    switch (activeFilter) {
      case 'critical':
        return filterMeasures(allMeasures, { 
          priority: ['critical', 'high'],
          status: ['idea', 'open', 'in_progress', 'waiting', 'blocked']
        })
      case 'deadlines':
        return allMeasures.filter(m => 
          m.dueDate && 
          m.status !== 'done' && 
          m.status !== 'discarded'
        )
      case 'blocked':
        return allMeasures.filter(m => m.status === 'blocked')
      case 'update-needed':
        const needingUpdateIds = findProjectsNeedingUpdate(allTwins)
        return allMeasures.filter(m => needingUpdateIds.includes(m.projectId))
      default:
        return sortMeasuresByPriority(allMeasures).slice(0, 10)
    }
  }, [allMeasures, activeFilter, allTwins])

  // Attention queue: top priority measures
  const attentionQueue = useMemo(() => {
    return sortMeasuresByPriority(
      allMeasures.filter(m => m.status !== 'done' && m.status !== 'discarded')
    ).slice(0, 5)
  }, [allMeasures])

  // Deadline board data
  const deadlineBoard = useMemo(() => {
    const measuresWithDue = allMeasures.filter(m => 
      m.status !== 'done' && m.status !== 'discarded'
    )
    
    return {
      overdue: measuresWithDue.filter(m => calculateDueDateCategory(m.dueDate) === 'overdue'),
      today: measuresWithDue.filter(m => calculateDueDateCategory(m.dueDate) === 'today'),
      next7Days: measuresWithDue.filter(m => calculateDueDateCategory(m.dueDate) === 'next_7_days'),
      later: measuresWithDue.filter(m => calculateDueDateCategory(m.dueDate) === 'later' || calculateDueDateCategory(m.dueDate) === 'no_due_date')
    }
  }, [allMeasures])

  // Projects summary for "Maßnahmen nach Projekt"
  const projectsSummary = useMemo(() => {
    return allTwins.map(twin => {
      const projectMeasures = allMeasures.filter(m => m.projectId === twin.id)
      const openMeasures = projectMeasures.filter(m => 
        m.status !== 'done' && m.status !== 'discarded'
      )
      const criticalCount = openMeasures.filter(m => 
        m.priority === 'critical' || m.priority === 'high'
      ).length
      
      const nextDue = openMeasures
        .filter(m => m.dueDate)
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0]?.dueDate

      return {
        id: twin.id,
        title: twin.title,
        totalMeasures: openMeasures.length,
        criticalCount,
        nextDue
      }
    }).filter(p => p.totalMeasures > 0)
  }, [allTwins, allMeasures])

  const handleMeasureClick = (measure: Measure) => {
    setSelectedMeasure(measure)
  }

  const handleOpenTwin = (measure: Measure) => {
    onOpenTwin(measure.projectId)
  }

  const getPriorityBadge = (priority: MeasurePriority) => {
    const styles = {
      critical: 'bg-rose-500/15 text-rose-600 border-rose-500/30',
      high: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
      medium: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
      low: 'bg-slate-500/15 text-slate-600 border-slate-500/30'
    }
    return styles[priority] || styles.medium
  }

  const getStatusBadge = (status: MeasureStatus) => {
    const styles = {
      idea: 'bg-slate-500/10 text-slate-500',
      open: 'bg-emerald-500/15 text-emerald-600',
      in_progress: 'bg-blue-500/15 text-blue-600',
      waiting: 'bg-amber-500/15 text-amber-600',
      blocked: 'bg-rose-500/15 text-rose-600',
      done: 'bg-emerald-500/15 text-emerald-600',
      discarded: 'bg-slate-500/10 text-slate-400'
    }
    return styles[status] || styles.open
  }

  const getDueDateChip = (dueDate: string | null | undefined) => {
    const category = calculateDueDateCategory(dueDate)
    const styles = {
      overdue: 'bg-rose-500 text-white',
      today: 'bg-amber-500 text-white',
      next_7_days: 'bg-blue-500 text-white',
      later: 'bg-slate-400 text-white',
      no_due_date: 'bg-slate-200 text-slate-600'
    }
    const labels = {
      overdue: 'Überfällig',
      today: 'Heute',
      next_7_days: '7 Tage',
      later: 'Später',
      no_due_date: 'Keine Frist'
    }
    return { className: styles[category], label: labels[category] }
  }

  return (
    <div className="space-y-6">
      {/* Command Hero */}
      <FadeIn direction="up">
        <section className="lp-card lp-card--hero">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--lp-cobalt)] to-[var(--lp-teal)] flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[var(--lp-text)]">Command</h1>
              <p className="text-[var(--lp-muted)]">Deine projektübergreifende Maßnahmenzentrale</p>
            </div>
          </div>

          {hasTwins ? (
            <>
              <p className="text-lg text-[var(--lp-text)] mb-4">
                {stats.critical > 0 
                  ? `${stats.critical} kritische Maßnahmen brauchen Aufmerksamkeit.`
                  : stats.withDeadlines > 0
                  ? `${stats.withDeadlines} Maßnahmen haben aktive Fristen.`
                  : 'Alle Maßnahmen sind auf Kurs.'}
              </p>

              {/* KPI Cards - Clickable */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard
                  icon={AlertTriangle}
                  value={stats.critical}
                  label="Kritische Maßnahmen"
                  variant="danger"
                  isActive={activeFilter === 'critical'}
                  onClick={() => setActiveFilter(activeFilter === 'critical' ? 'all' : 'critical')}
                />
                <MetricCard
                  icon={Clock}
                  value={stats.withDeadlines}
                  label="Mit Frist"
                  variant="warning"
                  isActive={activeFilter === 'deadlines'}
                  onClick={() => setActiveFilter(activeFilter === 'deadlines' ? 'all' : 'deadlines')}
                />
                <MetricCard
                  icon={AlertCircle}
                  value={stats.blockedProjects}
                  label="Blockierte Projekte"
                  variant="danger"
                  isActive={activeFilter === 'blocked'}
                  onClick={() => setActiveFilter(activeFilter === 'blocked' ? 'all' : 'blocked')}
                />
                <MetricCard
                  icon={Activity}
                  value={stats.updateNeeded}
                  label="Update nötig"
                  variant="neutral"
                  isActive={activeFilter === 'update-needed'}
                  onClick={() => setActiveFilter(activeFilter === 'update-needed' ? 'all' : 'update-needed')}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-[var(--lp-muted)] mb-4">
                Noch keine Projekte erfasst. Starte mit einem neuen Input.
              </p>
              <button className="lp-button-primary" onClick={onNewInput}>
                <Plus className="w-4 h-4 mr-2" />
                Ersten Input erfassen
              </button>
            </div>
          )}
        </section>
      </FadeIn>

      {/* Active Filter Display */}
      <AnimatePresence>
        {activeFilter !== 'all' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--lp-cobalt)]/10 border border-[var(--lp-cobalt)]/30 rounded-xl"
          >
            <Filter className="w-4 h-4 text-[var(--lp-cobalt)]" />
            <span className="text-sm font-medium text-[var(--lp-cobalt)]">
              {activeFilter === 'critical' && 'Kritische Maßnahmen'}
              {activeFilter === 'deadlines' && 'Maßnahmen mit Frist'}
              {activeFilter === 'blocked' && 'Blockierte Maßnahmen'}
              {activeFilter === 'update-needed' && 'Update benötigt'}
            </span>
            <span className="text-sm text-[var(--lp-muted)] ml-2">
              ({filteredMeasures.length})
            </span>
            <button 
              onClick={() => setActiveFilter('all')}
              className="ml-auto p-1 hover:bg-[var(--lp-cobalt)]/20 rounded-lg"
            >
              <X className="w-4 h-4 text-[var(--lp-cobalt)]" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtered Measures List */}
      <AnimatePresence mode="wait">
        {activeFilter !== 'all' && filteredMeasures.length > 0 && (
          <FadeIn key="filtered-list">
            <section className="lp-card lp-card--padded">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--lp-text)]">
                  Gefilterte Maßnahmen
                </h2>
                <span className="text-sm text-[var(--lp-muted)]">
                  {filteredMeasures.length} Maßnahmen
                </span>
              </div>
              <div className="space-y-2">
                {filteredMeasures.map((measure) => (
                  <MeasureRow 
                    key={measure.id} 
                    measure={measure}
                    onClick={() => handleMeasureClick(measure)}
                    onOpenTwin={() => handleOpenTwin(measure)}
                    getStatusBadge={getStatusBadge}
                    getDueDateChip={getDueDateChip}
                  />
                ))}
              </div>
            </section>
          </FadeIn>
        )}
      </AnimatePresence>

      {/* Attention Queue */}
      {hasTwins && attentionQueue.length > 0 && (
        <FadeIn direction="up" delay={0.1}>
          <section className="lp-card lp-card--padded">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-5 h-5 text-[var(--lp-cobalt)]" />
              <h2 className="text-xl font-semibold text-[var(--lp-text)]">Attention Queue</h2>
              <span className="text-sm text-[var(--lp-muted)] ml-auto">
                Die wichtigsten nächsten Schritte
              </span>
            </div>

            <div className="space-y-3">
              {attentionQueue.map((measure) => (
                <motion.div
                  key={measure.id}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-[var(--lp-border)] bg-[var(--lp-surface-soft)] cursor-pointer group"
                  onClick={() => handleMeasureClick(measure)}
                >
                  {/* Priority Indicator */}
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    measure.priority === 'critical' ? 'bg-rose-500' :
                    measure.priority === 'high' ? 'bg-amber-500' :
                    measure.priority === 'medium' ? 'bg-blue-500' : 'bg-slate-400'
                  }`} />
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getPriorityBadge(measure.priority)}`}>
                        {measure.priority === 'critical' ? 'Kritisch' :
                         measure.priority === 'high' ? 'Hoch' :
                         measure.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                      </span>
                      <span className="text-xs text-[var(--lp-muted)] truncate">
                        {measure.projectTitle}
                      </span>
                    </div>
                    <div className="font-medium text-[var(--lp-text)] truncate">
                      {measure.title}
                    </div>
                    {measure.description && (
                      <div className="text-sm text-[var(--lp-muted)] truncate">
                        {measure.description}
                      </div>
                    )}
                  </div>

                  {/* Due Date */}
                  {measure.dueDate && (
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getDueDateChip(measure.dueDate).className}`}>
                        {getDueDateChip(measure.dueDate).label}
                      </span>
                      <span className="text-xs text-[var(--lp-muted)]">
                        {formatDaysUntilDue(measure.dueDate)}
                      </span>
                    </div>
                  )}

                  {/* Status */}
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusBadge(measure.status)}`}>
                    {measure.status === 'open' ? 'Offen' :
                     measure.status === 'in_progress' ? 'In Arbeit' :
                     measure.status === 'blocked' ? 'Blockiert' :
                     measure.status === 'waiting' ? 'Wartend' :
                     measure.status === 'done' ? 'Erledigt' : 'Idee'}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      className="lp-button-secondary text-xs py-1 px-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenTwin(measure)
                      }}
                    >
                      <ArrowRight className="w-3 h-3 mr-1" />
                      Twin
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </FadeIn>
      )}

      {/* Deadline Board */}
      {hasTwins && (
        <FadeIn direction="up" delay={0.15}>
          <section className="lp-card lp-card--padded">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-5 h-5 text-[var(--lp-teal)]" />
              <h2 className="text-xl font-semibold text-[var(--lp-text)]">Fristenboard</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Overdue */}
              <DeadlineColumn 
                title="Überfällig" 
                count={deadlineBoard.overdue.length}
                color="rose"
                measures={deadlineBoard.overdue}
                onMeasureClick={handleMeasureClick}
              />
              {/* Today */}
              <DeadlineColumn 
                title="Heute" 
                count={deadlineBoard.today.length}
                color="amber"
                measures={deadlineBoard.today}
                onMeasureClick={handleMeasureClick}
              />
              {/* Next 7 Days */}
              <DeadlineColumn 
                title="Nächste 7 Tage" 
                count={deadlineBoard.next7Days.length}
                color="blue"
                measures={deadlineBoard.next7Days}
                onMeasureClick={handleMeasureClick}
              />
              {/* Later */}
              <DeadlineColumn 
                title="Später / Keine Frist" 
                count={deadlineBoard.later.length}
                color="slate"
                measures={deadlineBoard.later}
                onMeasureClick={handleMeasureClick}
              />
            </div>
          </section>
        </FadeIn>
      )}

      {/* Projects Summary */}
      {hasTwins && projectsSummary.length > 0 && (
        <FadeIn direction="up" delay={0.2}>
          <section className="lp-card lp-card--padded">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <LayoutGrid className="w-5 h-5 text-[var(--lp-violet)]" />
                <h2 className="text-xl font-semibold text-[var(--lp-text)]">
                  Maßnahmen nach Projekt
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projectsSummary.map((project) => (
                <motion.div
                  key={project.id}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 rounded-xl border border-[var(--lp-border)] bg-[var(--lp-surface-soft)] cursor-pointer"
                  onClick={() => onOpenTwin(project.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-[var(--lp-text)] truncate">
                      {project.title}
                    </h3>
                    {project.criticalCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-rose-500">
                        <AlertTriangle className="w-3 h-3" />
                        {project.criticalCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[var(--lp-muted)]">
                    <span>{project.totalMeasures} offene Maßnahmen</span>
                    {project.nextDue && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Nächste: {new Date(project.nextDue).toLocaleDateString('de-DE')}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </FadeIn>
      )}

      {/* Measure Detail Modal */}
      <MeasureDetailModal
        measure={selectedMeasure}
        onClose={() => setSelectedMeasure(null)}
        onOpenTwin={() => selectedMeasure && handleOpenTwin(selectedMeasure)}
      />
    </div>
  )
}

// --- Sub-Components ---

interface MetricCardProps {
  icon: typeof AlertTriangle
  value: number
  label: string
  variant: 'danger' | 'warning' | 'neutral'
  isActive: boolean
  onClick: () => void
}

function MetricCard({ icon: Icon, value, label, variant, isActive, onClick }: MetricCardProps) {
  const colors = {
    danger: 'text-rose-500 border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10',
    warning: 'text-amber-500 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10',
    neutral: 'text-slate-500 border-slate-500/30 bg-slate-500/5 hover:bg-slate-500/10'
  }

  const activeColors = {
    danger: 'bg-rose-500 text-white border-rose-500',
    warning: 'bg-amber-500 text-white border-amber-500',
    neutral: 'bg-slate-500 text-white border-slate-500'
  }

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
        isActive ? activeColors[variant] : colors[variant]
      }`}
    >
      <Icon className={`w-5 h-5 mb-2 ${isActive ? 'text-white' : ''}`} />
      <div className={`text-2xl font-bold ${isActive ? 'text-white' : ''}`}>{value}</div>
      <div className={`text-xs ${isActive ? 'text-white/80' : ''}`}>{label}</div>
    </button>
  )
}

interface MeasureRowProps {
  measure: Measure
  onClick: () => void
  onOpenTwin: () => void
  getStatusBadge: (s: MeasureStatus) => string
  getDueDateChip: (d: string | null | undefined) => { className: string; label: string }
}

function MeasureRow({ measure, onClick, onOpenTwin, getStatusBadge, getDueDateChip }: MeasureRowProps) {
  return (
    <motion.div
      whileHover={{ x: 2 }}
      className="flex items-center gap-3 p-3 rounded-lg border border-[var(--lp-border)] bg-[var(--lp-surface-soft)] cursor-pointer group"
      onClick={onClick}
    >
      <div className={`w-2 h-2 rounded-full ${
        measure.priority === 'critical' ? 'bg-rose-500' :
        measure.priority === 'high' ? 'bg-amber-500' : 'bg-blue-500'
      }`} />
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[var(--lp-text)] text-sm truncate">
          {measure.title}
        </div>
        <div className="text-xs text-[var(--lp-muted)] truncate">
          {measure.projectTitle}
        </div>
      </div>

      {measure.dueDate && (
        <span className={`text-xs px-2 py-0.5 rounded-full ${getDueDateChip(measure.dueDate).className}`}>
          {getDueDateChip(measure.dueDate).label}
        </span>
      )}

      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(measure.status)}`}>
        {measure.status === 'open' ? 'Offen' :
         measure.status === 'in_progress' ? 'In Arbeit' :
         measure.status === 'blocked' ? 'Blockiert' : measure.status}
      </span>

      <button 
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[var(--lp-surface)] rounded"
        onClick={(e) => {
          e.stopPropagation()
          onOpenTwin()
        }}
      >
        <ChevronRight className="w-4 h-4 text-[var(--lp-muted)]" />
      </button>
    </motion.div>
  )
}

interface DeadlineColumnProps {
  title: string
  count: number
  color: 'rose' | 'amber' | 'blue' | 'slate'
  measures: Measure[]
  onMeasureClick: (m: Measure) => void
}

function DeadlineColumn({ title, count, color, measures, onMeasureClick }: DeadlineColumnProps) {
  const colors = {
    rose: 'border-rose-500/30 bg-rose-500/5',
    amber: 'border-amber-500/30 bg-amber-500/5',
    blue: 'border-blue-500/30 bg-blue-500/5',
    slate: 'border-slate-500/30 bg-slate-500/5'
  }

  const headerColors = {
    rose: 'text-rose-500',
    amber: 'text-amber-500',
    blue: 'text-blue-500',
    slate: 'text-slate-500'
  }

  return (
    <div className={`p-3 rounded-xl border ${colors[color]} min-h-[200px]`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-medium ${headerColors[color]}`}>{title}</h3>
        <span className={`text-lg font-bold ${headerColors[color]}`}>{count}</span>
      </div>
      
      <div className="space-y-2">
        {measures.slice(0, 5).map((measure) => (
          <motion.div
            key={measure.id}
            whileHover={{ scale: 1.02 }}
            className="p-2 rounded-lg bg-white/50 dark:bg-black/20 cursor-pointer group"
            onClick={() => onMeasureClick(measure)}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-1.5 py-0.5 rounded border ${
                measure.priority === 'critical' ? 'bg-rose-500/15 text-rose-600 border-rose-500/30' :
                measure.priority === 'high' ? 'bg-amber-500/15 text-amber-600 border-amber-500/30' :
                measure.priority === 'medium' ? 'bg-blue-500/15 text-blue-600 border-blue-500/30' :
                'bg-slate-500/15 text-slate-600 border-slate-500/30'
              }`}>
                {measure.priority === 'critical' ? 'K' :
                 measure.priority === 'high' ? 'H' :
                 measure.priority === 'medium' ? 'M' : 'N'}
              </span>
              <span className="text-xs text-[var(--lp-muted)] truncate">
                {measure.projectTitle}
              </span>
            </div>
            <div className="text-sm text-[var(--lp-text)] truncate font-medium">
              {measure.title}
            </div>
          </motion.div>
        ))}
        {measures.length > 5 && (
          <div className="text-xs text-center text-[var(--lp-muted)] py-2">
            +{measures.length - 5} weitere
          </div>
        )}
      </div>
    </div>
  )
}

interface MeasureDetailModalProps {
  measure: Measure | null
  onClose: () => void
  onOpenTwin: () => void
}

function MeasureDetailModal({ measure, onClose, onOpenTwin }: MeasureDetailModalProps) {
  if (!measure) return null

  const getPriorityBadge = (priority: MeasurePriority) => {
    const styles = {
      critical: 'bg-rose-500/15 text-rose-600 border-rose-500/30',
      high: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
      medium: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
      low: 'bg-slate-500/15 text-slate-600 border-slate-500/30'
    }
    return styles[priority] || styles.medium
  }

  const getStatusBadge = (status: MeasureStatus) => {
    const styles = {
      idea: 'bg-slate-500/10 text-slate-500',
      open: 'bg-emerald-500/15 text-emerald-600',
      in_progress: 'bg-blue-500/15 text-blue-600',
      waiting: 'bg-amber-500/15 text-amber-600',
      blocked: 'bg-rose-500/15 text-rose-600',
      done: 'bg-emerald-500/15 text-emerald-600',
      discarded: 'bg-slate-500/10 text-slate-400'
    }
    return styles[status] || styles.open
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[var(--lp-panel)] border border-[var(--lp-border)] rounded-2xl max-w-lg w-full p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getPriorityBadge(measure.priority)}`}>
                  {measure.priority === 'critical' ? 'Kritisch' :
                   measure.priority === 'high' ? 'Hoch' :
                   measure.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                </span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusBadge(measure.status)}`}>
                  {measure.status === 'open' ? 'Offen' :
                   measure.status === 'in_progress' ? 'In Arbeit' :
                   measure.status === 'blocked' ? 'Blockiert' :
                   measure.status === 'waiting' ? 'Wartend' :
                   measure.status === 'done' ? 'Erledigt' : 'Idee'}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-[var(--lp-text)]">{measure.title}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[var(--lp-surface)] rounded-lg">
              <X className="w-5 h-5 text-[var(--lp-muted)]" />
            </button>
          </div>

          {/* Details */}
          <div className="space-y-4 mb-6">
            {/* Project */}
            <div className="flex items-center gap-3">
              <LayoutGrid className="w-4 h-4 text-[var(--lp-muted)]" />
              <span className="text-sm text-[var(--lp-muted)]">Projekt:</span>
              <span className="text-sm font-medium text-[var(--lp-text)]">{measure.projectTitle}</span>
            </div>

            {/* Description */}
            {measure.description && (
              <div className="p-3 bg-[var(--lp-surface-soft)] rounded-lg">
                <p className="text-sm text-[var(--lp-text)]">{measure.description}</p>
              </div>
            )}

            {/* Due Date */}
            {measure.dueDate && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-[var(--lp-muted)]" />
                <span className="text-sm text-[var(--lp-muted)]">Frist:</span>
                <span className="text-sm font-medium text-[var(--lp-text)]">
                  {new Date(measure.dueDate).toLocaleDateString('de-DE')}
                </span>
                <span className="text-xs text-[var(--lp-muted)]">
                  ({formatDaysUntilDue(measure.dueDate)})
                </span>
              </div>
            )}

            {/* Owner */}
            {measure.owner && (
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-[var(--lp-muted)]" />
                <span className="text-sm text-[var(--lp-muted)]">Kümmerer:</span>
                <span className="text-sm font-medium text-[var(--lp-text)]">{measure.owner}</span>
              </div>
            )}

            {/* Value Score */}
            {measure.valueScore && (
              <div className="flex items-center gap-3">
                <Flag className="w-4 h-4 text-[var(--lp-muted)]" />
                <span className="text-sm text-[var(--lp-muted)]">Nutzwert:</span>
                <span className="text-sm font-medium text-[var(--lp-text)]">{measure.valueScore}/10</span>
              </div>
            )}

            {/* Strategic Goal */}
            {measure.strategicGoal && (
              <div className="flex items-center gap-3">
                <Target className="w-4 h-4 text-[var(--lp-muted)]" />
                <span className="text-sm text-[var(--lp-muted)]">Strategisches Ziel:</span>
                <span className="text-sm font-medium text-[var(--lp-text)]">{measure.strategicGoal}</span>
              </div>
            )}

            {/* Notes */}
            {measure.notes && (
              <div className="p-3 bg-[var(--lp-surface-soft)] rounded-lg border-l-2 border-[var(--lp-cobalt)]">
                <p className="text-xs text-[var(--lp-muted)] mb-1">Notizen:</p>
                <p className="text-sm text-[var(--lp-text)]">{measure.notes}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button className="lp-button-primary flex-1">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Als erledigt markieren
            </button>
            <button 
              className="lp-button-secondary"
              onClick={onOpenTwin}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Im Twin öffnen
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
