import { motion, AnimatePresence } from 'motion/react'
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  User,
  Calendar,
  Target,
  Sparkles,
  Edit3,
  ChevronRight,
  Trash2
} from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import type { StoredProjectTwinV2 } from '../../types/projectTwinV2'
import type { Measure, MeasureStatus, MeasurePriority } from '../../types/measures'
import { useState, useMemo } from 'react'
import { logMeasureUpdated, logMeasureCompleted } from '../../services/activityLogService'

interface MeasuresPanelProps {
  twin: StoredProjectTwinV2
  onMeasureClick?: (measure: Measure) => void
  onAddMeasure?: () => void
  onTwinUpdate?: (updatedTwin: StoredProjectTwinV2) => void
}

interface GroupedMeasures {
  open: Measure[]
  inProgress: Measure[]
  blocked: Measure[]
  done: Measure[]
  other: Measure[]
}

type StatusGroup = 'open' | 'inProgress' | 'blocked' | 'done' | 'other'

export default function MeasuresPanel({
  twin,
  onMeasureClick,
  onAddMeasure,
  onTwinUpdate
}: MeasuresPanelProps) {
  const [expandedMeasureId, setExpandedMeasureId] = useState<string | null>(null)
  const [editingMeasureId, setEditingMeasureId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Measure>>({})

  const measures = twin.measures || []

  const groupedMeasures: GroupedMeasures = useMemo(() => {
    return measures.reduce((acc, measure) => {
      switch (measure.status) {
        case 'open':
        case 'idea':
          acc.open.push(measure)
          break
        case 'in_progress':
          acc.inProgress.push(measure)
          break
        case 'blocked':
        case 'waiting':
          acc.blocked.push(measure)
          break
        case 'done':
          acc.done.push(measure)
          break
        default:
          acc.other.push(measure)
      }
      return acc
    }, { open: [], inProgress: [], blocked: [], done: [], other: [] } as GroupedMeasures)
  }, [measures])

  const stats = useMemo(() => {
    return {
      total: measures.length,
      open: groupedMeasures.open.length,
      inProgress: groupedMeasures.inProgress.length,
      blocked: groupedMeasures.blocked.length,
      done: groupedMeasures.done.length,
      critical: measures.filter(m => m.priority === 'critical' && m.status !== 'done').length,
      high: measures.filter(m => m.priority === 'high' && m.status !== 'done').length,
      overdue: measures.filter(m => {
        if (!m.dueDate || m.status === 'done') return false
        return new Date(m.dueDate) < new Date()
      }).length
    }
  }, [measures, groupedMeasures])

  const toggleExpand = (measureId: string) => {
    setExpandedMeasureId(expandedMeasureId === measureId ? null : measureId)
  }

  const startEditing = (measure: Measure) => {
    setEditingMeasureId(measure.id)
    setEditForm({ ...measure })
  }

  const cancelEditing = () => {
    setEditingMeasureId(null)
    setEditForm({})
  }

  const saveMeasure = () => {
    if (!editingMeasureId || !onTwinUpdate) return

    const originalMeasure = measures.find(m => m.id === editingMeasureId)
    if (!originalMeasure) return

    const updatedMeasures = measures.map(m =>
      m.id === editingMeasureId
        ? { ...m, ...editForm, updatedAt: new Date().toISOString() }
        : m
    )

    // Track changes for activity log
    const changes: Record<string, unknown> = {}
    Object.entries(editForm).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
        const oldValue = originalMeasure[key as keyof Measure]
        if (oldValue !== value) {
          changes[key] = { from: oldValue, to: value }
        }
      }
    })

    let updatedTwin: StoredProjectTwinV2 = {
      ...twin,
      measures: updatedMeasures,
      updatedAt: new Date().toISOString()
    }

    // Log activity if there are changes
    if (Object.keys(changes).length > 0) {
      updatedTwin = logMeasureUpdated(
        updatedTwin,
        editingMeasureId,
        originalMeasure.title,
        changes
      )
    }

    onTwinUpdate(updatedTwin)
    setEditingMeasureId(null)
    setEditForm({})
  }

  const markAsDone = (measure: Measure) => {
    if (!onTwinUpdate) return

    const updatedMeasures = measures.map(m =>
      m.id === measure.id
        ? { ...m, status: 'done' as MeasureStatus, completedAt: new Date().toISOString() }
        : m
    )

    let updatedTwin: StoredProjectTwinV2 = {
      ...twin,
      measures: updatedMeasures,
      updatedAt: new Date().toISOString()
    }

    updatedTwin = logMeasureCompleted(updatedTwin, measure.id, measure.title)

    onTwinUpdate(updatedTwin)
  }

  const deleteMeasure = (measureId: string) => {
    if (!onTwinUpdate) return
    if (!confirm('Maßnahme wirklich löschen?')) return

    const updatedMeasures = measures.filter(m => m.id !== measureId)

    const updatedTwin: StoredProjectTwinV2 = {
      ...twin,
      measures: updatedMeasures,
      updatedAt: new Date().toISOString()
    }

    onTwinUpdate(updatedTwin)
    setExpandedMeasureId(null)
  }

  const getStatusIcon = (status: MeasureStatus) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 className="w-4 h-4" />
      case 'in_progress':
        return <Clock className="w-4 h-4" />
      case 'blocked':
        return <AlertTriangle className="w-4 h-4" />
      case 'waiting':
        return <Clock className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: MeasureStatus) => {
    switch (status) {
      case 'done':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'blocked':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      case 'waiting':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const getStatusLabel = (status: MeasureStatus) => {
    const labels: Record<string, string> = {
      'idea': 'Idee',
      'open': 'Offen',
      'in_progress': 'In Bearbeitung',
      'waiting': 'Wartend',
      'blocked': 'Blockiert',
      'done': 'Erledigt',
      'discarded': 'Verworfen'
    }
    return labels[status] || status
  }

  const getPriorityBadge = (priority: MeasurePriority) => {
    const configs = {
      critical: { variant: 'rose', label: 'Kritisch' },
      high: { variant: 'amber', label: 'Hoch' },
      medium: { variant: 'blue', label: 'Mittel' },
      low: { variant: 'neutral', label: 'Niedrig' }
    }
    const config = configs[priority] || configs.medium
    return <Badge variant={config.variant as 'rose' | 'amber' | 'blue' | 'neutral'}>{config.label}</Badge>
  }

  const isOverdue = (dueDate: string | null | undefined) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const formatDueDate = (dueDate: string | null | undefined) => {
    if (!dueDate) return 'Keine Frist'
    const date = new Date(dueDate)
    const today = new Date()
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return `Überfällig seit ${Math.abs(diffDays)} Tagen`
    if (diffDays === 0) return 'Heute fällig'
    if (diffDays === 1) return 'Morgen fällig'
    return `Fällig in ${diffDays} Tagen`
  }

  const renderMeasureGroup = (
    title: string,
    measures: Measure[],
    groupType: StatusGroup
  ) => {
    if (measures.length === 0) return null

    const groupColors = {
      open: 'border-slate-500/20',
      inProgress: 'border-blue-500/20',
      blocked: 'border-rose-500/20',
      done: 'border-emerald-500/20',
      other: 'border-slate-500/20'
    }

    const groupBgColors = {
      open: 'bg-slate-500/5',
      inProgress: 'bg-blue-500/5',
      blocked: 'bg-rose-500/5',
      done: 'bg-emerald-500/5',
      other: 'bg-slate-500/5'
    }

    return (
      <div className={`rounded-xl border ${groupColors[groupType]} ${groupBgColors[groupType]} overflow-hidden mb-4`}>
        <div className="px-4 py-3 border-b border-[var(--lp-border)] bg-[var(--lp-surface)]">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-[var(--lp-text)]">{title}</h4>
            <Badge variant="neutral">{measures.length}</Badge>
          </div>
        </div>
        <div className="divide-y divide-[var(--lp-border)]">
          {measures.map((measure) => (
            <motion.div
              key={measure.id}
              layout
              className="bg-[var(--lp-surface-soft)] hover:bg-[var(--lp-surface)] transition-colors"
            >
              {/* Header Row */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => toggleExpand(measure.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getStatusColor(measure.status)}`}>
                    {getStatusIcon(measure.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-medium text-[var(--lp-text)] truncate">
                        {measure.title}
                      </h5>
                      {getPriorityBadge(measure.priority)}
                      {isOverdue(measure.dueDate) && (
                        <Badge variant="rose">Überfällig</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-[var(--lp-muted)]">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {measure.owner || 'Nicht zugewiesen'}
                      </span>
                      {measure.dueDate && (
                        <span className={`flex items-center gap-1 ${isOverdue(measure.dueDate) ? 'text-rose-400' : ''}`}>
                          <Calendar className="w-3 h-3" />
                          {formatDueDate(measure.dueDate)}
                        </span>
                      )}
                      {measure.valueScore && (
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          Nutzwert: {measure.valueScore}/10
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 text-[var(--lp-muted)] transition-transform ${
                      expandedMeasureId === measure.id ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedMeasureId === measure.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-0 border-t border-[var(--lp-border)]">
                      {editingMeasureId === measure.id ? (
                        /* Edit Form */
                        <div className="pt-4 space-y-3">
                          <div>
                            <label className="text-xs font-medium text-[var(--lp-muted)] block mb-1">Titel</label>
                            <input
                              type="text"
                              value={editForm.title || ''}
                              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                              className="w-full px-3 py-2 bg-[var(--lp-surface)] border border-[var(--lp-border)] rounded-lg text-sm text-[var(--lp-text)] focus:outline-none focus:ring-2 focus:ring-[var(--lp-cobalt)]"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-[var(--lp-muted)] block mb-1">Beschreibung</label>
                            <textarea
                              value={editForm.description || ''}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              rows={2}
                              className="w-full px-3 py-2 bg-[var(--lp-surface)] border border-[var(--lp-border)] rounded-lg text-sm text-[var(--lp-text)] focus:outline-none focus:ring-2 focus:ring-[var(--lp-cobalt)] resize-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-medium text-[var(--lp-muted)] block mb-1">Status</label>
                              <select
                                value={editForm.status || 'open'}
                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as MeasureStatus })}
                                className="w-full px-3 py-2 bg-[var(--lp-surface)] border border-[var(--lp-border)] rounded-lg text-sm text-[var(--lp-text)] focus:outline-none focus:ring-2 focus:ring-[var(--lp-cobalt)]"
                              >
                                <option value="open">Offen</option>
                                <option value="in_progress">In Bearbeitung</option>
                                <option value="blocked">Blockiert</option>
                                <option value="done">Erledigt</option>
                                <option value="waiting">Wartend</option>
                                <option value="idea">Idee</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-[var(--lp-muted)] block mb-1">Priorität</label>
                              <select
                                value={editForm.priority || 'medium'}
                                onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as MeasurePriority })}
                                className="w-full px-3 py-2 bg-[var(--lp-surface)] border border-[var(--lp-border)] rounded-lg text-sm text-[var(--lp-text)] focus:outline-none focus:ring-2 focus:ring-[var(--lp-cobalt)]"
                              >
                                <option value="low">Niedrig</option>
                                <option value="medium">Mittel</option>
                                <option value="high">Hoch</option>
                                <option value="critical">Kritisch</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-medium text-[var(--lp-muted)] block mb-1">Frist</label>
                              <input
                                type="date"
                                value={editForm.dueDate ? editForm.dueDate.split('T')[0] : ''}
                                onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                                className="w-full px-3 py-2 bg-[var(--lp-surface)] border border-[var(--lp-border)] rounded-lg text-sm text-[var(--lp-text)] focus:outline-none focus:ring-2 focus:ring-[var(--lp-cobalt)]"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-[var(--lp-muted)] block mb-1">Kümmerer</label>
                              <input
                                type="text"
                                value={editForm.owner || ''}
                                onChange={(e) => setEditForm({ ...editForm, owner: e.target.value })}
                                className="w-full px-3 py-2 bg-[var(--lp-surface)] border border-[var(--lp-border)] rounded-lg text-sm text-[var(--lp-text)] focus:outline-none focus:ring-2 focus:ring-[var(--lp-cobalt)]"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-[var(--lp-muted)] block mb-1">Notizen</label>
                            <textarea
                              value={editForm.notes || ''}
                              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                              rows={2}
                              placeholder="Interne Notizen..."
                              className="w-full px-3 py-2 bg-[var(--lp-surface)] border border-[var(--lp-border)] rounded-lg text-sm text-[var(--lp-text)] focus:outline-none focus:ring-2 focus:ring-[var(--lp-cobalt)] resize-none"
                            />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button onClick={saveMeasure} className="flex-1">
                              Speichern
                            </Button>
                            <Button variant="secondary" onClick={cancelEditing}>
                              Abbrechen
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Detail View */
                        <div className="pt-4 space-y-3">
                          {measure.description && (
                            <div className="p-3 bg-[var(--lp-surface)] rounded-lg">
                              <p className="text-xs font-medium text-[var(--lp-muted)] mb-1">Beschreibung</p>
                              <p className="text-sm text-[var(--lp-text)]">{measure.description}</p>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="p-2 bg-[var(--lp-surface)] rounded-lg">
                              <span className="text-xs text-[var(--lp-muted)] block">Status</span>
                              <span className="text-[var(--lp-text)] font-medium">{getStatusLabel(measure.status)}</span>
                            </div>
                            <div className="p-2 bg-[var(--lp-surface)] rounded-lg">
                              <span className="text-xs text-[var(--lp-muted)] block">Priorität</span>
                              <span className="text-[var(--lp-text)] font-medium">{measure.priority}</span>
                            </div>
                            <div className="p-2 bg-[var(--lp-surface)] rounded-lg">
                              <span className="text-xs text-[var(--lp-muted)] block">Kümmerer</span>
                              <span className="text-[var(--lp-text)] font-medium">{measure.owner || 'Nicht zugewiesen'}</span>
                            </div>
                            <div className="p-2 bg-[var(--lp-surface)] rounded-lg">
                              <span className="text-xs text-[var(--lp-muted)] block">Frist</span>
                              <span className={`font-medium ${isOverdue(measure.dueDate) ? 'text-rose-400' : 'text-[var(--lp-text)]'}`}>
                                {measure.dueDate ? new Date(measure.dueDate).toLocaleDateString('de-DE') : 'Keine'}
                              </span>
                            </div>
                          </div>

                          {measure.strategicGoal && (
                            <div className="p-2 bg-[var(--lp-surface)] rounded-lg">
                              <span className="text-xs text-[var(--lp-muted)] block">Strategisches Ziel</span>
                              <span className="text-sm text-[var(--lp-text)]">{measure.strategicGoal}</span>
                            </div>
                          )}

                          {measure.notes && (
                            <div className="p-3 bg-[var(--lp-surface)] rounded-lg border-l-2 border-[var(--lp-amber)]">
                              <span className="text-xs text-[var(--lp-muted)] block mb-1">Notizen</span>
                              <p className="text-sm text-[var(--lp-text)] whitespace-pre-wrap">{measure.notes}</p>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 pt-2">
                            {measure.status !== 'done' && (
                              <button
                                onClick={() => markAsDone(measure)}
                                className="lp-button-primary text-sm"
                                type="button"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Als erledigt markieren
                              </button>
                            )}
                            <button
                              onClick={() => onMeasureClick?.(measure)}
                              className="lp-button-secondary text-sm"
                              type="button"
                            >
                              Ausführen
                            </button>
                            <button
                              onClick={() => startEditing(measure)}
                              className="lp-button-secondary text-sm"
                              type="button"
                            >
                              <Edit3 className="w-4 h-4 mr-1" />
                              Bearbeiten
                            </button>
                            <button
                              className="lp-button-secondary text-sm text-violet-600 border-violet-200 hover:bg-violet-50"
                              onClick={() => {
                                // Trigger AI editing - would integrate with AI service
                                alert('KI-Bearbeitung würde hier starten...')
                              }}
                              type="button"
                            >
                              <Sparkles className="w-4 h-4 mr-1" />
                              Mit KI bearbeiten
                            </button>
                            <button
                              className="lp-button-secondary text-sm text-rose-600 hover:bg-rose-50 ml-auto"
                              onClick={() => deleteMeasure(measure.id)}
                              type="button"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <section className="lp-card lp-card--padded">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-violet-400" />
          <h3 className="text-lg font-semibold text-[var(--lp-text)]">Maßnahmen</h3>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="neutral">{stats.total} Maßnahmen</Badge>
          {onAddMeasure && (
            <Button
              size="sm"
              onClick={onAddMeasure}
              className="flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Neue Maßnahme
            </Button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Offen"
          value={stats.open}
          color="slate"
          icon={AlertCircle}
        />
        <StatCard
          label="In Bearbeitung"
          value={stats.inProgress}
          color="blue"
          icon={Clock}
        />
        <StatCard
          label="Blockiert"
          value={stats.blocked}
          color="rose"
          icon={AlertTriangle}
        />
        <StatCard
          label="Erledigt"
          value={stats.done}
          color="emerald"
          icon={CheckCircle2}
        />
      </div>

      {/* Priority Warning */}
      {(stats.critical > 0 || stats.overdue > 0) && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span className="font-medium text-rose-600">Aufmerksamkeit erforderlich</span>
          </div>
          <p className="text-sm text-rose-700">
            {stats.critical > 0 && `${stats.critical} kritische Maßnahmen`}
            {stats.critical > 0 && stats.overdue > 0 && ' und '}
            {stats.overdue > 0 && `${stats.overdue} überfällige Maßnahmen`}
          </p>
        </div>
      )}

      {/* Measure Groups */}
      {measures.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="w-12 h-12 text-[var(--lp-muted)] mx-auto mb-4 opacity-40" />
          <h4 className="text-lg font-medium text-[var(--lp-text)] mb-2">Noch keine Maßnahmen</h4>
          <p className="text-sm text-[var(--lp-muted)] mb-4 max-w-md mx-auto">
            Erstelle deine erste Maßnahme oder generiere sie aus den Aktionen des Project Twins.
          </p>
          {onAddMeasure && (
            <Button onClick={onAddMeasure}>
              <Plus className="w-4 h-4 mr-2" />
              Erste Maßnahme erstellen
            </Button>
          )}
        </div>
      ) : (
        <>
          {renderMeasureGroup('Blockiert / Wartend', groupedMeasures.blocked, 'blocked')}
          {renderMeasureGroup('In Bearbeitung', groupedMeasures.inProgress, 'inProgress')}
          {renderMeasureGroup('Offen / Ideen', groupedMeasures.open, 'open')}
          {renderMeasureGroup('Erledigt', groupedMeasures.done, 'done')}
          {renderMeasureGroup('Sonstige', groupedMeasures.other, 'other')}
        </>
      )}
    </section>
  )
}

// Stat Card Component
function StatCard({
  label,
  value,
  color,
  icon: Icon
}: {
  label: string
  value: number
  color: 'slate' | 'blue' | 'rose' | 'emerald'
  icon: typeof AlertCircle
}) {
  const colors = {
    slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  }

  return (
    <div className={`p-4 rounded-xl border ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider opacity-80">{label}</span>
        <Icon className="w-4 h-4 opacity-60" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}
